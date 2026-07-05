import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  const load = () => api.getCategories().then(setCategories).catch(() => {});
  useEffect(() => { load(); }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try { await api.addCategory(newCat.trim()); setNewCat(''); toast.success('Category added'); load(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header"><h1>Product Categories</h1></div>
      <div className="glass-card" style={{ padding: 24, maxWidth: 600 }}>
        <form onSubmit={addCategory} className="flex gap-12 mb-24">
          <input className="form-control" style={{ flex: 1 }} placeholder="New category name..." value={newCat} onChange={e => setNewCat(e.target.value)} />
          <button className="btn btn-primary" type="submit"><Plus size={18} /> Add</button>
        </form>
        {categories.length === 0 ? (
          <div className="empty-state"><Tags size={40} /><h3>No categories</h3></div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Category Name</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
