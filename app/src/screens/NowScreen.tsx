import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/environment';

// Background images
const backgroundImages = [
  require('../assets/images/backgrounds/shubham-dhage-NsPqV-WsZYY-unsplash.jpg'),
  require('../assets/images/backgrounds/akshar-dave-BcvPlibJyo0-unsplash.jpg'),
  require('../assets/images/backgrounds/tareq-ajalyakin-Ig1YHgmJrnQ-unsplash.jpg'),
  require('../assets/images/backgrounds/elvis-bekmanis-g9qwoPiS0nY-unsplash.jpg'),
  require('../assets/images/backgrounds/brennan-burling-ay53qag90W8-unsplash.jpg'),
  require('../assets/images/backgrounds/eastman-childs-CEtIM994vaI-unsplash.jpg'),
  require('../assets/images/backgrounds/ben-arthur-Q9Ylf-AAD04-unsplash.jpg'),
];

interface ActivityInBlock {
  _id: string;
  name: string;
  wellnessTags: string[];
  blockName?: string;
}

interface Block {
  _id: string;
  activityType: {
    name: string;
    wellnessTags: string[];
  };
  startTime: string;
  endTime: string;
  notes?: string;
  activities?: ActivityInBlock[];
}

interface PlannedDay {
  _id: string;
  date: string;
  template: {
    name: string;
    blocks: Block[];
  };
}

