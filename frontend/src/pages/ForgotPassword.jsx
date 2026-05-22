import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ marginBottom: '12px' }}>Check your email</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px' }}>
              If an account with that email exists, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2>Forgot your password?</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              Enter your email address and we'll send you a reset link.
            </p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div className="auth-switch">
              Remember your password? <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
