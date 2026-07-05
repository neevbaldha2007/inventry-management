import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile(form);
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header"><h1>My Profile</h1></div>
      <div className="glass-card" style={{ padding: 32, maxWidth: 500 }}>
        <div className="flex items-center gap-16 mb-24">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.name}</h3>
            <p className="text-muted" style={{ textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary"><Save size={18} /> Save Changes</button>
        </form>
      </div>
    </div>
  );
}
