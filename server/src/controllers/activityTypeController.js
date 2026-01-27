const prisma = require('../config/prisma');

// Get all activity types for a user
const getActivityTypes = async (req, res) => {
  try {
    const activities = await prisma.activityType.findMany({
      where: { userId: req.user.id },
      include: {
        wellnessTags: {
          select: { id: true, name: true, type: true, color: true },
        },
      },
      orderBy: { name: 'asc' },
    });

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
    const userWellnessTags = await prisma.wellnessCategory.findMany({
      where: {
        id: { in: wellnessTagIds },
        userId: req.user.id,
      },
    });

    if (userWellnessTags.length !== wellnessTagIds.length) {
      return res.status(400).json({ error: 'Invalid wellness tag IDs' });
    }
    
    // Check if activity already exists for this user
    const existingActivity = await prisma.activityType.findFirst({
      where: {
        userId: req.user.id,
        name: name.trim(),
      },
    });
    
    if (existingActivity) {
      return res.status(400).json({ error: 'Activity with this name already exists' });
    }
    
    const activity = await prisma.activityType.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        userId: req.user.id,
        isDefault: false,
        wellnessTags: {
          connect: wellnessTagIds.map((id) => ({ id })),
        },
      },
      include: {
        wellnessTags: {
          select: { id: true, name: true, type: true, color: true },
        },
      },
    });

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
    
    const activity = await prisma.activityType.findFirst({
      where: { id, userId: req.user.id },
      include: {
        wellnessTags: {
          select: { id: true },
        },
      },
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Don't allow updating default activities
    if (activity.isDefault) {
      return res.status(400).json({ error: 'Cannot update default activities' });
    }
    
    const data = {};

    // Verify wellness tags if provided
    if (wellnessTagIds && wellnessTagIds.length > 0) {
      const userWellnessTags = await prisma.wellnessCategory.findMany({
        where: {
          id: { in: wellnessTagIds },
          userId: req.user.id,
        },
      });

      if (userWellnessTags.length !== wellnessTagIds.length) {
        return res.status(400).json({ error: 'Invalid wellness tag IDs' });
      }

      data.wellnessTags = {
        set: wellnessTagIds.map((wtId) => ({ id: wtId })),
      };
    }

    // Update fields
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim();

    const updated = await prisma.activityType.update({
      where: { id },
      data,
      include: {
        wellnessTags: {
          select: { id: true, name: true, type: true, color: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update activity type' });
  }
};

// Delete an activity type
const deleteActivityType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await prisma.activityType.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Don't allow deleting default activities
    if (activity.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default activities' });
    }
    
    await prisma.activityType.delete({ where: { id } });
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