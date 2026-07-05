import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, ClipboardCheck } from 'lucide-react';

export default function StockAdjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getAdjustments(filter ? { status: filter } : {}).then(setAdjustments).catch(() => {});
  }, [filter]);

  return (
    <div>
      <div className="page-header">
        <h1>Stock Adjustments</h1>
        <Link to="/adjustments/new" className="btn btn-primary"><Plus size={18} /> New Adjustment</Link>
      </div>
      <div className="filter-bar">
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="done">Done</option>
        </select>
      </div>
      {adjustments.length === 0 ? (
        <div className="empty-state"><ClipboardCheck size={48} /><h3>No adjustments found</h3></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Warehouse</th><th>Location</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {adjustments.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.reference}</strong></td>
                  <td>{a.warehouse_name}</td>
                  <td>{a.location_name || '—'}</td>
                  <td className="truncate" style={{maxWidth:200}}>{a.reason || '—'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td><Link to={`/adjustments/${a.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
