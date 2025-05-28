const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getDayTemplates,
  getDayTemplate,
  createDayTemplate,
  updateDayTemplate,
  deleteDayTemplate
} = require('../controllers/dayTemplateController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/templates - Get all day templates for user
router.get('/', getDayTemplates);

// GET /api/templates/:id - Get specific day template
router.get('/:id', getDayTemplate);

// POST /api/templates - Create new day template
router.post('/', createDayTemplate);

// PUT /api/templates/:id - Update day template
router.put('/:id', updateDayTemplate);

// DELETE /api/templates/:id - Delete day template
router.delete('/:id', deleteDayTemplate);

module.exports = router; 