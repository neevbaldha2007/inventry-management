const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all adjustments
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = `SELECT a.*, w.name as warehouse_name, l.name as location_name FROM adjustments a JOIN warehouses w ON a.warehouse_id = w.id LEFT JOIN locations l ON a.location_id = l.id`;
    const params = [];
    if (status) { query += ' WHERE a.status = ?'; params.push(status); }
    query += ' ORDER BY a.created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single adjustment with items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const adj = db.prepare(`SELECT a.*, w.name as warehouse_name, l.name as location_name FROM adjustments a JOIN warehouses w ON a.warehouse_id = w.id LEFT JOIN locations l ON a.location_id = l.id WHERE a.id = ?`).get(req.params.id);
    if (!adj) return res.status(404).json({ error: 'Adjustment not found' });
    adj.items = db.prepare(`SELECT ai.*, p.name as product_name, p.sku FROM adjustment_items ai JOIN products p ON ai.product_id = p.id WHERE ai.adjustment_id = ?`).all(req.params.id);
    res.json(adj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create adjustment
router.post('/', (req, res) => {
  try {
    const { warehouse_id, location_id, reason, items } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'Warehouse is required' });
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM adjustments').get().c;
    const reference = `ADJ-${String(count + 1).padStart(3, '0')}`;
    const id = uuidv4();
    db.prepare('INSERT INTO adjustments (id, reference, warehouse_id, location_id, reason, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, reference, warehouse_id, location_id || null, reason || '', 'draft'
    );
    if (items && items.length) {
      const ins = db.prepare('INSERT INTO adjustment_items (id, adjustment_id, product_id, recorded_qty, counted_qty, difference) VALUES (?, ?, ?, ?, ?, ?)');
      items.forEach(item => {
        const diff = (item.counted_qty || 0) - (item.recorded_qty || 0);
        ins.run(uuidv4(), id, item.product_id, item.recorded_qty || 0, item.counted_qty || 0, diff);
      });
    }
    const adj = db.prepare(`SELECT a.*, w.name as warehouse_name FROM adjustments a JOIN warehouses w ON a.warehouse_id = w.id WHERE a.id = ?`).get(id);
    adj.items = db.prepare(`SELECT ai.*, p.name as product_name, p.sku FROM adjustment_items ai JOIN products p ON ai.product_id = p.id WHERE ai.adjustment_id = ?`).all(id);
    res.status(201).json(adj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate adjustment → stock corrected
router.post('/:id/validate', (req, res) => {
  try {
    const db = getDb();
    const adj = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id);
    if (!adj) return res.status(404).json({ error: 'Adjustment not found' });
    if (adj.status === 'done') return res.status(400).json({ error: 'Already validated' });

    const items = db.prepare('SELECT ai.*, p.name as product_name FROM adjustment_items ai JOIN products p ON ai.product_id = p.id WHERE ai.adjustment_id = ?').all(req.params.id);
    const warehouse = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(adj.warehouse_id);
    const location = adj.location_id ? db.prepare('SELECT name FROM locations WHERE id = ?').get(adj.location_id) : null;
    const locStr = location ? `${warehouse.name} / ${location.name}` : warehouse.name;

    const validateAll = db.transaction(() => {
      items.forEach(item => {
        // Set stock to counted quantity
        const existing = db.prepare('SELECT id FROM stock WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, adj.warehouse_id);
        if (existing) {
          db.prepare('UPDATE stock SET quantity = ? WHERE id = ?').run(item.counted_qty, existing.id);
        } else {
          db.prepare('INSERT INTO stock (id, product_id, warehouse_id, location_id, quantity) VALUES (?, ?, ?, ?, ?)').run(
            uuidv4(), item.product_id, adj.warehouse_id, adj.location_id, item.counted_qty
          );
        }
        // Log
        db.prepare('INSERT INTO stock_ledger (id, type, reference_id, reference_name, product_id, product_name, from_location, to_location, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), 'adjustment', adj.id, adj.reference, item.product_id, item.product_name, locStr, locStr, item.difference
        );
      });
      db.prepare('UPDATE adjustments SET status = ?, validated_at = ? WHERE id = ?').run('done', new Date().toISOString(), req.params.id);
    });
    validateAll();

    const updated = db.prepare(`SELECT a.*, w.name as warehouse_name FROM adjustments a JOIN warehouses w ON a.warehouse_id = w.id WHERE a.id = ?`).get(req.params.id);
    updated.items = db.prepare(`SELECT ai.*, p.name as product_name, p.sku FROM adjustment_items ai JOIN products p ON ai.product_id = p.id WHERE ai.adjustment_id = ?`).all(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete adjustment
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM adjustments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Adjustment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
