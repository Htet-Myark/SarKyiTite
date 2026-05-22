const express = require('express');
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DUE_DAYS = 14;

router.post('/', protect, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies < 1)
      return res.status(400).json({ message: 'No copies available' });

    const existing = await BorrowRecord.findOne({
      user: req.user._id, book: bookId, status: { $in: ['borrowed', 'overdue'] }
    });
    if (existing) return res.status(400).json({ message: 'You already have this book borrowed' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const blockedBorrow = await BorrowRecord.findOne({
      user: req.user._id,
      status: { $in: ['borrowed', 'overdue'] },
      borrowDate: { $lte: sevenDaysAgo }
    }).populate('book', 'title');
    if (blockedBorrow) {
      return res.status(403).json({
        message: `You cannot borrow new books until you return "${blockedBorrow.book.title}", which you have had for more than 7 days.`
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DUE_DAYS);

    const record = await BorrowRecord.create({
      user: req.user._id,
      book: bookId,
      dueDate,
      bookSnapshot: { title: book.title, author: book.author },
      userSnapshot: { username: req.user.username, email: req.user.email }
    });
    book.availableCopies -= 1;
    await book.save();

    await record.populate('book', 'title author');
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return', protect, async (req, res) => {
  try {
    const record = await BorrowRecord.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: 'Borrow record not found' });
    if (record.status === 'returned')
      return res.status(400).json({ message: 'Already returned' });

    record.returnDate = new Date();
    record.status = 'returned';
    await record.save();

    await Book.findByIdAndUpdate(record.book, { $inc: { availableCopies: 1 } });

    res.json({ message: 'Book returned successfully', record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate('book', 'title author category coverImage')
      .sort({ borrowDate: -1 });

    const updated = await Promise.all(records.map(async r => {
      if (r.status === 'borrowed' && new Date() > r.dueDate) {
        r.status = 'overdue';
        await r.save();
      }
      return r;
    }));

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
