const WellnessCategory = require('../models/WellnessCategory');

// Get all wellness categories for a user
const getWellnessCategories = async (req, res) => {
  try {
    const categories = await WellnessCategory.find({ userId: req.user._id })
      .sort({ type: 1, name: 1 });
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wellness categories' });
  }
};

// Create a new wellness category
const createWellnessCategory = async (req, res) => {
  try {
    const { name, type, color, description } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    // Check if category already exists for this user
    const existingCategory = await WellnessCategory.findOne({
      userId: req.user._id,
      name: name.trim(),
      type
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name and type already exists' });
    }
    
    const category = new WellnessCategory({
      name: name.trim(),
      type,
      color: color || '#3498db',
      description: description?.trim(),
      userId: req.user._id,
      isDefault: false
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wellness category' });
  }
};

// Update a wellness category
const updateWellnessCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, description } = req.body;
    
    const category = await WellnessCategory.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Don't allow updating default categories
    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot update default categories' });
    }
    
    // Update fields
    if (name) category.name = name.trim();
    if (type) category.type = type;
    if (color) category.color = color;
    if (description !== undefined) category.description = description?.trim();
    
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wellness category' });
  }
};

// Delete a wellness category
const deleteWellnessCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await WellnessCategory.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Don't allow deleting default categories
    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }
    
    await WellnessCategory.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wellness category' });
  }
};

module.exports = {
  getWellnessCategories,
  createWellnessCategory,
  updateWellnessCategory,
  deleteWellnessCategory
}; 