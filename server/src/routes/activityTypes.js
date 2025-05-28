const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getActivityTypes,
  createActivityType,
  updateActivityType,
  deleteActivityType
} = require('../controllers/activityTypeController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/activities - Get all activity types for user
router.get('/', getActivityTypes);

// POST /api/activities - Create new activity type
router.post('/', createActivityType);

// PUT /api/activities/:id - Update activity type
router.put('/:id', updateActivityType);

// DELETE /api/activities/:id - Delete activity type
router.delete('/:id', deleteActivityType);

module.exports = router; 