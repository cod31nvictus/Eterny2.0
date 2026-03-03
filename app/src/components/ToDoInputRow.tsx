import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface ToDoInputRowProps {
  onSubmit: (text: string, time?: string) => Promise<any>;
  onCancel: () => void;
  placeholder?: string;
  initialText?: string;
  initialTime?: string;
}

const ToDoInputRow: React.FC<ToDoInputRowProps> = ({
  onSubmit,
  onCancel,
  placeholder = "Add a new task...",
  initialText = "",
  initialTime = "",
}) => {
  const [text, setText] = useState(initialText);
  const [time, setTime] = useState(initialTime);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus the text input when component mounts
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  const validateTime = (timeString: string): boolean => {
    if (!timeString) return true; // Empty time is valid
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    // Remove any non-digit characters except colon
    let cleaned = timeString.replace(/[^\d:]/g, '');
    
    // Auto-add colon after 2 digits
    if (cleaned.length === 2 && !cleaned.includes(':')) {
      cleaned = cleaned + ':';
    }
    
    // Limit to HH:MM format
    if (cleaned.length > 5) {
      cleaned = cleaned.substring(0, 5);
    }
    
    return cleaned;
  };

  const handleTimeChange = (timeString: string) => {
    const formatted = formatTime(timeString);
    setTime(formatted);
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    if (time && !validateTime(time)) {
      Alert.alert('Error', 'Please enter a valid time in HH:MM format');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(text.trim(), time || undefined);
      if (result) {
        setText('');
        setTime('');
        setShowTimeInput(false);
      }
    } catch (error) {
      console.error('Error submitting todo:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setTime('');
    setShowTimeInput(false);
    onCancel();
  };

  return (
    <View style={styles.container}>
      {/* Main input row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={!submitting}
        />
        
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimeInput(!showTimeInput)}
          disabled={submitting}
        >
          <Text style={[
            styles.timeButtonText,
            showTimeInput && styles.timeButtonTextActive
          ]}>
            🕐
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time input row (conditional) */}
      {showTimeInput && (
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Time:</Text>
          <TextInput
            style={styles.timeInput}
            value={time}
            onChangeText={handleTimeChange}
            placeholder="HH:MM"
            placeholderTextColor="#999999"
            keyboardType="numeric"
            maxLength={5}
            editable={!submitting}
          />
          <TouchableOpacity
            style={styles.clearTimeButton}
            onPress={() => setTime('')}
            disabled={submitting}
          >
            <Text style={styles.clearTimeText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          <Text style={[
            styles.submitButtonText,
            submitting && styles.submitButtonTextDisabled
          ]}>
            {submitting ? 'Adding...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  timeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  timeButtonText: {
    fontSize: 18,
    opacity: 0.6,
  },
  timeButtonTextActive: {
    opacity: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    width: 40,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  clearTimeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearTimeText: {
    fontSize: 14,
    color: '#6366f1',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default ToDoInputRow; 