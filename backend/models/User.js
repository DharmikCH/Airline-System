const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // select: false keeps the hash out of every query result by default, so a
  // controller cannot leak it by accident. Login has to ask for it explicitly
  // with .select('+password_hash').
  password_hash: {
    type: String,
    required: true,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['passenger', 'admin'],
    default: 'passenger'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
