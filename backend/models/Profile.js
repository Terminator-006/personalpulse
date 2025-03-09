// models/Profile.js
const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['friend', 'family', 'colleague', 'other'],
    default: 'other'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', ProfileSchema);