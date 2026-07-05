const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all receipts
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = `SELECT r.*, w.name as warehouse_name FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id`;
    const params = [];
    if (status) { query += ' WHERE r.status = ?'; params.push(status); }
    query += ' ORDER BY r.created_at DESC';
    const receipts = db.prepare(query).all(...params);
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single receipt with items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const receipt = db.prepare(`SELECT r.*, w.name as warehouse_name FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id WHERE r.id = ?`).get(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    receipt.items = db.prepare(`SELECT ri.*, p.name as product_name, p.sku FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?`).all(req.params.id);
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create receipt
router.post('/', (req, res) => {
  try {
    const { supplier_name, warehouse_id, items } = req.body;
    if (!supplier_name || !warehouse_id) {
      return res.status(400).json({ error: 'Supplier name and warehouse are required' });
    }
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM receipts').get().c;
    const reference = `REC-${String(count + 1).padStart(3, '0')}`;
    const id = uuidv4();
    db.prepare('INSERT INTO receipts (id, reference, supplier_name, warehouse_id, status) VALUES (?, ?, ?, ?, ?)').run(id, reference, supplier_name, warehouse_id, 'draft');
    if (items && items.length) {
      const ins = db.prepare('INSERT INTO receipt_items (id, receipt_id, product_id, expected_qty, received_qty) VALUES (?, ?, ?, ?, ?)');
      items.forEach(item => {
        ins.run(uuidv4(), id, item.product_id, item.expected_qty || 0, 0);
      });
    }
    const receipt = db.prepare(`SELECT r.*, w.name as warehouse_name FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id WHERE r.id = ?`).get(id);
    receipt.items = db.prepare(`SELECT ri.*, p.name as product_name, p.sku FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?`).all(id);
    res.status(201).json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update receipt items
router.put('/:id', (req, res) => {
  try {
    const { supplier_name, items } = req.body;
    const db = getDb();
    if (supplier_name) {
      db.prepare('UPDATE receipts SET supplier_name = ? WHERE id = ?').run(supplier_name, req.params.id);
    }
    if (items) {
      db.prepare('DELETE FROM receipt_items WHERE receipt_id = ?').run(req.params.id);
      const ins = db.prepare('INSERT INTO receipt_items (id, receipt_id, product_id, expected_qty, received_qty) VALUES (?, ?, ?, ?, ?)');
      items.forEach(item => {
        ins.run(uuidv4(), req.params.id, item.product_id, item.expected_qty || 0, item.received_qty || 0);
      });
    }
    const receipt = db.prepare(`SELECT r.*, w.name as warehouse_name FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id WHERE r.id = ?`).get(req.params.id);
    receipt.items = db.prepare(`SELECT ri.*, p.name as product_name, p.sku FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?`).all(req.params.id);
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate receipt → stock increases
router.post('/:id/validate', (req, res) => {
  try {
    const db = getDb();
    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ error: 'Already validated' });

    const items = db.prepare('SELECT ri.*, p.name as product_name FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?').all(req.params.id);
    const { received_items } = req.body;
    const warehouse = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(receipt.warehouse_id);

    const updateAll = db.transaction(() => {
      items.forEach(item => {
        const recvQty = received_items ? (received_items.find(r => r.product_id === item.product_id)?.received_qty || item.expected_qty) : item.expected_qty;
        // Update received qty
        db.prepare('UPDATE receipt_items SET received_qty = ? WHERE id = ?').run(recvQty, item.id);
        // Upsert stock
        const existing = db.prepare('SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, receipt.warehouse_id);
        if (existing) {
          db.prepare('UPDATE stock SET quantity = quantity + ? WHERE id = ?').run(recvQty, existing.id);
        } else {
          db.prepare('INSERT INTO stock (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)').run(uuidv4(), item.product_id, receipt.warehouse_id, recvQty);
        }
        // Log to ledger
        db.prepare('INSERT INTO stock_ledger (id, type, reference_id, reference_name, product_id, product_name, from_location, to_location, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), 'receipt', receipt.id, receipt.reference, item.product_id, item.product_name, '', warehouse.name, recvQty
        );
      });
      db.prepare('UPDATE receipts SET status = ?, validated_at = ? WHERE id = ?').run('done', new Date().toISOString(), req.params.id);
    });
    updateAll();

    const updated = db.prepare(`SELECT r.*, w.name as warehouse_name FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id WHERE r.id = ?`).get(req.params.id);
    updated.items = db.prepare(`SELECT ri.*, p.name as product_name, p.sku FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?`).all(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete receipt
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM receipts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
