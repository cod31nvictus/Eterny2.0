const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getWellnessCategories,
  createWellnessCategory,
  updateWellnessCategory,
  deleteWellnessCategory
} = require('../controllers/wellnessCategoryController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/categories - Get all wellness categories for user
router.get('/', getWellnessCategories);

// POST /api/categories - Create new wellness category
router.post('/', createWellnessCategory);

// PUT /api/categories/:id - Update wellness category
router.put('/:id', updateWellnessCategory);

// DELETE /api/categories/:id - Delete wellness category
router.delete('/:id', deleteWellnessCategory);

module.exports = router;