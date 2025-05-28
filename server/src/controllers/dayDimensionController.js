const DayDimension = require('../models/DayDimension');

// Get all day dimensions for a user
const getDayDimensions = async (req, res) => {
  try {
    const dimensions = await DayDimension.find({ userId: req.user._id })
      .sort({ name: 1 });
    
    res.json(dimensions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch day dimensions' });
  }
};

// Create a new day dimension
const createDayDimension = async (req, res) => {
  try {
    const { name, description, values } = req.body;
    
    // Validate required fields
    if (!name || !values || values.length === 0) {
      return res.status(400).json({ error: 'Name and at least one value are required' });
    }
    
    // Check if dimension already exists for this user
    const existingDimension = await DayDimension.findOne({
      userId: req.user._id,
      name: name.trim()
    });
    
    if (existingDimension) {
      return res.status(400).json({ error: 'Dimension with this name already exists' });
    }
    
    const dimension = new DayDimension({
      name: name.trim(),
      description: description?.trim(),
      values: values.map((value, index) => ({
        name: value.name.trim(),
        description: value.description?.trim(),
        order: value.order || index + 1
      })),
      userId: req.user._id,
      isDefault: false
    });
    
    await dimension.save();
    res.status(201).json(dimension);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create day dimension' });
  }
};

// Update a day dimension
const updateDayDimension = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, values } = req.body;
    
    const dimension = await DayDimension.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }
    
    // Allow updating default dimensions (but not deleting them)
    // This enables users to customize default day dimensions to their needs
    
    // Update fields
    if (name) dimension.name = name.trim();
    if (description !== undefined) dimension.description = description?.trim();
    if (values && values.length > 0) {
      dimension.values = values.map((value, index) => ({
        name: value.name.trim(),
        description: value.description?.trim(),
        order: value.order || index + 1
      }));
    }
    
    await dimension.save();
    res.json(dimension);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update day dimension' });
  }
};

// Delete a day dimension
const deleteDayDimension = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dimension = await DayDimension.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }
    
    // Don't allow deleting default dimensions
    if (dimension.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default dimensions' });
    }
    
    await DayDimension.findByIdAndDelete(id);
    res.json({ message: 'Dimension deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete day dimension' });
  }
};

module.exports = {
  getDayDimensions,
  createDayDimension,
  updateDayDimension,
  deleteDayDimension
};