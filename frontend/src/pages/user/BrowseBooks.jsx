import { useState, useEffect, useCallback } from 'react';
import api from '../../api';

function getCoverClass(category) {
  const map = { Fiction: 'cat-Fiction', Science: 'cat-Science', History: 'cat-History', Technology: 'cat-Technology', Biography: 'cat-Biography', Philosophy: 'cat-Philosophy' };
  return map[category] || '';
}

function getCoverEmoji(category) {
  const map = { Fiction: '📕', Science: '🔬', History: '🏛️', Technology: '💻', Biography: '👤', Philosophy: '💭' };
  return map[category] || '📚';
}

export default function BrowseBooks() {
  const [books, setBooks] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [msg, setMsg] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const [booksRes, bookmarksRes] = await Promise.all([
        api.get('/books', { params }),
        api.get('/bookmarks')
      ]);
      setBooks(booksRes.data);
      setBookmarks(bookmarksRes.data.map(b => b._id));
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    api.get('/books/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleBorrow = async (bookId) => {
    setActionLoading(a => ({ ...a, [`borrow-${bookId}`]: true }));
    try {
      await api.post('/borrow', { bookId });
      flash('Book borrowed! Due in 14 days.');
      fetchBooks();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to borrow', true);
    } finally {
      setActionLoading(a => ({ ...a, [`borrow-${bookId}`]: false }));
    }
  };

  const handleBookmark = async (bookId) => {
    setActionLoading(a => ({ ...a, [`bm-${bookId}`]: true }));
    try {
      const isBookmarked = bookmarks.includes(bookId);
      if (isBookmarked) {
        await api.delete(`/bookmarks/${bookId}`);
        setBookmarks(b => b.filter(id => id !== bookId));
        flash('Bookmark removed.');
      } else {
        await api.post(`/bookmarks/${bookId}`);
        setBookmarks(b => [...b, bookId]);
        flash('Bookmarked!');
      }
    } catch (err) {
      flash(err.response?.data?.message || 'Failed', true);
    } finally {
      setActionLoading(a => ({ ...a, [`bm-${bookId}`]: false }));
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Browse Books</h1>
        <p>Discover and borrow books from our collection</p>
      </div>

      {msg && <div className={msg.isError ? 'error-msg' : 'success-msg'}>{msg.text}</div>}

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by title or author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No books found</h3>
          <p>Try adjusting your search or category filter</p>
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
                    className={`btn btn-sm ${bookmarks.includes(book._id) ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => handleBookmark(book._id)}
                    disabled={actionLoading[`bm-${book._id}`]}
                    title={bookmarks.includes(book._id) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {bookmarks.includes(book._id) ? '🔖' : '☆'}
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
