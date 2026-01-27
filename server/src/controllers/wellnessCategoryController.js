const prisma = require('../config/prisma');

// Get all wellness categories for a user
const getWellnessCategories = async (req, res) => {
  try {
    const categories = await prisma.wellnessCategory.findMany({
      where: { userId: req.user.id },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

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
    const existingCategory = await prisma.wellnessCategory.findFirst({
      where: {
        userId: req.user.id,
        name: name.trim(),
        type,
      },
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name and type already exists' });
    }
    
    const category = await prisma.wellnessCategory.create({
      data: {
        name: name.trim(),
        type,
        color: color || '#3498db',
        description: description?.trim(),
        userId: req.user.id,
        isDefault: false,
      },
    });

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
    
    const category = await prisma.wellnessCategory.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Don't allow updating default categories
    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot update default categories' });
    }
    
    const data = {};
    if (name) data.name = name.trim();
    if (type) data.type = type;
    if (color) data.color = color;
    if (description !== undefined) data.description = description?.trim();

    const updated = await prisma.wellnessCategory.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wellness category' });
  }
};

// Delete a wellness category
const deleteWellnessCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.wellnessCategory.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Don't allow deleting default categories
    if (category.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }
    
    await prisma.wellnessCategory.delete({ where: { id } });
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