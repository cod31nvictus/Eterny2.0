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
  TextInput,
} from 'react-native';
import { ActivityType, WellnessCategory } from '../types';
import api from '../services/api';

interface ActivityLog {
  _id: string;
  activityTypeId: ActivityType;
  duration: number;
  notes?: string;
  date: string;
  createdAt: string;
}

interface LogActivityForm {
  activityTypeId: string;
  duration: number;
  notes: string;
  date: string;
}

const ProgressScreen: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<LogActivityForm>({
    activityTypeId: '',
    duration: 30,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesData] = await Promise.all([
        api.activities.getAll(),
        // Note: We would need to add activity logging endpoints to the API
        // For now, we'll simulate with empty logs
      ]);
      setActivities(activitiesData);
      setActivityLogs([]); // Simulated empty logs
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (activities.length === 0) {
      Alert.alert('Error', 'You need to create activity types first');
      return;
    }
    
    setFormData({
      activityTypeId: activities[0]._id,
      duration: 30,
      notes: '',
      date: selectedDate,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.activityTypeId) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }

    if (formData.duration <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      
      // Note: This would call an actual API endpoint for logging activities
      // For now, we'll simulate success
      const newLog: ActivityLog = {
        _id: Date.now().toString(),
        activityTypeId: activities.find(a => a._id === formData.activityTypeId)!,
        duration: formData.duration,
        notes: formData.notes,
        date: formData.date,
        createdAt: new Date().toISOString(),
      };
      
      setActivityLogs([newLog, ...activityLogs]);
      handleCloseModal();
      Alert.alert('Success', 'Activity logged successfully!');
    } catch (error) {
      console.error('Failed to log activity:', error);
      Alert.alert('Error', 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = activityLogs.filter(log => log.date === today);
    const totalMinutes = todayLogs.reduce((sum, log) => sum + log.duration, 0);
    const activityCount = todayLogs.length;
    
    return { totalMinutes, activityCount };
  };

  const getWeekStats = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekLogs = activityLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= today;
    });
    
    const totalMinutes = weekLogs.reduce((sum, log) => sum + log.duration, 0);
    const activityCount = weekLogs.length;
    
    return { totalMinutes, activityCount };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const selectedDateLogs = activityLogs.filter(log => log.date === selectedDate);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatMinutes(todayStats.totalMinutes)}</Text>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statSubLabel}>{todayStats.activityCount} activities</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatMinutes(weekStats.totalMinutes)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statSubLabel}>{weekStats.activityCount} activities</Text>
            </View>
          </View>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateContainer}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.dateInfo}>
              <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Logs */}
        <View style={styles.logsContainer}>
          {selectedDateLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No activities logged</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your wellness journey by logging your first activity.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleOpenModal}
              >
                <Text style={styles.emptyButtonText}>Log Your First Activity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.logsList}>
              {selectedDateLogs.map((log) => (
                <View key={log._id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logActivity}>{log.activityTypeId.name}</Text>
                    <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
                  </View>
                  
                  <Text style={styles.logDuration}>{formatMinutes(log.duration)}</Text>
                  
                  {log.notes && (
                    <Text style={styles.logNotes}>{log.notes}</Text>
                  )}
                  
                  <View style={styles.logCategories}>
                    {log.activityTypeId.wellnessTagIds.map((tag) => (
                      <View
                        key={tag._id}
                        style={[
                          styles.logCategoryChip,
                          { backgroundColor: tag.color + '20', borderColor: tag.color + '40' }
                        ]}
                      >
                        <Text style={[styles.logCategoryText, { color: tag.color }]}>
                          {tag.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Activity Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenModal}
      >
        <Text style={styles.addButtonText}>+ Log Activity</Text>
      </TouchableOpacity>

      {/* Log Activity Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Activity</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !formData.activityTypeId}
            >
              <Text style={[
                styles.modalSaveText,
                (submitting || !formData.activityTypeId) && styles.modalSaveTextDisabled
              ]}>
                {submitting ? 'Logging...' : 'Log'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Activity</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activitiesScroll}>
                <View style={styles.activitiesGrid}>
                  {activities.map((activity) => (
                    <TouchableOpacity
                      key={activity._id}
                      style={[
                        styles.activityOption,
                        formData.activityTypeId === activity._id && styles.activityOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, activityTypeId: activity._id })}
                    >
                      <Text style={styles.activityOptionIcon}>
                        {activity.icon === 'DirectionsRun' ? '🏃' :
                         activity.icon === 'FitnessCenter' ? '💪' :
                         activity.icon === 'SelfImprovement' ? '🧘' :
                         activity.icon === 'Restaurant' ? '🍽️' :
                         activity.icon === 'Work' ? '💼' :
                         activity.icon === 'Home' ? '🏠' :
                         activity.icon === 'School' ? '📚' :
                         activity.icon === 'LocalHospital' ? '🏥' :
                         activity.icon === 'MusicNote' ? '🎵' :
                         activity.icon === 'SportsEsports' ? '🎮' :
                         activity.icon === 'DirectionsCar' ? '🚗' :
                         activity.icon === 'Phone' ? '📞' :
                         activity.icon === 'Computer' ? '💻' :
                         activity.icon === 'Book' ? '📖' :
                         activity.icon === 'Brush' ? '🎨' : '🏃'}
                      </Text>
                      <Text style={styles.activityOptionName}>{activity.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.duration.toString()}
                onChangeText={(text) => setFormData({ ...formData, duration: parseInt(text) || 0 })}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="How did it go? Any observations..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date</Text>
              <TextInput
                style={styles.formInput}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  dateContainer: {
    marginBottom: 24,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  dateInfo: {
    alignItems: 'center',
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  logsContainer: {
    marginBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  logsList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logActivity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logTime: {
    fontSize: 14,
    color: '#64748b',
  },
  logDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  logNotes: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  logCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  logCategoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  logCategoryText: {
    fontSize: 12,
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
  modalSaveText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#94a3b8',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  activitiesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  activitiesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  activityOption: {
    width: 80,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center',
  },
  activityOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  activityOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activityOptionName: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ProgressScreen; 