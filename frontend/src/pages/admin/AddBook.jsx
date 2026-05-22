import { useState } from 'react';
import api from '../../api';

const CATEGORIES = ['Fiction', 'Science', 'History', 'Technology', 'Biography', 'Philosophy', 'Mathematics', 'Arts', 'Other'];
const EMPTY_FORM = { title: '', author: '', isbn: '', category: 'Fiction', description: '', totalCopies: 1, publishedYear: '' };

export default function AddBook() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const currentYear = new Date().getFullYear();

  const showFlash = (text, isError = false) => {
    setFlash({ text, isError });
    setTimeout(() => setFlash(null), 4000);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'totalCopies' ? Number(value) : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return showFlash('Title and author are required', true);
    if (form.publishedYear !== '') {
      const yr = Number(form.publishedYear);
      if (!Number.isInteger(yr) || yr < 1) return showFlash('Published year cannot be negative or zero', true);
      if (yr > currentYear) return showFlash(`Published year cannot exceed ${currentYear}`, true);
    }
    setSaving(true);
    try {
      await api.post('/books', form);
      showFlash(`"${form.title}" added to the library!`);
      setForm(EMPTY_FORM);
    } catch (err) {
      showFlash(err.response?.data?.message || 'Failed to add book', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Add New Book</h1>
        <p>Add a new book to the library collection</p>
      </div>

      {flash && <div className={flash.isError ? 'error-msg' : 'success-msg'}>{flash.text}</div>}

      <div className="card" style={{ maxWidth: '640px' }}>
        <div className="card-header">
          <h3>Book Details</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Book title" required />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" required />
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
                <input
                  name="publishedYear"
                  type="number"
                  value={form.publishedYear}
                  onChange={handleChange}
                  placeholder="e.g. 2020"
                  min="1"
                  max={currentYear}
                />
              </div>
              <div className="form-group">
                <label>Total Copies</label>
                <input name="totalCopies" type="number" min="1" value={form.totalCopies} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Short description of the book..." rows={4} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Adding...' : '+ Add Book'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setForm(EMPTY_FORM)}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
