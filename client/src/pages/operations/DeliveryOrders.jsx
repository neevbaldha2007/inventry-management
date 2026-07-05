import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, Truck } from 'lucide-react';

export default function DeliveryOrders() {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getDeliveries(filter ? { status: filter } : {}).then(setDeliveries).catch(() => {});
  }, [filter]);

  return (
    <div>
      <div className="page-header">
        <h1>Delivery Orders (Outgoing)</h1>
        <Link to="/deliveries/new" className="btn btn-primary"><Plus size={18} /> New Delivery</Link>
      </div>
      <div className="filter-bar">
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="waiting">Waiting</option>
          <option value="ready">Ready</option><option value="done">Done</option>
        </select>
      </div>
      {deliveries.length === 0 ? (
        <div className="empty-state"><Truck size={48} /><h3>No delivery orders found</h3></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Warehouse</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.reference}</strong></td>
                  <td>{d.customer_name}</td>
                  <td>{d.warehouse_name}</td>
                  <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td><Link to={`/deliveries/${d.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
