import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Tags, ChevronDown, ArrowDownToLine, Truck, ArrowLeftRight, ClipboardCheck, History, Warehouse, UserCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [opsOpen, setOpsOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Package size={28} />
          <span>IMS</span>
        </div>
        <div className="sidebar-tagline">Inventory System</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Management</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <Package size={18} /> Products
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <Tags size={18} /> Categories
        </NavLink>

        <div className="nav-section-label">Operations</div>
        <button className="nav-item" onClick={() => setOpsOpen(!opsOpen)}>
          <ClipboardCheck size={18} /> Operations
          <ChevronDown size={14} className={`chevron ${opsOpen ? 'open' : ''}`} />
        </button>
        {opsOpen && (
          <div className="nav-submenu">
            <NavLink to="/receipts" className={({ isActive }) => `nav-item sub ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              <ArrowDownToLine size={14} /> Receipts
            </NavLink>
            <NavLink to="/deliveries" className={({ isActive }) => `nav-item sub ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              <Truck size={14} /> Delivery Orders
            </NavLink>
            <NavLink to="/transfers" className={({ isActive }) => `nav-item sub ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              <ArrowLeftRight size={14} /> Internal Transfers
            </NavLink>
            <NavLink to="/adjustments" className={({ isActive }) => `nav-item sub ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              <ClipboardCheck size={14} /> Adjustments
            </NavLink>
          </div>
        )}
        <NavLink to="/move-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <History size={18} /> Move History
        </NavLink>

        <div className="nav-section-label">Settings</div>
        <NavLink to="/warehouses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
          <Warehouse size={18} /> Warehouses
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="profile-link" onClick={handleNavClick}>
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="profile-info">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role">{user?.role}</span>
          </div>
        </NavLink>
        <button className="btn-ghost btn-icon" onClick={handleLogout} title="Logout"><LogOut size={18} /></button>
      </div>
    </aside>
  );
}
