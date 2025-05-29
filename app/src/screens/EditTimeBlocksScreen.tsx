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
  FlatList,
} from 'react-native';
import { DayTemplate, ActivityType, TimeBlock } from '../types';
import { api } from '../services/api';

interface TimeBlockRow {
  id: number;
  startTime: string;
  endTime: string;
  activityTypeId?: string;
  activityName?: string;
  blockName?: string;
  sameAsPrevious: boolean;
}

interface EditTimeBlocksScreenProps {
  navigation: any;
  route: any;
}

const EditTimeBlocksScreen: React.FC<EditTimeBlocksScreenProps> = ({ navigation, route }) => {
  const { template, isNewTemplate } = route.params;
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockRow[]>([]);
  const [showActivityModal, setShowActivityModal] = useState<{ index: number; activityName: string } | null>(null);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [dayStartTime, setDayStartTime] = useState('06:00');
  const [tempStartTime, setTempStartTime] = useState('06:00');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActivities();
    showStartTimeSelector();
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

  const showStartTimeSelector = () => {
    setShowStartTimeModal(true);
  };

  const generateTimeBlocks = (startTime: string) => {
    const blocks: TimeBlockRow[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;

    // Generate 96 blocks (24 hours * 4 blocks per hour = 96 15-minute blocks)
    for (let i = 0; i < 96; i++) {
      const startTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Calculate end time (15 minutes later)
      let endHour = currentHour;
      let endMinute = currentMinute + 15;
      
      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
      }
      
      if (endHour >= 24) {
        endHour -= 24;
      }
      
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      blocks.push({
        id: i,
        startTime: startTimeStr,
        endTime: endTimeStr,
        sameAsPrevious: false,
      });

      // Update current time for next iteration
      currentHour = endHour;
      currentMinute = endMinute;
    }

    setTimeBlocks(blocks);
  };

  const handleStartTimeConfirm = () => {
    setDayStartTime(tempStartTime);
    generateTimeBlocks(tempStartTime);
    setShowStartTimeModal(false);
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleActivitySelect = (blockIndex: number, activity: ActivityType, customName?: string) => {
    const updatedBlocks = [...timeBlocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      activityTypeId: activity._id,
      activityName: activity.name,
      blockName: customName || activity.name,
      sameAsPrevious: false,
    };
    setTimeBlocks(updatedBlocks);
    setShowActivityModal(null);
    setSearchQuery(''); // Clear search when modal closes
  };

  const handleSameAsPrevious = (blockIndex: number, checked: boolean) => {
    const updatedBlocks = [...timeBlocks];
    
    if (checked && blockIndex > 0) {
      const previousBlock = updatedBlocks[blockIndex - 1];
      if (previousBlock.activityTypeId) {
        updatedBlocks[blockIndex] = {
          ...updatedBlocks[blockIndex],
          activityTypeId: previousBlock.activityTypeId,
          activityName: previousBlock.activityName,
          blockName: previousBlock.blockName,
          sameAsPrevious: true,
        };
      }
    } else {
      updatedBlocks[blockIndex] = {
        ...updatedBlocks[blockIndex],
        activityTypeId: undefined,
        activityName: undefined,
        blockName: undefined,
        sameAsPrevious: false,
      };
    }
    
    setTimeBlocks(updatedBlocks);
  };

  const canUseSameAsPrevious = (blockIndex: number): boolean => {
    if (blockIndex === 0) return false;
    return !!timeBlocks[blockIndex - 1]?.activityTypeId;
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      // Convert TimeBlockRow[] to TimeBlock[]
      const convertedTimeBlocks: Omit<TimeBlock, '_id'>[] = timeBlocks
        .filter(block => block.activityTypeId) // Only include blocks with activities
        .map((block, index) => ({
          activityTypeId: block.activityTypeId!,
          blockName: block.blockName || block.activityName || '',
          startTime: block.startTime,
          endTime: block.endTime,
          notes: '',
          order: index,
        }));

      const updatedTemplate = {
        ...template,
        timeBlocks: convertedTimeBlocks,
      };

      await api.templates.update(template._id, updatedTemplate);
      
      Alert.alert(
        'Success',
        'Template saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
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
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderTimeBlockRow = ({ item, index }: { item: TimeBlockRow; index: number }) => {
    const canUsePrevious = canUseSameAsPrevious(index);
    
    return (
      <View style={styles.tableRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{item.startTime}</Text>
        </View>
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{item.endTime}</Text>
        </View>
        <TouchableOpacity 
          style={styles.activityColumn}
          onPress={() => setShowActivityModal({ 
            index, 
            activityName: item.activityName || '' 
          })}
        >
          <Text style={[
            styles.activityText,
            !item.activityName && styles.activityTextPlaceholder
          ]}>
            {item.activityName || 'Tap to select'}
          </Text>
        </TouchableOpacity>
        <View style={styles.checkboxColumn}>
          {canUsePrevious && (
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.sameAsPrevious && styles.checkboxChecked
              ]}
              onPress={() => handleSameAsPrevious(index, !item.sameAsPrevious)}
            >
              {item.sameAsPrevious && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
          <TouchableOpacity 
            style={styles.startTimeButton}
            onPress={showStartTimeSelector}
          >
            <Text style={styles.startTimeText}>Start: {formatTime(dayStartTime)}</Text>
          </TouchableOpacity>
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

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.timeColumn}>
            <Text style={styles.headerText}>Start</Text>
          </View>
          <View style={styles.timeColumn}>
            <Text style={styles.headerText}>End</Text>
          </View>
          <View style={styles.activityColumn}>
            <Text style={styles.headerText}>Activity</Text>
          </View>
          <View style={styles.checkboxColumn}>
            <Text style={styles.headerText}>Same as Previous</Text>
          </View>
        </View>

        <FlatList
          data={timeBlocks}
          renderItem={renderTimeBlockRow}
          keyExtractor={(item) => item.id.toString()}
          style={styles.tableContent}
          showsVerticalScrollIndicator={true}
        />
      </View>

      {/* Start Time Modal */}
      <Modal
        visible={showStartTimeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Day Start Time</Text>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              What time do you want to start your day?
            </Text>
            <TextInput
              style={styles.timeInput}
              value={tempStartTime}
              onChangeText={setTempStartTime}
              placeholder="06:00"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleStartTimeConfirm}
            >
              <Text style={styles.confirmButtonText}>Generate Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Activity Selection Modal */}
      <Modal
        visible={showActivityModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowActivityModal(null);
              setSearchQuery('');
            }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Activity</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose an activity type and optionally customize the name:
            </Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search activities..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {filteredActivities.length === 0 && searchQuery.length > 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No activities found matching "{searchQuery}"
                </Text>
              </View>
            )}
            
            <ScrollView style={styles.activitiesScroll}>
              {filteredActivities.map((activity) => (
                <View key={activity._id} style={styles.activitySection}>
                  <TouchableOpacity
                    style={styles.activityOption}
                    onPress={() => showActivityModal && handleActivitySelect(showActivityModal.index, activity)}
                  >
                    <Text style={styles.activityOptionText}>{activity.name}</Text>
                    {activity.description && (
                      <Text style={styles.activityOptionDescription}>{activity.description}</Text>
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.customNameSection}>
                    <Text style={styles.customNameLabel}>Custom Name (Optional):</Text>
                    <View style={styles.customNameRow}>
                      <TextInput
                        style={styles.customNameInput}
                        placeholder={activity.name}
                        onSubmitEditing={(event) => {
                          const customName = event.nativeEvent.text.trim();
                          if (showActivityModal) {
                            handleActivitySelect(showActivityModal.index, activity, customName || activity.name);
                          }
                        }}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.useCustomButton}
                        onPress={() => {
                          if (showActivityModal) {
                            // Get the current value from the input - for now just use activity name
                            handleActivitySelect(showActivityModal.index, activity, activity.name);
                          }
                        }}
                      >
                        <Text style={styles.useCustomButtonText}>Use</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
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
  startTimeButton: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  startTimeText: {
    fontSize: 12,
    color: '#0369a1',
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
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableContent: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    alignItems: 'center',
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
  },
  activityColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  checkboxColumn: {
    width: 80,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  activityText: {
    fontSize: 14,
    color: '#1e293b',
  },
  activityTextPlaceholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitiesScroll: {
    flex: 1,
  },
  activitySection: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  customNameSection: {
    padding: 16,
  },
  customNameLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  customNameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customNameInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },
  useCustomButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
  },
  useCustomButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 8,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#64748b',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
  },
});

export default EditTimeBlocksScreen; 