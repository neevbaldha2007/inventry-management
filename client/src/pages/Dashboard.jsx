import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, AlertTriangle, ArrowDownToLine, Truck, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#7c6ff7', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#eef0f6', fontSize: '0.85rem' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label || payload[0]?.name}</p>
      <p style={{ color: '#b0b8cc' }}>{payload[0]?.dataKey === 'total_stock' ? 'Stock' : 'Value'}: <strong style={{ color: '#eef0f6' }}>{payload[0]?.value}</strong></p>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state" style={{marginTop:80}}><p>Loading dashboard...</p></div>;
  if (!data) return <div className="empty-state" style={{marginTop:80}}><p>Failed to load dashboard</p></div>;

  const { kpis, recentActivity, stockByCategory, topProducts, lowStockProducts } = data;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card purple">
          <div className="kpi-icon"><Package size={40} /></div>
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{kpis.totalProducts}</div>
        </div>
        <div className="glass-card kpi-card red">
          <div className="kpi-icon"><AlertTriangle size={40} /></div>
          <div className="kpi-label">Low Stock Items</div>
          <div className="kpi-value">{kpis.lowStockItems}</div>
        </div>
        <div className="glass-card kpi-card green">
          <div className="kpi-icon"><ArrowDownToLine size={40} /></div>
          <div className="kpi-label">Pending Receipts</div>
          <div className="kpi-value">{kpis.pendingReceipts}</div>
        </div>
        <div className="glass-card kpi-card orange">
          <div className="kpi-icon"><Truck size={40} /></div>
          <div className="kpi-label">Pending Deliveries</div>
          <div className="kpi-value">{kpis.pendingDeliveries}</div>
        </div>
        <div className="glass-card kpi-card teal">
          <div className="kpi-icon"><ArrowLeftRight size={40} /></div>
          <div className="kpi-label">Pending Transfers</div>
          <div className="kpi-value">{kpis.pendingTransfers}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3><TrendingUp size={16} />Top Products by Stock</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} margin={{ bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#b0b8cc', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#b0b8cc', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_stock" fill="#7c6ff7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><Package size={16} />Stock by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stockByCategory}
                dataKey="total_stock"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#727d95' }}
              >
                {stockByCategory.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Activity */}
        <div className="glass-card activity-feed">
          <div className="section-title">Recent Activity</div>
          {recentActivity.length === 0 ? (
            <p className="text-muted">No recent activity</p>
          ) : (
            recentActivity.map(item => (
              <div className="activity-item" key={item.id}>
                <div className={`activity-dot ${item.type}`} />
                <div>
                  <div className="activity-text">
                    <strong>{item.reference_name}</strong> — {item.type === 'receipt' ? 'Received' : item.type === 'delivery' ? 'Delivered' : item.type === 'transfer' ? 'Transferred' : 'Adjusted'}{' '}
                    <strong>{Math.abs(item.qty)}</strong> {item.product_name}
                  </div>
                  <div className="activity-time">{new Date(item.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title">
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            Low Stock Alerts
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted">All stock levels are healthy!</p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Reorder</th></tr></thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="mono">{p.sku}</span></td>
                      <td style={{ color: p.total_stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>{p.total_stock}</td>
                      <td>{p.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
