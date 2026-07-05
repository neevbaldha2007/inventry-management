import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, ArrowLeftRight } from 'lucide-react';

export default function InternalTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getTransfers(filter ? { status: filter } : {}).then(setTransfers).catch(() => {});
  }, [filter]);

  return (
    <div>
      <div className="page-header">
        <h1>Internal Transfers</h1>
        <Link to="/transfers/new" className="btn btn-primary"><Plus size={18} /> New Transfer</Link>
      </div>
      <div className="filter-bar">
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="done">Done</option>
        </select>
      </div>
      {transfers.length === 0 ? (
        <div className="empty-state"><ArrowLeftRight size={48} /><h3>No transfers found</h3></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>From</th><th>To</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.reference}</strong></td>
                  <td>{t.source_warehouse_name}{t.source_location_name ? ` / ${t.source_location_name}` : ''}</td>
                  <td>{t.dest_warehouse_name}{t.dest_location_name ? ` / ${t.dest_location_name}` : ''}</td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td><Link to={`/transfers/${t.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
