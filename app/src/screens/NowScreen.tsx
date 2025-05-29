import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  console.log('🎯 NowScreen component is loading with navigation fixes!');
  const { user, logout } = useAuth();
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [nextBlock, setNextBlock] = useState<Block | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
  };

  const timeStringToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTimeString = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Ended';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  const calculateActivityContinuation = async (activityName: string, currentEndTime: string) => {
    // This would need to fetch all time blocks and calculate how long this activity continues
    // For now, return a placeholder - in a real implementation, you'd check subsequent time blocks
    return "2h 30m"; // Placeholder
  };

  const formatContinuationDuration = (minutes: number) => {
    if (minutes <= 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `Continues for another ${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `Continues for another ${hours}h`;
    } else {
      return `Continues for another ${mins}m`;
    }
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
        
        // Convert to time blocks with activities
        const allTimeBlocks = Array.from(timeBlocksMap.entries()).map(([timeKey, activities]) => {
          const [startTime, endTime] = timeKey.split('-');
          return {
            startTime,
            endTime,
            activities
          };
        });
        
        // Sort blocks by start time
        const sortedBlocks = allTimeBlocks.sort((a, b) => 
          timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
        );
        
        // Find current and next time blocks based on current time
        const currentTime = getCurrentTime();
        let currentTimeBlock = null;
        let nextTimeBlock = null;
        
        for (let i = 0; i < sortedBlocks.length; i++) {
          const block = sortedBlocks[i];
          const startTime = timeStringToMinutes(block.startTime);
          const endTime = timeStringToMinutes(block.endTime);
          
          // Check if this time block is currently active
          if (currentTime >= startTime && currentTime < endTime) {
            currentTimeBlock = block;
            // Find the next time block after this one
            if (i + 1 < sortedBlocks.length) {
              nextTimeBlock = sortedBlocks[i + 1];
            }
            break;
          }
          
          // If we haven't found a current block and this block is in the future
          if (currentTime < startTime && !nextTimeBlock) {
            nextTimeBlock = block;
            break;
          }
        }
        
        // Convert current time block to Block format for compatibility
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
        
        // Convert next time block to Block format for compatibility
        if (nextTimeBlock) {
          const nextBlock: Block = {
            _id: nextTimeBlock.activities[0]._id,
            activityType: {
              name: nextTimeBlock.activities[0].name,
              wellnessTags: nextTimeBlock.activities[0].wellnessTags
            },
            startTime: nextTimeBlock.startTime,
            endTime: nextTimeBlock.endTime,
            activities: nextTimeBlock.activities
          };
          setNextBlock(nextBlock);
        } else {
          setNextBlock(null);
        }
        
        console.log('🎯 NowScreen: Current time block activities:', currentTimeBlock?.activities.length || 0);
        console.log('🎯 NowScreen: Next time block:', nextTimeBlock?.startTime || 'None');
      } else {
        console.error('🎯 NowScreen: Failed to fetch schedule:', response.status);
        setCurrentBlock(null);
        setNextBlock(null);
      }
    } catch (error) {
      console.error('🎯 NowScreen: Error fetching today schedule:', error);
      setCurrentBlock(null);
      setNextBlock(null);
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
      updateTimeRemaining();
      
      // Refresh schedule every minute to check for new blocks
      const now = new Date();
      if (now.getSeconds() === 0) {
        fetchTodaySchedule();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBlock]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaySchedule();
  };

  const showConfigMenu = () => {
    console.log('🎯 NowScreen: Opening hamburger menu...');
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const navigateToScreen = (screenName: string) => {
    console.log(`🎯 NowScreen: Navigating to ${screenName}...`);
    console.log('🎯 NowScreen navigation object:', navigation);
    console.log('🎯 NowScreen navigation state:', navigation.getState?.());
    closeMenu();
    try {
      // For drawer screens, we need to navigate to the parent (drawer) navigator
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        console.log(`🎯 NowScreen: Using parent navigation for ${screenName}`);
        parentNavigation.navigate(screenName);
      } else {
        console.log(`🎯 NowScreen: Using direct navigation for ${screenName}`);
        navigation.navigate(screenName);
      }
      console.log(`🎯 NowScreen: Navigation to ${screenName} completed`);
    } catch (error) {
      console.error(`🎯 NowScreen: Navigation to ${screenName} failed:`, error);
    }
  };

  const handleLogout = () => {
    closeMenu();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Right Now</Text>
          <TouchableOpacity style={styles.menuButton} onPress={showConfigMenu}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.currentTimeContainer}>
          <Text style={styles.currentTimeValue}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {currentBlock ? (
          <View style={styles.currentBlockContainer}>
            <View style={styles.currentBlock}>
              {/* Time block info and duration remaining */}
              <Text style={styles.timeBlockInfo}>
                {currentBlock.startTime} - {currentBlock.endTime}
              </Text>
              <Text style={styles.timeRemaining}>{timeRemaining}</Text>
              
              {/* List all concurrent activities */}
              {currentBlock.activities && currentBlock.activities.length > 0 && (
                <View style={styles.activitiesListContainer}>
                  {currentBlock.activities.map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityName}>
                          {activity.blockName || activity.name}
                        </Text>
                        <View style={styles.activityTypeTag}>
                          <Text style={styles.activityTypeText}>
                            {activity.name}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.continuationText}>
                        Continues for another 2h 30m
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noBlockContainer}>
            <Text style={styles.noBlockText}>No scheduled activity right now</Text>
            <Text style={styles.noBlockSubtext}>
              Enjoy your free time or check your schedule for upcoming activities
            </Text>
          </View>
        )}

        {nextBlock && (
          <View style={styles.nextBlockContainer}>
            <Text style={styles.nextBlockTitle}>Coming Up Next</Text>
            <View style={styles.nextBlock}>
              <Text style={styles.nextTimeBlock}>
                {nextBlock.startTime} - {nextBlock.endTime}
              </Text>
              {nextBlock.activities && nextBlock.activities.length > 0 && (
                <View style={styles.nextActivitiesContainer}>
                  {nextBlock.activities.map((activity, index) => (
                    <Text key={index} style={styles.nextActivityName}>
                      {activity.blockName || activity.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeMenu}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Settings</Text>
            <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuContent}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Templates')}
            >
              <Text style={styles.menuItemIcon}>📋</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Design Day Templates</Text>
                <Text style={styles.menuItemSubtitle}>Create daily schedules with time blocks</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Calendar')}
            >
              <Text style={styles.menuItemIcon}>📅</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Plan Calendar</Text>
                <Text style={styles.menuItemSubtitle}>Schedule templates to specific dates</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('WellnessCategories')}
            >
              <Text style={styles.menuItemIcon}>🏷️</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Wellness Categories</Text>
                <Text style={styles.menuItemSubtitle}>Manage wellness and drain categories</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('ActivityTypes')}
            >
              <Text style={styles.menuItemIcon}>🎯</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Activity Types</Text>
                <Text style={styles.menuItemSubtitle}>Create and manage activity types</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('DayDimensions')}
            >
              <Text style={styles.menuItemIcon}>📊</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Day Dimensions</Text>
                <Text style={styles.menuItemSubtitle}>Configure day characteristics</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Profile')}
            >
              <Text style={styles.menuItemIcon}>👤</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Profile</Text>
                <Text style={styles.menuItemSubtitle}>Manage your personal information</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, styles.logoutText]}>Logout</Text>
                <Text style={styles.menuItemSubtitle}>Sign out of your account</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentBlockContainer: {
    marginBottom: 24,
  },
  currentBlock: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  currentActivityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 18,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  timeRemaining: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 16,
  },
  notes: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  noBlockContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  noBlockText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  noBlockSubtext: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  nextBlockContainer: {
    marginBottom: 24,
  },
  nextBlockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  nextBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  nextTimeBlock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  nextActivitiesContainer: {
    marginTop: 8,
  },
  nextActivityName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  currentTimeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentTimeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  // Hamburger Menu Styles
  menuContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#dc2626',
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  activityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  activityTagText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  timeBlockInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  activitiesListContainer: {
    marginBottom: 16,
  },
  activityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityTypeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityTypeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  continuationText: {
    fontSize: 14,
    color: '#ffffff',
    fontStyle: 'italic',
  },
});

export default NowScreen; 