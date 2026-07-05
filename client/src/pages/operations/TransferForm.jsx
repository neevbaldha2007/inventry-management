import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ source_warehouse_id: '', source_location_id: '', dest_warehouse_id: '', dest_location_id: '', items: [] });
  const [transfer, setTransfer] = useState(null);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses);
    api.getProducts().then(setProducts);
    if (id) {
      api.getTransfer(id).then(t => {
        setTransfer(t);
        setForm({ source_warehouse_id: t.source_warehouse_id, source_location_id: t.source_location_id || '', dest_warehouse_id: t.dest_warehouse_id, dest_location_id: t.dest_location_id || '', items: t.items.map(i => ({ product_id: i.product_id, qty: i.qty })) });
      });
    }
  }, [id]);

  const srcLocations = warehouses.find(w => w.id === form.source_warehouse_id)?.locations || [];
  const dstLocations = warehouses.find(w => w.id === form.dest_warehouse_id)?.locations || [];

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', qty: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => { const items = [...form.items]; items[i][field] = value; setForm({ ...form, items }); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, source_location_id: form.source_location_id || null, dest_location_id: form.dest_location_id || null };
      if (id) { toast.success('Transfer saved'); }
      else { const t = await api.createTransfer(payload); toast.success('Transfer created'); navigate(`/transfers/${t.id}`); }
    } catch (err) { toast.error(err.message); }
  };

  const handleValidate = async () => {
    try { await api.validateTransfer(id); toast.success('Transfer validated! Stock moved.'); navigate('/transfers'); } catch (err) { toast.error(err.message); }
  };

  const isDone = transfer?.status === 'done';

  return (
    <div>
      <div className="page-header">
        <h1>{id ? `Transfer ${transfer?.reference || ''}` : 'New Internal Transfer'}</h1>
        <div className="flex gap-12">
          {transfer && !isDone && <button className="btn btn-success" onClick={handleValidate}><CheckCircle size={18} /> Validate</button>}
          {isDone && <span className="badge badge-done" style={{padding:'8px 16px',fontSize:'0.85rem'}}>Validated ✓</span>}
        </div>
      </div>
      <form onSubmit={handleSave} className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Source Warehouse</label>
            <select className="form-control" value={form.source_warehouse_id} onChange={e => setForm({ ...form, source_warehouse_id: e.target.value, source_location_id: '' })} required disabled={isDone}>
              <option value="">Select source</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Source Location (optional)</label>
            <select className="form-control" value={form.source_location_id} onChange={e => setForm({ ...form, source_location_id: e.target.value })} disabled={isDone}>
              <option value="">Any</option>
              {srcLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Destination Warehouse</label>
            <select className="form-control" value={form.dest_warehouse_id} onChange={e => setForm({ ...form, dest_warehouse_id: e.target.value, dest_location_id: '' })} required disabled={isDone}>
              <option value="">Select destination</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Destination Location (optional)</label>
            <select className="form-control" value={form.dest_location_id} onChange={e => setForm({ ...form, dest_location_id: e.target.value })} disabled={isDone}>
              <option value="">Any</option>
              {dstLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-24">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Items</h3>
            {!isDone && <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>}
          </div>
          {form.items.length === 0 ? <p className="text-muted">No items added yet.</p> : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Quantity</th><th></th></tr></thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td><select className="form-control" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} disabled={isDone}>
                        <option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></td>
                      <td><input className="form-control" type="number" min="0" value={item.qty} onChange={e => updateItem(i, 'qty', parseFloat(e.target.value) || 0)} disabled={isDone} /></td>
                      <td>{!isDone && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!isDone && (
          <div className="mt-24 flex gap-12" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/transfers')}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Transfer</button>
          </div>
        )}
      </form>
    </div>
  );
}
