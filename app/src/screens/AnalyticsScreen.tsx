import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WellnessSummary, QuickStats, CategorySummary, ActivitySummary, DaySummary } from '../types';
import api from '../services/api';

const AnalyticsScreen: React.FC = () => {
  const [summary, setSummary] = useState<WellnessSummary | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const [summaryData, quickStatsData] = await Promise.all([
        api.summary.getWellnessSummary(startDateStr, endDateStr),
        api.summary.getQuickStats(),
      ]);
      setSummary(summaryData);
      setQuickStats(quickStatsData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return '#10b981';
    if (score < 0) return '#ef4444';
    return '#64748b';
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeButtons}>
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  timeRange === range && styles.timeRangeButtonTextActive
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats Overview */}
        {quickStats && (
          <View style={styles.overviewContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatMinutes(quickStats.todayMinutes)}</Text>
                <Text style={styles.statLabel}>Today</Text>
                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(quickStats.todayScore) }]}>
                  <Text style={styles.scoreText}>
                    {quickStats.todayScore > 0 ? '+' : ''}{quickStats.todayScore}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatMinutes(quickStats.weekMinutes)}</Text>
                <Text style={styles.statLabel}>This Week</Text>
                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(quickStats.weekScore) }]}>
                  <Text style={styles.scoreText}>
                    {quickStats.weekScore > 0 ? '+' : ''}{quickStats.weekScore}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatMinutes(quickStats.monthMinutes)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(quickStats.monthScore) }]}>
                  <Text style={styles.scoreText}>
                    {quickStats.monthScore > 0 ? '+' : ''}{quickStats.monthScore}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Wellness Score */}
        {summary && (
          <View style={styles.wellnessScoreContainer}>
            <Text style={styles.sectionTitle}>Wellness Score</Text>
            <View style={styles.wellnessScoreCard}>
              <Text style={[styles.wellnessScoreValue, { color: getScoreColor(summary.wellnessScore) }]}>
                {summary.wellnessScore > 0 ? '+' : ''}{summary.wellnessScore}
              </Text>
              <Text style={styles.wellnessScoreLabel}>
                {summary.wellnessScore > 0 ? 'Positive' : summary.wellnessScore < 0 ? 'Needs Improvement' : 'Neutral'}
              </Text>
              <View style={styles.wellnessBreakdown}>
                <Text style={styles.breakdownText}>
                  Total: {formatMinutes(summary.totalMinutes)} over {summary.totalDays} days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {summary && (
          <View style={styles.categoryContainer}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <View style={styles.categoriesGrid}>
              {Object.values(summary.byCategory).map((category: CategorySummary) => (
                <View key={category.name} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryType}>{category.type}</Text>
                  </View>
                  
                  <Text style={styles.categoryTime}>{formatMinutes(category.totalMinutes)}</Text>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill,
                          { 
                            width: `${getProgressPercentage(category.totalMinutes, summary.totalMinutes)}%`,
                            backgroundColor: category.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {Math.round(getProgressPercentage(category.totalMinutes, summary.totalMinutes))}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Activities */}
        {summary && (
          <View style={styles.activitiesContainer}>
            <Text style={styles.sectionTitle}>Top Activities</Text>
            <View style={styles.activitiesList}>
              {Object.values(summary.byActivity).slice(0, 5).map((activity: ActivitySummary, index: number) => (
                <View key={activity.name} style={styles.activityItem}>
                  <View style={styles.activityRank}>
                    <Text style={styles.activityRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityTime}>{formatMinutes(activity.totalMinutes)}</Text>
                  </View>
                  <Text style={styles.activityCount}>{activity.daysActive} days</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Daily Trends */}
        {summary && (
          <View style={styles.trendsContainer}>
            <Text style={styles.sectionTitle}>Daily Trends</Text>
            <View style={styles.trendsList}>
              {summary.byDay.slice(-7).map((day: DaySummary, index: number) => (
                <View key={day.date} style={styles.trendItem}>
                  <Text style={styles.trendDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.trendTime}>{formatMinutes(day.totalMinutes)}</Text>
                  <View style={[styles.trendScore, { backgroundColor: getScoreColor(day.wellnessScore) }]}>
                    <Text style={styles.trendScoreText}>
                      {day.wellnessScore > 0 ? '+' : ''}{day.wellnessScore}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  timeRangeContainer: {
    marginBottom: 24,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#000000',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#FFFFFF',
  },
  overviewContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 8,
  },
  scoreIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  wellnessScoreContainer: {
    marginBottom: 24,
  },
  wellnessScoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  wellnessScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wellnessScoreLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  wellnessBreakdown: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: '#333333',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  categoryType: {
    fontSize: 12,
    color: '#333333',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  categoryTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  activitiesContainer: {
    marginBottom: 24,
  },
  activitiesList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityRankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#333333',
  },
  activityCount: {
    fontSize: 12,
    color: '#333333',
  },
  trendsContainer: {
    marginBottom: 24,
  },
  trendsList: {
    gap: 8,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trendDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  trendTime: {
    fontSize: 14,
    color: '#333333',
    marginRight: 12,
  },
  trendScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  trendScoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AnalyticsScreen; 