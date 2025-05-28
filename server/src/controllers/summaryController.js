const { getWellnessSummary, getWellnessTrends } = require('../services/wellnessSummaryService');

// Get wellness summary for a date range
const getWellnessSummaryController = async (req, res) => {
  try {
    const { start, end, groupBy, includeDrains } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    // Limit date range to prevent performance issues
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({ error: 'Date range cannot exceed 365 days' });
    }
    
    const options = {
      groupBy: groupBy || 'category',
      includeDrains: includeDrains !== 'false' // default to true unless explicitly false
    };
    
    const summary = await getWellnessSummary(req.user._id, startDate, endDate, options);
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting wellness summary:', error);
    res.status(500).json({ error: 'Failed to get wellness summary' });
  }
};

// Get wellness trends over time
const getWellnessTrendsController = async (req, res) => {
  try {
    const { start, end, interval } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    // Validate interval
    const validIntervals = ['daily', 'weekly'];
    const selectedInterval = interval || 'daily';
    if (!validIntervals.includes(selectedInterval)) {
      return res.status(400).json({ error: 'Invalid interval. Must be daily or weekly' });
    }
    
    const trends = await getWellnessTrends(req.user._id, startDate, endDate, selectedInterval);
    
    res.json(trends);
  } catch (error) {
    console.error('Error getting wellness trends:', error);
    res.status(500).json({ error: 'Failed to get wellness trends' });
  }
};

// Get quick stats for dashboard
const getQuickStats = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    // Get today's summary
    const todaySummary = await getWellnessSummary(req.user._id, today, today);
    
    // Get this week's summary
    const thisWeekSummary = await getWellnessSummary(req.user._id, thisWeekStart, today);
    
    // Get last week's summary for comparison
    const lastWeekSummary = await getWellnessSummary(req.user._id, lastWeekStart, lastWeekEnd);
    
    const stats = {
      today: {
        wellnessScore: todaySummary.byDay[0]?.wellnessScore || 0,
        totalMinutes: todaySummary.byDay[0]?.totalMinutes || 0,
        topCategories: Object.values(todaySummary.byCategory)
          .sort((a, b) => b.totalMinutes - a.totalMinutes)
          .slice(0, 3)
      },
      thisWeek: {
        wellnessScore: thisWeekSummary.wellnessScore,
        totalMinutes: thisWeekSummary.totalMinutes,
        averagePerDay: Math.round(thisWeekSummary.totalMinutes / (thisWeekSummary.totalDays || 1)),
        activeDays: thisWeekSummary.totalDays
      },
      comparison: {
        wellnessScoreChange: thisWeekSummary.wellnessScore - lastWeekSummary.wellnessScore,
        minutesChange: thisWeekSummary.totalMinutes - lastWeekSummary.totalMinutes,
        activeDaysChange: thisWeekSummary.totalDays - lastWeekSummary.totalDays
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting quick stats:', error);
    res.status(500).json({ error: 'Failed to get quick stats' });
  }
};

// Get category breakdown for a specific period
const getCategoryBreakdown = async (req, res) => {
  try {
    const { start, end, type } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const options = {
      groupBy: 'category',
      includeDrains: type !== 'wellness-only'
    };
    
    const summary = await getWellnessSummary(req.user._id, startDate, endDate, options);
    
    // Format for charts/visualization
    const breakdown = {
      categories: Object.values(summary.byCategory).map(category => ({
        name: category.name,
        type: category.type,
        color: category.color,
        minutes: category.totalMinutes,
        percentage: summary.totalMinutes > 0 ? 
          Math.round((category.totalMinutes / summary.totalMinutes) * 100) : 0,
        averagePerDay: category.averagePerDay,
        daysActive: category.daysActive
      })),
      totals: {
        wellnessMinutes: Object.values(summary.byCategory)
          .filter(cat => cat.type === 'wellness')
          .reduce((sum, cat) => sum + cat.totalMinutes, 0),
        drainMinutes: Object.values(summary.byCategory)
          .filter(cat => cat.type === 'drain')
          .reduce((sum, cat) => sum + cat.totalMinutes, 0),
        totalMinutes: summary.totalMinutes,
        wellnessScore: summary.wellnessScore
      }
    };
    
    res.json(breakdown);
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    res.status(500).json({ error: 'Failed to get category breakdown' });
  }
};

module.exports = {
  getWellnessSummaryController,
  getWellnessTrendsController,
  getQuickStats,
  getCategoryBreakdown
}; 