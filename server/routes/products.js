const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all products with stock totals
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, category } = req.query;
    let query = `
      SELECT p.*, COALESCE(SUM(s.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
    `;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY p.id ORDER BY p.name';
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product with stock per location
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const stockByLocation = db.prepare(`
      SELECT s.*, w.name as warehouse_name, l.name as location_name
      FROM stock s
      JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ?
    `).all(req.params.id);
    res.json({ ...product, stock: stockByLocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', (req, res) => {
  try {
    const { name, sku, category, unit_of_measure, reorder_level } = req.body;
    if (!name || !sku || !category) {
      return res.status(400).json({ error: 'Name, SKU, and category are required' });
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existing) return res.status(409).json({ error: 'SKU already exists' });
    const id = uuidv4();
    db.prepare('INSERT INTO products (id, name, sku, category, unit_of_measure, reorder_level) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, name, sku, category, unit_of_measure || 'Units', reorder_level || 10
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const { name, sku, category, unit_of_measure, reorder_level } = req.body;
    const db = getDb();
    db.prepare('UPDATE products SET name=?, sku=?, category=?, unit_of_measure=?, reorder_level=? WHERE id=?').run(
      name, sku, category, unit_of_measure, reorder_level, req.params.id
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add category
router.post('/meta/categories', (req, res) => {
  try {
    const { name } = req.body;
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(id, name);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
