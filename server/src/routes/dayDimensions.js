const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getDayDimensions,
  createDayDimension,
  updateDayDimension,
  deleteDayDimension
} = require('../controllers/dayDimensionController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/dimensions - Get all day dimensions for user
router.get('/', getDayDimensions);

// POST /api/dimensions - Create new day dimension
router.post('/', createDayDimension);

// PUT /api/dimensions/:id - Update day dimension
router.put('/:id', updateDayDimension);

// DELETE /api/dimensions/:id - Delete day dimension
router.delete('/:id', deleteDayDimension);

module.exports = router;