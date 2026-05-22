import { useState, useEffect } from 'react';
import api from '../../api';

export default function AdminBookRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/admin/all');
      setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const startReply = (id) => {
    setReplyingId(id);
    setReplyText('');
    setError('');
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyText('');
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/requests/admin/${id}/reply`, { reply: replyText });
      setReplyingId(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <>
      <div className="page-header">
        <h1>Book Requests</h1>
        <p>Review and reply to user book requests</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: `All (${requests.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'replied', label: `Replied (${requests.length - pendingCount})` }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
              background: filter === f.key ? 'var(--primary)' : 'var(--gray-100)',
              color: filter === f.key ? '#fff' : 'var(--gray-600)'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '12px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {filter !== 'all' ? filter : ''} requests</h3>
          <p>Nothing to show here yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(req => (
            <div key={req._id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--gray-800)' }}>{req.bookTitle}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '3px' }}>
                      by <strong>{req.userSnapshot?.username || req.user?.username || 'Unknown'}</strong>
                      {' · '}{req.userSnapshot?.email || req.user?.email || ''}
                      {' · '}{new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px', whiteSpace: 'nowrap',
                    background: req.status === 'replied' ? '#dcfce7' : '#fef9c3',
                    color: req.status === 'replied' ? '#166534' : '#854d0e'
                  }}>
                    {req.status === 'replied' ? 'Replied' : 'Pending'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--gray-600)', background: 'var(--gray-50)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  {req.message}
                </div>

                {req.adminReply && (
                  <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Your Reply · {req.repliedAt ? new Date(req.repliedAt).toLocaleDateString() : ''}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{req.adminReply}</div>
                  </div>
                )}

                {replyingId === req._id ? (
                  <div style={{ marginTop: '4px' }}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" style={{ fontSize: '13px', padding: '6px 16px' }} disabled={submitting} onClick={() => handleReply(req._id)}>
                        {submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button className="btn" style={{ fontSize: '13px', padding: '6px 16px', background: 'var(--gray-100)', color: 'var(--gray-700)' }} onClick={cancelReply}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '6px 16px' }}
                    onClick={() => startReply(req._id)}
                  >
                    {req.status === 'replied' ? 'Edit Reply' : 'Reply'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
