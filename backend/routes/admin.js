const express = require('express');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const { protect, adminOnly } = require('../middleware/auth');
const { sendWarningEmail } = require('../utils/email');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [totalBooks, totalUsers, activeBorrows, overdueCount] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: 'user' }),
      BorrowRecord.countDocuments({ status: { $in: ['borrowed', 'overdue'] } }),
      BorrowRecord.countDocuments({ status: 'overdue' })
    ]);
    res.json({ totalBooks, totalUsers, activeBorrows, overdueCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    const usersWithBorrows = await Promise.all(users.map(async (u) => {
      const borrows = await BorrowRecord.find({ user: u._id, status: { $in: ['borrowed', 'overdue'] } })
        .populate('book', 'title');
      return { ...u.toObject(), activeBorrows: borrows };
    }));
    res.json(usersWithBorrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/borrows', async (req, res) => {
  try {
    const records = await BorrowRecord.find()
      .populate('user', 'username email')
      .populate('book', 'title author')
      .sort({ borrowDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/warn/:userId', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Warning message required' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow warning if user has a borrow older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const longBorrow = await BorrowRecord.findOne({
      user: user._id,
      status: { $in: ['borrowed', 'overdue'] },
      borrowDate: { $lte: sevenDaysAgo }
    });
    if (!longBorrow) {
      return res.status(400).json({ message: 'User has no borrows older than 1 week' });
    }

    user.warnings.push({ message });
    await user.save();

    try {
      await sendWarningEmail(user.email, user.username, message);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
      return res.status(500).json({ message: 'Warning saved but email failed to send. Check email config.' });
    }

    res.json({ message: 'Warning sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/warnings/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('username warnings');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.warnings.sort((a, b) => b.sentAt - a.sentAt));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/inactive-users', async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const users = await User.find({
      role: 'user',
      $or: [
        { lastActive: { $lte: oneYearAgo } },
        { lastActive: null, createdAt: { $lte: oneYearAgo } }
      ]
    }).select('-password').sort({ lastActive: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });

    const activeBorrow = await BorrowRecord.findOne({
      user: user._id, status: { $in: ['borrowed', 'overdue'] }
    });
    if (activeBorrow) return res.status(400).json({ message: 'Cannot delete user with active borrows' });

    await BorrowRecord.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
