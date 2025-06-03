import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
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
    fetchHabitsForDate: fetchHabitsForDateFromAPI,
    createHabit, 
    toggleHabitTracking,
    deleteHabit,
    clearError 
  } = useHabitContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
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
  }, [selectedDate, habits, todayHabits]);

  const fetchHabitsForDate = async (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // For today, use the todayHabits data which includes completion status
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      setSelectedDateHabits(todayHabits);
    } else {
      // For other dates, fetch from API with actual completion status
      const habitsForDate = await fetchHabitsForDateFromAPI(dateString);
      setSelectedDateHabits(habitsForDate);
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      // Remove duplicates by using Set
      const uniqueDays = [...new Set(prev)];
      return uniqueDays.includes(dayIndex)
        ? uniqueDays.filter(d => d !== dayIndex)
        : [...uniqueDays, dayIndex].sort((a, b) => a - b); // Keep sorted order
    });
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

  const handleInfoPress = (habit: any) => {
    setSelectedHabit(habit);
    setHabitName(habit.name);
    setSelectedDays(habit.trackingDays);
    setShowInfoModal(true);
  };

  const handleUpdateHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    // For now, we'll delete the old habit and create a new one
    const deleteSuccess = await deleteHabit(selectedHabit._id);
    if (deleteSuccess) {
      const createSuccess = await createHabit(habitName.trim(), selectedDays);
      if (createSuccess) {
        setShowInfoModal(false);
        setSelectedHabit(null);
        setHabitName('');
        setSelectedDays([]);
      }
    }
  };

  const handleDeleteHabit = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${selectedHabit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteHabit(selectedHabit._id);
            if (success) {
              setShowInfoModal(false);
              setSelectedHabit(null);
              setHabitName('');
              setSelectedDays([]);
            }
          }
        }
      ]
    );
  };

  const formatMonth = (date: Date) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${year}`;
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
          {/* Month Navigation Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.monthNavText}>{'<'}</Text>
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>{formatMonth(currentDate)}</Text>
            
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.monthNavText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          
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
            <SwipeableHabitItem
              key={habit._id}
              habit={habit}
              onInfoPress={() => handleInfoPress(habit)}
              onToggle={async () => {
                const dateString = selectedDate.toISOString().split('T')[0];
                const success = await toggleHabitTracking(habit._id, dateString);
                if (success) {
                  // Refresh the habits for the selected date to get updated completion status
                  await fetchHabitsForDate(selectedDate);
                  
                  // If we tracked for today, also refresh today's habits
                  const today = new Date().toISOString().split('T')[0];
                  if (dateString === today) {
                    await fetchTodayHabits();
                  }
                  
                  // Always refresh the global habits list to update streaks
                  await fetchHabits();
                }
              }}
            />
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

      {/* Habit Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            <TouchableOpacity onPress={handleUpdateHabit}>
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

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDeleteHabit}
            >
              <Text style={styles.deleteButtonText}>Delete Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Swipeable Habit Item Component
const SwipeableHabitItem: React.FC<{
  habit: any;
  onInfoPress: () => void;
  onToggle: () => void;
}> = ({ habit, onInfoPress, onToggle }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [localCompleted, setLocalCompleted] = useState(habit.completedToday);

  // Update local state when habit prop changes
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
      const threshold = 100;
      
      if (Math.abs(translationX) > threshold) {
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
      {/* Swipeable card */}
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
              <View style={styles.habitNameWithInfo}>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={onInfoPress}
                >
                  <Text style={styles.infoIcon}>ⓘ</Text>
                </TouchableOpacity>
                <Text style={styles.habitName}>{habit.name}</Text>
              </View>
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
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
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  habitNameWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoIcon: {
    fontSize: 14,
    color: '#000000',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 32,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeContainer: {
    flex: 1,
  },
});

export default HabitTrackerScreen; 