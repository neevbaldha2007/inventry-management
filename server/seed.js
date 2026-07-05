const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

const RESET = process.argv.includes('--reset');

function seed() {
  const db = getDb();

  if (RESET) {
    console.log('Resetting database...');
    db.exec(`
      DELETE FROM stock_ledger;
      DELETE FROM adjustment_items;
      DELETE FROM adjustments;
      DELETE FROM transfer_items;
      DELETE FROM transfers;
      DELETE FROM delivery_items;
      DELETE FROM deliveries;
      DELETE FROM receipt_items;
      DELETE FROM receipts;
      DELETE FROM stock;
      DELETE FROM locations;
      DELETE FROM warehouses;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM users;
    `);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0 && !RESET) {
    console.log('Database already seeded. Use --reset to re-seed.');
    return;
  }

  console.log('Seeding database...');

  // Users
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const userId = uuidv4();
  db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
    userId, 'Admin User', 'admin@ims.com', passwordHash, 'manager'
  );

  // Categories
  const categories = ['Raw Materials', 'Components', 'Finished Goods', 'Packaging'];
  categories.forEach(c => {
    db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)').run(uuidv4(), c);
  });

  // Warehouses
  const wh1 = uuidv4(), wh2 = uuidv4(), wh3 = uuidv4();
  db.prepare('INSERT INTO warehouses (id, name, address) VALUES (?, ?, ?)').run(wh1, 'Main Warehouse', '123 Industrial Ave, Block A');
  db.prepare('INSERT INTO warehouses (id, name, address) VALUES (?, ?, ?)').run(wh2, 'Warehouse B', '456 Storage Rd, Unit 7');
  db.prepare('INSERT INTO warehouses (id, name, address) VALUES (?, ?, ?)').run(wh3, 'Production Floor', '123 Industrial Ave, Block C');

  // Locations
  const loc = {};
  const locData = [
    { id: uuidv4(), wh: wh1, name: 'Rack A' },
    { id: uuidv4(), wh: wh1, name: 'Rack B' },
    { id: uuidv4(), wh: wh1, name: 'Rack C' },
    { id: uuidv4(), wh: wh1, name: 'Floor Storage' },
    { id: uuidv4(), wh: wh2, name: 'Shelf 1' },
    { id: uuidv4(), wh: wh2, name: 'Shelf 2' },
    { id: uuidv4(), wh: wh2, name: 'Cold Storage' },
    { id: uuidv4(), wh: wh3, name: 'Assembly Line' },
    { id: uuidv4(), wh: wh3, name: 'Quality Check' },
  ];
  locData.forEach(l => {
    db.prepare('INSERT INTO locations (id, warehouse_id, name) VALUES (?, ?, ?)').run(l.id, l.wh, l.name);
    loc[l.name] = l.id;
  });

  // Products
  const products = [
    { id: uuidv4(), name: 'Steel Rods', sku: 'RM-001', category: 'Raw Materials', uom: 'kg', reorder: 50 },
    { id: uuidv4(), name: 'Aluminum Sheets', sku: 'RM-002', category: 'Raw Materials', uom: 'kg', reorder: 30 },
    { id: uuidv4(), name: 'Copper Wire', sku: 'RM-003', category: 'Raw Materials', uom: 'meters', reorder: 100 },
    { id: uuidv4(), name: 'Ball Bearings', sku: 'CP-001', category: 'Components', uom: 'Units', reorder: 200 },
    { id: uuidv4(), name: 'Electric Motors', sku: 'CP-002', category: 'Components', uom: 'Units', reorder: 20 },
    { id: uuidv4(), name: 'Circuit Boards', sku: 'CP-003', category: 'Components', uom: 'Units', reorder: 50 },
    { id: uuidv4(), name: 'Office Chairs', sku: 'FG-001', category: 'Finished Goods', uom: 'Units', reorder: 15 },
    { id: uuidv4(), name: 'Standing Desks', sku: 'FG-002', category: 'Finished Goods', uom: 'Units', reorder: 10 },
    { id: uuidv4(), name: 'Monitor Arms', sku: 'FG-003', category: 'Finished Goods', uom: 'Units', reorder: 25 },
    { id: uuidv4(), name: 'Cardboard Boxes (L)', sku: 'PK-001', category: 'Packaging', uom: 'Units', reorder: 100 },
    { id: uuidv4(), name: 'Bubble Wrap Roll', sku: 'PK-002', category: 'Packaging', uom: 'meters', reorder: 50 },
    { id: uuidv4(), name: 'Packing Tape', sku: 'PK-003', category: 'Packaging', uom: 'rolls', reorder: 30 },
  ];
  const insertProduct = db.prepare('INSERT INTO products (id, name, sku, category, unit_of_measure, reorder_level) VALUES (?, ?, ?, ?, ?, ?)');
  products.forEach(p => insertProduct.run(p.id, p.name, p.sku, p.category, p.uom, p.reorder));

  // Stock
  const insertStock = db.prepare('INSERT INTO stock (id, product_id, warehouse_id, location_id, quantity) VALUES (?, ?, ?, ?, ?)');
  const stockEntries = [
    { pid: products[0].id, wh: wh1, loc: loc['Rack A'], qty: 150 },
    { pid: products[1].id, wh: wh1, loc: loc['Rack A'], qty: 75 },
    { pid: products[2].id, wh: wh1, loc: loc['Rack B'], qty: 200 },
    { pid: products[3].id, wh: wh1, loc: loc['Rack C'], qty: 500 },
    { pid: products[4].id, wh: wh1, loc: loc['Floor Storage'], qty: 35 },
    { pid: products[5].id, wh: wh2, loc: loc['Shelf 1'], qty: 120 },
    { pid: products[6].id, wh: wh2, loc: loc['Shelf 2'], qty: 8 },
    { pid: products[7].id, wh: wh2, loc: loc['Shelf 2'], qty: 5 },
    { pid: products[8].id, wh: wh2, loc: loc['Shelf 1'], qty: 45 },
    { pid: products[9].id, wh: wh1, loc: loc['Floor Storage'], qty: 250 },
    { pid: products[10].id, wh: wh1, loc: loc['Floor Storage'], qty: 30 },
    { pid: products[11].id, wh: wh1, loc: loc['Floor Storage'], qty: 60 },
    { pid: products[0].id, wh: wh3, loc: loc['Assembly Line'], qty: 40 },
    { pid: products[4].id, wh: wh3, loc: loc['Assembly Line'], qty: 10 },
  ];
  stockEntries.forEach(s => insertStock.run(uuidv4(), s.pid, s.wh, s.loc, s.qty));

  const nowISO = new Date().toISOString();

  // Receipts
  const r1 = uuidv4(), r2 = uuidv4(), r3 = uuidv4();
  db.prepare('INSERT INTO receipts (id, reference, supplier_name, warehouse_id, status, validated_at) VALUES (?, ?, ?, ?, ?, ?)').run(r1, 'REC-001', 'Steel Corp Ltd', wh1, 'done', nowISO);
  db.prepare('INSERT INTO receipts (id, reference, supplier_name, warehouse_id, status) VALUES (?, ?, ?, ?, ?)').run(r2, 'REC-002', 'ElectroParts Inc', wh2, 'ready');
  db.prepare('INSERT INTO receipts (id, reference, supplier_name, warehouse_id, status) VALUES (?, ?, ?, ?, ?)').run(r3, 'REC-003', 'PackageWorld', wh1, 'draft');

  const insertRI = db.prepare('INSERT INTO receipt_items (id, receipt_id, product_id, expected_qty, received_qty) VALUES (?, ?, ?, ?, ?)');
  insertRI.run(uuidv4(), r1, products[0].id, 100, 100);
  insertRI.run(uuidv4(), r1, products[1].id, 50, 50);
  insertRI.run(uuidv4(), r2, products[5].id, 80, 80);
  insertRI.run(uuidv4(), r3, products[9].id, 200, 0);

  // Deliveries
  const d1 = uuidv4(), d2 = uuidv4();
  db.prepare('INSERT INTO deliveries (id, reference, customer_name, warehouse_id, status, validated_at) VALUES (?, ?, ?, ?, ?, ?)').run(d1, 'DEL-001', 'Office Spaces Co', wh2, 'done', nowISO);
  db.prepare('INSERT INTO deliveries (id, reference, customer_name, warehouse_id, status) VALUES (?, ?, ?, ?, ?)').run(d2, 'DEL-002', 'TechHub Ltd', wh2, 'draft');

  const insertDI = db.prepare('INSERT INTO delivery_items (id, delivery_id, product_id, qty) VALUES (?, ?, ?, ?)');
  insertDI.run(uuidv4(), d1, products[6].id, 10);
  insertDI.run(uuidv4(), d1, products[7].id, 5);
  insertDI.run(uuidv4(), d2, products[8].id, 20);

  // Transfers
  const t1 = uuidv4(), t2 = uuidv4();
  db.prepare('INSERT INTO transfers (id, reference, source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, status, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(t1, 'TRF-001', wh1, loc['Rack A'], wh3, loc['Assembly Line'], 'done', nowISO);
  db.prepare('INSERT INTO transfers (id, reference, source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(t2, 'TRF-002', wh1, loc['Rack C'], wh3, loc['Quality Check'], 'draft');

  const insertTI = db.prepare('INSERT INTO transfer_items (id, transfer_id, product_id, qty) VALUES (?, ?, ?, ?)');
  insertTI.run(uuidv4(), t1, products[0].id, 40);
  insertTI.run(uuidv4(), t2, products[3].id, 100);

  // Adjustments
  const a1 = uuidv4();
  db.prepare('INSERT INTO adjustments (id, reference, warehouse_id, location_id, reason, status, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(a1, 'ADJ-001', wh1, loc['Rack B'], 'Damaged items found during inventory count', 'done', nowISO);
  const insertAI = db.prepare('INSERT INTO adjustment_items (id, adjustment_id, product_id, recorded_qty, counted_qty, difference) VALUES (?, ?, ?, ?, ?, ?)');
  insertAI.run(uuidv4(), a1, products[2].id, 210, 200, -10);

  // Stock Ledger entries
  const insertLedger = db.prepare('INSERT INTO stock_ledger (id, type, reference_id, reference_name, product_id, product_name, from_location, to_location, qty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const now = Date.now();
  insertLedger.run(uuidv4(), 'receipt', r1, 'REC-001', products[0].id, 'Steel Rods', '', 'Main Warehouse / Rack A', 100, new Date(now - 4*3600000).toISOString());
  insertLedger.run(uuidv4(), 'receipt', r1, 'REC-001', products[1].id, 'Aluminum Sheets', '', 'Main Warehouse / Rack A', 50, new Date(now - 4*3600000).toISOString());
  insertLedger.run(uuidv4(), 'delivery', d1, 'DEL-001', products[6].id, 'Office Chairs', 'Warehouse B / Shelf 2', '', -10, new Date(now - 3*3600000).toISOString());
  insertLedger.run(uuidv4(), 'delivery', d1, 'DEL-001', products[7].id, 'Standing Desks', 'Warehouse B / Shelf 2', '', -5, new Date(now - 3*3600000).toISOString());
  insertLedger.run(uuidv4(), 'transfer', t1, 'TRF-001', products[0].id, 'Steel Rods', 'Main Warehouse / Rack A', 'Production Floor / Assembly Line', 40, new Date(now - 2*3600000).toISOString());
  insertLedger.run(uuidv4(), 'adjustment', a1, 'ADJ-001', products[2].id, 'Copper Wire', 'Main Warehouse / Rack B', 'Main Warehouse / Rack B', -10, new Date(now - 1*3600000).toISOString());

  console.log('Database seeded successfully!');
  console.log('Demo login: admin@ims.com / admin123');
}

seed();
