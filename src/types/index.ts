export type RecurrenceType = 
  | 'meals'      // Multiple meal times
  | 'days'       // Specific days of week
  | 'daily'
  | 'weekly'
  | 'fortnightly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';

export type CompletedDisplayMode = 'grey-out' | 'grey-drop' | 'separate-completed';

export interface Task {
  id: string;
  title: string;
  groupId: string;
  recurrence: RecurrenceType;
  recurrenceConfig?: {
    meals?: ('breakfast' | 'lunch' | 'dinner' | 'nightcap')[];
    days?: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]; // 0 = Sunday, 1 = Monday, etc.
  };
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  profiles: string[];
  order: number;
  dueDate?: Date;
  recurrenceFromDate?: Date; // Not available for meal-based tasks
  enableNotifications?: boolean;
}

export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  completedDisplayMode: CompletedDisplayMode;
  isCollapsed: boolean;
  order: number;
  createdAt: Date;
  enableDueDates: boolean;
  sortByDueDate: boolean;
  defaultNotifications?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
  createdAt: Date;
  isTaskCompetitor?: boolean;
  pin?: string;
  permissions?: {
    canEditTasks: boolean;
    canCreateTasks: boolean;
    canDeleteTasks: boolean;
  };
  mealTimes?: {
    breakfast: string; // Time in HH:MM format (24-hour)
    lunch: string;
    dinner: string;
    nightcap: string;
  };
}

export interface HistoryEntry {
  id: string;
  taskId: string;
  profileId: string;
  action: 'completed' | 'unchecked' | 'reset' | 'restored';
  timestamp: Date;
  taskTitle: string;
  profileName: string;
  details?: string;
}

export interface AISettings {
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  enabled: boolean;
}

export interface AIQuery {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  userId: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  showCompletedCount: boolean;
  enableNotifications: boolean;
  autoArchiveCompleted: boolean;
  archiveDays: number;
  ai: AISettings;
  settingsPassword?: string;
  showTopCollaborator: boolean;
}

export interface AppState {
  tasks: Task[];
  groups: TaskGroup[];
  profiles: UserProfile[];
  history: HistoryEntry[];
  settings: AppSettings;
  activeProfileId: string;
  loading?: boolean;
}