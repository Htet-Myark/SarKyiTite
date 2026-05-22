const express = require('express');
const Book = require('../models/Book');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All public queries exclude soft-deleted books
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
    if (category) filter.category = category;
    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Book.distinct('category', { isDeleted: false });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isDeleted: false });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function validateYear(year) {
  if (year === undefined || year === null || year === '') return null;
  const yr = Number(year);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(yr) || yr < 1) return 'Published year cannot be negative or zero';
  if (yr > currentYear) return `Published year cannot exceed ${currentYear}`;
  return null;
}

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const yearError = validateYear(req.body.publishedYear);
    if (yearError) return res.status(400).json({ message: yearError });
    const book = await Book.create({ ...req.body, availableCopies: req.body.totalCopies });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const yearError = validateYear(req.body.publishedYear);
    if (yearError) return res.status(400).json({ message: yearError });
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
