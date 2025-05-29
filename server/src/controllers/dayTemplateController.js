const DayTemplate = require('../models/DayTemplate');
const ActivityType = require('../models/ActivityType');
const DayDimension = require('../models/DayDimension');

// Get all day templates for a user
const getDayTemplates = async (req, res) => {
  try {
    const templates = await DayTemplate.find({ userId: req.user._id })
      .populate('timeBlocks.activityTypeId', 'name')
      .sort({ name: 1 });
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch day templates' });
  }
};

// Get a specific day template
const getDayTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await DayTemplate.findOne({
      _id: id,
      userId: req.user._id
    })
    .populate('timeBlocks.activityTypeId', 'name wellnessTagIds')
    .populate('dimensionValues.dimensionId', 'name description');
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch day template' });
  }
};

// Create a new day template
const createDayTemplate = async (req, res) => {
  try {
    console.log('Creating day template with data:', JSON.stringify(req.body, null, 2));
    const { name, description, dimensionValues, timeBlocks, tags } = req.body;
    
    // Validate required fields
    if (!name) {
      console.error('Validation failed: Name is required');
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if template already exists for this user
    const existingTemplate = await DayTemplate.findOne({
      userId: req.user._id,
      name: name.trim()
    });
    
    if (existingTemplate) {
      console.error('Validation failed: Template with this name already exists');
      return res.status(400).json({ error: 'Template with this name already exists' });
    }
    
    // Validate activity types in time blocks
    if (timeBlocks && timeBlocks.length > 0) {
      console.log('Validating time blocks:', timeBlocks.length, 'blocks');
      const activityIds = timeBlocks.map(block => block.activityTypeId);
      console.log('Activity IDs to validate:', activityIds);
      
      const userActivities = await ActivityType.find({
        _id: { $in: activityIds },
        userId: req.user._id
      });
      
      console.log('Found user activities:', userActivities.map(a => ({ id: a._id, name: a.name })));
      
      if (userActivities.length !== activityIds.length) {
        console.error('Validation failed: Invalid activity type IDs. Expected:', activityIds, 'Found:', userActivities.map(a => a._id));
        return res.status(400).json({ error: 'Invalid activity type IDs' });
      }
    }
    
    // Validate dimension values
    if (dimensionValues && dimensionValues.length > 0) {
      console.log('Validating dimension values:', dimensionValues);
      const dimensionIds = dimensionValues.map(dv => dv.dimensionId);
      const userDimensions = await DayDimension.find({
        _id: { $in: dimensionIds },
        userId: req.user._id
      });
      
      console.log('Found user dimensions:', userDimensions.map(d => ({ id: d._id, name: d.name })));
      
      if (userDimensions.length !== dimensionIds.length) {
        console.error('Validation failed: Invalid dimension IDs. Expected:', dimensionIds, 'Found:', userDimensions.map(d => d._id));
        return res.status(400).json({ error: 'Invalid dimension IDs' });
      }
      
      // Validate that value IDs exist in their respective dimensions
      for (const dimValue of dimensionValues) {
        const dimension = userDimensions.find(d => d._id.toString() === dimValue.dimensionId);
        const valueExists = dimension.values.some(v => v._id.toString() === dimValue.valueId);
        
        if (!valueExists) {
          console.error('Validation failed: Invalid value ID for dimension', dimension.name, 'Value ID:', dimValue.valueId);
          return res.status(400).json({ error: `Invalid value ID for dimension ${dimension.name}` });
        }
      }
    }
    
    const template = new DayTemplate({
      name: name.trim(),
      description: description?.trim(),
      dimensionValues: dimensionValues || [],
      timeBlocks: timeBlocks ? timeBlocks.map((block, index) => ({
        activityTypeId: block.activityTypeId,
        blockName: block.blockName?.trim(),
        startTime: block.startTime,
        endTime: block.endTime,
        notes: block.notes?.trim(),
        order: block.order || index + 1
      })) : [],
      tags: tags || [],
      userId: req.user._id,
      isDefault: false
    });
    
    console.log('Attempting to save template:', template.toObject());
    await template.save();
    console.log('Template saved successfully with ID:', template._id);
    
    // Populate before returning
    await template.populate('timeBlocks.activityTypeId', 'name');
    
    console.log('Template creation completed successfully');
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating day template:', error);
    res.status(500).json({ error: 'Failed to create day template' });
  }
};

// Update a day template
const updateDayTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, dimensionValues, timeBlocks, tags } = req.body;
    
    const template = await DayTemplate.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Don't allow updating default templates
    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot update default templates' });
    }
    
    // Validate activity types if provided
    if (timeBlocks && timeBlocks.length > 0) {
      const activityIds = timeBlocks.map(block => block.activityTypeId);
      const userActivities = await ActivityType.find({
        _id: { $in: activityIds },
        userId: req.user._id
      });
      
      if (userActivities.length !== activityIds.length) {
        console.error('Invalid activity type IDs. Expected:', activityIds, 'Found:', userActivities.map(a => a._id));
        return res.status(400).json({ error: 'Invalid activity type IDs' });
      }
    }
    
    // Update fields
    if (name) template.name = name.trim();
    if (description !== undefined) template.description = description?.trim();
    if (dimensionValues) template.dimensionValues = dimensionValues;
    if (timeBlocks) {
      template.timeBlocks = timeBlocks.map((block, index) => ({
        activityTypeId: block.activityTypeId,
        blockName: block.blockName?.trim(),
        startTime: block.startTime,
        endTime: block.endTime,
        notes: block.notes?.trim(),
        order: block.order || index + 1
      }));
    }
    if (tags) template.tags = tags;
    
    await template.save();
    await template.populate('timeBlocks.activityTypeId', 'name');
    
    res.json(template);
  } catch (error) {
    console.error('Error updating day template:', error);
    res.status(500).json({ error: 'Failed to update day template' });
  }
};

// Delete a day template
const deleteDayTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await DayTemplate.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Don't allow deleting default templates
    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default templates' });
    }
    
    await DayTemplate.findByIdAndDelete(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete day template' });
  }
};

module.exports = {
  getDayTemplates,
  getDayTemplate,
  createDayTemplate,
  updateDayTemplate,
  deleteDayTemplate
}; 