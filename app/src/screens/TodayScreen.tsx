import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayTemplate, TemplateDimensionValue } from '../types';
import api from '../services/api';
import config from '../config/environment';

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

interface SyncState {
  lastSyncTime: string | null;
  lastSyncHash: string | null;
  needsSync: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const TodayScreen = () => {
  const { user } = useAuth();
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [templateInfo, setTemplateInfo] = useState<DayTemplate | null>(null);
  const [changePlanModalVisible, setChangePlanModalVisible] = useState(false);
  const [templatesList, setTemplatesList] = useState<DayTemplate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ enabled: boolean; connected: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncTime: null,
    lastSyncHash: null,
    needsSync: false,
  });

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
        
        // Extract template info from the first template (assuming one template per day for now)
        if (data.templates && data.templates.length > 0) {
          const firstTemplate = data.templates[0];
          if (firstTemplate.template) {
            setTemplateInfo(firstTemplate.template);
          }
        } else {
          setTemplateInfo(null);
        }
        
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
        
        // Check if sync is needed after setting the schedule
        checkSyncNeeded(blocksWithActivities);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllTemplates = async () => {
    try {
      const templates = await api.templates.getAll();
      setTemplatesList(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleChangePlan = () => {
    fetchAllTemplates();
    setChangePlanModalVisible(true);
  };

  const handleTemplateSelect = async (template: DayTemplate) => {
    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Create a simple assignment for today only
      const assignForm = {
        templateId: template._id,
        startDate: today,
        recurrence: { type: 'none' as const, interval: 1 },
      };

      await api.calendar.assignTemplate(assignForm);
      
      Alert.alert('Success', `Template "${template.name}" assigned to today`);
      
      // Update the template info and refresh the schedule
      setTemplateInfo(template);
      setChangePlanModalVisible(false);
      fetchTodaySchedule();
      
      // Mark sync as needed since schedule changed
      saveSyncState({
        ...syncState,
        needsSync: true,
      });
    } catch (error) {
      console.error('Error assigning template:', error);
      Alert.alert('Error', 'Failed to assign template');
    } finally {
      setSubmitting(false);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const status = await api.calendar.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error checking sync status:', error);
      // Set default disconnected state if sync check fails
      setSyncStatus({
        connected: false,
        enabled: false,
        message: 'Google Calendar Not Connected'
      });
    }
  };

  const handleSync = async () => {
    if (!syncStatus?.connected) {
      Alert.alert(
        'Google Calendar Not Connected',
        'Please sign in with Google Calendar permissions to enable sync.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if sync is needed
    const needsSync = checkSyncNeeded(scheduleBlocks);
    if (!needsSync) {
      Alert.alert(
        'Already Synced',
        'Your schedule is already up to date with Google Calendar.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSyncing(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (!syncStatus.enabled) {
        await api.calendar.enableSync();
        setSyncStatus(prev => prev ? { ...prev, enabled: true } : null);
      }
      
      const result = await api.calendar.syncToday(today);
      
      // Mark as synced after successful sync
      markAsSynced();
      
      Alert.alert(
        'Sync Complete',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      Alert.alert(
        'Sync Failed',
        'Failed to sync with Google Calendar. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
    checkSyncStatus();
    loadSyncState();
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

  // Check sync status whenever schedule blocks change
  useEffect(() => {
    if (scheduleBlocks.length > 0) {
      checkSyncNeeded(scheduleBlocks);
    }
  }, [scheduleBlocks, syncState.lastSyncHash]);

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
            {block.activities.map((activity, activityIndex) => (
              <View key={activityIndex} style={styles.activityItem}>
                <Text style={styles.activityBullet}>●</Text>
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>
                    {activity.blockName || activity.name}
                  </Text>
                  <Text style={styles.activityCategory}>
                    {activity.wellnessTags?.[0] || 'General'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {block.isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>CURRENT</Text>
          </View>
        )}
      </View>
    );
  };

  // Generate a hash of the current schedule for sync tracking
  const generateScheduleHash = (blocks: ScheduleBlock[]) => {
    const scheduleData = blocks
      .filter(block => block.hasActivity)
      .map(block => ({
        startTime: block.startTime,
        endTime: block.endTime,
        activities: block.activities.map(activity => ({
          name: activity.name,
          blockName: activity.blockName,
          wellnessTags: activity.wellnessTags.sort(),
        })).sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return JSON.stringify(scheduleData);
  };

  // Load sync state from AsyncStorage
  const loadSyncState = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const syncStateKey = `syncState_${today}`;
      const savedState = await AsyncStorage.getItem(syncStateKey);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setSyncState(parsedState);
      }
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
  };

  // Save sync state to AsyncStorage
  const saveSyncState = async (newState: SyncState) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const syncStateKey = `syncState_${today}`;
      await AsyncStorage.setItem(syncStateKey, JSON.stringify(newState));
      setSyncState(newState);
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  };

  // Check if sync is needed by comparing current schedule with last synced version
  const checkSyncNeeded = (blocks: ScheduleBlock[]) => {
    const currentHash = generateScheduleHash(blocks);
    const needsSync = !syncState.lastSyncHash || syncState.lastSyncHash !== currentHash;
    
    if (needsSync !== syncState.needsSync) {
      saveSyncState({
        ...syncState,
        needsSync,
      });
    }
    
    return needsSync;
  };

  // Mark schedule as synced
  const markAsSynced = () => {
    const currentHash = generateScheduleHash(scheduleBlocks);
    const now = new Date().toISOString();
    
    saveSyncState({
      lastSyncTime: now,
      lastSyncHash: currentHash,
      needsSync: false,
    });
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
        
        <TouchableOpacity 
          style={[
            styles.syncButton,
            syncing && styles.syncButtonLoading,
            syncStatus?.connected && styles.syncButtonEnabled
          ]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Image
            source={require('../assets/images/sync.png')}
            style={[
              styles.syncIcon,
              syncStatus?.connected && styles.syncIconEnabled
            ]}
            resizeMode="contain"
          />
          <Text style={[
            styles.syncStatusText,
            syncStatus?.connected && styles.syncStatusTextEnabled
          ]}>
            {syncing ? 'Syncing...' : syncStatus?.connected ? (syncState.needsSync ? 'Sync Now' : 'Synced') : 'Not Connected'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {templateInfo && (
        <View style={styles.templateSection}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{templateInfo.name}</Text>
            <TouchableOpacity 
              style={styles.changePlanButton}
              onPress={handleChangePlan}
            >
              <Text style={styles.changePlanText}>Change Plan</Text>
            </TouchableOpacity>
          </View>
          
          {templateInfo.dimensionValues && templateInfo.dimensionValues.length > 0 && (
            <View style={styles.dimensionTags}>
              {templateInfo.dimensionValues.map((dimValue, index) => (
                <View key={index} style={styles.dimensionTag}>
                  <Text style={styles.dimensionTagText}>{dimValue.valueName}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
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
      
      {/* Template Selection Modal */}
      <Modal
        visible={changePlanModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setChangePlanModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Day Plan</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.selectedDateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>

            {templatesList.length === 0 ? (
              <View style={styles.noTemplatesContainer}>
                <Text style={styles.noTemplatesText}>
                  No templates available. Create a template first to schedule activities.
                </Text>
              </View>
            ) : (
              <View style={styles.templatesContainer}>
                <Text style={styles.sectionTitle}>Choose a Template</Text>
                {templatesList.map((template) => (
                  <View key={template._id} style={styles.templateOption}>
                    <View style={styles.templateOptionInfo}>
                      <Text style={styles.templateOptionName}>{template.name}</Text>
                      {template.description && (
                        <Text style={styles.templateOptionDescription}>
                          {template.description}
                        </Text>
                      )}
                      <Text style={styles.templateOptionActivities}>
                        {template.timeBlocks.length} activities
                      </Text>
                      
                      {template.dimensionValues && template.dimensionValues.length > 0 && (
                        <View style={styles.templateDimensionTags}>
                          {template.dimensionValues.map((dimValue, index) => (
                            <View key={index} style={styles.templateDimensionTag}>
                              <Text style={styles.templateDimensionTagText}>{dimValue.valueName}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      style={styles.selectTemplateButton}
                      onPress={() => handleTemplateSelect(template)}
                      disabled={submitting}
                    >
                      <Text style={styles.selectTemplateButtonText}>
                        Select for Today
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -0.015,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  syncButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  syncButtonEnabled: {
    // Remove background color for enabled state
  },
  syncButtonLoading: {
    opacity: 0.6,
  },
  syncIcon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  syncIconEnabled: {
    opacity: 1,
  },
  templateSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  changePlanButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  changePlanText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  dimensionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dimensionTagText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  scheduleContainer: {
    backgroundColor: '#FFFFFF',
  },
  scheduleBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  scheduleBlockPast: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  scheduleBlockCurrent: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
  },
  scheduleBlockUpcoming: {
    backgroundColor: '#FFFFFF',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  scheduleTimeCurrent: {
    color: '#000000',
    fontWeight: 'bold',
  },
  scheduleTimePast: {
    color: '#333333',
    fontWeight: '400',
  },
  scheduleTimeUpcoming: {
    color: '#333333',
    fontWeight: '500',
  },
  activitiesContainer: {
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityBullet: {
    fontSize: 16,
    color: '#000000',
    marginRight: 12,
    width: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  activityCategory: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  activeIndicator: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  activeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  noTemplatesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noTemplatesText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  templatesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  templateOption: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  templateOptionInfo: {
    marginBottom: 16,
  },
  templateOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  templateOptionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  templateOptionActivities: {
    fontSize: 12,
    color: '#64748b',
  },
  templateDimensionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  templateDimensionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
  },
  templateDimensionTagText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  selectTemplateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  selectTemplateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalPlaceholder: {
    width: 60,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  syncStatusText: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  syncStatusTextEnabled: {
    color: '#000000',
    fontWeight: '600',
  },
});

export default TodayScreen; 