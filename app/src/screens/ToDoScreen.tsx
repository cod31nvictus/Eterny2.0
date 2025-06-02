import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useToDoContext } from '../contexts/ToDoContext';
import ToDoInputRow from '../components/ToDoInputRow';
import ToDoItem from '../components/ToDoItem';

const ToDoScreen = () => {
  const {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    toggleComplete,
    deleteTodo,
    clearError,
  } = useToDoContext();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    console.log('📝 ToDoScreen: Loading todos for date:', selectedDate);
    fetchTodos(selectedDate);
  }, [selectedDate, fetchTodos]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodos(selectedDate);
    setRefreshing(false);
  };

  const handleCreateTodo = async (text: string, time?: string) => {
    const result = await createTodo(text, selectedDate, time);
    if (result) {
      setShowAddInput(false);
    }
    return result;
  };

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id);
  };

  const handleDeleteTodo = async (id: string) => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTodo(id)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Group todos by completion status
  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Navigation Header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => navigateDate('prev')}
        >
          <Text style={styles.dateNavText}>‹</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateContainer} onPress={goToToday}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateSubtext}>
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => navigateDate('next')}
        >
          <Text style={styles.dateNavText}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Add Todo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddInput(!showAddInput)}
            >
              <Text style={styles.addButtonText}>
                {showAddInput ? '−' : '+'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddInput && (
            <ToDoInputRow
              onSubmit={handleCreateTodo}
              onCancel={() => setShowAddInput(false)}
              placeholder="Add a new task..."
            />
          )}
        </View>

        {/* Incomplete Todos */}
        {incompleteTodos.length > 0 && (
          <View style={styles.todoList}>
            {incompleteTodos.map((todo) => (
              <ToDoItem
                key={todo._id}
                todo={todo}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTodo}
              />
            ))}
          </View>
        )}

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.completedSectionTitle}>
                Completed ({completedTodos.length})
              </Text>
            </View>
            <View style={styles.todoList}>
              {completedTodos.map((todo) => (
                <ToDoItem
                  key={todo._id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {todos.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks for this day</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to add your first task
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  dateNavButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  dateNavText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  dateSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  completedSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  todoList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 60,
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
    color: '#666666',
    textAlign: 'center',
  },
});

export default ToDoScreen; 