import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History } from 'lucide-react';

export default function MoveHistory() {
  const [ledger, setLedger] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStockLedger(filterType ? { type: filterType } : {}).then(setLedger).catch(() => {}).finally(() => setLoading(false));
  }, [filterType]);

  const typeColors = {
    receipt: 'var(--success)',
    delivery: 'var(--danger)',
    transfer: 'var(--secondary)',
    adjustment: 'var(--warning)'
  };

  return (
    <div>
      <div className="page-header"><h1>Move History (Stock Ledger)</h1></div>
      <div className="filter-bar">
        <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="receipt">Receipts</option>
          <option value="delivery">Deliveries</option>
          <option value="transfer">Transfers</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </div>
      {loading ? <p className="text-muted">Loading...</p> : ledger.length === 0 ? (
        <div className="empty-state"><History size={48} /><h3>No stock movements yet</h3></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Reference</th><th>Product</th><th>From</th><th>To</th><th>Qty</th><th>Date</th></tr></thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td><span style={{ color: typeColors[entry.type], fontWeight: 700, textTransform: 'capitalize' }}>{entry.type}</span></td>
                  <td><strong>{entry.reference_name}</strong></td>
                  <td>{entry.product_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{entry.from_location || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{entry.to_location || '—'}</td>
                  <td style={{ fontWeight: 700, color: entry.qty > 0 ? 'var(--success)' : entry.qty < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {entry.qty > 0 ? '+' : ''}{entry.qty}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
