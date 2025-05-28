const PlannedDay = require('../models/PlannedDay');
const DayTemplate = require('../models/DayTemplate');

// Assign a template to calendar with recurrence
const assignTemplateToCalendar = async (req, res) => {
  try {
    const { 
      templateId, 
      startDate, 
      endDate, 
      recurrence, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!templateId || !startDate) {
      return res.status(400).json({ error: 'Template ID and start date are required' });
    }
    
    // Verify template belongs to user
    const template = await DayTemplate.findOne({
      _id: templateId,
      userId: req.user._id
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Validate recurrence pattern
    if (recurrence) {
      if (recurrence.type === 'weekly' && (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0)) {
        return res.status(400).json({ error: 'Days of week required for weekly recurrence' });
      }
      
      if (recurrence.type === 'monthly' && (!recurrence.daysOfMonth || recurrence.daysOfMonth.length === 0)) {
        return res.status(400).json({ error: 'Days of month required for monthly recurrence' });
      }
    }
    
    const plannedDay = new PlannedDay({
      templateId,
      userId: req.user._id,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      recurrence: recurrence || { type: 'none', interval: 1 },
      notes: notes?.trim(),
      isActive: true
    });
    
    await plannedDay.save();
    
    // Populate template info before returning
    await plannedDay.populate('templateId', 'name description tags');
    
    res.status(201).json(plannedDay);
  } catch (error) {
    console.error('Error assigning template to calendar:', error);
    res.status(500).json({ error: 'Failed to assign template to calendar' });
  }
};

// Get planned days for a date range
const getPlannedDays = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    // Get all active planned days that could potentially overlap with the date range
    const plannedDays = await PlannedDay.find({
      userId: req.user._id,
      isActive: true,
      $or: [
        // Plans that start before or during the range
        { startDate: { $lte: endDate } },
        // Plans with no end date (indefinite)
        { endDate: null },
        // Plans that end after or during the range
        { endDate: { $gte: startDate } }
      ]
    })
    .populate({
      path: 'templateId',
      select: 'name description tags timeBlocks dimensionValues',
      populate: {
        path: 'timeBlocks.activityTypeId',
        select: 'name wellnessTagIds',
        populate: {
          path: 'wellnessTagIds',
          select: 'name type color'
        }
      }
    });
    
    // Generate the actual scheduled days for the date range
    const scheduledDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Find all templates scheduled for this date
      const templatesForDate = plannedDays.filter(plannedDay => 
        plannedDay.isScheduledForDate(currentDate)
      );
      
      if (templatesForDate.length > 0) {
        scheduledDays.push({
          date: dateStr,
          templates: templatesForDate.map(pd => ({
            plannedDayId: pd._id,
            template: pd.templateId,
            notes: pd.notes,
            recurrence: pd.recurrence
          }))
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      dateRange: { start, end },
      scheduledDays,
      totalDays: scheduledDays.length
    });
  } catch (error) {
    console.error('Error getting planned days:', error);
    res.status(500).json({ error: 'Failed to get planned days' });
  }
};

// Get planned days for a specific date
const getPlannedDaysByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const targetDate = new Date(date);
    
    // Get all active planned days for the user
    const plannedDays = await PlannedDay.find({
      userId: req.user._id,
      isActive: true
    })
    .populate({
      path: 'templateId',
      select: 'name description tags timeBlocks dimensionValues',
      populate: {
        path: 'timeBlocks.activityTypeId',
        select: 'name wellnessTagIds',
        populate: {
          path: 'wellnessTagIds',
          select: 'name type color'
        }
      }
    });
    
    // Filter for templates scheduled on this specific date
    const templatesForDate = plannedDays.filter(plannedDay => 
      plannedDay.isScheduledForDate(targetDate)
    );
    
    res.json({
      date,
      templates: templatesForDate.map(pd => ({
        plannedDayId: pd._id,
        template: pd.templateId,
        notes: pd.notes,
        recurrence: pd.recurrence
      }))
    });
  } catch (error) {
    console.error('Error getting planned days by date:', error);
    res.status(500).json({ error: 'Failed to get planned days for date' });
  }
};

// Update a planned day
const updatePlannedDay = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate, recurrence, notes, isActive } = req.body;
    
    const plannedDay = await PlannedDay.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!plannedDay) {
      return res.status(404).json({ error: 'Planned day not found' });
    }
    
    // Update fields
    if (endDate !== undefined) plannedDay.endDate = endDate ? new Date(endDate) : null;
    if (recurrence) plannedDay.recurrence = recurrence;
    if (notes !== undefined) plannedDay.notes = notes?.trim();
    if (isActive !== undefined) plannedDay.isActive = isActive;
    
    await plannedDay.save();
    await plannedDay.populate('templateId', 'name description tags');
    
    res.json(plannedDay);
  } catch (error) {
    console.error('Error updating planned day:', error);
    res.status(500).json({ error: 'Failed to update planned day' });
  }
};

// Delete a planned day
const deletePlannedDay = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plannedDay = await PlannedDay.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!plannedDay) {
      return res.status(404).json({ error: 'Planned day not found' });
    }
    
    await PlannedDay.findByIdAndDelete(id);
    res.json({ message: 'Planned day deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned day:', error);
    res.status(500).json({ error: 'Failed to delete planned day' });
  }
};

