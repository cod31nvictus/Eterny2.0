// User Types
export interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

// Wellness Category Types
export interface WellnessCategory {
  _id: string;
  name: string;
  type: 'wellness' | 'drain';
  color: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryForm {
  name: string;
  type: 'wellness' | 'drain';
  color: string;
  description?: string;
}

// Activity Type Types
export interface ActivityType {
  _id: string;
  name: string;
  wellnessTagIds: WellnessCategory[];
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityForm {
  name: string;
  wellnessTagIds: string[];
  description?: string;
}

// Day Dimension Types
export interface DimensionValue {
  _id: string;
  name: string;
  description?: string;
  order: number;
}

export interface DayDimension {
  _id: string;
  name: string;
  description?: string;
  values: DimensionValue[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Time Block Types
export interface TimeBlock {
  _id?: string;
  activityTypeId: string | ActivityType;
  blockName?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  order: number;
}

// Template Dimension Value Types
export interface TemplateDimensionValue {
  dimensionId: string;
  valueId: string;
  valueName: string;
}

// Day Template Types
export interface DayTemplate {
  _id: string;
  name: string;
  description?: string;
  dimensionValues: TemplateDimensionValue[];
  timeBlocks: TimeBlock[];
  tags: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateForm {
  name: string;
  description?: string;
  dimensionValues: TemplateDimensionValue[];
  timeBlocks: Omit<TimeBlock, '_id'>[];
  tags: string[];
}

// Calendar Types
export interface Recurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. for weekly
  daysOfMonth?: number[]; // 1-31 for monthly
  monthsOfYear?: number[]; // 1-12 for yearly
  endDate?: string; // When recurrence ends
  count?: number; // Number of occurrences (alternative to endDate)
  bySetPos?: number[]; // For complex patterns like "2nd Tuesday"
}

export interface RecurrenceException {
  originalDate: string;
  action: 'delete' | 'modify';
  modifiedTemplate?: string; // If action is 'modify'
  reason?: string;
}

export interface RecurrenceEditOptions {
  editType: 'this' | 'thisAndFuture' | 'all';
  originalDate: string;
}

export interface PlannedDay {
  _id: string;
  templateId: string | DayTemplate;
  date: string;
  recurrence: Recurrence;
  notes?: string;
  exceptions: RecurrenceException[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledTemplate {
  plannedDayId: string;
  template: DayTemplate;
  recurrence: Recurrence;
  notes?: string;
}

export interface ScheduledDay {
  date: string;
  templates: ScheduledTemplate[];
}

export interface CalendarResponse {
  scheduledDays: ScheduledDay[];
  totalDays: number;
}

export interface AssignTemplateForm {
  templateId: string;
  startDate: string;
  endDate?: string;
  recurrence: Recurrence;
  notes?: string;
}

// Summary Types
export interface CategorySummary {
  name: string;
  type: 'wellness' | 'drain';
  color: string;
  totalMinutes: number;
  daysActive: number;
  averagePerDay: number;
}

export interface ActivitySummary {
  name: string;
  totalMinutes: number;
  daysActive: number;
  averagePerDay: number;
}

export interface DaySummary {
  date: string;
  totalMinutes: number;
  wellnessScore: number;
  activitiesCount: number;
}

export interface WellnessSummary {
  totalMinutes: number;
  wellnessScore: number;
  totalDays: number;
  byCategory: Record<string, CategorySummary>;
  byActivity: Record<string, ActivitySummary>;
  byDay: DaySummary[];
}

export interface QuickStats {
  todayMinutes: number;
  todayScore: number;
  weekMinutes: number;
  weekScore: number;
  monthMinutes: number;
  monthScore: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: any;
} 