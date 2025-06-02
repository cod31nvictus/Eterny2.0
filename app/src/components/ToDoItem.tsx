import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { ToDoItem as ToDoItemType } from '../contexts/ToDoContext';

interface ToDoItemProps {
  todo: ToDoItemType;
  onToggleComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ToDoItem: React.FC<ToDoItemProps> = ({
  todo,
  onToggleComplete,
  onDelete,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const handleToggleComplete = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    
    try {
      // If completing the task, add a fade animation
      if (!todo.completed) {
        await onToggleComplete(todo._id);
        
        // Fade out animation for completed tasks
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // If uncompleting, just toggle without animation
        await onToggleComplete(todo._id);
        
        // Reset opacity for uncompleted tasks
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    
    // Convert 24-hour to 12-hour format
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatCompletedTime = (completedAt?: string) => {
    if (!completedAt) return null;
    
    const date = new Date(completedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.content}
        onPress={handleToggleComplete}
        disabled={isToggling}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            todo.completed && styles.checkboxCompleted
          ]}>
            {todo.completed && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.todoText,
            todo.completed && styles.todoTextCompleted
          ]}>
            {todo.text}
          </Text>
          
          {/* Time and completion info */}
          <View style={styles.metaContainer}>
            {todo.time && (
              <Text style={[
                styles.timeText,
                todo.completed && styles.timeTextCompleted
              ]}>
                🕐 {formatTime(todo.time)}
              </Text>
            )}
            
            {todo.completed && todo.completedAt && (
              <Text style={styles.completedText}>
                Completed {formatCompletedTime(todo.completedAt)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Delete button (only show for completed items or on long press) */}
      {todo.completed && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(todo._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 4,
  },
  todoTextCompleted: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  timeTextCompleted: {
    color: '#CCCCCC',
  },
  completedText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default ToDoItem;