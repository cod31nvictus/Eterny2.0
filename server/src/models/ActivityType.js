const mongoose = require('mongoose');

const activityTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  wellnessTagIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellnessCategory',
    required: true
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
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

// Update the updatedAt field before saving
activityTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
activityTypeSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('ActivityType', activityTypeSchema); 