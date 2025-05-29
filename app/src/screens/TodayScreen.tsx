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

interface Block {
  _id: string;
  activityType: {
    name: string;
    wellnessTags: string[];
  };
  startTime: string;
  endTime: string;
  notes?: string;
  blockName?: string;
}

interface PlannedDay {
  _id: string;
  date: string;
  template: {
    name: string;
    blocks: Block[];
  };
}

const { width: screenWidth } = Dimensions.get('window');

const TodayScreen = () => {
  const { user } = useAuth();
  const [todayBlocks, setTodayBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timeStringToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTimeString = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentTimeInMinutes = () => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  const isBlockActive = (block: Block) => {
    const currentMinutes = getCurrentTimeInMinutes();
    const startMinutes = timeStringToMinutes(block.startTime);
    const endMinutes = timeStringToMinutes(block.endTime);
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const isBlockPast = (block: Block) => {
    const currentMinutes = getCurrentTimeInMinutes();
    const endMinutes = timeStringToMinutes(block.endTime);
    return currentMinutes >= endMinutes;
  };

  const getBlockDuration = (block: Block) => {
    const startMinutes = timeStringToMinutes(block.startTime);
    const endMinutes = timeStringToMinutes(block.endTime);
    const duration = endMinutes - startMinutes;
    
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getWellnessColor = (tags: string[]) => {
    // Simple color mapping based on wellness tags
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
    return '#64748b'; // Default gray
  };

  const fetchTodaySchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://10.0.2.2:5001/api/calendar?start=${today}&end=${today}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const todayPlan: PlannedDay | undefined = data.find((plan: PlannedDay) => 
          plan.date === today
        );

        if (todayPlan && todayPlan.template.blocks) {
          const sortedBlocks = todayPlan.template.blocks.sort((a, b) => 
            timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
          );
          setTodayBlocks(sortedBlocks);
        } else {
          setTodayBlocks([]);
        }
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
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaySchedule();
  };

  const renderTimelineBlock = (block: Block, index: number) => {
    const isActive = isBlockActive(block);
    const isPast = isBlockPast(block);
    const wellnessColor = getWellnessColor(block.activityType.wellnessTags);

    return (
      <View key={block._id} style={styles.timelineItem}>
        <View style={styles.timeColumn}>
          <Text style={[styles.timeText, isPast && styles.pastTimeText]}>
            {block.startTime}
          </Text>
          <View style={[styles.timeDot, { backgroundColor: wellnessColor }]} />
          <Text style={[styles.timeText, isPast && styles.pastTimeText]}>
            {block.endTime}
          </Text>
        </View>
        
        <View style={styles.blockColumn}>
          <View style={[
            styles.blockCard,
            isActive && styles.activeBlock,
            isPast && styles.pastBlock,
            { borderLeftColor: wellnessColor }
          ]}>
            <View style={styles.blockHeader}>
              <Text style={[
                styles.blockTitle,
                isActive && styles.activeBlockTitle,
                isPast && styles.pastBlockTitle
              ]}>
                {block.blockName || block.activityType.name}
              </Text>
              <Text style={[
                styles.blockDuration,
                isPast && styles.pastText
              ]}>
                {getBlockDuration(block)}
              </Text>
            </View>
            
            {block.notes && (
              <Text style={[
                styles.blockNotes,
                isPast && styles.pastText
              ]}>
                {block.notes}
              </Text>
            )}
            
            {block.activityType.wellnessTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {block.activityType.wellnessTags.map((tag, tagIndex) => (
                  <View 
                    key={tagIndex} 
                    style={[
                      styles.tag,
                      { backgroundColor: `${wellnessColor}20` },
                      isPast && styles.pastTag
                    ]}
                  >
                    <Text style={[
                      styles.tagText,
                      { color: wellnessColor },
                      isPast && styles.pastTagText
                    ]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {isActive && (
              <View style={styles.activeIndicator}>
                <Text style={styles.activeIndicatorText}>ACTIVE NOW</Text>
              </View>
            )}
          </View>
        </View>
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

        {todayBlocks.length > 0 ? (
          <View style={styles.timeline}>
            {todayBlocks.map((block, index) => renderTimelineBlock(block, index))}
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
  timeline: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 80,
    alignItems: 'center',
    paddingTop: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pastTimeText: {
    color: '#9ca3af',
  },
  timeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  blockColumn: {
    flex: 1,
    marginLeft: 16,
  },
  blockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeBlock: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  pastBlock: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  activeBlockTitle: {
    color: '#0ea5e9',
  },
  pastBlockTitle: {
    color: '#9ca3af',
  },
  blockDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
  },
  blockNotes: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  pastText: {
    color: '#9ca3af',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  pastTag: {
    backgroundColor: '#f3f4f6',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pastTagText: {
    color: '#9ca3af',
  },
  activeIndicator: {
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  activeIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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