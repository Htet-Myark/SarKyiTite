const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  status: { type: String, enum: ['borrowed', 'returned', 'overdue'], default: 'borrowed' },
  autoWarningSent: { type: Boolean, default: false },
  bookSnapshot: {
    title: { type: String, default: '' },
    author: { type: String, default: '' }
  },
  userSnapshot: {
    username: { type: String, default: '' },
    email: { type: String, default: '' }
  }
});

borrowSchema.pre('save', function () {
  if (this.status === 'borrowed' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
});

module.exports = mongoose.model('BorrowRecord', borrowSchema);
