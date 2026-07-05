import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit_of_measure: 'Units', reorder_level: 10 });

  const load = () => {
    setLoading(true);
    api.getProducts({ search, category: filterCat }).then(setProducts).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, filterCat]);
  useEffect(() => { api.getCategories().then(c => setCategories(c)).catch(() => {}); }, []);
  useEffect(() => { const q = searchParams.get('search'); if (q) setSearch(q); }, [searchParams]);

  const openNew = () => { setEditProduct(null); setForm({ name: '', sku: '', category: categories[0]?.name || '', unit_of_measure: 'Units', reorder_level: 10 }); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, sku: p.sku, category: p.category, unit_of_measure: p.unit_of_measure, reorder_level: p.reorder_level }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await api.updateProduct(editProduct.id, form);
        toast.success('Product updated');
      } else {
        await api.createProduct(form);
        toast.success('Product created');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.deleteProduct(id); toast.success('Deleted'); load(); } catch (err) { toast.error(err.message); }
  };

  const getStockColor = (p) => {
    if (p.total_stock === 0) return 'var(--danger)';
    if (p.total_stock <= p.reorder_level) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Add Product</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input className="form-control" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-muted">Loading...</p> : products.length === 0 ? (
        <div className="empty-state"><Package size={48} /><h3>No products found</h3><p>Create your first product to get started.</p></div>
      ) : (
        <div className="data-table-wrapper glass-card">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>SKU</th><th>Category</th><th>UoM</th><th>Stock</th><th>Reorder</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="mono">{p.sku}</span></td>
                  <td><span className="badge badge-category">{p.category}</span></td>
                  <td>{p.unit_of_measure}</td>
                  <td style={{ fontWeight: 700, color: getStockColor(p) }}>
                    {p.total_stock}
                  </td>
                  <td>{p.reorder_level}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(p.id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" required />
                </div>
                <div className="form-group">
                  <label>SKU / Code</label>
                  <input className="form-control" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. RM-001" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Unit of Measure</label>
                    <select className="form-control" value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })}>
                      {['Units', 'kg', 'meters', 'liters', 'rolls', 'boxes', 'pieces'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reorder Level</label>
                    <input className="form-control" type="number" min="0" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
