import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceiptForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplier_name: '', warehouse_id: '', items: [] });
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses);
    api.getProducts().then(setProducts);
    if (id) {
      api.getReceipt(id).then(r => {
        setReceipt(r);
        setForm({ supplier_name: r.supplier_name, warehouse_id: r.warehouse_id, items: r.items.map(i => ({ product_id: i.product_id, expected_qty: i.expected_qty, received_qty: i.received_qty })) });
      });
    }
  }, [id]);

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', expected_qty: 0, received_qty: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => { const items = [...form.items]; items[i][field] = value; setForm({ ...form, items }); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (id) { await api.updateReceipt(id, form); toast.success('Receipt updated'); }
      else { const r = await api.createReceipt(form); toast.success('Receipt created'); navigate(`/receipts/${r.id}`); }
    } catch (err) { toast.error(err.message); }
  };

  const handleValidate = async () => {
    try {
      const received_items = form.items.map(i => ({ product_id: i.product_id, received_qty: i.received_qty || i.expected_qty }));
      await api.validateReceipt(id, received_items);
      toast.success('Receipt validated! Stock updated.');
      navigate('/receipts');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{id ? `Receipt ${receipt?.reference || ''}` : 'New Receipt'}</h1>
        <div className="flex gap-12">
          {receipt && receipt.status !== 'done' && (
            <button className="btn btn-success" onClick={handleValidate}><CheckCircle size={18} /> Validate</button>
          )}
          {receipt?.status === 'done' && <span className="badge badge-done" style={{padding:'8px 16px',fontSize:'0.85rem'}}>Validated ✓</span>}
        </div>
      </div>
      <form onSubmit={handleSave} className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>Supplier Name</label>
            <input className="form-control" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} required disabled={receipt?.status === 'done'} />
          </div>
          <div className="form-group">
            <label>Warehouse</label>
            <select className="form-control" value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })} required disabled={receipt?.status === 'done'}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-24">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Items</h3>
            {receipt?.status !== 'done' && <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>}
          </div>
          {form.items.length === 0 ? <p className="text-muted">No items added yet.</p> : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Expected Qty</th><th>Received Qty</th><th></th></tr></thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <select className="form-control" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} disabled={receipt?.status === 'done'}>
                          <option value="">Select product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                      </td>
                      <td><input className="form-control" type="number" min="0" value={item.expected_qty} onChange={e => updateItem(i, 'expected_qty', parseFloat(e.target.value) || 0)} disabled={receipt?.status === 'done'} /></td>
                      <td><input className="form-control" type="number" min="0" value={item.received_qty} onChange={e => updateItem(i, 'received_qty', parseFloat(e.target.value) || 0)} disabled={receipt?.status === 'done'} /></td>
                      <td>{receipt?.status !== 'done' && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(i)}><Trash2 size={14} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {receipt?.status !== 'done' && (
          <div className="mt-24 flex gap-12" style={{justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/receipts')}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Receipt</button>
          </div>
        )}
      </form>
    </div>
  );
}
