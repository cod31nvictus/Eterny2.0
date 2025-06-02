const mongoose = require('mongoose');

const toDoItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  time: {
    type: String, // Format: HH:MM (optional)
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty/null
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
toDoItemSchema.index({ userId: 1, date: 1, order: 1 });

// Update completedAt when completed status changes
toDoItemSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed) {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('ToDoItem', toDoItemSchema); 