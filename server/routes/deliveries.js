const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all deliveries
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = `SELECT d.*, w.name as warehouse_name FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id`;
    const params = [];
    if (status) { query += ' WHERE d.status = ?'; params.push(status); }
    query += ' ORDER BY d.created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single delivery with items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const delivery = db.prepare(`SELECT d.*, w.name as warehouse_name FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id WHERE d.id = ?`).get(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    delivery.items = db.prepare(`SELECT di.*, p.name as product_name, p.sku FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?`).all(req.params.id);
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create delivery
router.post('/', (req, res) => {
  try {
    const { customer_name, warehouse_id, items } = req.body;
    if (!customer_name || !warehouse_id) {
      return res.status(400).json({ error: 'Customer name and warehouse are required' });
    }
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM deliveries').get().c;
    const reference = `DEL-${String(count + 1).padStart(3, '0')}`;
    const id = uuidv4();
    db.prepare('INSERT INTO deliveries (id, reference, customer_name, warehouse_id, status) VALUES (?, ?, ?, ?, ?)').run(id, reference, customer_name, warehouse_id, 'draft');
    if (items && items.length) {
      const ins = db.prepare('INSERT INTO delivery_items (id, delivery_id, product_id, qty) VALUES (?, ?, ?, ?)');
      items.forEach(item => ins.run(uuidv4(), id, item.product_id, item.qty || 0));
    }
    const delivery = db.prepare(`SELECT d.*, w.name as warehouse_name FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id WHERE d.id = ?`).get(id);
    delivery.items = db.prepare(`SELECT di.*, p.name as product_name, p.sku FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?`).all(id);
    res.status(201).json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update delivery
router.put('/:id', (req, res) => {
  try {
    const { customer_name, items } = req.body;
    const db = getDb();
    if (customer_name) db.prepare('UPDATE deliveries SET customer_name = ? WHERE id = ?').run(customer_name, req.params.id);
    if (items) {
      db.prepare('DELETE FROM delivery_items WHERE delivery_id = ?').run(req.params.id);
      const ins = db.prepare('INSERT INTO delivery_items (id, delivery_id, product_id, qty) VALUES (?, ?, ?, ?)');
      items.forEach(item => ins.run(uuidv4(), req.params.id, item.product_id, item.qty || 0));
    }
    const delivery = db.prepare(`SELECT d.*, w.name as warehouse_name FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id WHERE d.id = ?`).get(req.params.id);
    delivery.items = db.prepare(`SELECT di.*, p.name as product_name, p.sku FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?`).all(req.params.id);
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate delivery → stock decreases
router.post('/:id/validate', (req, res) => {
  try {
    const db = getDb();
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ error: 'Already validated' });

    const items = db.prepare('SELECT di.*, p.name as product_name FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?').all(req.params.id);
    const warehouse = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(delivery.warehouse_id);

    const validateAll = db.transaction(() => {
      items.forEach(item => {
        // Decrease stock
        const existing = db.prepare('SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ?').get(item.product_id, delivery.warehouse_id);
        if (existing) {
          db.prepare('UPDATE stock SET quantity = MAX(0, quantity - ?) WHERE id = ?').run(item.qty, existing.id);
        }
        // Log to ledger
        db.prepare('INSERT INTO stock_ledger (id, type, reference_id, reference_name, product_id, product_name, from_location, to_location, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), 'delivery', delivery.id, delivery.reference, item.product_id, item.product_name, warehouse.name, '', -item.qty
        );
      });
      db.prepare('UPDATE deliveries SET status = ?, validated_at = ? WHERE id = ?').run('done', new Date().toISOString(), req.params.id);
    });
    validateAll();

    const updated = db.prepare(`SELECT d.*, w.name as warehouse_name FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id WHERE d.id = ?`).get(req.params.id);
    updated.items = db.prepare(`SELECT di.*, p.name as product_name, p.sku FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?`).all(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete delivery
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
