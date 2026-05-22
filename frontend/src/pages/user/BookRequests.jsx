import { useState, useEffect } from 'react';
import api from '../../api';

export default function BookRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bookTitle: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ bookTitle: '', message: '' });

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/my');
      setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/requests', form);
      setForm({ bookTitle: '', message: '' });
      setSuccess('Request submitted successfully!');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (req) => {
    setEditingId(req._id);
    setEditForm({ bookTitle: req.bookTitle, message: req.message });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ bookTitle: '', message: '' });
  };

  const handleEdit = async (id) => {
    setError('');
    try {
      await api.put(`/requests/${id}`, editForm);
      setEditingId(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request? The admin reply (if any) will also be removed.')) return;
    try {
      await api.delete(`/requests/${id}`);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete request');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Book Requests</h1>
        <p>Request a book you'd like the library to add</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--gray-800)' }}>New Request</h3>
          {error && <div className="error-msg" style={{ marginBottom: '12px' }}>{error}</div>}
          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '12px' }}>
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Book Title</label>
              <input
                value={form.bookTitle}
                onChange={e => setForm(f => ({ ...f, bookTitle: e.target.value }))}
                placeholder="Enter the book title you'd like"
                required
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Why would you like this book? Any details..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '12px' }}>
        My Requests ({requests.length})
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📬</div>
          <h3>No requests yet</h3>
          <p>Submit a request above to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(req => (
            <div key={req._id} className="card">
              <div className="card-body">
                {editingId === req._id ? (
                  <>
                    <div className="form-group">
                      <label>Book Title</label>
                      <input
                        value={editForm.bookTitle}
                        onChange={e => setEditForm(f => ({ ...f, bookTitle: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        value={editForm.message}
                        onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" style={{ fontSize: '13px', padding: '6px 16px' }} onClick={() => handleEdit(req._id)}>Save</button>
                      <button className="btn" style={{ fontSize: '13px', padding: '6px 16px', background: 'var(--gray-100)', color: 'var(--gray-700)' }} onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--gray-800)' }}>{req.bookTitle}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                          {req.updatedAt !== req.createdAt && ' (edited)'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                          background: req.status === 'replied' ? '#dcfce7' : '#fef9c3',
                          color: req.status === 'replied' ? '#166534' : '#854d0e'
                        }}>
                          {req.status === 'replied' ? 'Replied' : 'Pending'}
                        </span>
                        {req.status !== 'replied' && (
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 4px' }}
                            title="Edit"
                            onClick={() => startEdit(req)}
                          >✏️</button>
                        )}
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 4px' }}
                          title="Delete"
                          onClick={() => handleDelete(req._id)}
                        >🗑️</button>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: req.adminReply ? '12px' : '0', background: 'var(--gray-50)', borderRadius: '8px', padding: '10px 12px' }}>
                      {req.message}
                    </div>

                    {req.adminReply && (
                      <div style={{ marginTop: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Admin Reply · {req.repliedAt ? new Date(req.repliedAt).toLocaleDateString() : ''}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{req.adminReply}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