// Add exception to a planned day
const addException = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalDate, action, modifiedTemplate, reason } = req.body;
    
    if (!originalDate || !action) {
      return res.status(400).json({ error: 'Original date and action are required' });
    }
    
    const plannedDay = await PlannedDay.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!plannedDay) {
      return res.status(404).json({ error: 'Planned day not found' });
    }
    
    // Check if exception already exists for this date
    const exceptionExists = plannedDay.exceptions.some(exception => {
      const existingDate = new Date(exception.originalDate);
      const newDate = new Date(originalDate);
      return existingDate.toDateString() === newDate.toDateString();
    });
    
    if (exceptionExists) {
      return res.status(400).json({ error: 'Exception already exists for this date' });
    }
    
    plannedDay.exceptions.push({
      originalDate: new Date(originalDate),
      action,
      modifiedTemplate: modifiedTemplate || null,
      reason: reason?.trim()
    });
    
    await plannedDay.save();
    res.json(plannedDay);
  } catch (error) {
    console.error('Error adding exception:', error);
    res.status(500).json({ error: 'Failed to add exception' });
  }
};

// Edit recurring event with options (this, thisAndFuture, all)
const editRecurringEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { editType, originalDate, newTemplate, newRecurrence } = req.body;
    
    if (!editType || !originalDate) {
      return res.status(400).json({ error: 'Edit type and original date are required' });
    }
    
    const plannedDay = await PlannedDay.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!plannedDay) {
      return res.status(404).json({ error: 'Planned day not found' });
    }
    
    const targetDate = new Date(originalDate);
    
    switch (editType) {
      case 'this':
        // Add exception for this occurrence and create new single event
        plannedDay.exceptions.push({
          originalDate: targetDate,
          action: 'delete',
          reason: 'Modified single occurrence'
        });
        
        if (newTemplate) {
          // Create new single-day planned event
          const newPlannedDay = new PlannedDay({
            templateId: newTemplate,
            userId: req.user._id,
            startDate: targetDate,
            endDate: targetDate,
            recurrence: { type: 'none', interval: 1 },
            notes: `Modified from recurring event`,
            isActive: true
          });
          await newPlannedDay.save();
        }
        
        await plannedDay.save();
        break;
        
      case 'thisAndFuture':
        // End the current series at the day before target date
        const dayBefore = new Date(targetDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        plannedDay.endDate = dayBefore;
        
        if (newTemplate || newRecurrence) {
          // Create new series starting from target date
          const newPlannedDay = new PlannedDay({
            templateId: newTemplate || plannedDay.templateId,
            userId: req.user._id,
            startDate: targetDate,
            endDate: plannedDay.endDate,
            recurrence: newRecurrence || plannedDay.recurrence,
            notes: plannedDay.notes,
            isActive: true
          });
          await newPlannedDay.save();
        }
        
        await plannedDay.save();
        break;
        
      case 'all':
        // Update the entire series
        if (newTemplate) {
          plannedDay.templateId = newTemplate;
        }
        if (newRecurrence) {
          plannedDay.recurrence = newRecurrence;
        }
        await plannedDay.save();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid edit type' });
    }
    
    res.json({ message: 'Recurring event updated successfully' });
  } catch (error) {
    console.error('Error editing recurring event:', error);
    res.status(500).json({ error: 'Failed to edit recurring event' });
  }
};

// Delete recurring event with options (this, thisAndFuture, all)
const deleteRecurringEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { editType, originalDate } = req.body;
    
    console.log('deleteRecurringEvent called with:', {
      id,
      editType,
      originalDate,
      userId: req.user._id
    });
    
    if (!editType || !originalDate) {
      return res.status(400).json({ error: 'Edit type and original date are required' });
    }
    
    const plannedDay = await PlannedDay.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!plannedDay) {
      return res.status(404).json({ error: 'Planned day not found' });
    }
    
    const targetDate = new Date(originalDate);
    
    switch (editType) {
      case 'this':
        // Add exception for this occurrence
        console.log('Adding delete exception for date:', targetDate);
        plannedDay.exceptions.push({
          originalDate: targetDate,
          action: 'delete',
          reason: 'Deleted single occurrence'
        });
        await plannedDay.save();
        console.log('Exception added, planned day now has exceptions:', plannedDay.exceptions);
        break;
        
      case 'thisAndFuture':
        // End the series at the day before target date
        const dayBefore = new Date(targetDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        plannedDay.endDate = dayBefore;
        await plannedDay.save();
        break;
        
      case 'all':
        // Delete the entire series
        await PlannedDay.findByIdAndDelete(id);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid edit type' });
    }
    
    res.json({ message: 'Recurring event deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring event:', error);
    res.status(500).json({ error: 'Failed to delete recurring event' });
  }
};

module.exports = {
  assignTemplateToCalendar,
  getPlannedDays,
  getPlannedDaysByDate,
  updatePlannedDay,
  deletePlannedDay,
  addException,
  editRecurringEvent,
  deleteRecurringEvent
}; 