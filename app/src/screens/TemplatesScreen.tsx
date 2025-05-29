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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { DayTemplate, ActivityType, DayDimension } from '../types';

const TemplatesScreen: React.FC = () => {
  console.log('🎯 TemplatesScreen component is rendering!');
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [dimensions, setDimensions] = useState<DayDimension[]>([]);
  const [loading, setLoading] = useState(true);
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

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
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
            <Text style={styles.emptyEmoji}>📋</Text>
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
                  </View>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={handleCreateTemplate}
                    >
                      <Text style={styles.editButtonText}>Edit Info</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.editTimeBlocksButton}
                      onPress={() => (navigation as any).navigate('EditTimeBlocks', { template })}
                    >
                      <Text style={styles.editTimeBlocksButtonText}>Edit Schedule</Text>
                    </TouchableOpacity>

                    {!template.isDefault && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(template)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.templateSchedule}>
                  <Text style={styles.scheduleTitle}>
                    Schedule ({template.timeBlocks.length} activities)
                  </Text>
                  <ScrollView style={styles.timeBlocksList} nestedScrollEnabled>
                    {template.timeBlocks.map((block, index) => {
                      const activity = typeof block.activityTypeId === 'object' ? block.activityTypeId : 
                        activities.find(act => act._id === block.activityTypeId);
                      return (
                        <View key={index} style={styles.timeBlockItem}>
                          <Text style={styles.timeBlockActivity}>
                            {block.blockName || activity?.name || 'Unknown Activity'}
                          </Text>
                          <Text style={styles.timeBlockTime}>
                            {formatTime(block.startTime)} - {formatTime(block.endTime)} 
                            ({calculateDuration(block.startTime, block.endTime)})
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  templatesGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1e293b',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  editTimeBlocksButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  editTimeBlocksButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  templateSchedule: {
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  timeBlocksList: {
    maxHeight: 120,
  },
  timeBlockItem: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  timeBlockActivity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  timeBlockTime: {
    fontSize: 12,
    color: '#64748b',
  },
  templateTags: {
    marginBottom: 12,
  },
  tagsLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TemplatesScreen; 