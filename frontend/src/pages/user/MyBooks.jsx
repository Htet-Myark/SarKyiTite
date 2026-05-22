import { useState, useEffect } from 'react';
import api from '../../api';

function statusBadge(status) {
  const map = {
    borrowed: 'badge-blue',
    returned: 'badge-green',
    overdue: 'badge-red'
  };
  return map[status] || 'badge-gray';
}

function daysLeft(dueDate) {
  const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'Due today';
  return `${diff} days left`;
}

export default function MyBooks() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState({});
  const [msg, setMsg] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/borrow/my');
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleReturn = async (recordId) => {
    setReturning(r => ({ ...r, [recordId]: true }));
    try {
      await api.put(`/borrow/${recordId}/return`);
      setMsg({ text: 'Book returned successfully!', isError: false });
      fetchRecords();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to return', isError: true });
    } finally {
      setReturning(r => ({ ...r, [recordId]: false }));
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const active = records.filter(r => r.status !== 'returned');
  const history = records.filter(r => r.status === 'returned');

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>;

  return (
    <>
      <div className="page-header">
        <h1>My Borrowed Books</h1>
        <p>Track your current borrows and history</p>
      </div>

      {msg && <div className={msg.isError ? 'error-msg' : 'success-msg'}>{msg.text}</div>}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '12px' }}>
          Currently Borrowed ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No active borrows</h3>
            <p>Browse the library to borrow a book</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Author</th>
                    <th>Borrowed</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(r => (
                    <tr key={r._id}>
                      <td><strong>{r.book?.title || r.bookSnapshot?.title || '(Book Removed)'}</strong></td>
                      <td>{r.book?.author || r.bookSnapshot?.author}</td>
                      <td>{new Date(r.borrowDate).toLocaleDateString()}</td>
                      <td>
                        <div>{new Date(r.dueDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '12px', color: r.status === 'overdue' ? 'var(--danger)' : 'var(--gray-500)' }}>
                          {daysLeft(r.dueDate)}
                        </div>
                      </td>
                      <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleReturn(r._id)}
                          disabled={returning[r._id]}
                        >
                          {returning[r._id] ? '...' : 'Return'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '12px' }}>
            History ({history.length})
          </h3>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Book</th><th>Author</th><th>Borrowed</th><th>Returned</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r._id}>
                      <td>{r.book?.title || r.bookSnapshot?.title || '(Book Removed)'}</td>
                      <td>{r.book?.author || r.bookSnapshot?.author}</td>
                      <td>{new Date(r.borrowDate).toLocaleDateString()}</td>
                      <td>{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '-'}</td>
                      <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
