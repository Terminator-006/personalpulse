// models/Interaction.js
const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['meeting', 'call', 'chat', 'other'],
    default: 'other'
  },
  sentiment: {
    score: Number,      // Will store between -1 to 1
    label: String,      // positive, negative, neutral
    confidence: Number  // 0 to 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interaction', InteractionSchema);