import { useState, useEffect } from 'react';
import api from '../../api';

function getCoverClass(category) {
  const map = { Fiction: 'cat-Fiction', Science: 'cat-Science', History: 'cat-History', Technology: 'cat-Technology', Biography: 'cat-Biography', Philosophy: 'cat-Philosophy' };
  return map[category] || '';
}
function getCoverEmoji(category) {
  const map = { Fiction: '📕', Science: '🔬', History: '🏛️', Technology: '💻', Biography: '👤', Philosophy: '💭' };
  return map[category] || '📚';
}

export default function Bookmarks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [msg, setMsg] = useState(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookmarks');
      setBooks(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleRemove = async (bookId) => {
    setActionLoading(a => ({ ...a, [bookId]: true }));
    try {
      await api.delete(`/bookmarks/${bookId}`);
      setBooks(b => b.filter(book => book._id !== bookId));
      flash('Bookmark removed.');
    } catch {
      flash('Failed to remove bookmark.', true);
    } finally {
      setActionLoading(a => ({ ...a, [bookId]: false }));
    }
  };

  const handleBorrow = async (bookId) => {
    setActionLoading(a => ({ ...a, [`borrow-${bookId}`]: true }));
    try {
      await api.post('/borrow', { bookId });
      flash('Book borrowed! Due in 14 days.');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to borrow', true);
    } finally {
      setActionLoading(a => ({ ...a, [`borrow-${bookId}`]: false }));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>;

  return (
    <>
      <div className="page-header">
        <h1>Bookmarks</h1>
        <p>Books you've saved for later</p>
      </div>

      {msg && <div className={msg.isError ? 'error-msg' : 'success-msg'}>{msg.text}</div>}

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <h3>No bookmarks yet</h3>
          <p>Browse the library and bookmark books you're interested in</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <div key={book._id} className="book-card">
              <div className={`book-cover ${getCoverClass(book.category)}`}>
                {getCoverEmoji(book.category)}
              </div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
                <div className="book-meta">
                  <span className="badge badge-blue">{book.category}</span>
                  <span style={{ fontSize: '12px', color: book.availableCopies > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {book.availableCopies > 0 ? `${book.availableCopies} left` : 'Unavailable'}
                  </span>
                </div>
                <div className="book-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBorrow(book._id)}
                    disabled={book.availableCopies === 0 || actionLoading[`borrow-${book._id}`]}
                  >
                    {actionLoading[`borrow-${book._id}`] ? '...' : '📖 Borrow'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(book._id)}
                    disabled={actionLoading[book._id]}
                    title="Remove bookmark"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
