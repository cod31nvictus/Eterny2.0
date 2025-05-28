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
  };

  // Summary API
  summary = {
    getWellnessSummary: (
      startDate: string,
      endDate: string,
      options?: { includeDrains?: boolean }
    ): Promise<WellnessSummary> => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(options?.includeDrains && { includeDrains: 'true' }),
      });
      return this.makeRequest<WellnessSummary>(`/summary/wellness?${params}`);
    },

    getQuickStats: (): Promise<QuickStats> =>
      this.makeRequest<QuickStats>('/summary/quick-stats'),

    getTrends: (
      startDate: string,
      endDate: string,
      period: 'daily' | 'weekly'
    ): Promise<WellnessSummary[]> => {
      const params = new URLSearchParams({ startDate, endDate, period });
      return this.makeRequest<WellnessSummary[]>(`/summary/trends?${params}`);
    },
  };
}

export const api = new ApiService();
export default api; 