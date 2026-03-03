const mongoose = require('mongoose');

const plannedDaySchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DayTemplate',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false // null means indefinite
  },
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1 // every X days/weeks/months/years
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }],
    daysOfMonth: [{
      type: Number,
      min: 1,
      max: 31
    }],
    monthsOfYear: [{
      type: Number,
      min: 1,
      max: 12 // 1 = January, 12 = December
    }],
    endDate: {
      type: Date,
      required: false // When recurrence ends
    },
    count: {
      type: Number,
      required: false // Number of occurrences (alternative to endDate)
    },
    bySetPos: [{
      type: Number // For complex patterns like "2nd Tuesday"
    }]
  },
  exceptions: [{
    originalDate: {
      type: Date,
      required: true
    },
    action: {
      type: String,
      enum: ['delete', 'modify'],
      required: true
    },
    modifiedTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DayTemplate',
      required: false // Only if action is 'modify'
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
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
plannedDaySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
plannedDaySchema.index({ userId: 1, startDate: 1, endDate: 1 });
plannedDaySchema.index({ userId: 1, 'recurrence.type': 1 });

// Method to check if a template is scheduled for a specific date
plannedDaySchema.methods.isScheduledForDate = function(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(this.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  // Check if date is before start date
  if (targetDate < startDate) return false;
  
  // Check if date is after end date (if end date exists)
  if (this.endDate) {
    const endDate = new Date(this.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (targetDate > endDate) return false;
  }
  
  // Check if date is in exceptions
  const isException = this.exceptions.some(exception => {
    const exceptionDate = new Date(exception.originalDate);
    exceptionDate.setHours(0, 0, 0, 0);
    return exceptionDate.getTime() === targetDate.getTime() && exception.action === 'delete';
  });
  
  if (isException) return false;
  
  // Check recurrence end date
  if (this.recurrence.endDate) {
    const recurrenceEndDate = new Date(this.recurrence.endDate);
    recurrenceEndDate.setHours(0, 0, 0, 0);
    if (targetDate > recurrenceEndDate) return false;
  }
  
  // Check recurrence pattern
  switch (this.recurrence.type) {
    case 'none':
      return startDate.getTime() === targetDate.getTime();
      
    case 'daily':
      const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff % this.recurrence.interval === 0;
      
    case 'weekly':
      const weeksDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24 * 7));
      const targetDayOfWeek = targetDate.getDay();
      
      // If specific days are selected, check if target day is included
      if (this.recurrence.daysOfWeek && this.recurrence.daysOfWeek.length > 0) {
        return weeksDiff >= 0 && 
               weeksDiff % this.recurrence.interval === 0 && 
               this.recurrence.daysOfWeek.includes(targetDayOfWeek);
      } else {
        // Default to the same day of week as start date
        return weeksDiff >= 0 && 
               weeksDiff % this.recurrence.interval === 0 && 
               targetDayOfWeek === startDate.getDay();
      }
      
    case 'monthly':
      const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (targetDate.getMonth() - startDate.getMonth());
      
      if (monthsDiff < 0 || monthsDiff % this.recurrence.interval !== 0) return false;
      
      // Check if using specific days of month
      if (this.recurrence.daysOfMonth && this.recurrence.daysOfMonth.length > 0) {
        return this.recurrence.daysOfMonth.includes(targetDate.getDate());
      }
      
      // Check if using day of week pattern (e.g., "2nd Tuesday")
      if (this.recurrence.daysOfWeek && this.recurrence.bySetPos) {
        const targetDayOfWeek = targetDate.getDay();
        const weekOfMonth = Math.ceil(targetDate.getDate() / 7);
        
        return this.recurrence.daysOfWeek.includes(targetDayOfWeek) &&
               this.recurrence.bySetPos.includes(weekOfMonth);
      }
      
      // Default to same date of month as start date
      return targetDate.getDate() === startDate.getDate();
      
    case 'yearly':
      const yearsDiff = targetDate.getFullYear() - startDate.getFullYear();
      
      if (yearsDiff < 0 || yearsDiff % this.recurrence.interval !== 0) return false;
      
      // Check if using specific months
      if (this.recurrence.monthsOfYear && this.recurrence.monthsOfYear.length > 0) {
        const targetMonth = targetDate.getMonth() + 1; // Convert to 1-12
        return this.recurrence.monthsOfYear.includes(targetMonth) &&
               targetDate.getDate() === startDate.getDate();
      }
      
      // Default to same month and date as start date
      return targetDate.getMonth() === startDate.getMonth() &&
             targetDate.getDate() === startDate.getDate();
      
    default:
      return false;
  }
};

module.exports = mongoose.model('PlannedDay', plannedDaySchema); 