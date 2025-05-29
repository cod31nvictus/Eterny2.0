import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  WellnessCategory,
  CreateCategoryForm,
  ActivityType,
  CreateActivityForm,
  DayDimension,
  DayTemplate,
  CreateTemplateForm,
  CalendarResponse,
  AssignTemplateForm,
  WellnessSummary,
  QuickStats,
} from '../types';

const BASE_URL = 'http://10.0.2.2:5001/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAuthToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && {Authorization: `Bearer ${token}`}),
        ...options.headers,
      },
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        await AsyncStorage.removeItem('token');
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth API
  auth = {
    getCurrentUser: (): Promise<User> =>
      this.makeRequest<User>('/auth/me'),

    logout: async (): Promise<void> => {
      await AsyncStorage.removeItem('token');
      return this.makeRequest<void>('/auth/logout', {method: 'POST'});
    },

    setToken: async (token: string): Promise<void> => {
      await AsyncStorage.setItem('token', token);
    },
  };

  // Categories API
  categories = {
    getAll: (): Promise<WellnessCategory[]> =>
      this.makeRequest<WellnessCategory[]>('/categories'),

    create: (data: CreateCategoryForm): Promise<WellnessCategory> =>
      this.makeRequest<WellnessCategory>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CreateCategoryForm): Promise<WellnessCategory> =>
      this.makeRequest<WellnessCategory>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      this.makeRequest<void>(`/categories/${id}`, { method: 'DELETE' }),
  };

  // Activities API
  activities = {
    getAll: (): Promise<ActivityType[]> =>
      this.makeRequest<ActivityType[]>('/activities'),

    create: (data: CreateActivityForm): Promise<ActivityType> =>
      this.makeRequest<ActivityType>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CreateActivityForm): Promise<ActivityType> =>
      this.makeRequest<ActivityType>(`/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      this.makeRequest<void>(`/activities/${id}`, { method: 'DELETE' }),
  };

  // Dimensions API
  dimensions = {
    getAll: (): Promise<DayDimension[]> =>
      this.makeRequest<DayDimension[]>('/dimensions'),

    create: (data: { name: string; description?: string; values: { name: string; description?: string }[] }): Promise<DayDimension> =>
      this.makeRequest<DayDimension>('/dimensions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { name: string; description?: string; values: { name: string; description?: string }[] }): Promise<DayDimension> =>
      this.makeRequest<DayDimension>(`/dimensions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      this.makeRequest<void>(`/dimensions/${id}`, { method: 'DELETE' }),
  };

  // Templates API
  templates = {
    getAll: (): Promise<DayTemplate[]> =>
      this.makeRequest<DayTemplate[]>('/templates'),

    create: (data: CreateTemplateForm): Promise<DayTemplate> =>
      this.makeRequest<DayTemplate>('/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CreateTemplateForm): Promise<DayTemplate> =>
      this.makeRequest<DayTemplate>(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      this.makeRequest<void>(`/templates/${id}`, { method: 'DELETE' }),
  };

  // Calendar API
  calendar = {
    getPlannedDays: (startDate: string, endDate: string): Promise<CalendarResponse> =>
      this.makeRequest<CalendarResponse>(
        `/calendar?start=${startDate}&end=${endDate}`
      ),

    getDaySchedule: (date: string): Promise<CalendarResponse> =>
      this.makeRequest<CalendarResponse>(`/calendar/${date}`),

    assignTemplate: (data: AssignTemplateForm): Promise<void> =>
      this.makeRequest<void>('/calendar/assign-template', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    editRecurringEvent: (
      plannedDayId: string,
      options: {
        editType: 'this' | 'thisAndFuture' | 'all';
        originalDate: string;
        newTemplate?: string;
        newRecurrence?: any;
      }
    ): Promise<void> =>
      this.makeRequest<void>(`/calendar/planned/${plannedDayId}/edit-recurring`, {
        method: 'PUT',
        body: JSON.stringify(options),
      }),

    deleteRecurringEvent: (
      plannedDayId: string,
      options: {
        editType: 'this' | 'thisAndFuture' | 'all';
        originalDate: string;
      }
    ): Promise<void> => {
      console.log('API deleteRecurringEvent called with:', {
        plannedDayId,
        options,
        url: `/calendar/planned/${plannedDayId}/delete-recurring`
      });
      return this.makeRequest<void>(`/calendar/planned/${plannedDayId}/delete-recurring`, {
        method: 'DELETE',
        body: JSON.stringify(options),
      });
    },

    // Google Calendar sync methods
    getSyncStatus: (): Promise<{ enabled: boolean; hasTokens: boolean }> =>
      this.makeRequest<{ enabled: boolean; hasTokens: boolean }>('/calendar/sync/status'),

    enableSync: (): Promise<{ success: boolean; message: string }> =>
      this.makeRequest<{ success: boolean; message: string }>('/calendar/sync/enable', {
        method: 'POST',
      }),

    disableSync: (): Promise<{ success: boolean; message: string }> =>
      this.makeRequest<{ success: boolean; message: string }>('/calendar/sync/disable', {
        method: 'POST',
      }),

    syncToday: (date: string): Promise<{ success: boolean; message: string; eventsCreated: number }> =>
      this.makeRequest<{ success: boolean; message: string; eventsCreated: number }>(`/calendar/sync/${date}`, {
        method: 'POST',
      }),
  };

  // Profile API
  profile = {
    get: (): Promise<{
      fullName: string;
      dateOfBirth: string;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    }> =>
      this.makeRequest<{
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
      }>('/profile'),

    update: (data: {
      fullName: string;
      dateOfBirth: string;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    }): Promise<{
      fullName: string;
      dateOfBirth: string;
      gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    }> =>
      this.makeRequest<{
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
      }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    checkCompletion: (): Promise<{
      hasProfile: boolean;
      isComplete: boolean;
    }> =>
      this.makeRequest<{
        hasProfile: boolean;
        isComplete: boolean;
      }>('/profile/completion'),
  };

  // Summary API
  summary = {
    getWellnessSummary: (
      startDate: string,
      endDate: string,
      options?: { includeDrains?: boolean }
    ): Promise<WellnessSummary> => {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        ...(options?.includeDrains !== undefined && { includeDrains: options.includeDrains.toString() }),
      });
      return this.makeRequest<WellnessSummary>(`/summary?${params}`);
    },

    getQuickStats: (): Promise<QuickStats> =>
      this.makeRequest<QuickStats>('/summary/quick-stats'),

    getTrends: (
      startDate: string,
      endDate: string,
      period: 'daily' | 'weekly'
    ): Promise<WellnessSummary[]> => {
      const params = new URLSearchParams({ 
        start: startDate, 
        end: endDate, 
        interval: period 
      });
      return this.makeRequest<WellnessSummary[]>(`/summary/trends?${params}`);
    },
  };
}

export const api = new ApiService();
export default api; 