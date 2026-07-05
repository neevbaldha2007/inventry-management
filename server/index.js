const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');

// Initialize DB
getDb();

const app = express();

// CORS: allow Vercel frontend and localhost in dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://inventry-management-kappa.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());


// Import middleware
const { authMiddleware } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const warehouseRoutes = require('./routes/warehouses');
const receiptRoutes = require('./routes/receipts');
const deliveryRoutes = require('./routes/deliveries');
const transferRoutes = require('./routes/transfers');
const adjustmentRoutes = require('./routes/adjustments');
const stockRoutes = require('./routes/stock');
const dashboardRoutes = require('./routes/dashboard');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/warehouses', authMiddleware, warehouseRoutes);
app.use('/api/receipts', authMiddleware, receiptRoutes);
app.use('/api/deliveries', authMiddleware, deliveryRoutes);
app.use('/api/transfers', authMiddleware, transferRoutes);
app.use('/api/adjustments', authMiddleware, adjustmentRoutes);
app.use('/api/stock', authMiddleware, stockRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 IMS Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: inventory.db`);

  // Auto-seed if no users exist
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('No users found, running seed...');
    require('./seed');
  }
});
