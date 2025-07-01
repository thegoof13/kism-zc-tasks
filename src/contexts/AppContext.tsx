import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Task, TaskGroup, UserProfile, HistoryEntry } from '../types';
import { defaultGroups, defaultProfiles, defaultSettings, sampleTasks } from '../utils/defaultData';
import { shouldResetTask } from '../utils/recurrence';

type AppAction = 
  | { type: 'TOGGLE_TASK'; taskId: string; profileId: string }
  | { type: 'ADD_TASK'; task: Omit<Task, 'id' | 'createdAt' | 'order'> }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'RESTORE_TASK'; taskId: string }
  | { type: 'RESET_TASK'; taskId: string }
  | { type: 'UNCHECK_TASK'; taskId: string; profileId: string }
  | { type: 'ADD_GROUP'; group: Omit<TaskGroup, 'id' | 'createdAt' | 'order'> }
  | { type: 'UPDATE_GROUP'; groupId: string; updates: Partial<TaskGroup> }
  | { type: 'DELETE_GROUP'; groupId: string }
  | { type: 'TOGGLE_GROUP_COLLAPSE'; groupId: string }
  | { type: 'ADD_PROFILE'; profile: Omit<UserProfile, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PROFILE'; profileId: string; updates: Partial<UserProfile> }
  | { type: 'DELETE_PROFILE'; profileId: string }
  | { type: 'SET_ACTIVE_PROFILE'; profileId: string }
  | { type: 'UPDATE_SETTINGS'; updates: Partial<AppState['settings']> }
  | { type: 'RESET_RECURRING_TASKS' }
  | { type: 'LOAD_STATE'; state: AppState };

const initialState: AppState = {
  tasks: sampleTasks,
  groups: defaultGroups,
  profiles: defaultProfiles,
  history: [],
  settings: defaultSettings,
  activeProfileId: 'default',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      const isCompleting = !task.isCompleted;
      const profile = state.profiles.find(p => p.id === action.profileId);
      
      const updatedTask = {
        ...task,
        isCompleted: isCompleting,
        completedBy: isCompleting ? action.profileId : undefined,
        completedAt: isCompleting ? new Date() : undefined,
      };

      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: action.profileId,
        action: isCompleting ? 'completed' : 'unchecked',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: profile?.name || 'Unknown',
        details: isCompleting ? 'Task marked as completed' : 'Task unchecked via toggle',
      };

      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.taskId ? updatedTask : t),
        history: [historyEntry, ...state.history],
      };
    }

    case 'UNCHECK_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task || !task.isCompleted) return state;

      const profile = state.profiles.find(p => p.id === action.profileId);
      
      const updatedTask = {
        ...task,
        isCompleted: false,
        completedBy: undefined,
        completedAt: undefined,
      };

      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: action.profileId,
        action: 'unchecked',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: profile?.name || 'Unknown',
        details: 'Task unchecked via menu - completion history preserved',
      };

      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.taskId ? updatedTask : t),
        history: [historyEntry, ...state.history],
      };
    }

    case 'ADD_TASK': {
      const maxOrder = Math.max(...state.tasks.filter(t => t.groupId === action.task.groupId).map(t => t.order), -1);
      const newTask: Task = {
        ...action.task,
        id: Date.now().toString(),
        createdAt: new Date(),
        order: maxOrder + 1,
      };
      
      return {
        ...state,
        tasks: [...state.tasks, newTask],
      };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.taskId ? { ...t, ...action.updates } : t
        ),
      };
    }

    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.taskId),
      };
    }

    case 'RESTORE_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      const updatedTask = {
        ...task,
        isCompleted: false,
        completedBy: undefined,
        completedAt: undefined,
      };

      // Create history entry for restore action
      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: state.activeProfileId,
        action: 'restored',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: state.profiles.find(p => p.id === state.activeProfileId)?.name || 'Unknown',
        details: 'Task restored - all completion history removed',
      };

      // Remove all previous history entries for this task
      const filteredHistory = state.history.filter(h => h.taskId !== action.taskId);

      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.taskId ? updatedTask : t),
        history: [historyEntry, ...filteredHistory],
      };
    }

    case 'RESET_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      const updatedTask = {
        ...task,
        isCompleted: false,
        completedBy: undefined,
        completedAt: undefined,
      };

      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: state.activeProfileId,
        action: 'reset',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: state.profiles.find(p => p.id === state.activeProfileId)?.name || 'Unknown',
        details: 'Task reset - unchecked but completion history preserved',
      };

      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.taskId ? updatedTask : t),
        history: [historyEntry, ...state.history],
      };
    }

    case 'ADD_GROUP': {
      const maxOrder = Math.max(...state.groups.map(g => g.order), -1);
      const newGroup: TaskGroup = {
        ...action.group,
        id: Date.now().toString(),
        createdAt: new Date(),
        order: maxOrder + 1,
      };
      
      return {
        ...state,
        groups: [...state.groups, newGroup],
      };
    }

    case 'UPDATE_GROUP': {
      return {
        ...state,
        groups: state.groups.map(g => 
          g.id === action.groupId ? { ...g, ...action.updates } : g
        ),
      };
    }

    case 'DELETE_GROUP': {
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.groupId),
        tasks: state.tasks.filter(t => t.groupId !== action.groupId),
      };
    }

    case 'TOGGLE_GROUP_COLLAPSE': {
      return {
        ...state,
        groups: state.groups.map(g => 
          g.id === action.groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
        ),
      };
    }

    case 'ADD_PROFILE': {
      const newProfile: UserProfile = {
        ...action.profile,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      
      return {
        ...state,
        profiles: [...state.profiles, newProfile],
      };
    }

    case 'UPDATE_PROFILE': {
      return {
        ...state,
        profiles: state.profiles.map(p => 
          p.id === action.profileId ? { ...p, ...action.updates } : p
        ),
      };
    }

    case 'DELETE_PROFILE': {
      const remainingProfiles = state.profiles.filter(p => p.id !== action.profileId);
      return {
        ...state,
        profiles: remainingProfiles,
        activeProfileId: state.activeProfileId === action.profileId 
          ? remainingProfiles[0]?.id || ''
          : state.activeProfileId,
      };
    }

    case 'SET_ACTIVE_PROFILE': {
      return {
        ...state,
        activeProfileId: action.profileId,
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.updates },
      };
    }

    case 'RESET_RECURRING_TASKS': {
      const updatedTasks = state.tasks.map(task => {
        if (task.isCompleted && task.completedAt && shouldResetTask(task.completedAt, task.recurrence)) {
          return {
            ...task,
            isCompleted: false,
            completedBy: undefined,
            completedAt: undefined,
          };
        }
        return task;
      });

      return {
        ...state,
        tasks: updatedTasks,
      };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('zentasks-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Convert date strings back to Date objects
        parsedState.tasks = parsedState.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        parsedState.groups = parsedState.groups.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
        }));
        parsedState.profiles = parsedState.profiles.map((profile: any) => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
        }));
        parsedState.history = parsedState.history.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        
        dispatch({ type: 'LOAD_STATE', state: parsedState });
      } catch (error) {
        console.warn('Failed to load saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('zentasks-state', JSON.stringify(state));
  }, [state]);

  // Reset recurring tasks on app load
  useEffect(() => {
    dispatch({ type: 'RESET_RECURRING_TASKS' });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}