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

module.exports = router; 