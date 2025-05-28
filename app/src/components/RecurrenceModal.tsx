import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { Recurrence } from '../types';

interface RecurrenceModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (recurrence: Recurrence) => void;
  initialDate: Date;
  initialRecurrence?: Recurrence;
}

const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
  initialRecurrence,
}) => {
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(
    initialRecurrence?.type || 'none'
  );
  const [interval, setInterval] = useState(initialRecurrence?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialRecurrence?.daysOfWeek || [initialDate.getDay()]
  );
  const [monthlyPattern, setMonthlyPattern] = useState<'date' | 'day'>('date');
  const [hasEndDate, setHasEndDate] = useState(!!initialRecurrence?.endDate);
  const [endDate, setEndDate] = useState(initialRecurrence?.endDate || '');
  const [occurrenceCount, setOccurrenceCount] = useState(initialRecurrence?.count || 10);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  };

  const getDayName = (dayIndex: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
  };

  const handleConfirm = () => {
    const recurrence: Recurrence = {
      type: recurrenceType,
      interval,
      ...(recurrenceType === 'weekly' && { daysOfWeek: selectedDays }),
      ...(recurrenceType === 'monthly' && {
        ...(monthlyPattern === 'date' 
          ? { daysOfMonth: [initialDate.getDate()] }
          : { 
              daysOfWeek: [initialDate.getDay()],
              bySetPos: [getWeekOfMonth(initialDate)]
            }
        )
      }),
      ...(hasEndDate && endDate && { endDate }),
      ...(!hasEndDate && { count: occurrenceCount }),
    };

    onConfirm(recurrence);
  };

  const getRecurrencePreview = () => {
    if (recurrenceType === 'none') return 'Does not repeat';
    
    let preview = '';
    if (interval === 1) {
      switch (recurrenceType) {
        case 'daily':
          preview = 'Daily';
          break;
        case 'weekly':
          if (selectedDays.length === 7) {
            preview = 'Daily (every day of the week)';
          } else if (selectedDays.length === 1) {
            preview = `Weekly on ${getDayName(selectedDays[0])}`;
          } else {
            const daysList = selectedDays.map(d => dayNames[d]).join(', ');
            preview = `Weekly on ${daysList}`;
          }
          break;
        case 'monthly':
          if (monthlyPattern === 'date') {
            preview = `Monthly on the ${initialDate.getDate()}${getOrdinalSuffix(initialDate.getDate())}`;
          } else {
            const weekNum = getWeekOfMonth(initialDate);
            const dayName = getDayName(initialDate.getDay());
            const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
            preview = `Monthly on the ${ordinals[weekNum - 1]} ${dayName}`;
          }
          break;
        case 'yearly':
          preview = `Annually on ${monthNames[initialDate.getMonth()]} ${initialDate.getDate()}`;
          break;
      }
    } else {
      switch (recurrenceType) {
        case 'daily':
          preview = `Every ${interval} days`;
          break;
        case 'weekly':
          preview = `Every ${interval} weeks`;
          if (selectedDays.length > 0) {
            const daysList = selectedDays.map(d => dayNames[d]).join(', ');
            preview += ` on ${daysList}`;
          }
          break;
        case 'monthly':
          preview = `Every ${interval} months`;
          break;
        case 'yearly':
          preview = `Every ${interval} years`;
          break;
      }
    }

    if (hasEndDate && endDate) {
      preview += ` until ${endDate}`;
    } else if (!hasEndDate) {
      preview += ` for ${occurrenceCount} occurrences`;
    }

    return preview;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Repeat</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Recurrence Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            {['none', 'daily', 'weekly', 'monthly', 'yearly'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.option}
                onPress={() => setRecurrenceType(type as any)}
              >
                <Text style={styles.optionText}>
                  {type === 'none' ? 'Does not repeat' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <View style={[styles.radio, recurrenceType === type && styles.radioSelected]} />
              </TouchableOpacity>
            ))}
          </View>

          {recurrenceType !== 'none' && (
            <>
              {/* Interval */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Every</Text>
                <View style={styles.intervalContainer}>
                  <TextInput
                    style={styles.intervalInput}
                    value={interval.toString()}
                    onChangeText={(text) => setInterval(Math.max(1, parseInt(text) || 1))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.intervalLabel}>
                    {recurrenceType}{interval > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Weekly Day Selection */}
              {recurrenceType === 'weekly' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Repeat on</Text>
                  <View style={styles.daysContainer}>
                    {dayNames.map((day, index) => (
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
                </View>
              )}

              {/* Monthly Pattern */}
              {recurrenceType === 'monthly' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Repeat by</Text>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => setMonthlyPattern('date')}
                  >
                    <Text style={styles.optionText}>
                      Day of month ({initialDate.getDate()}{getOrdinalSuffix(initialDate.getDate())})
                    </Text>
                    <View style={[styles.radio, monthlyPattern === 'date' && styles.radioSelected]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => setMonthlyPattern('day')}
                  >
                    <Text style={styles.optionText}>
                      Day of week ({['First', 'Second', 'Third', 'Fourth', 'Fifth'][getWeekOfMonth(initialDate) - 1]} {getDayName(initialDate.getDay())})
                    </Text>
                    <View style={[styles.radio, monthlyPattern === 'day' && styles.radioSelected]} />
                  </TouchableOpacity>
                </View>
              )}

              {/* End Options */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ends</Text>
                <View style={styles.endOption}>
                  <Text style={styles.optionText}>On date</Text>
                  <Switch
                    value={hasEndDate}
                    onValueChange={setHasEndDate}
                    trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                    thumbColor={hasEndDate ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
                
                {hasEndDate ? (
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <View style={styles.countContainer}>
                    <Text style={styles.countLabel}>After</Text>
                    <TextInput
                      style={styles.countInput}
                      value={occurrenceCount.toString()}
                      onChangeText={(text) => setOccurrenceCount(Math.max(1, parseInt(text) || 1))}
                      keyboardType="numeric"
                    />
                    <Text style={styles.countLabel}>occurrences</Text>
                  </View>
                )}
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Summary</Text>
                <Text style={styles.previewText}>{getRecurrencePreview()}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  cancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  doneText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  radioSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    width: 60,
    textAlign: 'center',
    marginRight: 12,
  },
  intervalLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  dayButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  endOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  countLabel: {
    fontSize: 16,
    color: '#1e293b',
    marginHorizontal: 8,
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
});

export default RecurrenceModal; 