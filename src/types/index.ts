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
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
  createdAt: Date;
}

export interface HistoryEntry {
  id: string;
  taskId: string;
  profileId: string;
  action: 'completed' | 'uncompleted';
  timestamp: Date;
  taskTitle: string;
  profileName: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  showCompletedCount: boolean;
  enableNotifications: boolean;
  autoArchiveCompleted: boolean;
  archiveDays: number;
}

export interface AppState {
  tasks: Task[];
  groups: TaskGroup[];
  profiles: UserProfile[];
  history: HistoryEntry[];
  settings: AppSettings;
  activeProfileId: string;
}