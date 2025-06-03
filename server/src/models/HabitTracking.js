const mongoose = require('mongoose');

const habitTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  completed: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
habitTrackingSchema.index({ userId: 1, date: 1 });
habitTrackingSchema.index({ habitId: 1, date: 1 });
habitTrackingSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitTracking', habitTrackingSchema);