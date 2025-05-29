import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ActivityInBlock {
  _id: string;
  name: string;
  wellnessTags: string[];
  blockName?: string;
}

interface TimeBlock {
  startTime: string;
  endTime: string;
  activities: ActivityInBlock[];
}

interface ScheduleBlock {
  startTime: string;
  endTime: string;
  activities: ActivityInBlock[];
  hasActivity: boolean;
  isActive: boolean;
  isPast: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const TodayScreen = () => {
  const { user } = useAuth();
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const formatTime = (time: string) => {
    // Remove seconds if present and format as HH:MM
    const timeParts = time.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const timeStringToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getCurrentTimeInMinutes = () => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  const isBlockActive = (startTime: string, endTime: string) => {
    const currentMinutes = getCurrentTimeInMinutes();
    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = timeStringToMinutes(endTime);
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const isBlockPast = (endTime: string) => {
    const currentMinutes = getCurrentTimeInMinutes();
    const endMinutes = timeStringToMinutes(endTime);
    return currentMinutes >= endMinutes;
  };

  const getWellnessColor = (tags: string[]) => {
    const colorMap: { [key: string]: string } = {
      'Physical Health': '#10b981',
      'Mental Health': '#6366f1',
      'Social': '#f59e0b',
      'Spiritual': '#8b5cf6',
      'Intellectual': '#06b6d4',
      'Emotional': '#ef4444',
      'Environmental': '#84cc16',
      'Occupational': '#f97316',
    };

    for (const tag of tags) {
      if (colorMap[tag]) {
        return colorMap[tag];
      }
    }
    return '#64748b';
  };

  const generateFullDaySchedule = (timeBlocks: TimeBlock[]) => {
    // Start from 6:00 AM by default
    const startTime = '06:00';
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const schedule: ScheduleBlock[] = [];
    const currentTime = new Date(startDate);
    
    // Generate 96 time blocks (24 hours * 4 blocks per hour)
    for (let i = 0; i < 96; i++) {
      const blockStartTime = new Date(currentTime);
      const blockEndTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
      
      const startTimeStr = blockStartTime.toTimeString().slice(0, 5);
      const endTimeStr = blockEndTime.toTimeString().slice(0, 5);
      
      // Find all activities for this time block
      const activitiesForBlock = timeBlocks.filter(block => 
        block.startTime === startTimeStr
      );
      
      const activities: ActivityInBlock[] = [];
      activitiesForBlock.forEach(block => {
        activities.push(...block.activities);
      });
      
      const hasActivity = activities.length > 0;
      const isActive = isBlockActive(startTimeStr, endTimeStr);
      const isPast = isBlockPast(endTimeStr);
      
      schedule.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        activities,
        hasActivity,
        isActive,
        isPast
      });
      
      currentTime.setTime(currentTime.getTime() + 15 * 60 * 1000);
    }
    
    return schedule;
  };

  const fetchTodaySchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://10.0.2.2:5001/api/calendar/${today}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Extract and group time blocks from all templates
        const timeBlocksMap = new Map<string, TimeBlock>();
        
        if (data.templates && data.templates.length > 0) {
          data.templates.forEach((templateData: any) => {
            if (templateData.template && templateData.template.timeBlocks) {
              templateData.template.timeBlocks.forEach((timeBlock: any) => {
                const key = `${timeBlock.startTime}-${timeBlock.endTime}`;
                
                const activity: ActivityInBlock = {
                  _id: timeBlock._id,
                  name: timeBlock.activityTypeId.name,
                  wellnessTags: timeBlock.activityTypeId.wellnessTagIds?.map((tag: any) => tag.name) || [],
                  blockName: timeBlock.blockName
                };
                
                if (timeBlocksMap.has(key)) {
                  timeBlocksMap.get(key)!.activities.push(activity);
                } else {
                  timeBlocksMap.set(key, {
                    startTime: timeBlock.startTime,
                    endTime: timeBlock.endTime,
                    activities: [activity]
                  });
                }
              });
            }
          });
        }
        
        const timeBlocks = Array.from(timeBlocksMap.values());
        const fullSchedule = generateFullDaySchedule(timeBlocks);
        
        // Only show blocks that have activities
        const blocksWithActivities = fullSchedule.filter(block => block.hasActivity);
        setScheduleBlocks(blocksWithActivities);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Update the schedule blocks with new active/past status
      setScheduleBlocks(prevBlocks => 
        prevBlocks.map(block => ({
          ...block,
          isActive: isBlockActive(block.startTime, block.endTime),
          isPast: isBlockPast(block.endTime)
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaySchedule();
  };

  const renderScheduleBlock = (block: ScheduleBlock, index: number) => {
    return (
      <View 
        key={index} 
        style={[
          styles.scheduleBlock,
          block.isPast && styles.scheduleBlockPast,
          block.isActive && styles.scheduleBlockCurrent,
          !block.isPast && !block.isActive && styles.scheduleBlockUpcoming
        ]}
      >
        <Text style={[
          styles.scheduleTime,
          block.isPast && styles.scheduleTimePast,
          block.isActive && styles.scheduleTimeCurrent,
          !block.isPast && !block.isActive && styles.scheduleTimeUpcoming
        ]}>
          {formatTime(block.startTime)} - {formatTime(block.endTime)}
        </Text>
        
        {block.activities.length > 0 && (
          <View style={styles.activitiesContainer}>
            {block.activities.map((activity, activityIndex) => {
              const wellnessColor = getWellnessColor(activity.wellnessTags);
              return (
                <View 
                  key={activityIndex} 
                  style={[
                    styles.activityTag,
                    { 
                      backgroundColor: block.isPast 
                        ? '#f3f4f6' 
                        : block.isActive 
                          ? `${wellnessColor}30`
                          : `${wellnessColor}15`,
                      borderColor: block.isPast 
                        ? '#d1d5db' 
                        : block.isActive 
                          ? wellnessColor
                          : `${wellnessColor}80`
                    }
                  ]}
                >
                  <Text style={[
                    styles.activityTagText,
                    { 
                      color: block.isPast 
                        ? '#9ca3af' 
                        : block.isActive 
                          ? wellnessColor
                          : `${wellnessColor}CC`
                    }
                  ]}>
                    {activity.blockName || activity.name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        
        {block.isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>● ACTIVE NOW</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading today's schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Today's Schedule</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {scheduleBlocks.length > 0 ? (
          <View style={styles.scheduleContainer}>
            {scheduleBlocks.map((block, index) => renderScheduleBlock(block, index))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities scheduled for today</Text>
            <Text style={styles.emptySubtext}>
              Create a template and assign it to today to see your schedule
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  scheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleBlock: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  scheduleBlockPast: {
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  scheduleBlockCurrent: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleBlockUpcoming: {
    backgroundColor: '#fafbfc',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  scheduleTimeCurrent: {
    color: '#0ea5e9',
    fontWeight: '700',
  },
  scheduleTimePast: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  scheduleTimeUpcoming: {
    color: '#64748b',
    fontWeight: '400',
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  activityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activityTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeIndicator: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  activeIndicatorText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default TodayScreen; 