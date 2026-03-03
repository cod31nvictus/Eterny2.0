const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const GoogleCalendarService = require('../services/googleCalendarService');
const User = require('../models/User');
const router = express.Router();

// Get sync status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isConnected = !!(user.googleAccessToken && user.googleRefreshToken);
    
    res.json({
      connected: isConnected,
      enabled: user.googleCalendarEnabled || false,
      message: isConnected ? 'Google Calendar Connected' : 'Google Calendar Not Connected'
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Enable Google Calendar sync
router.post('/enable', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google Calendar not connected. Please sign in with Google first.' 
      });
    }

    user.googleCalendarEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'Google Calendar sync enabled'
    });
  } catch (error) {
    console.error('Enable sync error:', error);
    res.status(500).json({ error: 'Failed to enable sync' });
  }
});

// Disable Google Calendar sync
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.googleCalendarEnabled = false;
    await user.save();

    res.json({
      success: true,
      message: 'Google Calendar sync disabled'
    });
  } catch (error) {
    console.error('Disable sync error:', error);
    res.status(500).json({ error: 'Failed to disable sync' });
  }
});

// Sync specific date
router.post('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleCalendarEnabled) {
      return res.status(400).json({ 
        error: 'Google Calendar sync is not enabled' 
      });
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      return res.status(400).json({ 
        error: 'Google Calendar not connected' 
      });
    }

    await GoogleCalendarService.syncDayToCalendar(user._id, date);

    res.json({
      success: true,
      message: `Successfully synced ${date} to Google Calendar`
    });
  } catch (error) {
    console.error('Sync date error:', error);
    res.status(500).json({ 
      error: 'Failed to sync to Google Calendar',
      details: error.message 
    });
  }
});

module.exports = router; 