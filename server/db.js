const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'manager',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      unit_of_measure TEXT NOT NULL DEFAULT 'Units',
      reorder_level INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      location_id TEXT,
      quantity REAL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      validated_at TEXT,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      expected_qty REAL DEFAULT 0,
      received_qty REAL DEFAULT 0,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      validated_at TEXT,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_items (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty REAL DEFAULT 0,
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      source_warehouse_id TEXT NOT NULL,
      source_location_id TEXT,
      dest_warehouse_id TEXT NOT NULL,
      dest_location_id TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      validated_at TEXT,
      FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (dest_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (source_location_id) REFERENCES locations(id),
      FOREIGN KEY (dest_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_items (
      id TEXT PRIMARY KEY,
      transfer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty REAL DEFAULT 0,
      FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      location_id TEXT,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      validated_at TEXT,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS adjustment_items (
      id TEXT PRIMARY KEY,
      adjustment_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      recorded_qty REAL DEFAULT 0,
      counted_qty REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      FOREIGN KEY (adjustment_id) REFERENCES adjustments(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS stock_ledger (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      reference_name TEXT DEFAULT '',
      product_id TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      from_location TEXT DEFAULT '',
      to_location TEXT DEFAULT '',
      qty REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);
}

module.exports = { getDb };
