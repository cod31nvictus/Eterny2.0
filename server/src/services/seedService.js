const WellnessCategory = require('../models/WellnessCategory');
const ActivityType = require('../models/ActivityType');
const DayDimension = require('../models/DayDimension');

const defaultWellnessCategories = [
  // Wellness categories
  { name: 'Physical Wellness', type: 'wellness', color: '#2E7D32', description: 'Physical health and fitness activities' },
  { name: 'Mental Wellness', type: 'wellness', color: '#8B1E3F', description: 'Mental health and cognitive well-being' },
  { name: 'Spiritual Wellness', type: 'wellness', color: '#7E57C2', description: 'Spiritual growth and inner peace' },
  { name: 'Social Wellness', type: 'wellness', color: '#FF9800', description: 'Social connections and relationships' },
  { name: 'Financial Wellness', type: 'wellness', color: '#5C6BC0', description: 'Financial health and security' },
  
  // Drain categories
  { name: 'Physical Drain', type: 'drain', color: '#4CAF50', description: 'Activities that drain physical energy' },
  { name: 'Mental Drain', type: 'drain', color: '#5A0820', description: 'Activities that drain mental energy' },
  { name: 'Spiritual Drain', type: 'drain', color: '#4527A0', description: 'Activities that drain spiritual energy' },
  { name: 'Social Drain', type: 'drain', color: '#EF6C00', description: 'Activities that drain social energy' },
  { name: 'Financial Drain', type: 'drain', color: '#283593', description: 'Activities that drain financial resources' }
];

const seedDefaultWellnessCategories = async (userId) => {
  try {
    const categoriesToCreate = defaultWellnessCategories.map(category => ({
      ...category,
      userId,
      isDefault: true
    }));
    
    await WellnessCategory.insertMany(categoriesToCreate);
    console.log(`Seeded ${categoriesToCreate.length} default wellness categories for user ${userId}`);
  } catch (error) {
    console.error('Error seeding default wellness categories:', error);
    throw error;
  }
};

const defaultActivityTypes = [
  { name: 'Work', description: 'Professional work activities and tasks', wellnessCategories: ['Physical Drain', 'Mental Drain', 'Social Wellness', 'Financial Wellness'] },
  { name: 'Family Time', description: 'Quality time spent with family members', wellnessCategories: ['Social Wellness', 'Mental Wellness'] },
  { name: 'Walking', description: 'Walking for exercise, transportation, or leisure', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Sleeping', description: 'Rest and sleep for physical and mental recovery', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Hydration', description: 'Drinking water and maintaining proper fluid intake', wellnessCategories: ['Physical Wellness'] },
  { name: 'Meal', description: 'Eating meals and nourishing the body', wellnessCategories: ['Physical Wellness'] },
  { name: 'Outdoors', description: 'Spending time in nature and outdoor environments', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Exercise', description: 'Physical fitness activities and workouts', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Sports', description: 'Participating in sports and athletic activities', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Free Play', description: 'Unstructured play and recreational activities', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Personal Hygiene', description: 'Self-care activities for cleanliness and grooming', wellnessCategories: ['Physical Wellness', 'Mental Wellness'] },
  { name: 'Prayer', description: 'Spiritual practice and connection with the divine', wellnessCategories: ['Spiritual Wellness', 'Mental Wellness'] },
  { name: 'Meditation', description: 'Mindfulness practice and mental clarity exercises', wellnessCategories: ['Spiritual Wellness', 'Mental Wellness'] },
  { name: 'Entertainment', description: 'Leisure activities for enjoyment and relaxation', wellnessCategories: ['Mental Wellness'] },
  { name: 'Social Engagement', description: 'Interacting and connecting with others socially', wellnessCategories: ['Social Wellness', 'Mental Wellness'] },
  { name: 'Nothingness', description: 'Quiet time for rest and mental decompression', wellnessCategories: ['Mental Wellness'] },
  { name: 'Learning', description: 'Educational activities and skill development', wellnessCategories: ['Mental Wellness'] },
  { name: 'Self Care', description: 'Activities focused on personal well-being and care', wellnessCategories: ['Mental Wellness'] },
  { name: 'Creative', description: 'Creative expression and artistic activities', wellnessCategories: ['Mental Wellness'] },
  { name: 'Commute', description: 'Transportation to and from work or activities', wellnessCategories: ['Physical Drain'] },
  { name: 'Travel', description: 'Traveling for leisure, work, or personal reasons', wellnessCategories: ['Physical Drain', 'Mental Wellness'] },
  { name: 'Shopping', description: 'Purchasing goods and services for daily needs', wellnessCategories: ['Mental Wellness', 'Financial Drain'] },
  { name: 'Budgeting', description: 'Financial planning and money management activities', wellnessCategories: ['Financial Wellness'] },
  { name: 'Medication', description: 'Taking prescribed medications and health supplements', wellnessCategories: ['Physical Wellness'] }
];

