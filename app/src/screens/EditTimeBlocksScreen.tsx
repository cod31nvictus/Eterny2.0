import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { DayTemplate, ActivityType, TimeBlock } from '../types';
import { api } from '../services/api';

interface EditTimeBlocksScreenProps {
  navigation: any;
  route: any;
}

const EditTimeBlocksScreen: React.FC<EditTimeBlocksScreenProps> = ({ navigation, route }) => {
  const { template, isNewTemplate } = route.params;
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<Omit<TimeBlock, '_id'>[]>(template.timeBlocks || []);
  const [showActivityPicker, setShowActivityPicker] = useState<number | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const activitiesData = await api.activities.getAll();
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityName = (activityTypeId: string | ActivityType) => {
    const activityId = typeof activityTypeId === 'string' ? activityTypeId : activityTypeId._id;
    const activity = activities.find(act => act._id === activityId);
    return activity?.name || 'Select Activity';
  };

  const addTimeBlock = () => {
    if (activities.length === 0) {
      Alert.alert('Error', 'You need to create activity types first');
      return;
    }

    const defaultActivity = activities[0];
    const newBlock: Omit<TimeBlock, '_id'> = {
      activityTypeId: defaultActivity._id,
      blockName: defaultActivity.name, // Default to activity name
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      order: timeBlocks.length,
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const updateTimeBlock = (index: number, field: keyof TimeBlock, value: string | number) => {
    const updatedBlocks = [...timeBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], [field]: value };
    
    // If activity changes, update block name to match activity name (but keep it editable)
    if (field === 'activityTypeId') {
      const activityId = typeof value === 'string' ? value : String(value);
      const activity = activities.find(act => act._id === activityId);
      if (activity) {
        updatedBlocks[index].blockName = activity.name;
      }
    }
    
    setTimeBlocks(updatedBlocks);
  };

  const removeTimeBlock = (index: number) => {
    const updatedBlocks = timeBlocks.filter((_, i) => i !== index);
    setTimeBlocks(updatedBlocks);
  };

  const handleActivitySelect = (index: number, activityId: string) => {
    updateTimeBlock(index, 'activityTypeId', activityId);
    setShowActivityPicker(null);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const updatedTemplate = {
        ...template,
        timeBlocks,
      };

      await api.templates.update(template._id, updatedTemplate);
      
      Alert.alert(
        'Success',
        'Template saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to templates list
              navigation.navigate('Templates');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Failed to save time blocks:', error);
      Alert.alert('Error', 'Failed to save time blocks');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{template.name}</Text>
          <View style={styles.dimensionTags}>
            {template.dimensionValues.map((dv: any, index: number) => (
              <View key={index} style={styles.dimensionTag}>
                <Text style={styles.dimensionTagText}>{dv.valueName}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
        >
          <Text style={[
            styles.saveText,
            submitting && styles.saveTextDisabled
          ]}>
            {submitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.timeBlocksHeader}>
          <Text style={styles.sectionTitle}>Time Blocks</Text>
          <TouchableOpacity
            style={styles.addTimeBlockButton}
            onPress={addTimeBlock}
            disabled={activities.length === 0}
          >
            <Text style={styles.addTimeBlockText}>+ Add Block</Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <View style={styles.noActivitiesContainer}>
            <Text style={styles.noActivitiesText}>
              You need to create activity types first before adding time blocks.
            </Text>
            <TouchableOpacity
              style={styles.createActivitiesButton}
              onPress={() => navigation.navigate('Activities')}
            >
              <Text style={styles.createActivitiesButtonText}>Create Activities</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timeBlocksContainer}>
            {timeBlocks.map((block, index) => (
              <View key={index} style={styles.timeBlockForm}>
                <View style={styles.timeBlockFormHeader}>
                  <Text style={styles.timeBlockFormTitle}>Block {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeTimeBlock(index)}
                    style={styles.removeBlockButton}
                  >
                    <Text style={styles.removeBlockText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>Activity</Text>
                    <TouchableOpacity 
                      style={styles.pickerContainer}
                      onPress={() => setShowActivityPicker(index)}
                    >
                      <Text style={styles.pickerText}>
                        {getActivityName(block.activityTypeId)}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>Block Name</Text>
                    <TextInput
                      style={styles.formInput}
                      value={block.blockName || ''}
                      onChangeText={(text) => updateTimeBlock(index, 'blockName', text)}
                      placeholder="Enter custom block name"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>Start Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={block.startTime}
                      onChangeText={(text) => updateTimeBlock(index, 'startTime', text)}
                      placeholder="09:00"
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>End Time</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={block.endTime}
                      onChangeText={(text) => updateTimeBlock(index, 'endTime', text)}
                      placeholder="10:00"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>Duration</Text>
                    <Text style={styles.durationText}>
                      {calculateDuration(block.startTime, block.endTime)}
                    </Text>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formSubLabel}>Notes (Optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={block.notes}
                      onChangeText={(text) => updateTimeBlock(index, 'notes', text)}
                      placeholder="Add notes..."
                    />
                  </View>
                </View>
              </View>
            ))}
            
            {timeBlocks.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No time blocks added yet</Text>
                <Text style={styles.emptySubtext}>
                  Click "Add Block" to start building your daily schedule
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Activity Picker Modal */}
      <Modal
        visible={showActivityPicker !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActivityPicker(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Activity</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity._id}
                style={styles.activityOption}
                onPress={() => showActivityPicker !== null && handleActivitySelect(showActivityPicker, activity._id)}
              >
                <Text style={styles.activityOptionText}>{activity.name}</Text>
                {activity.description && (
                  <Text style={styles.activityOptionDescription}>{activity.description}</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  dimensionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  dimensionTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dimensionTagText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeBlocksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTimeBlockButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTimeBlockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  noActivitiesContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  createActivitiesButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createActivitiesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeBlocksContainer: {
    gap: 16,
  },
  timeBlockForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeBlockFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBlockFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  removeBlockButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeBlockText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formColumn: {
    flex: 1,
  },
  formSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1e293b',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  timeInput: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  durationText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
  activityOption: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityOptionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default EditTimeBlocksScreen; 