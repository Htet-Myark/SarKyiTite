const express = require('express');
const User = require('../models/User');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarks');
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:bookId', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const user = await User.findById(req.user._id);
    if (user.bookmarks.includes(req.params.bookId))
      return res.status(400).json({ message: 'Already bookmarked' });

    user.bookmarks.push(req.params.bookId);
    await user.save();
    res.json({ message: 'Bookmarked', bookmarkCount: user.bookmarks.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:bookId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== req.params.bookId);
    await user.save();
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
