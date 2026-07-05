const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Stock ledger / move history
router.get('/ledger', (req, res) => {
  try {
    const db = getDb();
    const { type, product_id, limit } = req.query;
    let query = 'SELECT * FROM stock_ledger';
    const conditions = [];
    const params = [];
    if (type) { conditions.push('type = ?'); params.push(type); }
    if (product_id) { conditions.push('product_id = ?'); params.push(product_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock summary by product
router.get('/summary', (req, res) => {
  try {
    const db = getDb();
    const stocks = db.prepare(`
      SELECT p.id, p.name, p.sku, p.category, p.unit_of_measure, p.reorder_level,
             COALESCE(SUM(s.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id
      ORDER BY p.name
    `).all();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock by location for a product
router.get('/by-product/:productId', (req, res) => {
  try {
    const db = getDb();
    const stocks = db.prepare(`
      SELECT s.*, w.name as warehouse_name, l.name as location_name
      FROM stock s
      JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ?
    `).all(req.params.productId);
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
