import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', locations: '' });
  const [newLoc, setNewLoc] = useState({});

  const load = () => api.getWarehouses().then(setWarehouses).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const locations = form.locations.split(',').map(l => l.trim()).filter(Boolean);
      await api.createWarehouse({ name: form.name, address: form.address, locations });
      toast.success('Warehouse created');
      setShowModal(false);
      setForm({ name: '', address: '', locations: '' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const addLocation = async (whId) => {
    const name = newLoc[whId];
    if (!name?.trim()) return;
    try { await api.addLocation(whId, name.trim()); setNewLoc({ ...newLoc, [whId]: '' }); toast.success('Location added'); load(); } catch (err) { toast.error(err.message); }
  };

  const deleteWarehouse = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try { await api.deleteWarehouse(id); toast.success('Deleted'); load(); } catch (err) { toast.error(err.message); }
  };

  const deleteLocation = async (locId) => {
    try { await api.deleteLocation(locId); toast.success('Location removed'); load(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Warehouse</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {warehouses.map(wh => (
          <div key={wh.id} className="warehouse-card">
            <div className="flex items-center justify-between mb-8">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarehouseIcon size={18} style={{ color: 'var(--primary-light)' }} />{wh.name}
              </h3>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => deleteWarehouse(wh.id)}><Trash2 size={14} /></button>
            </div>
            <p className="address mb-16">{wh.address || 'No address'}</p>
            <div className="mb-8" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Locations:</div>
            <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
              {wh.locations.map(loc => (
                <span key={loc.id} className="location-tag">
                  <MapPin size={10} /> {loc.name}
                  <button onClick={() => deleteLocation(loc.id)} title="Remove">×</button>
                </span>
              ))}
              {wh.locations.length === 0 && <span className="text-muted" style={{ fontSize: '0.82rem' }}>No locations yet</span>}
            </div>
            <div className="flex gap-8">
              <input
                className="form-control"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="New location..."
                value={newLoc[wh.id] || ''}
                onChange={e => setNewLoc({ ...newLoc, [wh.id]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation(wh.id))}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => addLocation(wh.id)}><Plus size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2>New Warehouse</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Warehouse Name</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse" required /></div>
                <div className="form-group"><label>Address</label><input className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Industrial Ave" /></div>
                <div className="form-group"><label>Locations (comma separated)</label><input className="form-control" value={form.locations} onChange={e => setForm({ ...form, locations: e.target.value })} placeholder="Rack A, Rack B, Floor" /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Warehouse</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
