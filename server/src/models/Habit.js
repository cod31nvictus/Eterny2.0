const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  trackingDays: {
    type: [Number], // 0 = Monday, 1 = Tuesday, ... 6 = Sunday
    required: true,
    validate: {
      validator: function(days) {
        return days.length > 0 && days.every(day => day >= 0 && day <= 6);
      },
      message: 'Tracking days must be between 0 (Monday) and 6 (Sunday)'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient user queries
habitSchema.index({ userId: 1, isActive: 1 });

// Update the updatedAt field before saving
habitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Habit', habitSchema); 