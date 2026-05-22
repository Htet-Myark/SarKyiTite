import { useState, useEffect } from 'react';
import api from '../../api';

function statusBadge(status) {
  return { borrowed: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' }[status] || 'badge-gray';
}

export default function AllBorrows() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/borrows')
      .then(res => setRecords(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  const counts = {
    all: records.length,
    borrowed: records.filter(r => r.status === 'borrowed').length,
    overdue: records.filter(r => r.status === 'overdue').length,
    returned: records.filter(r => r.status === 'returned').length
  };

  return (
    <>
      <div className="page-header">
        <h1>All Borrow Records</h1>
        <p>Complete history of all book borrows in the system</p>
      </div>

      <div className="tabs">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'borrowed', label: `Active (${counts.borrowed})` },
          { key: 'overdue', label: `Overdue (${counts.overdue})` },
          { key: 'returned', label: `Returned (${counts.returned})` }
        ].map(t => (
          <button
            key={t.key}
            className={`tab-btn ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Book</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Returned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No records found</td></tr>
                ) : filtered.map(r => {
                  const isOverdue = r.status === 'overdue';
                  return (
                    <tr key={r._id} style={isOverdue ? { background: '#fff5f5' } : {}}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.user?.username || r.userSnapshot?.username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{r.user?.email || r.userSnapshot?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.book?.title || r.bookSnapshot?.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{r.book?.author || r.bookSnapshot?.author}</div>
                      </td>
                      <td>{new Date(r.borrowDate).toLocaleDateString()}</td>
                      <td>
                        <div>{new Date(r.dueDate).toLocaleDateString()}</div>
                        {isOverdue && (
                          <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                            {Math.ceil((new Date() - new Date(r.dueDate)) / (1000 * 60 * 60 * 24))}d overdue
                          </div>
                        )}
                      </td>
                      <td>{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}</td>
                      <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
