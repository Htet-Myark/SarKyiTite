import { useState, useEffect } from 'react';
import api from '../../api';

export default function Warnings() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const sorted = [...(res.data.warnings || [])].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      setWarnings(sorted);

      const unread = sorted.filter(w => !w.read);
      if (unread.length > 0) {
        api.post('/auth/mark-warnings-read').catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>;

  return (
    <>
      <div className="page-header">
        <h1>Warnings</h1>
        <p>Messages from the library administrator</p>
      </div>

      {warnings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No warnings</h3>
          <p>You're in good standing with the library</p>
        </div>
      ) : (
        <div>
          {warnings.map((w, i) => (
            <div key={i} className={`warning-item ${!w.read ? 'unread' : ''}`}>
              <span className="w-icon">⚠️</span>
              <div className="w-body">
                <div className="w-msg">{w.message}</div>
                <div className="w-date">{new Date(w.sentAt).toLocaleString()}</div>
              </div>
              {!w.read && <span className="unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
