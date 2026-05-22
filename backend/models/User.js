const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const warningSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  warnings: [warningSchema],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
