const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  isbn: { type: String, unique: true, sparse: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  totalCopies: { type: Number, required: true, min: 1, default: 1 },
  availableCopies: { type: Number, required: true, min: 0 },
  publishedYear: { type: Number },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

bookSchema.pre('save', function () {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
});

module.exports = mongoose.model('Book', bookSchema);
