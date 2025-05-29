const PlannedDay = require('../models/PlannedDay');
const DayTemplate = require('../models/DayTemplate');
const ActivityType = require('../models/ActivityType');
const WellnessCategory = require('../models/WellnessCategory');

// Helper function to parse time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to calculate duration between two times
const calculateDuration = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle overnight activities (end time is next day)
  if (endMinutes < startMinutes) {
    return (24 * 60) - startMinutes + endMinutes;
  }
  
  return endMinutes - startMinutes;
};

// Get wellness summary for a date range
const getWellnessSummary = async (userId, startDate, endDate, options = {}) => {
  try {
    const { groupBy = 'category', includeDrains = true } = options;
    
    // Get all planned days for the user in the date range
    const plannedDays = await PlannedDay.find({
      userId,
      isActive: true,
      $and: [
        { startDate: { $lte: endDate } },
        {
          $or: [
            { endDate: null },
            { endDate: { $exists: false } },
            { endDate: { $gte: startDate } }
          ]
        }
      ]
    })
    .populate({
      path: 'templateId',
      populate: {
        path: 'timeBlocks.activityTypeId',
        populate: {
          path: 'wellnessTagIds',
          select: 'name type color'
        }
      }
    });
    
    // Generate summary data
    const summary = {
      dateRange: { start: startDate, end: endDate },
      totalDays: 0,
      totalMinutes: 0,
      byCategory: {},
      byActivity: {},
      byDay: [],
      wellnessScore: 0
    };
    
    // Process each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Find templates scheduled for this date
      const templatesForDate = plannedDays.filter(plannedDay => 
        plannedDay.isScheduledForDate(currentDate)
      );
      
      if (templatesForDate.length > 0) {
        summary.totalDays++;
        
        const dayData = {
          date: dateStr,
          totalMinutes: 0,
          activities: [],
          categories: {},
          wellnessScore: 0
        };
        
        // Process each template for this day
        templatesForDate.forEach(plannedDay => {
          const template = plannedDay.templateId;
          
          if (template && template.timeBlocks) {
            template.timeBlocks.forEach(block => {
              const activity = block.activityTypeId;
              if (!activity) return;
              
              const duration = calculateDuration(block.startTime, block.endTime);
              
              // Add to day data
              dayData.totalMinutes += duration;
              dayData.activities.push({
                name: activity.name,
                duration,
                startTime: block.startTime,
                endTime: block.endTime,
                wellnessTags: activity.wellnessTagIds || []
              });
              
              // Process wellness categories
              if (activity.wellnessTagIds) {
                activity.wellnessTagIds.forEach(category => {
                  // Skip drains if not included
                  if (!includeDrains && category.type === 'drain') return;
                  
                  const categoryKey = category.name;
                  
                  // Update day categories
                  if (!dayData.categories[categoryKey]) {
                    dayData.categories[categoryKey] = {
                      name: category.name,
                      type: category.type,
                      color: category.color,
                      minutes: 0
                    };
                  }
                  dayData.categories[categoryKey].minutes += duration;
                  
                  // Update overall summary by category
                  if (!summary.byCategory[categoryKey]) {
                    summary.byCategory[categoryKey] = {
                      name: category.name,
                      type: category.type,
                      color: category.color,
                      totalMinutes: 0,
                      averagePerDay: 0,
                      daysActive: 0
                    };
                  }
                  summary.byCategory[categoryKey].totalMinutes += duration;
                });
              }
              
              // Update summary by activity
              const activityKey = activity.name;
              if (!summary.byActivity[activityKey]) {
                summary.byActivity[activityKey] = {
                  name: activity.name,
                  totalMinutes: 0,
                  averagePerDay: 0,
                  daysActive: 0,
                  wellnessTags: activity.wellnessTagIds || []
                };
              }
              summary.byActivity[activityKey].totalMinutes += duration;
              
              summary.totalMinutes += duration;
            });
          }
        });
        
        // Calculate day wellness score (wellness minutes - drain minutes)
        let wellnessMinutes = 0;
        let drainMinutes = 0;
        
        Object.values(dayData.categories).forEach(category => {
          if (category.type === 'wellness') {
            wellnessMinutes += category.minutes;
          } else if (category.type === 'drain') {
            drainMinutes += category.minutes;
          }
        });
        
        dayData.wellnessScore = wellnessMinutes - drainMinutes;
        summary.byDay.push(dayData);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate averages and final metrics
    if (summary.totalDays > 0) {
      // Category averages
      Object.values(summary.byCategory).forEach(category => {
        category.averagePerDay = Math.round(category.totalMinutes / summary.totalDays);
        category.daysActive = summary.byDay.filter(day => 
          day.categories[category.name] && day.categories[category.name].minutes > 0
        ).length;
      });
      
      // Activity averages
      Object.values(summary.byActivity).forEach(activity => {
        activity.averagePerDay = Math.round(activity.totalMinutes / summary.totalDays);
        activity.daysActive = summary.byDay.filter(day =>
          day.activities.some(a => a.name === activity.name)
        ).length;
      });
      
      // Overall wellness score
      const totalWellnessMinutes = Object.values(summary.byCategory)
        .filter(cat => cat.type === 'wellness')
        .reduce((sum, cat) => sum + cat.totalMinutes, 0);
      
      const totalDrainMinutes = Object.values(summary.byCategory)
        .filter(cat => cat.type === 'drain')
        .reduce((sum, cat) => sum + cat.totalMinutes, 0);
      
      summary.wellnessScore = totalWellnessMinutes - totalDrainMinutes;
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating wellness summary:', error);
    throw error;
  }
};

// Get wellness trends over time
const getWellnessTrends = async (userId, startDate, endDate, interval = 'daily') => {
  try {
    const summary = await getWellnessSummary(userId, startDate, endDate);
    
    const trends = {
      interval,
      dateRange: { start: startDate, end: endDate },
      data: []
    };
    
    if (interval === 'daily') {
      trends.data = summary.byDay.map(day => ({
        date: day.date,
        wellnessScore: day.wellnessScore,
        totalMinutes: day.totalMinutes,
        categories: day.categories
      }));
    } else if (interval === 'weekly') {
      // Group by weeks
      const weeks = {};
      summary.byDay.forEach(day => {
        const date = new Date(day.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = {
            weekStart: weekKey,
            wellnessScore: 0,
            totalMinutes: 0,
            days: 0,
            categories: {}
          };
        }
        
        weeks[weekKey].wellnessScore += day.wellnessScore;
        weeks[weekKey].totalMinutes += day.totalMinutes;
        weeks[weekKey].days++;
        
        Object.entries(day.categories).forEach(([name, category]) => {
          if (!weeks[weekKey].categories[name]) {
            weeks[weekKey].categories[name] = { ...category, minutes: 0 };
          }
          weeks[weekKey].categories[name].minutes += category.minutes;
        });
      });
      
      trends.data = Object.values(weeks);
    }
    
    return trends;
  } catch (error) {
    console.error('Error generating wellness trends:', error);
    throw error;
  }
};

module.exports = {
  getWellnessSummary,
  getWellnessTrends
}; 