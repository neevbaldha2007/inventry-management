import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, X, AlertTriangle, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import './TopBar.css';

const pageTitles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/receipts': 'Receipts',
  '/receipts/new': 'New Receipt',
  '/deliveries': 'Delivery Orders',
  '/deliveries/new': 'New Delivery',
  '/transfers': 'Internal Transfers',
  '/transfers/new': 'New Transfer',
  '/adjustments': 'Stock Adjustments',
  '/adjustments/new': 'New Adjustment',
  '/move-history': 'Move History',
  '/warehouses': 'Warehouses',
  '/profile': 'My Profile',
};

export default function TopBar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const title = pageTitles[location.pathname] || 'Inventory Management';

  useEffect(() => {
    api.getDashboard().then(data => {
      setLowStockProducts(data.lowStockProducts || []);
    }).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn-ghost btn-icon hamburger-btn" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <form onSubmit={handleSearch} className="topbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by SKU or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="topbar-notifications" ref={notifRef}>
          <button
            className="btn-ghost btn-icon notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {lowStockProducts.length > 0 && (
              <span className="notification-badge">{lowStockProducts.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <span><AlertTriangle size={14} style={{color:'var(--warning)', marginRight: 6}} />Low Stock Alerts</span>
                <button className="btn-ghost btn-icon" onClick={() => setShowNotifications(false)} style={{padding:4}}><X size={14} /></button>
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="notification-empty">All items in stock ✓</div>
              ) : (
                <div className="notification-list">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="notification-item" onClick={() => { setShowNotifications(false); navigate('/products'); }}>
                      <div className="notification-item-name">{p.name}</div>
                      <div className="notification-item-detail">
                        <span className="mono">{p.sku}</span>
                        <span style={{ color: p.total_stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                          {p.total_stock} left
                        </span>
                        <span className="text-muted">/ reorder at {p.reorder_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
