import { TaskGroup, UserProfile, AppSettings, Task } from '../types';

export const defaultGroups: TaskGroup[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out',
    isCollapsed: false,
    order: 0,
    createdAt: new Date(),
    enableDueDates: false,
    sortByDueDate: false,
  },
  {
    id: 'work',
    name: 'Work',
    color: '#10B981',
    icon: 'Briefcase',
    completedDisplayMode: 'grey-drop',
    isCollapsed: false,
    order: 1,
    createdAt: new Date(),
    enableDueDates: true,
    sortByDueDate: true,
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    color: '#F59E0B',
    icon: 'Heart',
    completedDisplayMode: 'grey-out',
    isCollapsed: false,
    order: 2,
    createdAt: new Date(),
    enableDueDates: false,
    sortByDueDate: false,
  },
  {
    id: 'household',
    name: 'Household',
    color: '#8B5CF6',
    icon: 'Home',
    completedDisplayMode: 'separate-completed',
    isCollapsed: false,
    order: 3,
    createdAt: new Date(),
    enableDueDates: true,
    sortByDueDate: true,
  },
];

export const defaultProfiles: UserProfile[] = [
  {
    id: 'default',
    name: 'Me',
    color: '#6366F1',
    avatar: '👤',
    isActive: true,
    createdAt: new Date(),
    isTaskCompetitor: true, // Default to participating in competition
    permissions: {
      canEditTasks: true,
      canCreateTasks: true,
      canDeleteTasks: true,
    },
  },
];

export const defaultSettings: AppSettings = {
  theme: 'system',
  showCompletedCount: true,
  enableNotifications: true,
  autoArchiveCompleted: false,
  archiveDays: 30,
  showTopCollaborator: true, // Default to showing Top Collaborator
  ai: {
    apiKey: '',
    provider: 'openai',
    model: 'gpt-4',
    enabled: false,
  },
};

export const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Morning meditation',
    groupId: 'personal',
    recurrence: 'daily',
    isCompleted: false,
    createdAt: new Date(),
    profiles: ['default'],
    order: 0,
  },
  {
    id: 'task-2',
    title: 'Check emails',
    groupId: 'work',
    recurrence: 'work-daily',
    isCompleted: false,
    createdAt: new Date(),
    profiles: ['default'],
    order: 0,
  },
  {
    id: 'task-3',
    title: 'Take vitamins',
    groupId: 'health',
    recurrence: 'breakfast',
    isCompleted: false,
    createdAt: new Date(),
    profiles: ['default'],
    order: 0,
  },
  {
    id: 'task-4',
    title: 'Weekly meal prep',
    groupId: 'household',
    recurrence: 'weekly',
    isCompleted: false,
    createdAt: new Date(),
    profiles: ['default'],
    order: 0,
  },
  {
    id: 'task-5',
    title: 'Exercise routine',
    groupId: 'health',
    recurrence: 'daily',
    isCompleted: true,
    completedBy: 'default',
    completedAt: new Date(),
    createdAt: new Date(),
    profiles: ['default'],
    order: 1,
  },
];