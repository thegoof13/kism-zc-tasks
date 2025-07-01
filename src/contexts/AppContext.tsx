import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Task, TaskGroup, UserProfile, HistoryEntry } from '../types';
import { defaultGroups, defaultProfiles, defaultSettings } from '../utils/defaultData';
import { shouldResetTask } from '../utils/recurrence';
import { useAuth } from '../hooks/useAuth';
import { DatabaseService } from '../services/database';

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
  | { type: 'LOAD_STATE'; state: AppState }
  | { type: 'SET_LOADING'; loading: boolean };

const initialState: AppState = {
  tasks: [],
  groups: [],
  profiles: [],
  history: [],
  settings: defaultSettings,
  activeProfileId: '',
  loading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    case 'LOAD_STATE':
      return { ...action.state, loading: false };

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

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  syncWithDatabase: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Sync data with database
  const syncWithDatabase = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', loading: true });

      const [profiles, groups, tasks, history, settings] = await Promise.all([
        DatabaseService.getProfiles(user.id),
        DatabaseService.getTaskGroups(user.id),
        DatabaseService.getTasks(user.id),
        DatabaseService.getHistory(user.id),
        DatabaseService.getSettings(user.id),
      ]);

      // If no data exists, create default data
      if (profiles.length === 0) {
        const defaultProfile = await DatabaseService.createProfile(user.id, defaultProfiles[0]);
        profiles.push(defaultProfile);
      }

      if (groups.length === 0) {
        for (const group of defaultGroups) {
          const createdGroup = await DatabaseService.createTaskGroup(user.id, group);
          groups.push(createdGroup);
        }
      }

      const activeProfileId = settings?.activeProfileId || profiles[0]?.id || '';
      const appSettings = settings || defaultSettings;

      dispatch({
        type: 'LOAD_STATE',
        state: {
          tasks,
          groups,
          profiles,
          history,
          settings: appSettings,
          activeProfileId,
          loading: false,
        },
      });
    } catch (error) {
      console.error('Failed to sync with database:', error);
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      syncWithDatabase();
    } else {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [user]);

  // Sync changes to database when state changes
  useEffect(() => {
    if (!user || state.loading) return;

    const syncChanges = async () => {
      try {
        // Save settings
        await DatabaseService.updateSettings(user.id, {
          ...state.settings,
          activeProfileId: state.activeProfileId,
        });
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    };

    syncChanges();
  }, [user, state.settings, state.activeProfileId, state.loading]);

  return (
    <AppContext.Provider value={{ state, dispatch, syncWithDatabase }}>
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