const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const HabitTracking = require('../models/HabitTracking');
const { authenticateToken } = require('../middleware/auth');

// Helper function to calculate streak
const calculateStreak = async (habitId, userId) => {
  const habit = await Habit.findById(habitId);
  if (!habit) return 0;

  const today = new Date();
  const trackingRecords = await HabitTracking.find({
    habitId,
    userId
  }).sort({ date: -1 });

  let streak = 0;
  let currentDate = new Date(today);
  let foundIncompleteDay = false;

  // Go backwards from today
  while (!foundIncompleteDay) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    // Check if this day should be tracked
    if (habit.trackingDays.includes(dayOfWeek)) {
      const record = trackingRecords.find(r => r.date === dateStr);
      
      if (record && record.completed) {
        streak++;
      } else {
        // Day was supposed to be tracked but wasn't completed
        foundIncompleteDay = true;
        break;
      }
    }

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Don't go back more than 365 days to prevent infinite loops
    if (today - currentDate > 365 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return streak;
};

// GET /api/habits - Get all habits for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user.id, 
      isActive: true 
    }).sort({ createdAt: -1 });

    // Calculate streaks for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const streak = await calculateStreak(habit._id, req.user.id);
        return {
          ...habit.toObject(),
          currentStreak: streak
        };
      })
    );

    res.json(habitsWithStreaks);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// GET /api/habits/today - Get habits for today
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const dateStr = today.toISOString().split('T')[0];

    const habits = await Habit.find({ 
      userId: req.user.id, 
      isActive: true,
      trackingDays: dayOfWeek
    }).sort({ createdAt: -1 });

    // Get today's tracking records
    const trackingRecords = await HabitTracking.find({
      userId: req.user.id,
      date: dateStr
    });

    // Calculate streaks and add completion status
    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const streak = await calculateStreak(habit._id, req.user.id);
        const tracking = trackingRecords.find(r => r.habitId.toString() === habit._id.toString());
        
        return {
          ...habit.toObject(),
          currentStreak: streak,
          completedToday: tracking ? tracking.completed : false,
          trackingId: tracking ? tracking._id : null
        };
      })
    );

    res.json(habitsWithStatus);
  } catch (error) {
    console.error('Error fetching today habits:', error);
    res.status(500).json({ error: 'Failed to fetch today habits' });
  }
});

// POST /api/habits - Create new habit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, trackingDays } = req.body;

    if (!name || !trackingDays || !Array.isArray(trackingDays)) {
      return res.status(400).json({ error: 'Name and tracking days are required' });
    }

    if (trackingDays.length === 0) {
      return res.status(400).json({ error: 'At least one tracking day must be selected' });
    }

    const habit = new Habit({
      userId: req.user.id,
      name: name.trim(),
      trackingDays
    });

    await habit.save();

    res.status(201).json({
      ...habit.toObject(),
      currentStreak: 0
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// POST /api/habits/:id/track - Toggle habit tracking for a date
router.post('/:id/track', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Verify habit belongs to user
    const habit = await Habit.findOne({ _id: id, userId: req.user.id, isActive: true });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if tracking record exists
    const existingTracking = await HabitTracking.findOne({
      userId: req.user.id,
      habitId: id,
      date
    });

    if (existingTracking) {
      // Toggle completion status
      existingTracking.completed = !existingTracking.completed;
      existingTracking.completedAt = new Date();
      await existingTracking.save();
    } else {
      // Create new tracking record
      const tracking = new HabitTracking({
        userId: req.user.id,
        habitId: id,
        date,
        completed: true
      });
      await tracking.save();
    }

    // Calculate new streak
    const streak = await calculateStreak(id, req.user.id);

    res.json({
      success: true,
      completed: existingTracking ? existingTracking.completed : true,
      currentStreak: streak
    });
  } catch (error) {
    console.error('Error tracking habit:', error);
    res.status(500).json({ error: 'Failed to track habit' });
  }
});

// DELETE /api/habits/:id - Delete habit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findOne({ _id: id, userId: req.user.id });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Soft delete by setting isActive to false
    habit.isActive = false;
    await habit.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

module.exports = router; 