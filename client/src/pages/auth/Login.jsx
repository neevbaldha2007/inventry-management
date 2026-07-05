import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@ims.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
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
          <p>Inventory Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/reset-password">Forgot Password?</Link>
        </div>
        <div className="auth-divider"><span>OR</span></div>
        <div className="auth-links">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
