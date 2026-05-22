import { useState, useEffect } from 'react';
import api from '../../api';

const CATEGORIES = ['Fiction', 'Science', 'History', 'Technology', 'Biography', 'Philosophy', 'Mathematics', 'Arts', 'Other'];

const EMPTY_FORM = { title: '', author: '', isbn: '', category: 'Fiction', description: '', totalCopies: 1, publishedYear: '' };

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | book object (edit)
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [flash, setFlash] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [search]);

  const showFlash = (text, isError = false) => {
    setFlash({ text, isError });
    setTimeout(() => setFlash(null), 3500);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal('add');
  };

  const openEdit = (book) => {
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category,
      description: book.description || '',
      totalCopies: book.totalCopies,
      publishedYear: book.publishedYear || ''
    });
    setModal(book);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'totalCopies' ? Number(value) : value }));
  };

  const currentYear = new Date().getFullYear();

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) return showFlash('Title and author are required', true);
    if (form.publishedYear !== '') {
      const yr = Number(form.publishedYear);
      if (!Number.isInteger(yr) || yr < 1) return showFlash('Published year cannot be negative or zero', true);
      if (yr > currentYear) return showFlash(`Published year cannot exceed ${currentYear}`, true);
    }
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/books', form);
        showFlash('Book added successfully!');
      } else {
        await api.put(`/books/${modal._id}`, form);
        showFlash('Book updated successfully!');
      }
      setModal(null);
      fetchBooks();
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to save book', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(d => ({ ...d, [bookId]: true }));
    try {
      await api.delete(`/books/${bookId}`);
      showFlash('Book deleted.');
      fetchBooks();
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to delete', true);
    } finally {
      setDeleting(d => ({ ...d, [bookId]: false }));
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Manage Books</h1>
        <p>Add, edit, or remove books from the library</p>
      </div>

      {flash && <div className={flash.isError ? 'error-msg' : 'success-msg'}>{flash.text}</div>}

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Books ({books.length})</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Copies</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '32px' }}>No books found</td></tr>
                ) : books.map(book => (
                  <tr key={book._id}>
                    <td><strong>{book.title}</strong></td>
                    <td>{book.author}</td>
                    <td><span className="badge badge-blue">{book.category}</span></td>
                    <td>{book.totalCopies}</td>
                    <td>
                      <span className={`badge ${book.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(book)}>✏️ Edit</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(book._id, book.title)}
                          disabled={deleting[book._id]}
                        >
                          {deleting[book._id] ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: '540px' }}>
            <h3>{modal === 'add' ? '➕ Add New Book' : '✏️ Edit Book'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Book title" />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="filter-select" style={{ width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Published Year</label>
                <input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} placeholder="e.g. 2020" min="1" max={new Date().getFullYear()} />
              </div>
              <div className="form-group">
                <label>Total Copies</label>
                <input name="totalCopies" type="number" min="1" value={form.totalCopies} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Short description..." rows={3} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'add' ? 'Add Book' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
