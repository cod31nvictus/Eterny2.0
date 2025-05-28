const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getWellnessSummaryController,
  getWellnessTrendsController,
  getQuickStats,
  getCategoryBreakdown
} = require('../controllers/summaryController');

// All routes require authentication
router.use(authenticateToken);

// GET /api/summary?start=YYYY-MM-DD&end=YYYY-MM-DD - Get wellness summary for date range
router.get('/', getWellnessSummaryController);

// GET /api/summary/trends?start=YYYY-MM-DD&end=YYYY-MM-DD&interval=daily - Get wellness trends
router.get('/trends', getWellnessTrendsController);

// GET /api/summary/quick-stats - Get quick stats for dashboard
router.get('/quick-stats', getQuickStats);

// GET /api/summary/categories?start=YYYY-MM-DD&end=YYYY-MM-DD - Get category breakdown
router.get('/categories', getCategoryBreakdown);

module.exports = router; 