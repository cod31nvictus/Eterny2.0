import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RecurrenceEditOptions } from '../types';

interface RecurrenceEditModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (options: RecurrenceEditOptions) => void;
  eventTitle: string;
  eventDate: string;
  action: 'edit' | 'delete';
}

const RecurrenceEditModal: React.FC<RecurrenceEditModalProps> = ({
  visible,
  onClose,
  onConfirm,
  eventTitle,
  eventDate,
  action,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleOption = (editType: 'this' | 'thisAndFuture' | 'all') => {
    const options: RecurrenceEditOptions = {
      editType,
      originalDate: eventDate,
    };
    onConfirm(options);
  };

  const getActionText = () => {
    return action === 'delete' ? 'delete' : 'change';
  };

  const getActionTitle = () => {
    return action === 'delete' ? 'Delete recurring event' : 'Change recurring event';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{getActionTitle()}</Text>
            <Text style={styles.subtitle}>
              "{eventTitle}" on {formatDate(eventDate)}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.question}>
              Do you want to {getActionText()} only this event, or this and all future events, or all events in the series?
            </Text>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOption('this')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>This event only</Text>
                <Text style={styles.optionDescription}>
                  {action === 'delete' 
                    ? 'Only this occurrence will be deleted'
                    : 'Only this occurrence will be changed'
                  }
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOption('thisAndFuture')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>This and following events</Text>
                <Text style={styles.optionDescription}>
                  {action === 'delete' 
                    ? 'This and all future occurrences will be deleted'
                    : 'This and all future occurrences will be changed'
                  }
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOption('all')}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>All events</Text>
                <Text style={styles.optionDescription}>
                  {action === 'delete' 
                    ? 'All occurrences in the series will be deleted'
                    : 'All occurrences in the series will be changed'
                  }
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
  question: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default RecurrenceEditModal; 