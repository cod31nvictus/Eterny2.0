import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/environment';

// Types
export interface Habit {
  _id: string;
  name: string;
  trackingDays: number[]; // 0 = Monday, 1 = Tuesday, ... 6 = Sunday
  currentStreak: number;
  completedToday?: boolean;
  trackingId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HabitContextType {
  habits: Habit[];
  todayHabits: Habit[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  fetchTodayHabits: () => Promise<void>;
  fetchHabitsForDate: (date: string) => Promise<Habit[]>;
  createHabit: (name: string, trackingDays: number[]) => Promise<Habit | null>;
  toggleHabitTracking: (habitId: string, date: string) => Promise<boolean>;
  deleteHabit: (habitId: string) => Promise<boolean>;
  clearError: () => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const useHabitContext = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabitContext must be used within a HabitProvider');
  }
  return context;
};

interface HabitProviderProps {
  children: ReactNode;
}

export const HabitProvider: React.FC<HabitProviderProps> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('Habit API Error:', error);
    const message = error.response?.data?.error || error.message || defaultMessage;
    setError(message);
    return null;
  };

  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setHabits(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch habits');
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits/today`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setTodayHabits(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch today habits');
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch today habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitsForDate = async (date: string): Promise<Habit[]> => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits/date/${date}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch habits for date');
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch habits for date');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (name: string, trackingDays: number[]): Promise<Habit | null> => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, trackingDays }),
      });

      if (response.ok) {
        const newHabit = await response.json();
        setHabits(prev => [newHabit, ...prev]);
        
        // Refresh today habits if the new habit should be tracked today
        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        if (trackingDays.includes(dayOfWeek)) {
          await fetchTodayHabits();
        }
        
        return newHabit;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create habit');
      }
    } catch (error) {
      handleApiError(error, 'Failed to create habit');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitTracking = async (habitId: string, date: string): Promise<boolean> => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits/${habitId}/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update today habits if tracking today
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
          setTodayHabits(prev => 
            prev.map(habit => 
              habit._id === habitId 
                ? { 
                    ...habit, 
                    completedToday: result.completed, 
                    currentStreak: result.currentStreak 
                  }
                : habit
            )
          );
        }

        // Update all habits streak
        setHabits(prev => 
          prev.map(habit => 
            habit._id === habitId 
              ? { ...habit, currentStreak: result.currentStreak }
              : habit
          )
        );

        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track habit');
      }
    } catch (error) {
      handleApiError(error, 'Failed to track habit');
      return false;
    }
  };

  const deleteHabit = async (habitId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${config.API_BASE_URL}/habits/${habitId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setHabits(prev => prev.filter(habit => habit._id !== habitId));
        setTodayHabits(prev => prev.filter(habit => habit._id !== habitId));
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete habit');
      }
    } catch (error) {
      handleApiError(error, 'Failed to delete habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: HabitContextType = {
    habits,
    todayHabits,
    loading,
    error,
    fetchHabits,
    fetchTodayHabits,
    fetchHabitsForDate,
    createHabit,
    toggleHabitTracking,
    deleteHabit,
    clearError,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
}; 