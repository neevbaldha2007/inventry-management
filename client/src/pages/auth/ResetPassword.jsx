import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.requestOtp(email);
      toast.success(data.otp_hint || 'OTP sent!');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword);
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="logo">
          <h1>📦 IMS</h1>
          <p>Reset your password</p>
        </div>
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <KeyRound size={18} />
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>OTP Code</label>
              <input className="form-control" type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP (hint: 123456)" required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" required minLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <KeyRound size={18} />
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        <div className="auth-links mt-16">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
