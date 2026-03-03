import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/environment';

export interface ToDoItem {
  _id: string;
  userId: string;
  text: string;
  date: string;
  time?: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ToDoContextType {
  todos: ToDoItem[];
  loading: boolean;
  error: string | null;
  fetchTodos: (date?: string) => Promise<void>;
  createTodo: (text: string, date: string, time?: string) => Promise<ToDoItem | null>;
  updateTodo: (id: string, updates: { text?: string; time?: string }) => Promise<ToDoItem | null>;
  toggleComplete: (id: string) => Promise<ToDoItem | null>;
  deleteTodo: (id: string) => Promise<boolean>;
  clearError: () => void;
}

const ToDoContext = createContext<ToDoContextType | undefined>(undefined);

export const useToDoContext = () => {
  const context = useContext(ToDoContext);
  if (!context) {
    throw new Error('useToDoContext must be used within a ToDoProvider');
  }
  return context;
};

interface ToDoProviderProps {
  children: React.ReactNode;
}

export const ToDoProvider: React.FC<ToDoProviderProps> = ({ children }) => {
  const [todos, setTodos] = useState<ToDoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error.message || defaultMessage;
    setError(errorMessage);
    return null;
  };

  const fetchTodos = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const url = date 
        ? `${config.API_BASE_URL}/todo?date=${date}`
        : `${config.API_BASE_URL}/todo`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data);
        console.log('📝 ToDoContext: Fetched todos:', data.length);
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch todos');
      }
    } catch (error) {
      handleApiError(error, 'Error fetching todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = useCallback(async (text: string, date: string, time?: string): Promise<ToDoItem | null> => {
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return null;
      }

      const response = await fetch(`${config.API_BASE_URL}/todo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, date, time }),
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos(prev => [...prev, newTodo]);
        console.log('📝 ToDoContext: Created todo:', newTodo);
        return newTodo;
      } else {
        setError('Failed to create todo');
        return null;
      }
    } catch (error) {
      return handleApiError(error, 'Error creating todo');
    }
  }, []);

  const updateTodo = useCallback(async (id: string, updates: { text?: string; time?: string }): Promise<ToDoItem | null> => {
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return null;
      }

      const response = await fetch(`${config.API_BASE_URL}/todo/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo._id === id ? updatedTodo : todo
        ));
        console.log('📝 ToDoContext: Updated todo:', updatedTodo);
        return updatedTodo;
      } else {
        setError('Failed to update todo');
        return null;
      }
    } catch (error) {
      return handleApiError(error, 'Error updating todo');
    }
  }, []);

  const toggleComplete = useCallback(async (id: string): Promise<ToDoItem | null> => {
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return null;
      }

      const response = await fetch(`${config.API_BASE_URL}/todo/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(todo => 
          todo._id === id ? updatedTodo : todo
        ));
        console.log('📝 ToDoContext: Toggled completion:', updatedTodo);
        return updatedTodo;
      } else {
        setError('Failed to update todo');
        return null;
      }
    } catch (error) {
      return handleApiError(error, 'Error toggling todo completion');
    }
  }, []);

  const deleteTodo = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required');
        return false;
      }

      const response = await fetch(`${config.API_BASE_URL}/todo/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTodos(prev => prev.filter(todo => todo._id !== id));
        console.log('📝 ToDoContext: Deleted todo:', id);
        return true;
      } else {
        setError('Failed to delete todo');
        return false;
      }
    } catch (error) {
      handleApiError(error, 'Error deleting todo');
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ToDoContextType = {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    clearError,
  };

  return (
    <ToDoContext.Provider value={value}>
      {children}
    </ToDoContext.Provider>
  );
};