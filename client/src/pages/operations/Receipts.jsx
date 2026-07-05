import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, ArrowDownToLine } from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getReceipts(filter ? { status: filter } : {}).then(setReceipts).catch(() => {});
  }, [filter]);

  return (
    <div>
      <div className="page-header">
        <h1>Receipts (Incoming Goods)</h1>
        <Link to="/receipts/new" className="btn btn-primary"><Plus size={18} /> New Receipt</Link>
      </div>
      <div className="filter-bar">
        <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="waiting">Waiting</option>
          <option value="ready">Ready</option><option value="done">Done</option>
        </select>
      </div>
      {receipts.length === 0 ? (
        <div className="empty-state"><ArrowDownToLine size={48} /><h3>No receipts found</h3></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Supplier</th><th>Warehouse</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.reference}</strong></td>
                  <td>{r.supplier_name}</td>
                  <td>{r.warehouse_name}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td><Link to={`/receipts/${r.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
