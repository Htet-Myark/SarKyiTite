import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">📚</span>
          <h1>Sar Kyi Tite</h1>
          <p>Library Management System</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ marginBottom: '12px' }}>Password Reset!</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
              Your password has been updated. Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h2>Set a new password</h2>
            {error && <div className="error-msg">{error}</div>}
            {!error || token ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                    disabled={!token}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    required
                    disabled={!token}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !token}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            ) : null}
            <div className="auth-switch">
              <Link to="/forgot-password">Request a new reset link</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
