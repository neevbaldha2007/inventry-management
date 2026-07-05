import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="logo">
          <h1>📦 IMS</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-divider"><span>OR</span></div>
        <div className="auth-links">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
