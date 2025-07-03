export type RecurrenceType = 
  | 'breakfast'
  | 'lunch' 
  | 'dinner'
  | 'daily'
  | 'work-daily'
  | 'weekend-daily'
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
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  profiles: string[];
  order: number;
  dueDate?: Date;
  recurrenceFromDate?: Date; // New field for when recurrence starts
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
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
  createdAt: Date;
  isTaskCompetitor?: boolean;
  pin?: string; // New field for profile PIN protection
  permissions?: {
    canEditTasks: boolean;
    canCreateTasks: boolean;
    canDeleteTasks: boolean;
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
  settingsPassword?: string; // New field for settings password protection
  showTopCollaborator: boolean; // New field for showing Top Collaborator in Trophy popup
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