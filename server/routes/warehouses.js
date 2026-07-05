const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get all warehouses with locations
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const warehouses = db.prepare('SELECT * FROM warehouses ORDER BY name').all();
    const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
    const result = warehouses.map(wh => ({
      ...wh,
      locations: locations.filter(l => l.warehouse_id === wh.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single warehouse
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    warehouse.locations = db.prepare('SELECT * FROM locations WHERE warehouse_id = ?').all(req.params.id);
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create warehouse
router.post('/', (req, res) => {
  try {
    const { name, address, locations } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO warehouses (id, name, address) VALUES (?, ?, ?)').run(id, name, address || '');
    if (locations && Array.isArray(locations)) {
      const insertLoc = db.prepare('INSERT INTO locations (id, warehouse_id, name) VALUES (?, ?, ?)');
      locations.forEach(locName => {
        insertLoc.run(uuidv4(), id, locName);
      });
    }
    const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
    warehouse.locations = db.prepare('SELECT * FROM locations WHERE warehouse_id = ?').all(id);
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update warehouse
router.put('/:id', (req, res) => {
  try {
    const { name, address } = req.body;
    const db = getDb();
    db.prepare('UPDATE warehouses SET name=?, address=? WHERE id=?').run(name, address, req.params.id);
    const warehouse = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
    warehouse.locations = db.prepare('SELECT * FROM locations WHERE warehouse_id = ?').all(req.params.id);
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add location to warehouse
router.post('/:id/locations', (req, res) => {
  try {
    const { name } = req.body;
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO locations (id, warehouse_id, name) VALUES (?, ?, ?)').run(id, req.params.id, name);
    res.status(201).json({ id, warehouse_id: req.params.id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete location
router.delete('/locations/:locId', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.locId);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete warehouse
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM warehouses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
