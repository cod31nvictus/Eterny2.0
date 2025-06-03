import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useHabitContext } from '../contexts/HabitContext';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HabitTrackerScreen: React.FC = () => {
  const { 
    habits,
    todayHabits, 
    loading, 
    error, 
    fetchHabits,
    fetchTodayHabits, 
    createHabit, 
    toggleHabitTracking,
    clearError 
  } = useHabitContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateHabits, setSelectedDateHabits] = useState<any[]>([]);

  useEffect(() => {
    fetchTodayHabits();
    fetchHabits();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  // Fetch habits for selected date when date changes
  useEffect(() => {
    fetchHabitsForDate(selectedDate);
  }, [selectedDate, habits]);

  const fetchHabitsForDate = (date: Date) => {
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const dateString = date.toISOString().split('T')[0];
    
    // Filter habits that should be tracked on this day
    const dayHabits = habits.filter(habit => 
      habit.isActive && habit.trackingDays.includes(dayOfWeek)
    );

    // For today, use the todayHabits data which includes completion status
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      setSelectedDateHabits(todayHabits);
    } else {
      // For other dates, we need to manually set completion status
      // This is a simplified version - in a real app, you'd fetch the actual completion data
      const habitsWithStatus = dayHabits.map(habit => ({
        ...habit,
        completedToday: false, // We don't have historical data, so default to false
        trackingId: undefined
      }));
      setSelectedDateHabits(habitsWithStatus);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayHabits();
    await fetchHabits();
    setRefreshing(false);
  };

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, convert to Monday = 0)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isFutureDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const handleDateSelect = (date: Date) => {
    if (!isFutureDate(date)) {
      setSelectedDate(date);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleAddHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    const success = await createHabit(habitName.trim(), selectedDays);
    if (success) {
      setShowAddModal(false);
      setHabitName('');
      setSelectedDays([]);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const success = await toggleHabitTracking(habitId, dateString);
    
    if (success) {
      // Refresh the selected date habits
      fetchHabitsForDate(selectedDate);
    }
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatSelectedDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today's Habits";
    }
    return `Habits for ${date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  };

  const calendarDays = generateCalendarDays(currentDate);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Text style={styles.monthTitle}>{formatMonth(currentDate)}</Text>
          
          {/* Days of week header */}
          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.calendarDay}
                onPress={() => date && handleDateSelect(date)}
                disabled={!date || isFutureDate(date)}
              >
                {date && (
                  <View style={[
                    styles.dayCell,
                    isToday(date) && styles.todayCell,
                    isSelectedDate(date) && styles.selectedDateCell,
                    isFutureDate(date) && styles.futureDayCell
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isToday(date) && styles.todayText,
                      isSelectedDate(date) && styles.selectedDateText,
                      isFutureDate(date) && styles.futureDayText
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.habitsContainer}>
          <View style={styles.habitsHeader}>
            <Text style={styles.habitsTitle}>{formatSelectedDate(selectedDate)}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Habit</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
            </View>
          )}

          {!loading && selectedDateHabits.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No habits for this day</Text>
              <Text style={styles.emptyStateSubtext}>Add a habit to get started!</Text>
            </View>
          )}

          {!loading && selectedDateHabits.map((habit) => (
            <View key={habit._id} style={styles.habitItem}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitStreak}>
                  Current streak: {habit.currentStreak} days
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.habitToggle,
                  habit.completedToday && styles.habitToggleCompleted
                ]}
                onPress={() => handleToggleHabit(habit._id)}
              >
                <Text style={[
                  styles.habitToggleText,
                  habit.completedToday && styles.habitToggleTextCompleted
                ]}>
                  {habit.completedToday ? '✓' : '○'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Habit</Text>
            <TouchableOpacity onPress={handleAddHabit}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Habit Name</Text>
              <TextInput
                style={styles.textInput}
                value={habitName}
                onChangeText={setHabitName}
                placeholder="e.g., Drink 8 glasses of water"
                placeholderTextColor="#999999"
                autoFocus
              />
            </View>

            <View style={styles.daysContainer}>
              <Text style={styles.inputLabel}>Track on these days</Text>
              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(index) && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      selectedDays.includes(index) && styles.dayButtonTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {selectedDays.length > 0 && (
                <Text style={styles.selectedDaysText}>
                  Selected: {selectedDays.map(i => FULL_DAYS[i]).join(', ')}
                </Text>
              )}
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  
  // Calendar Styles
  calendarContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.285%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: '#000000',
  },
  selectedDateCell: {
    backgroundColor: '#000000',
  },
  futureDayCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: '#000000',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  futureDayText: {
    color: '#999999',
  },

  // Habits Styles
  habitsContainer: {
    padding: 16,
  },
  habitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
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
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  habitStreak: {
    fontSize: 14,
    color: '#333333',
  },
  habitToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitToggleCompleted: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  habitToggleText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  habitToggleTextCompleted: {
    color: '#FFFFFF',
  },

  // Modal Styles
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
  modalCancelText: {
    fontSize: 16,
    color: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  daysContainer: {
    marginBottom: 32,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#000000',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  selectedDaysText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
});

export default HabitTrackerScreen; 