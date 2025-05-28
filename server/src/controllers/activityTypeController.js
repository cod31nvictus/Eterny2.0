const ActivityType = require('../models/ActivityType');
const WellnessCategory = require('../models/WellnessCategory');

// Get all activity types for a user
const getActivityTypes = async (req, res) => {
  try {
    const activities = await ActivityType.find({ userId: req.user._id })
      .populate('wellnessTagIds', 'name type color')
      .sort({ name: 1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity types' });
  }
};

// Create a new activity type
const createActivityType = async (req, res) => {
  try {
    const { name, wellnessTagIds, description } = req.body;
    
    // Validate required fields
    if (!name || !wellnessTagIds || wellnessTagIds.length === 0) {
      return res.status(400).json({ error: 'Name and at least one wellness tag are required' });
    }
    
    // Verify wellness tags belong to the user
    const userWellnessTags = await WellnessCategory.find({
      _id: { $in: wellnessTagIds },
      userId: req.user._id
    });
    
    if (userWellnessTags.length !== wellnessTagIds.length) {
      return res.status(400).json({ error: 'Invalid wellness tag IDs' });
    }
    
    // Check if activity already exists for this user
    const existingActivity = await ActivityType.findOne({
      userId: req.user._id,
      name: name.trim()
    });
    
    if (existingActivity) {
      return res.status(400).json({ error: 'Activity with this name already exists' });
    }
    
    const activity = new ActivityType({
      name: name.trim(),
      wellnessTagIds,
      description: description?.trim(),
      userId: req.user._id,
      isDefault: false
    });
    
    await activity.save();
    
    // Populate wellness tags before returning
    await activity.populate('wellnessTagIds', 'name type color');
    
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity type' });
  }
};

// Update an activity type
const updateActivityType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, wellnessTagIds, description } = req.body;
    
    const activity = await ActivityType.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Don't allow updating default activities
    if (activity.isDefault) {
      return res.status(400).json({ error: 'Cannot update default activities' });
    }
    
    // Verify wellness tags if provided
    if (wellnessTagIds && wellnessTagIds.length > 0) {
      const userWellnessTags = await WellnessCategory.find({
        _id: { $in: wellnessTagIds },
        userId: req.user._id
      });
      
      if (userWellnessTags.length !== wellnessTagIds.length) {
        return res.status(400).json({ error: 'Invalid wellness tag IDs' });
      }
      
      activity.wellnessTagIds = wellnessTagIds;
    }
    
    // Update fields
    if (name) activity.name = name.trim();
    if (description !== undefined) activity.description = description?.trim();
    
    await activity.save();
    await activity.populate('wellnessTagIds', 'name type color');
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update activity type' });
  }
};

// Delete an activity type
const deleteActivityType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await ActivityType.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Don't allow deleting default activities
    if (activity.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default activities' });
    }
    
    await ActivityType.findByIdAndDelete(id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete activity type' });
  }
};

module.exports = {
  getActivityTypes,
  createActivityType,
  updateActivityType,
  deleteActivityType
}; 