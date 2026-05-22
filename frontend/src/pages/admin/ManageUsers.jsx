import { useState, useEffect } from 'react';
import api from '../../api';

export default function ManageUsers() {
  const [tab, setTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inactiveLoading, setInactiveLoading] = useState(false);
  const [warnModal, setWarnModal] = useState(null);
  const [warnMsg, setWarnMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [flash, setFlash] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactiveUsers = async () => {
    setInactiveLoading(true);
    try {
      const res = await api.get('/admin/inactive-users');
      setInactiveUsers(res.data);
    } finally {
      setInactiveLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (tab === 'inactive') fetchInactiveUsers();
  }, [tab]);

  const showFlash = (text, isError = false) => {
    setFlash({ text, isError });
    setTimeout(() => setFlash(null), 3500);
  };

  const handleSendWarning = async () => {
    if (!warnMsg.trim()) return;
    setSending(true);
    try {
      await api.post(`/admin/warn/${warnModal._id}`, { message: warnMsg });
      showFlash(`Warning sent to ${warnModal.username} via email and in-app.`);
      setWarnModal(null);
      setWarnMsg('');
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to send warning', true);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This will also remove their borrow history. This cannot be undone.`)) return;
    setDeleting(d => ({ ...d, [userId]: true }));
    try {
      await api.delete(`/admin/users/${userId}`);
      showFlash(`User "${username}" deleted.`);
      setInactiveUsers(u => u.filter(x => x._id !== userId));
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to delete user', true);
    } finally {
      setDeleting(d => ({ ...d, [userId]: false }));
    }
  };

  const getSuggestedWarning = (user) => {
    const overdue = user.activeBorrows?.filter(b => b.status === 'overdue') || [];
    if (overdue.length > 0) {
      return `You have ${overdue.length} overdue book(s). Please return them immediately to avoid penalties. Books: ${overdue.map(b => b.book?.title).join(', ')}.`;
    }
    return '';
  };

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} year(s) ago`;
  };

  return (
    <>
      <div className="page-header">
        <h1>Manage Users</h1>
        <p>View all registered users and their borrow activity</p>
      </div>

      {flash && <div className={flash.isError ? 'error-msg' : 'success-msg'}>{flash.text}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Users ({users.length})
        </button>
        <button className={`tab-btn ${tab === 'inactive' ? 'active' : ''}`} onClick={() => setTab('inactive')}>
          Inactive &gt;1 Year ({inactiveUsers.length})
        </button>
      </div>

      {tab === 'all' && (
        <div className="card">
          <div className="card-header">
            <h3>All Users ({users.length})</h3>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Last Active</th>
                    <th>Active Borrows</th>
                    <th>Warnings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No users yet</td></tr>
                  ) : users.map(user => {
                    const overdueCount = user.activeBorrows?.filter(b => b.status === 'overdue').length || 0;
                    const canWarn = user.activeBorrows?.some(b => {
                      const days = Math.floor((new Date() - new Date(b.borrowDate)) / (1000 * 60 * 60 * 24));
                      return days >= 7;
                    }) || false;
                    return (
                      <tr key={user._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <strong>{user.username}</strong>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{timeAgo(user.lastActive)}</td>
                        <td>
                          <span className={`badge ${user.activeBorrows?.length > 0 ? 'badge-blue' : 'badge-gray'}`}>
                            {user.activeBorrows?.length || 0} book(s)
                          </span>
                          {overdueCount > 0 && (
                            <span className="badge badge-red" style={{ marginLeft: '6px' }}>
                              {overdueCount} overdue
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${user.warnings?.length > 0 ? 'badge-orange' : 'badge-gray'}`}>
                            {user.warnings?.length || 0}
                          </span>
                        </td>
                        <td>
                          {canWarn ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setWarnModal(user);
                                setWarnMsg(getSuggestedWarning(user));
                              }}
                            >
                              ⚠️ Warn
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                              {user.activeBorrows?.length > 0 ? '< 7 days' : 'No borrows'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'inactive' && (
        <div className="card">
          <div className="card-header">
            <h3>Inactive Users — No activity for over 1 year</h3>
          </div>
          {inactiveLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
          ) : inactiveUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No inactive users</h3>
              <p>All users have been active within the last year</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveUsers.map(user => (
                    <tr key={user._id} style={{ background: '#fafafa' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', background: 'var(--gray-400)' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <strong style={{ color: 'var(--gray-500)' }}>{user.username}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td style={{ fontSize: '13px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-gray">{timeAgo(user.lastActive)}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(user._id, user.username)}
                          disabled={deleting[user._id]}
                        >
                          {deleting[user._id] ? '...' : '🗑️ Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {warnModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setWarnModal(null)}>
          <div className="modal">
            <h3>⚠️ Send Warning to {warnModal.username}</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '14px' }}>
              This warning will be sent as an email and shown in the user's dashboard.
            </p>
            <div className="form-group">
              <label>Warning Message</label>
              <textarea
                value={warnMsg}
                onChange={e => setWarnMsg(e.target.value)}
                placeholder="Enter your warning message..."
                rows={4}
              />
            </div>
            {warnModal.activeBorrows?.length > 0 && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px' }}>
                <strong>Active borrows:</strong>
                {warnModal.activeBorrows.map((b, i) => (
                  <div key={i} style={{ color: b.status === 'overdue' ? 'var(--danger)' : 'var(--gray-700)' }}>
                    • {b.book?.title} {b.status === 'overdue' ? '(OVERDUE)' : ''}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setWarnModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleSendWarning} disabled={sending || !warnMsg.trim()}>
                {sending ? 'Sending...' : 'Send Warning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