const NowScreen = ({ navigation }: any) => {
  console.log('🎯 NowScreen component is loading with Galileo design adaptation!');
  const { user } = useAuth();
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allTimeBlocks, setAllTimeBlocks] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Background image rotation state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const slideAnim = useState(new Animated.Value(0))[0];

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const timeStringToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Ended';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `Continues for another ${hours}h ${mins}m`;
    }
    return `Continues for another ${mins}m`;
  };

  const formatTimeRemainingShort = (minutes: number) => {
    if (minutes <= 0) return '(ended)';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `(${hours}h ${mins}m remaining)`;
    }
    return `(${mins}m remaining)`;
  };

  const formatTimeUntilStart = (minutes: number) => {
    if (minutes <= 0) return 'Starting now';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `Starts in ${hours}h ${mins}m`;
    }
    return `Starts in ${mins}m`;
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTimeBlock = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getRandomImageIndex = (currentIndex: number) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * backgroundImages.length);
    } while (newIndex === currentIndex);
    return newIndex;
  };

  const transitionToNextImage = () => {
    const newIndex = getRandomImageIndex(currentImageIndex);
    setNextImageIndex(newIndex);

    // Slide animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // After animation completes, reset and update current image
      setCurrentImageIndex(newIndex);
      slideAnim.setValue(0);
    });
  };

  const calculateActivityContinuation = (activityName: string, currentEndTime: string, allTimeBlocks: any[]) => {
    const currentTime = getCurrentTime();
    const currentEndMinutes = timeStringToMinutes(currentEndTime);
    
    let remainingMinutes = currentEndMinutes - currentTime;
    
    const sortedBlocks = allTimeBlocks.sort((a, b) => 
      timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
    );
    
    const currentBlockIndex = sortedBlocks.findIndex(block => {
      const startTime = timeStringToMinutes(block.startTime);
      const endTime = timeStringToMinutes(block.endTime);
      return currentTime >= startTime && currentTime < endTime;
    });
    
    if (currentBlockIndex === -1) return remainingMinutes;
    
    for (let i = currentBlockIndex + 1; i < sortedBlocks.length; i++) {
      const nextBlock = sortedBlocks[i];
      const prevBlock = sortedBlocks[i - 1];
      
      if (nextBlock.startTime !== prevBlock.endTime) {
        break;
      }
      
      const hasMatchingActivity = nextBlock.activities.some((activity: any) => 
        activity.blockName === activityName || activity.name === activityName
      );
      
      if (!hasMatchingActivity) {
        break;
      }
      
      const blockDuration = timeStringToMinutes(nextBlock.endTime) - timeStringToMinutes(nextBlock.startTime);
      remainingMinutes += blockDuration;
    }
    
    return remainingMinutes;
  };

  const fetchTodaySchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `${config.API_BASE_URL}/calendar/${today}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const timeBlocksMap = new Map<string, ActivityInBlock[]>();
        
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
                  timeBlocksMap.get(key)!.push(activity);
                } else {
                  timeBlocksMap.set(key, [activity]);
                }
              });
            }
          });
        }
        
        const allTimeBlocks = Array.from(timeBlocksMap.entries()).map(([timeKey, activities]) => {
          const [startTime, endTime] = timeKey.split('-');
          return {
            startTime,
            endTime,
            activities
          };
        });
        
        setAllTimeBlocks(allTimeBlocks);
        
        const sortedBlocks = allTimeBlocks.sort((a, b) => 
          timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
        );
        
        const currentTime = getCurrentTime();
        let currentTimeBlock = null;
        let upcomingBlocks: any[] = [];
        
        for (let i = 0; i < sortedBlocks.length; i++) {
          const block = sortedBlocks[i];
          const startTime = timeStringToMinutes(block.startTime);
          const endTime = timeStringToMinutes(block.endTime);
          
          if (currentTime >= startTime && currentTime < endTime) {
            currentTimeBlock = block;
            if (i + 1 < sortedBlocks.length) {
              upcomingBlocks = [sortedBlocks[i + 1]];
            }
            break;
          }
          
          if (currentTime < startTime && !currentTimeBlock) {
            upcomingBlocks = [block];
            break;
          }
        }
        
        if (currentTimeBlock) {
          const currentBlock: Block = {
            _id: currentTimeBlock.activities[0]._id,
            activityType: {
              name: currentTimeBlock.activities[0].name,
              wellnessTags: currentTimeBlock.activities[0].wellnessTags
            },
            startTime: currentTimeBlock.startTime,
            endTime: currentTimeBlock.endTime,
            activities: currentTimeBlock.activities
          };
          setCurrentBlock(currentBlock);
        } else {
          setCurrentBlock(null);
        }
        
        const nextBlocks: Block[] = upcomingBlocks.map(block => ({
          _id: block.activities[0]._id,
          activityType: {
            name: block.activities[0].name,
            wellnessTags: block.activities[0].wellnessTags
          },
          startTime: block.startTime,
          endTime: block.endTime,
          activities: block.activities
        }));
        
        setNextBlocks(nextBlocks);
        
        console.log('🎯 NowScreen: Current activities:', currentTimeBlock?.activities.length || 0);
        console.log('🎯 NowScreen: Upcoming blocks:', upcomingBlocks.length);
      } else {
        console.error('🎯 NowScreen: Failed to fetch schedule:', response.status);
        setCurrentBlock(null);
        setNextBlocks([]);
      }
    } catch (error) {
      console.error('🎯 NowScreen: Error fetching today schedule:', error);
      setCurrentBlock(null);
      setNextBlocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateTimeRemaining = () => {
    if (currentBlock) {
      const currentTime = getCurrentTime();
      const endTime = timeStringToMinutes(currentBlock.endTime);
      const remaining = endTime - currentTime;
      setTimeRemaining(formatTimeRemaining(remaining));
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateTimeRemaining();
      
      const now = new Date();
      if (now.getSeconds() === 0) {
        fetchTodaySchedule();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBlock]);

  // Background image rotation effect
  useEffect(() => {
    const imageRotationInterval = setInterval(() => {
      transitionToNextImage();
    }, 15000); // Change image every 15 seconds

    return () => clearInterval(imageRotationInterval);
  }, [currentImageIndex, nextImageIndex]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaySchedule();
  };

  const ActivityCard = ({ activity, isUpcoming = false, timeInfo }: { 
    activity: any, 
    isUpcoming?: boolean, 
    timeInfo: string 
  }) => {
    // Determine if we should show activity type in brackets
    const shouldShowActivityType = activity.name && activity.blockName && 
      activity.name.toLowerCase() !== activity.blockName.toLowerCase();
    
    const getActivityTitle = () => {
      const baseName = activity.blockName || activity.name;
      if (shouldShowActivityType) {
        return `${baseName} (${activity.name})`;
      }
      return baseName;
    };

    return (
      <View style={styles.activityCard}>
        <View style={styles.activityIcon}>
          <Text style={styles.bulletPoint}>●</Text>
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>
            {getActivityTitle()}
          </Text>
          <Text style={styles.activitySubtitle}>
            {activity.wellnessTags?.[0] || 'General'}
          </Text>
          <Text style={styles.timeInfo}>
            {timeInfo}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading current schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image Container with Clock */}
      <View style={styles.backgroundImageContainer}>
        {/* Current Image */}
        <Animated.View 
          style={[
            styles.backgroundImageLayer,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100], // Slide current image to the left
                  }),
                },
              ],
            },
          ]}
        >
          <ImageBackground
            source={backgroundImages[currentImageIndex]}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Next Image (slides in from right) */}
        <Animated.View 
          style={[
            styles.backgroundImageLayer,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0], // Slide next image from right to center
                  }),
                },
              ],
            },
          ]}
        >
          <ImageBackground
            source={backgroundImages[nextImageIndex]}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>
        
        {/* Clock Overlay */}
        <View style={styles.clockOverlay}>
          <Text style={styles.clockText}>{formatCurrentTime(currentTime)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Now Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Now</Text>
          </View>
          {currentBlock && (
            <View style={styles.timeInfoContainer}>
              <Text style={styles.timeBlockText}>
                {formatTimeBlock(currentBlock.startTime, currentBlock.endTime)}
              </Text>
              <Text style={styles.timeRemainingText}>
                {formatTimeRemainingShort(
                  timeStringToMinutes(currentBlock.endTime) - getCurrentTime()
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Now Section */}
        {currentBlock && currentBlock.activities ? (
          currentBlock.activities.map((activity, index) => (
            <ActivityCard
              key={index}
              activity={activity}
              timeInfo={formatTimeRemaining(
                calculateActivityContinuation(
                  activity.blockName || activity.name,
                  currentBlock.endTime,
                  allTimeBlocks
                )
              )}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No scheduled activity right now</Text>
            <Text style={styles.emptyStateSubtext}>Enjoy your free time!</Text>
          </View>
        )}

        {/* Up Next Section */}
        {nextBlocks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Up Next</Text>
            </View>
            
            {nextBlocks.map((block, blockIndex) => 
              block.activities?.map((activity, activityIndex) => {
                const currentTime = getCurrentTime();
                const startTime = timeStringToMinutes(block.startTime);
                const timeUntilStart = startTime - currentTime;
                
                return (
                  <ActivityCard
                    key={`${blockIndex}-${activityIndex}`}
                    activity={activity}
                    isUpcoming={true}
                    timeInfo={formatTimeUntilStart(timeUntilStart)}
                  />
                );
              })
            )}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  backgroundImageContainer: {
    minHeight: 218,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  clockText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -0.015,
  },
  timeBlockText: {
    fontSize: 14,
    color: '#333333',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 72,
    backgroundColor: '#FFFFFF',
  },
  activityIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletPoint: {
    fontSize: 24,
    color: '#000000',
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  timeInfo: {
    fontSize: 14,
    color: '#333333',
    marginTop: 2,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#333333',
  },
  timeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#333333',
    marginLeft: 8,
  },
});

export default NowScreen; 