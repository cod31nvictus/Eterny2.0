import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { DayTemplate, ActivityType, DayDimension } from '../types';

const TemplatesScreen: React.FC = () => {
  console.log('🎯 TemplatesScreen component is rendering!');
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [dimensions, setDimensions] = useState<DayDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DayTemplate | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const navigation = useNavigation();

  // Debug navigation
  console.log('🎯 TemplatesScreen navigation object:', navigation);
  console.log('🎯 TemplatesScreen navigation state:', navigation.getState?.());

  useEffect(() => {
    fetchData();
  }, []);

  // Add focus listener to refresh data when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 TemplatesScreen focused, refreshing data...');
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesData, activitiesData, dimensionsData] = await Promise.all([
        api.templates.getAll(),
        api.activities.getAll(),
        api.dimensions.getAll(),
      ]);
      setTemplates(templatesData);
      setActivities(activitiesData);
      setDimensions(dimensionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: DayTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.templates.delete(template._id);
              setTemplates(templates.filter(tmpl => tmpl._id !== template._id));
            } catch (error) {
              console.error('Failed to delete template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleCreateTemplate = () => {
    console.log('🎯 Attempting to navigate to CreateTemplate...');
    console.log('🎯 Current navigation state:', navigation.getState?.());
    console.log('🎯 Available routes:', navigation.getState?.()?.routes);
    
    try {
      // Check if we're in the template stack navigator
      const state = navigation.getState?.();
      console.log('🎯 Navigation state type:', state?.type);
      console.log('🎯 Route names:', state?.routeNames);
      
      // If we're in a stack navigator that has CreateTemplate, navigate directly
      if (state?.routeNames?.includes('CreateTemplate')) {
        console.log('🎯 Found CreateTemplate in current stack, navigating...');
        (navigation as any).navigate('CreateTemplate');
      } else {
        // We're in the wrong context, need to get the parent stack navigator
        console.log('🎯 CreateTemplate not found in current context, checking parent...');
        const parent = navigation.getParent();
        if (parent) {
          console.log('🎯 Parent navigation state:', parent.getState?.());
          console.log('🎯 Parent route names:', parent.getState?.()?.routeNames);
          
          // Try to navigate using parent
          (parent as any).navigate('CreateTemplate');
        } else {
          console.log('🎯 No parent navigator found, trying direct navigation...');
          (navigation as any).navigate('CreateTemplate');
        }
      }
      console.log('🎯 Navigation call completed');
    } catch (error) {
      console.error('🎯 Navigation error:', error);
    }
  };

  const generateFullDaySchedule = (template: DayTemplate) => {
    const startTime = template.startTime || '06:00';
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const schedule = [];
    const currentTime = new Date(startDate);
    
    // Generate 96 time blocks (24 hours * 4 blocks per hour)
    for (let i = 0; i < 96; i++) {
      const blockStartTime = new Date(currentTime);
      const blockEndTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // Add 15 minutes
      
      const startTimeStr = blockStartTime.toTimeString().slice(0, 5);
      const endTimeStr = blockEndTime.toTimeString().slice(0, 5);
      
      // Find if there's an activity for this time block
      const activity = template.timeBlocks.find(block => 
        block.startTime === startTimeStr
      );
      
      schedule.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        activity: activity ? (activity.blockName || getActivityName(activity.activityTypeId)) : null,
        hasActivity: !!activity
      });
      
      currentTime.setTime(currentTime.getTime() + 15 * 60 * 1000); // Add 15 minutes
    }
    
    return schedule;
  };

  const getActivityName = (activityId: string | ActivityType) => {
    if (typeof activityId === 'object') {
      return activityId.name;
    }
    const activity = activities.find(act => act._id === activityId);
    return activity?.name || 'Unknown Activity';
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewSchedule = (template: DayTemplate) => {
    setSelectedTemplate(template);
    setShowScheduleModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first day template to start planning your wellness schedule.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateTemplate}
            >
              <Text style={styles.emptyButtonText}>Create Your First Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <View key={template._id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    {template.description && (
                      <Text style={styles.templateDescription}>{template.description}</Text>
                    )}
                    <Text style={styles.templateMeta}>
                      Starts at {formatTime(template.startTime || '06:00')} • {template.timeBlocks.length} activities
                    </Text>
                  </View>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleCreateTemplate}
                    >
                      <Text style={styles.iconText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => (navigation as any).navigate('EditTimeBlocks', { template })}
                    >
                      <Text style={styles.iconText}>Schedule</Text>
                    </TouchableOpacity>

                    {!template.isDefault && (
                      <TouchableOpacity
                        style={[styles.iconButton, styles.deleteIconButton]}
                        onPress={() => handleDelete(template)}
                      >
                        <Text style={styles.iconText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewScheduleButton}
                  onPress={() => handleViewSchedule(template)}
                >
                  <Text style={styles.viewScheduleButtonText}>View Schedule</Text>
                </TouchableOpacity>

                {template.tags.length > 0 && (
                  <View style={styles.templateTags}>
                    <Text style={styles.tagsLabel}>Tags:</Text>
                    <View style={styles.tagsContainer}>
                      {template.tags.map((tag, index) => (
                        <View key={index} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {template.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleCreateTemplate}
      >
        <Text style={styles.addButtonText}>+ Create Template</Text>
      </TouchableOpacity>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTemplate?.name} - Full Day Schedule
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scheduleContainer}>
            {selectedTemplate && generateFullDaySchedule(selectedTemplate).map((block, index) => (
              <View 
                key={index} 
                style={[
                  styles.scheduleBlock,
                  block.hasActivity ? styles.scheduleBlockActive : styles.scheduleBlockEmpty
                ]}
              >
                <Text style={styles.scheduleTime}>
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </Text>
                <Text style={[
                  styles.scheduleActivity,
                  !block.hasActivity && styles.scheduleActivityEmpty
                ]}>
                  {block.activity || 'Free time'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  deleteIconButton: {
    backgroundColor: '#F5F5F5',
  },
  templateMeta: {
    fontSize: 12,
    color: '#333333',
  },
  viewScheduleButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewScheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  templateTags: {
    marginBottom: 12,
  },
  tagsLabel: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 6,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagText: {
    fontSize: 12,
    color: '#333333',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleBlock: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scheduleBlockActive: {
    backgroundColor: '#F5F5F5',
  },
  scheduleBlockEmpty: {
    backgroundColor: '#FFFFFF',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  scheduleActivity: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  scheduleActivityEmpty: {
    color: '#333333',
  },
});

export default TemplatesScreen; 