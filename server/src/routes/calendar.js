const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  assignTemplateToCalendar,
  getPlannedDays,
  getPlannedDaysByDate,
  updatePlannedDay,
  deletePlannedDay,
  addException,
  editRecurringEvent,
  deleteRecurringEvent
} = require('../controllers/calendarController');
const CalendarAssignment = require('../models/CalendarAssignment');
const DayTemplate = require('../models/DayTemplate');
const ActivityType = require('../models/ActivityType');
const WellnessTag = require('../models/WellnessTag');
const googleCalendarService = require('../services/googleCalendarService');

// All routes require authentication
router.use(authenticateToken);

// POST /api/calendar/assign-template - Assign template to calendar
router.post('/assign-template', assignTemplateToCalendar);

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD - Get planned days for date range
router.get('/', getPlannedDays);

// GET /api/calendar/:date - Get planned days for specific date
router.get('/:date', getPlannedDaysByDate);

// PUT /api/calendar/planned/:id - Update planned day
router.put('/planned/:id', updatePlannedDay);

// DELETE /api/calendar/planned/:id - Delete planned day
router.delete('/planned/:id', deletePlannedDay);

// POST /api/calendar/planned/:id/exception - Add exception to planned day
router.post('/planned/:id/exception', addException);

// PUT /api/calendar/planned/:id/edit-recurring - Edit recurring event with options
router.put('/planned/:id/edit-recurring', editRecurringEvent);

// DELETE /api/calendar/planned/:id/delete-recurring - Delete recurring event with options
router.delete('/planned/:id/delete-recurring', deleteRecurringEvent);

// Google Calendar sync endpoints
router.get('/sync/status', async (req, res) => {
  try {
    const status = await googleCalendarService.getCalendarSyncStatus(req.user.id);
    res.json(status);
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

router.post('/sync/enable', async (req, res) => {
  try {
    const result = await googleCalendarService.enableCalendarSync(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error enabling sync:', error);
    res.status(500).json({ error: 'Failed to enable sync' });
  }
});

router.post('/sync/disable', async (req, res) => {
  try {
    const result = await googleCalendarService.disableCalendarSync(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error disabling sync:', error);
    res.status(500).json({ error: 'Failed to disable sync' });
  }
});

router.post('/sync/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Get the schedule for this date
    const assignments = await CalendarAssignment.find({
      userId: req.user.id,
      startDate: { $lte: new Date(date) },
      $or: [
        { endDate: { $gte: new Date(date) } },
        { endDate: null }
      ]
    }).populate({
      path: 'templateId',
      populate: {
        path: 'timeBlocks.activityTypeId',
        populate: {
          path: 'wellnessTagIds'
        }
      }
    });

    if (assignments.length === 0) {
      return res.json({ success: true, message: 'No schedule to sync for this date' });
    }

    // Convert to time blocks format
    const timeBlocksMap = new Map();
    
    assignments.forEach(assignment => {
      if (assignment.templateId && assignment.templateId.timeBlocks) {
        assignment.templateId.timeBlocks.forEach(timeBlock => {
          const key = `${timeBlock.startTime}-${timeBlock.endTime}`;
          
          const activity = {
            _id: timeBlock._id,
            name: timeBlock.activityTypeId.name,
            wellnessTags: timeBlock.activityTypeId.wellnessTagIds?.map(tag => tag.name) || [],
            blockName: timeBlock.blockName
          };
          
          if (timeBlocksMap.has(key)) {
            timeBlocksMap.get(key).activities.push(activity);
          } else {
            timeBlocksMap.set(key, {
              startTime: timeBlock.startTime,
              endTime: timeBlock.endTime,
              activities: [activity]
            });
          }
        });
      }
    });

    const timeBlocks = Array.from(timeBlocksMap.values());
    
    // Sync to Google Calendar
    const events = await googleCalendarService.syncScheduleToCalendar(req.user.id, date, timeBlocks);
    
    res.json({
      success: true,
      message: `Synced ${events.length} events to Google Calendar`,
      eventsCreated: events.length
    });
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    res.status(500).json({ error: 'Failed to sync to Google Calendar' });
  }
});

module.exports = router; 