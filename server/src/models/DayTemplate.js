const mongoose = require('mongoose');

const timeBlockSchema = new mongoose.Schema({
  activityTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityType',
    required: true
  },
  blockName: {
    type: String,
    trim: true
    // This will default to activity name but can be customized
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const dimensionValueSchema = new mongoose.Schema({
  dimensionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DayDimension',
    required: true
  },
  valueId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  valueName: {
    type: String,
    required: true
  }
});

const dayTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    default: "06:00",
    trim: true
  },
  dimensionValues: [dimensionValueSchema],
  timeBlocks: [timeBlockSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
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
dayTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
dayTemplateSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('DayTemplate', dayTemplateSchema); 