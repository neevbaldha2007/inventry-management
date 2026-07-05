const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Dashboard KPIs
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

    const lowStockItems = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, COALESCE(SUM(s.quantity), 0) as total_stock, p.reorder_level
        FROM products p LEFT JOIN stock s ON p.id = s.product_id
        GROUP BY p.id
        HAVING total_stock <= p.reorder_level
      )
    `).get().count;

    const outOfStockItems = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, COALESCE(SUM(s.quantity), 0) as total_stock
        FROM products p LEFT JOIN stock s ON p.id = s.product_id
        GROUP BY p.id
        HAVING total_stock = 0
      )
    `).get().count;

    const pendingReceipts = db.prepare("SELECT COUNT(*) as count FROM receipts WHERE status IN ('draft', 'ready', 'waiting')").get().count;
    const pendingDeliveries = db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE status IN ('draft', 'ready', 'waiting')").get().count;
    const pendingTransfers = db.prepare("SELECT COUNT(*) as count FROM transfers WHERE status IN ('draft', 'ready', 'waiting')").get().count;

    const recentActivity = db.prepare('SELECT * FROM stock_ledger ORDER BY created_at DESC LIMIT 10').all();

    const stockByCategory = db.prepare(`
      SELECT p.category, COALESCE(SUM(s.quantity), 0) as total_stock, COUNT(DISTINCT p.id) as product_count
      FROM products p LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.category
    `).all();

    const topProducts = db.prepare(`
      SELECT p.name, p.sku, COALESCE(SUM(s.quantity), 0) as total_stock
      FROM products p LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id
      ORDER BY total_stock DESC
      LIMIT 8
    `).all();

    const lowStockProducts = db.prepare(`
      SELECT p.id, p.name, p.sku, p.reorder_level, COALESCE(SUM(s.quantity), 0) as total_stock
      FROM products p LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id
      HAVING total_stock <= p.reorder_level
      ORDER BY total_stock ASC
    `).all();

    res.json({
      kpis: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers
      },
      recentActivity,
      stockByCategory,
      topProducts,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
