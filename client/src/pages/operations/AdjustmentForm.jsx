import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdjustmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [form, setForm] = useState({ warehouse_id: '', location_id: '', reason: '', items: [] });
  const [adjustment, setAdjustment] = useState(null);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses);
    api.getProducts().then(setProducts);
    api.getStockSummary().then(setStockData);
    if (id) {
      api.getAdjustment(id).then(a => {
        setAdjustment(a);
        setForm({ warehouse_id: a.warehouse_id, location_id: a.location_id || '', reason: a.reason, items: a.items.map(i => ({ product_id: i.product_id, recorded_qty: i.recorded_qty, counted_qty: i.counted_qty })) });
      });
    }
  }, [id]);

  const locations = warehouses.find(w => w.id === form.warehouse_id)?.locations || [];
  const isDone = adjustment?.status === 'done';

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', recorded_qty: 0, counted_qty: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    if (field === 'product_id') {
      const stock = stockData.find(s => s.id === value);
      items[i].recorded_qty = stock?.total_stock || 0;
    }
    setForm({ ...form, items });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, location_id: form.location_id || null };
      if (id) { toast.success('Adjustment saved'); }
      else { const a = await api.createAdjustment(payload); toast.success('Adjustment created'); navigate(`/adjustments/${a.id}`); }
    } catch (err) { toast.error(err.message); }
  };

  const handleValidate = async () => {
    try { await api.validateAdjustment(id); toast.success('Adjustment validated! Stock corrected.'); navigate('/adjustments'); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{id ? `Adjustment ${adjustment?.reference || ''}` : 'New Stock Adjustment'}</h1>
        <div className="flex gap-12">
          {adjustment && !isDone && <button className="btn btn-success" onClick={handleValidate}><CheckCircle size={18} /> Validate</button>}
          {isDone && <span className="badge badge-done" style={{padding:'8px 16px',fontSize:'0.85rem'}}>Validated ✓</span>}
        </div>
      </div>
      <form onSubmit={handleSave} className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Warehouse</label>
            <select className="form-control" value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value, location_id: '' })} required disabled={isDone}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Location (optional)</label>
            <select className="form-control" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} disabled={isDone}>
              <option value="">Any</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Reason</label>
          <input className="form-control" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Damaged items, Annual count" disabled={isDone} />
        </div>
        <div className="mt-24">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Items</h3>
            {!isDone && <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>}
          </div>
          {form.items.length === 0 ? <p className="text-muted">No items added yet.</p> : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Recorded Qty</th><th>Counted Qty</th><th>Difference</th><th></th></tr></thead>
                <tbody>
                  {form.items.map((item, i) => {
                    const diff = (item.counted_qty || 0) - (item.recorded_qty || 0);
                    return (
                      <tr key={i}>
                        <td><select className="form-control" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} disabled={isDone}>
                          <option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></td>
                        <td><input className="form-control" type="number" value={item.recorded_qty} readOnly style={{opacity:0.6}} /></td>
                        <td><input className="form-control" type="number" min="0" value={item.counted_qty} onChange={e => updateItem(i, 'counted_qty', parseFloat(e.target.value) || 0)} disabled={isDone} /></td>
                        <td style={{ fontWeight: 700, color: diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{diff > 0 ? '+' : ''}{diff}</td>
                        <td>{!isDone && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!isDone && (
          <div className="mt-24 flex gap-12" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/adjustments')}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Adjustment</button>
          </div>
        )}
      </form>
    </div>
  );
}
