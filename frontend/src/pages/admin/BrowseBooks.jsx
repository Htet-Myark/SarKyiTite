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

export default function AdminBrowseBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { api.get('/books/categories').then(r => setCategories(r.data)); }, []);
  useEffect(() => { const t = setTimeout(fetchBooks, 300); return () => clearTimeout(t); }, [fetchBooks]);

  return (
    <>
      <div className="page-header">
        <h1>Browse Books</h1>
        <p>All books currently in the library collection</p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by title or author..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '12px', color: 'var(--gray-500)', fontSize: '13px' }}>
        {books.length} book{books.length !== 1 ? 's' : ''} found
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
                    {book.availableCopies}/{book.totalCopies} available
                  </span>
                </div>
                {book.publishedYear && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>
                    Published: {book.publishedYear}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
