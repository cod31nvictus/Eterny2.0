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
import { DayTemplate, ScheduledDay, AssignTemplateForm, CalendarResponse, Recurrence, RecurrenceEditOptions } from '../types';
import { api } from '../services/api';
import RecurrenceModal from '../components/RecurrenceModal';
import RecurrenceEditModal from '../components/RecurrenceEditModal';

const CalendarScreen: React.FC = () => {
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [scheduledDays, setScheduledDays] = useState<ScheduledDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DayTemplate | null>(null);
  const [recurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
  const [recurrenceEditModalVisible, setRecurrenceEditModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    template: DayTemplate;
    date: string;
    action: 'edit' | 'delete';
  } | null>(null);
  const [editTemplateModalVisible, setEditTemplateModalVisible] = useState(false);
  const [editRecurrenceModalVisible, setEditRecurrenceModalVisible] = useState(false);
  const [editingRecurrenceOptions, setEditingRecurrenceOptions] = useState<RecurrenceEditOptions | null>(null);
  const [dayActionModalVisible, setDayActionModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentWeek]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);
      
      const [templatesData, calendarData] = await Promise.all([
        api.templates.getAll(),
        api.calendar.getPlannedDays(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]),
      ]);
      
      setTemplates(templatesData);
      setScheduledDays(calendarData.scheduledDays || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getScheduledTemplate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledDays.find(day => day.date === dateStr);
  };

  const handleDatePress = (date: Date) => {
    const scheduledTemplate = getScheduledTemplate(date);
    
    if (scheduledTemplate && scheduledTemplate.templates.length > 0) {
      // If there's already a template, show action options (edit or remove)
      setEditingEvent({
        template: scheduledTemplate.templates[0].template,
        date: date.toISOString().split('T')[0],
        action: 'edit'
      });
      setDayActionModalVisible(true);
    } else {
      // If no template, show assignment modal
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  const handleEditTemplate = () => {
    // Close all other modals first
    setDayActionModalVisible(false);
    setEditTemplateModalVisible(false);
    setEditRecurrenceModalVisible(false);
    
    if (editingEvent) {
      setEditingEvent({ ...editingEvent, action: 'edit' });
      setRecurrenceEditModalVisible(true);
    }
  };

  const handleRemoveTemplate = () => {
    // Close all other modals first
    setDayActionModalVisible(false);
    setEditTemplateModalVisible(false);
    setEditRecurrenceModalVisible(false);
    
    if (editingEvent) {
      const scheduledTemplate = getScheduledTemplate(new Date(editingEvent.date));
      const isRecurring = scheduledTemplate?.templates[0]?.recurrence?.type !== 'none';
      
      if (isRecurring) {
        // For recurring templates, show recurrence edit modal to choose scope
        setEditingEvent({ ...editingEvent, action: 'delete' });
        setRecurrenceEditModalVisible(true);
      } else {
        // For single occurrence, show direct confirmation
        Alert.alert(
          'Remove Template',
          `Are you sure you want to remove "${editingEvent.template.name}" from ${formatDate(new Date(editingEvent.date))}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  const plannedDayId = scheduledTemplate?.templates[0]?.plannedDayId;
                  if (plannedDayId) {
                    await api.calendar.deleteRecurringEvent(plannedDayId, {
                      editType: 'this',
                      originalDate: editingEvent.date,
                    });
                    Alert.alert('Success', 'Template removed successfully');
                    await fetchData();
                  }
                } catch (error) {
                  console.error('Failed to remove template:', error);
                  Alert.alert('Error', 'Failed to remove template');
                } finally {
                  setEditingEvent(null);
                }
              },
            },
          ]
        );
      }
    }
  };

  const handleTemplateSelect = (template: DayTemplate) => {
    setSelectedTemplate(template);
    setModalVisible(false);
    setRecurrenceModalVisible(true);
  };

  const handleRecurrenceConfirm = async (recurrence: Recurrence) => {
    if (!selectedDate || !selectedTemplate) return;

    try {
      setSubmitting(true);
      
      const formData: AssignTemplateForm = {
        templateId: selectedTemplate._id,
        startDate: selectedDate.toISOString().split('T')[0],
        recurrence,
      };

      await api.calendar.assignTemplate(formData);
      await fetchData();
      setRecurrenceModalVisible(false);
      setSelectedTemplate(null);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to assign template:', error);
      Alert.alert('Error', 'Failed to assign template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTemplateSelect = (template: DayTemplate) => {
    setSelectedTemplate(template);
    setEditTemplateModalVisible(false);
    setEditRecurrenceModalVisible(true);
  };

  const handleEditRecurrenceConfirm = async (recurrence: Recurrence) => {
    if (!editingEvent || !editingRecurrenceOptions || !selectedTemplate) return;

    try {
      setSubmitting(true);
      
      // Get the planned day ID from the scheduled template
      const scheduledTemplate = getScheduledTemplate(new Date(editingEvent.date));
      if (!scheduledTemplate || scheduledTemplate.templates.length === 0) {
        Alert.alert('Error', 'Could not find scheduled template');
        return;
      }
      
      const plannedDayId = scheduledTemplate.templates[0].plannedDayId;
      

      
      await api.calendar.editRecurringEvent(plannedDayId, {
        editType: editingRecurrenceOptions.editType,
        originalDate: editingRecurrenceOptions.originalDate,
        newTemplate: selectedTemplate._id,
        newRecurrence: recurrence,
      });
      
      Alert.alert('Success', `Updated ${editingRecurrenceOptions.editType} occurrence(s)`);
      
      // Refresh the calendar data
      await fetchData();
      setEditRecurrenceModalVisible(false);
      setEditingEvent(null);
      setEditingRecurrenceOptions(null);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to edit recurring event:', error);
      Alert.alert('Error', 'Failed to edit recurring event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecurrenceEdit = async (options: RecurrenceEditOptions) => {
    if (!editingEvent) return;

    try {
      setSubmitting(true);
      
      // Get the planned day ID from the scheduled template
      const scheduledTemplate = getScheduledTemplate(new Date(editingEvent.date));
      if (!scheduledTemplate || scheduledTemplate.templates.length === 0) {
        Alert.alert('Error', 'Could not find scheduled template');
        return;
      }
      
      const plannedDayId = scheduledTemplate.templates[0].plannedDayId;
      

      
      if (editingEvent.action === 'delete') {
        console.log('Calling deleteRecurringEvent with:', {
          plannedDayId,
          editType: options.editType,
          originalDate: options.originalDate,
          templateName: editingEvent.template.name
        });
        
        await api.calendar.deleteRecurringEvent(plannedDayId, {
          editType: options.editType,
          originalDate: options.originalDate,
        });
        
        console.log('Delete API call completed successfully');
        Alert.alert('Success', `Deleted ${options.editType} occurrence(s)`);
        
        // Refresh the calendar data
        await fetchData();
        

        
        // Close all modals and reset all states
        setRecurrenceEditModalVisible(false);
        setEditTemplateModalVisible(false);
        setEditRecurrenceModalVisible(false);
        setDayActionModalVisible(false);
        setEditingEvent(null);
        setEditingRecurrenceOptions(null);
        setSelectedTemplate(null);
      } else {
        // For edit, show template selection modal
        setEditingRecurrenceOptions(options);
        setRecurrenceEditModalVisible(false);
        setEditTemplateModalVisible(true);
        return; // Don't close the editing flow yet
      }
    } catch (error) {
      console.error('Failed to edit recurring event:', error);
      Alert.alert('Error', 'Failed to edit recurring event');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  const weekDays = getWeekDays();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>
            {getWeekStart(currentWeek).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.content}>
        <View style={styles.calendarGrid}>
          {weekDays.map((date, index) => {
            const scheduledTemplate = getScheduledTemplate(date);
            const isDateToday = isToday(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  isDateToday && styles.todayCard,
                  scheduledTemplate && styles.scheduledCard
                ]}
                onPress={() => handleDatePress(date)}
              >
                <Text style={[
                  styles.dayDate,
                  isDateToday && styles.todayText
                ]}>
                  {formatDate(date)}
                </Text>
                
                {scheduledTemplate && scheduledTemplate.templates.length > 0 ? (
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>
                      {scheduledTemplate.templates[0].template.name}
                    </Text>
                    <Text style={styles.templateActivities}>
                      {scheduledTemplate.templates[0].template.timeBlocks.length} activities
                    </Text>
                    {scheduledTemplate.templates[0].recurrence.type !== 'none' && (
                      <View style={styles.recurrenceBadge}>
                        <Text style={styles.recurrenceText}>
                          {scheduledTemplate.templates[0].recurrence.type}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>No template</Text>
                    <Text style={styles.addTemplateText}>Tap to add</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Template Assignment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Assign Template
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.selectedDateText}>
              {selectedDate && formatDate(selectedDate)}
            </Text>

            {templates.length === 0 ? (
              <View style={styles.noTemplatesContainer}>
                <Text style={styles.noTemplatesText}>
                  No templates available. Create a template first to schedule activities.
                </Text>
              </View>
            ) : (
              <View style={styles.templatesContainer}>
                <Text style={styles.sectionTitle}>Choose a Template</Text>
                {templates.map((template) => (
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
                    </View>
                    
                    <TouchableOpacity
                      style={styles.selectTemplateButton}
                      onPress={() => handleTemplateSelect(template)}
                      disabled={submitting}
                    >
                      <Text style={styles.selectTemplateButtonText}>
                        Select & Configure Repeat
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Day Action Modal */}
      <Modal
        visible={dayActionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setDayActionModalVisible(false);
              setEditingEvent(null);
            }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Template Options
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            {editingEvent && (
              <>
                <Text style={styles.selectedDateText}>
                  {formatDate(new Date(editingEvent.date))}
                </Text>
                
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>
                    {editingEvent.template.name}
                  </Text>
                  {editingEvent.template.description && (
                    <Text style={styles.templateOptionDescription}>
                      {editingEvent.template.description}
                    </Text>
                  )}
                  <Text style={styles.templateActivities}>
                    {editingEvent.template.timeBlocks.length} activities
                  </Text>
                </View>

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditTemplate}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit Template</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveTemplate}
                  >
                    <Text style={styles.removeButtonText}>🗑️ Remove Template</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Enhanced Recurrence Modal */}
      {selectedDate && selectedTemplate && (
        <RecurrenceModal
          visible={recurrenceModalVisible}
          onClose={() => {
            setRecurrenceModalVisible(false);
            setSelectedTemplate(null);
            setSelectedDate(null);
          }}
          onConfirm={handleRecurrenceConfirm}
          initialDate={selectedDate}
        />
      )}

      {/* Recurrence Edit Modal */}
      {editingEvent && (
        <RecurrenceEditModal
          visible={recurrenceEditModalVisible}
          onClose={() => {
            setRecurrenceEditModalVisible(false);
            setEditTemplateModalVisible(false);
            setEditRecurrenceModalVisible(false);
            setDayActionModalVisible(false);
            setEditingEvent(null);
            setEditingRecurrenceOptions(null);
            setSelectedTemplate(null);
          }}
          onConfirm={handleRecurrenceEdit}
          eventTitle={editingEvent.template.name}
          eventDate={editingEvent.date}
          action={editingEvent.action}
        />
      )}

      {/* Edit Template Selection Modal */}
      <Modal
        visible={editTemplateModalVisible && editingEvent?.action === 'edit'}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setEditTemplateModalVisible(false);
              setEditingEvent(null);
              setEditingRecurrenceOptions(null);
            }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Edit Template
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.selectedDateText}>
              {editingEvent && `Editing: ${editingEvent.template.name}`}
            </Text>

            {templates.length === 0 ? (
              <View style={styles.noTemplatesContainer}>
                <Text style={styles.noTemplatesText}>
                  No templates available. Create a template first to schedule activities.
                </Text>
              </View>
            ) : (
              <View style={styles.templatesContainer}>
                <Text style={styles.sectionTitle}>Choose New Template</Text>
                {templates.map((template) => (
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
                    </View>
                    
                    <TouchableOpacity
                      style={styles.selectTemplateButton}
                      onPress={() => handleEditTemplateSelect(template)}
                      disabled={submitting}
                    >
                      <Text style={styles.selectTemplateButtonText}>
                        Select & Configure
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Recurrence Modal */}
      {selectedTemplate && editingEvent && editingRecurrenceOptions && (
        <RecurrenceModal
          visible={editRecurrenceModalVisible}
          onClose={() => {
            setEditRecurrenceModalVisible(false);
            setSelectedTemplate(null);
            setEditingEvent(null);
            setEditingRecurrenceOptions(null);
          }}
          onConfirm={handleEditRecurrenceConfirm}
          initialDate={new Date(editingEvent.date)}
          initialRecurrence={getScheduledTemplate(new Date(editingEvent.date))?.templates[0]?.recurrence}
        />
      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 18,
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
  content: {
    flex: 1,
    padding: 16,
  },
  calendarGrid: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  scheduledCard: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  todayText: {
    color: '#6366f1',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  templateActivities: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  recurrenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  addTemplateText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
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
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  recurrenceButtonText: {
    color: '#fff',
    fontSize: 14,
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
  actionButtonsContainer: {
    gap: 16,
    marginTop: 24,
  },
  editButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalendarScreen; 