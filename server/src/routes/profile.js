const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, checkProfileCompletion } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// All profile routes require authentication
router.use(authenticateToken);

// GET /api/profile - Get user profile
router.get('/', getProfile);

// PUT /api/profile - Update user profile
router.put('/', updateProfile);

// GET /api/profile/completion - Check if profile is complete
router.get('/completion', checkProfileCompletion);

module.exports = router; 