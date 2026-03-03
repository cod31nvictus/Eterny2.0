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
  TouchableOpacity,
  Image,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAuth } from '../contexts/AuthContext';
import { useToDoContext } from '../contexts/ToDoContext';
import { useHabitContext } from '../contexts/HabitContext';
import ToDoItem from '../components/ToDoItem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/environment';

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
  activities: ActivityInBlock[];
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
  const { todos, fetchTodos, toggleComplete, deleteTodo } = useToDoContext();
  const { 
    todayHabits, 
    fetchTodayHabits, 
    toggleHabitTracking,
    loading: habitsLoading 
  } = useHabitContext();
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [allTimeBlocks, setAllTimeBlocks] = useState<any[]>([]);
  const [upNextExpanded, setUpNextExpanded] = useState(false);

  // Static background image - no carousel
  const staticBackgroundImage = require('../assets/images/backgrounds/eastman-childs-CEtIM994vaI-unsplash.jpg');

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
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateTimeRemaining();
    }, 1000);

    fetchTodaySchedule();
    fetchTodos();
    fetchTodayHabits(); // Fetch today's habits

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Fetch today's todos
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Handle habit tracking
  const handleHabitToggle = async (habitId: string) => {
    const today = new Date();
    const dateString = getLocalDateString(today);
    await toggleHabitTracking(habitId, dateString);
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchTodaySchedule(),
      fetchTodos(),
      fetchTodayHabits()
    ]).then(() => {
      setRefreshing(false);
    });
  };

  // Todo handlers
  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id);
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
  };

  // Swipeable Habit Item Component
  const SwipeableHabitItem: React.FC<{
    habit: any;
    onToggle: () => void;
  }> = ({ habit, onToggle }) => {
    const translateX = useState(new Animated.Value(0))[0];
    const [localCompleted, setLocalCompleted] = useState(habit.completedToday);

    useEffect(() => {
      setLocalCompleted(habit.completedToday);
    }, [habit.completedToday]);

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      const { translationX, state } = event.nativeEvent;
      
      if (state === 5) { // ENDED
        if (Math.abs(translationX) > 50) { // Reduced threshold to 50px (20-25% of screen)
          // Instantly update UI
          setLocalCompleted(!localCompleted);
          
          // Animate card
          Animated.timing(translateX, {
            toValue: translationX > 0 ? 300 : -300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Then sync with backend
            onToggle();
            resetPosition();
          });
        } else {
          resetPosition();
        }
      }
    };

    const resetPosition = () => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={styles.swipeContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View 
            style={[
              styles.habitItem,
              { transform: [{ translateX }] }
            ]}
          >
            <View style={styles.habitInfo}>
              <View style={styles.habitNameRow}>
                <Text style={styles.habitName}>{habit.name}</Text>
                {localCompleted && (
                  <View style={styles.completedIcon}>
                    <Text style={styles.completedCheckmark}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.habitStreak}>
                Current streak: {habit.currentStreak} days
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
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

  // Helper function to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        <ImageBackground
          source={staticBackgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Clock Overlay */}
        <View style={styles.clockOverlay}>
          <Text style={styles.clockText}>{formatCurrentTime(currentTime)}</Text>
        </View>
      </View>

      {/* Quick Access Menu */}
      <View style={styles.quickAccessContainer}>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => navigation.navigate('MenuBuilder')}
          >
            <View style={styles.quickAccessIcon}>
              <Image 
                source={require('../assets/images/Menu Builder.png')} 
                style={styles.quickAccessIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAccessText}>Meal Builder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => navigation.navigate('HabitTracker')}
          >
            <View style={styles.quickAccessIcon}>
              <Image 
                source={require('../assets/images/Habit Tracker.png')} 
                style={styles.quickAccessIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAccessText}>Habit Tracker</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={() => navigation.navigate('ToDo')}
          >
            <View style={styles.quickAccessIcon}>
              <Image 
                source={require('../assets/images/To Do.png')} 
                style={styles.quickAccessIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.quickAccessText}>To Do</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Now Section */}
        {currentBlock && currentBlock.activities ? (
          <View>
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

            {currentBlock.activities.map((activity, index) => (
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
            ))}

            {/* Up Next Section - Collapsible */}
            {nextBlocks.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader}
                  onPress={() => setUpNextExpanded(!upNextExpanded)}
                >
                  <Text style={styles.sectionTitle}>Up Next</Text>
                  <Text style={styles.expandIcon}>{upNextExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                
                {upNextExpanded && nextBlocks.map((block, blockIndex) => 
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
          </View>
        ) : (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Now</Text>
              </View>
            </View>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No scheduled activity right now</Text>
              <Text style={styles.emptyStateSubtext}>Enjoy your free time!</Text>
            </View>

            {/* Up Next Section - Collapsible */}
            {nextBlocks.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader}
                  onPress={() => setUpNextExpanded(!upNextExpanded)}
                >
                  <Text style={styles.sectionTitle}>Up Next</Text>
                  <Text style={styles.expandIcon}>{upNextExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                
                {upNextExpanded && nextBlocks.map((block, blockIndex) => 
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
          </View>
        )}

        {/* To-Do Section */}
        {todos.filter(todo => !todo.completed).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
            </View>
            
            {todos
              .filter(todo => !todo.completed)
              .map((todo) => (
                <ToDoItem
                  key={todo._id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                />
              ))
            }
          </View>
        )}

        {/* Today's Habits Section */}
        {todayHabits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Habits</Text>
            </View>
            
            {todayHabits.map((habit) => (
              <SwipeableHabitItem
                key={habit._id}
                habit={habit}
                onToggle={() => handleHabitToggle(habit._id)}
              />
            ))}
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
    minHeight: 72,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
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
  quickAccessContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickAccessButton: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  quickAccessIcon: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessIconImage: {
    width: 32,
    height: 32,
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  habitCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  habitSubtitle: {
    fontSize: 14,
    color: '#333333',
  },
  swipeContainer: {
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  habitStreak: {
    fontSize: 14,
    color: '#333333',
  },
  completedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
});

export default NowScreen; 