const seedDefaultActivityTypes = async (userId) => {
  try {
    // Get user's wellness categories to map activity types
    const userCategories = await WellnessCategory.find({ userId, isDefault: true });
    const categoryMap = {};
    userCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    const activitiesToCreate = defaultActivityTypes.map(activity => {
      const wellnessTagIds = activity.wellnessCategories
        .map(catName => categoryMap[catName])
        .filter(id => id); // Remove undefined IDs

      return {
        name: activity.name,
        description: activity.description,
        wellnessTagIds,
        userId,
        isDefault: true
      };
    }).filter(activity => activity.wellnessTagIds.length > 0); // Only include activities with valid tags

    await ActivityType.insertMany(activitiesToCreate);
    console.log(`Seeded ${activitiesToCreate.length} default activity types for user ${userId}`);
  } catch (error) {
    console.error('Error seeding default activity types:', error);
    throw error;
  }
};

const defaultDayDimensions = [
  {
    name: 'Meal Regimen',
    description: 'Type of eating day',
    values: [
      { name: 'Normal', description: 'Regular eating day', order: 1 },
      { name: 'Refeed', description: 'Higher calorie day', order: 2 },
      { name: 'Intermittent Fasting', description: 'Fasting or low calorie day', order: 3 },
      { name: 'Islamic Fasting', description: 'Religious fasting practice', order: 4 },
      { name: '36 Hr Fasting', description: 'Extended fasting period', order: 5 },
      { name: 'Cheat', description: 'Indulgent eating day', order: 6 }
    ]
  },
  {
    name: 'Work Level',
    description: 'Type of work schedule',
    values: [
      { name: 'Regular', description: 'Normal work day', order: 1 },
      { name: 'Light', description: 'Reduced workload', order: 2 },
      { name: 'Heavy', description: 'Intense work day', order: 3 },
      { name: 'Off', description: 'No work scheduled', order: 4 }
    ]
  },
  {
    name: 'Energy Level',
    description: 'Expected energy for the day',
    values: [
      { name: 'High', description: 'High energy day', order: 1 },
      { name: 'Medium', description: 'Moderate energy', order: 2 },
      { name: 'Low', description: 'Low energy day', order: 3 },
      { name: 'Recovery', description: 'Rest and recovery focus', order: 4 }
    ]
  },
  {
    name: 'Social Focus',
    description: 'Social interaction level',
    values: [
      { name: 'Social Butterfly', description: 'High social interaction', order: 1 },
      { name: 'Balanced', description: 'Moderate social time', order: 2 },
      { name: 'Family Only', description: 'Focused family time', order: 3 },
      { name: 'Hermit', description: 'Minimal social interaction', order: 4 }
    ]
  },
  {
    name: 'Travel',
    description: 'Travel intensity for the day',
    values: [
      { name: 'No Travel', description: 'Staying at home or local area', order: 1 },
      { name: 'Light Travel', description: 'Short trips or local travel', order: 2 },
      { name: 'Heavy Travel', description: 'Long distance or extensive travel', order: 3 }
    ]
  }
];

const seedDefaultDayDimensions = async (userId) => {
  try {
    const dimensionsToCreate = defaultDayDimensions.map(dimension => ({
      ...dimension,
      userId,
      isDefault: true
    }));
    
    await DayDimension.insertMany(dimensionsToCreate);
    console.log(`Seeded ${dimensionsToCreate.length} default day dimensions for user ${userId}`);
  } catch (error) {
    console.error('Error seeding default day dimensions:', error);
    throw error;
  }
};

module.exports = {
  seedDefaultWellnessCategories,
  seedDefaultActivityTypes,
  seedDefaultDayDimensions
}; 