const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all transfers
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = `
      SELECT t.*,
        sw.name as source_warehouse_name, sl.name as source_location_name,
        dw.name as dest_warehouse_name, dl.name as dest_location_name
      FROM transfers t
      JOIN warehouses sw ON t.source_warehouse_id = sw.id
      JOIN warehouses dw ON t.dest_warehouse_id = dw.id
      LEFT JOIN locations sl ON t.source_location_id = sl.id
      LEFT JOIN locations dl ON t.dest_location_id = dl.id
    `;
    const params = [];
    if (status) { query += ' WHERE t.status = ?'; params.push(status); }
    query += ' ORDER BY t.created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single transfer with items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const transfer = db.prepare(`
      SELECT t.*,
        sw.name as source_warehouse_name, sl.name as source_location_name,
        dw.name as dest_warehouse_name, dl.name as dest_location_name
      FROM transfers t
      JOIN warehouses sw ON t.source_warehouse_id = sw.id
      JOIN warehouses dw ON t.dest_warehouse_id = dw.id
      LEFT JOIN locations sl ON t.source_location_id = sl.id
      LEFT JOIN locations dl ON t.dest_location_id = dl.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    transfer.items = db.prepare(`SELECT ti.*, p.name as product_name, p.sku FROM transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?`).all(req.params.id);
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create transfer
router.post('/', (req, res) => {
  try {
    const { source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, items } = req.body;
    if (!source_warehouse_id || !dest_warehouse_id) {
      return res.status(400).json({ error: 'Source and destination warehouses are required' });
    }
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM transfers').get().c;
    const reference = `TRF-${String(count + 1).padStart(3, '0')}`;
    const id = uuidv4();
    db.prepare('INSERT INTO transfers (id, reference, source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, reference, source_warehouse_id, source_location_id || null, dest_warehouse_id, dest_location_id || null, 'draft'
    );
    if (items && items.length) {
      const ins = db.prepare('INSERT INTO transfer_items (id, transfer_id, product_id, qty) VALUES (?, ?, ?, ?)');
      items.forEach(item => ins.run(uuidv4(), id, item.product_id, item.qty || 0));
    }
    const transfer = db.prepare(`
      SELECT t.*, sw.name as source_warehouse_name, dw.name as dest_warehouse_name
      FROM transfers t JOIN warehouses sw ON t.source_warehouse_id = sw.id JOIN warehouses dw ON t.dest_warehouse_id = dw.id WHERE t.id = ?
    `).get(id);
    transfer.items = db.prepare(`SELECT ti.*, p.name as product_name, p.sku FROM transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?`).all(id);
    res.status(201).json(transfer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate transfer → move stock between locations
router.post('/:id/validate', (req, res) => {
  try {
    const db = getDb();
    const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id);
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    if (transfer.status === 'done') return res.status(400).json({ error: 'Already validated' });

    const items = db.prepare('SELECT ti.*, p.name as product_name FROM transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?').all(req.params.id);
    const srcWh = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.source_warehouse_id);
    const dstWh = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.dest_warehouse_id);
    const srcLoc = transfer.source_location_id ? db.prepare('SELECT name FROM locations WHERE id = ?').get(transfer.source_location_id) : null;
    const dstLoc = transfer.dest_location_id ? db.prepare('SELECT name FROM locations WHERE id = ?').get(transfer.dest_location_id) : null;

    const validateAll = db.transaction(() => {
      items.forEach(item => {
        // Decrease source
        const srcStock = db.prepare('SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, transfer.source_warehouse_id);
        if (srcStock) {
          db.prepare('UPDATE stock SET quantity = MAX(0, quantity - ?) WHERE id = ?').run(item.qty, srcStock.id);
        }
        // Increase destination
        const dstStock = db.prepare('SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, transfer.dest_warehouse_id);
        if (dstStock) {
          db.prepare('UPDATE stock SET quantity = quantity + ? WHERE id = ?').run(item.qty, dstStock.id);
        } else {
          db.prepare('INSERT INTO stock (id, product_id, warehouse_id, location_id, quantity) VALUES (?, ?, ?, ?, ?)').run(
            uuidv4(), item.product_id, transfer.dest_warehouse_id, transfer.dest_location_id, item.qty
          );
        }
        // Log
        const fromStr = srcLoc ? `${srcWh.name} / ${srcLoc.name}` : srcWh.name;
        const toStr = dstLoc ? `${dstWh.name} / ${dstLoc.name}` : dstWh.name;
        db.prepare('INSERT INTO stock_ledger (id, type, reference_id, reference_name, product_id, product_name, from_location, to_location, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), 'transfer', transfer.id, transfer.reference, item.product_id, item.product_name, fromStr, toStr, item.qty
        );
      });
      db.prepare('UPDATE transfers SET status = ?, validated_at = ? WHERE id = ?').run('done', new Date().toISOString(), req.params.id);
    });
    validateAll();

    const updated = db.prepare(`
      SELECT t.*, sw.name as source_warehouse_name, dw.name as dest_warehouse_name
      FROM transfers t JOIN warehouses sw ON t.source_warehouse_id = sw.id JOIN warehouses dw ON t.dest_warehouse_id = dw.id WHERE t.id = ?
    `).get(req.params.id);
    updated.items = db.prepare(`SELECT ti.*, p.name as product_name, p.sku FROM transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?`).all(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete transfer
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM transfers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Transfer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
