const mongoose = require('mongoose');

const bookRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userSnapshot: {
    username: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  bookTitle: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'replied'], default: 'pending' },
  adminReply: { type: String, default: '' },
  repliedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookRequest', bookRequestSchema);
