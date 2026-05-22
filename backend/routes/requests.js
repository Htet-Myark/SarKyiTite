const express = require('express');
const BookRequest = require('../models/BookRequest');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── User routes ──

router.post('/', protect, async (req, res) => {
  try {
    const { bookTitle, message } = req.body;
    if (!bookTitle?.trim() || !message?.trim())
      return res.status(400).json({ message: 'Book title and message are required' });

    const request = await BookRequest.create({
      user: req.user._id,
      userSnapshot: { username: req.user.username, email: req.user.email },
      bookTitle,
      message
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const requests = await BookRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const request = await BookRequest.findOne({ _id: req.params.id, user: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'replied')
      return res.status(400).json({ message: 'Cannot edit a request that has already been replied to' });

    const { bookTitle, message } = req.body;
    if (bookTitle?.trim()) request.bookTitle = bookTitle.trim();
    if (message?.trim()) request.message = message.trim();
    request.updatedAt = new Date();
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await BookRequest.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Admin reply is embedded in the document — deleting the document removes it entirely
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin routes ──

router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const requests = await BookRequest.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/:id/reply', protect, adminOnly, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: 'Reply message is required' });

    const request = await BookRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.adminReply = reply.trim();
    request.status = 'replied';
    request.repliedAt = new Date();
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
