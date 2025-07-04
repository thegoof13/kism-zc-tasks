import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Task, TaskGroup, UserProfile, HistoryEntry } from '../types';
import { defaultGroups, defaultProfiles, defaultSettings } from '../utils/defaultData';
import { shouldResetTask, calculateNextDueDate } from '../utils/recurrence';
import { ApiService } from '../services/api';

type AppAction = 
  | { type: 'TOGGLE_TASK'; taskId: string; profileId: string }
  | { type: 'TOGGLE_TASK_SUCCESS'; taskId: string; profileId: string }
  | { type: 'TOGGLE_TASK_FAILURE'; taskId: string }
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
  | { type: 'REORDER_GROUPS'; groupIds: string[] }
  | { type: 'ADD_PROFILE'; profile: Omit<UserProfile, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PROFILE'; profileId: string; updates: Partial<UserProfile> }
  | { type: 'DELETE_PROFILE'; profileId: string }
  | { type: 'REORDER_PROFILES'; profileIds: string[] }
  | { type: 'SET_ACTIVE_PROFILE'; profileId: string }
  | { type: 'UPDATE_SETTINGS'; updates: Partial<AppState['settings']> }
  | { type: 'RESET_RECURRING_TASKS' }
  | { type: 'LOAD_STATE'; state: AppState }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_TASK_UPDATE_STATUS'; taskId: string; status: 'pending' | 'success' | 'error' | null };

const initialState: AppState = {
  tasks: [],
  groups: defaultGroups,
  profiles: defaultProfiles,
  history: [],
  settings: defaultSettings,
  activeProfileId: 'default',
  loading: true,
  taskUpdateStatuses: new Map(), // Track update status for each task
};

// Helper function to calculate top competitor
function calculateTopCompetitor(history: HistoryEntry[], profiles: UserProfile[]): UserProfile | null {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentHistory = history.filter(entry => 
    new Date(entry.timestamp) >= fourteenDaysAgo
  );

  const completedActions = recentHistory.filter(entry => entry.action === 'completed');
  const uncheckedActions = recentHistory.filter(entry => entry.action === 'unchecked');

  const taskCompetitors = profiles.filter(profile => profile.isTaskCompetitor);
  
  const competitorStats = taskCompetitors.map(profile => {
    const profileCompletions = completedActions.filter(entry => 
      entry.profileId === profile.id
    ).length;
    
    const profileUnchecked = uncheckedActions.filter(entry => 
      entry.profileId === profile.id
    ).length;
    
    return {
      profile,
      completions: profileCompletions,
      unchecked: profileUnchecked,
      accuracy: profileCompletions > 0 ? 
        Math.max(0, ((profileCompletions - profileUnchecked) / profileCompletions * 100)) : 0
    };
  }).sort((a, b) => {
    if (b.completions !== a.completions) {
      return b.completions - a.completions;
    }
    return b.accuracy - a.accuracy;
  });

  return competitorStats.find(stat => stat.completions > 0)?.profile || null;
}

// Helper function to log top competitor changes
function logTopCompetitorChange(
  newWinner: UserProfile | null, 
  previousWinner: UserProfile | null,
  history: HistoryEntry[]
): HistoryEntry[] {
  // Only log if there's actually a change and we have a new winner
  if (!newWinner || (previousWinner && newWinner.id === previousWinner.id)) {
    return history;
  }

  const logEntry: HistoryEntry = {
    id: `winner-${Date.now()}`,
    taskId: 'system',
    profileId: newWinner.id,
    action: 'completed' as const,
    timestamp: new Date(),
    taskTitle: 'Top Competitor Championship',
    profileName: newWinner.name,
    details: previousWinner 
      ? `${newWinner.name} overtook ${previousWinner.name} as Top Competitor`
      : `${newWinner.name} became the first Top Competitor`,
  };

  return [logEntry, ...history];
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    case 'SET_ERROR':
      return { ...state, loading: false };

    case 'LOAD_STATE': {
      // Deep merge settings to ensure all default properties are preserved
      const mergedSettings = {
        ...initialState.settings,
        ...action.state.settings,
        ai: {
          ...initialState.settings.ai,
          ...action.state.settings?.ai,
        },
      };

      return { 
        ...action.state, 
        settings: mergedSettings,
        loading: false,
        taskUpdateStatuses: new Map(),
      };
    }

    case 'SET_TASK_UPDATE_STATUS': {
      const newStatuses = new Map(state.taskUpdateStatuses);
      if (action.status === null) {
        newStatuses.delete(action.taskId);
      } else {
        newStatuses.set(action.taskId, action.status);
      }
      return {
        ...state,
        taskUpdateStatuses: newStatuses,
      };
    }

    case 'TOGGLE_TASK': {
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      // Set status to pending immediately
      const newStatuses = new Map(state.taskUpdateStatuses);
      newStatuses.set(action.taskId, 'pending');

      const isCompleting = !task.isCompleted;
      const profile = state.profiles.find(p => p.id === action.profileId);
      
      let updatedTask = {
        ...task,
        isCompleted: isCompleting,
        completedBy: isCompleting ? action.profileId : undefined,
        completedAt: isCompleting ? new Date() : undefined,
      };

      // If completing a task with a due date, reschedule it based on recurrence
      if (isCompleting && task.dueDate) {
        const group = state.groups.find(g => g.id === task.groupId);
        if (group?.enableDueDates) {
          const nextDueDate = calculateNextDueDate(new Date(task.dueDate), task.recurrence);
          updatedTask = {
            ...updatedTask,
            dueDate: nextDueDate,
            isCompleted: false, // Reset completion status for the new cycle
            completedBy: undefined,
            completedAt: undefined,
          };
        }
      }

      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: action.profileId,
        action: isCompleting ? 'completed' : 'unchecked',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: profile?.name || 'Unknown',
        details: isCompleting 
          ? (task.dueDate ? `Task completed and rescheduled to ${updatedTask.dueDate?.toLocaleDateString()}` : 'Task marked as completed')
          : 'Task unchecked via toggle',
      };

      const newHistory = [historyEntry, ...state.history];
      const updatedTasks = state.tasks.map(t => t.id === action.taskId ? updatedTask : t);

      // Check for top competitor changes
      const previousWinner = calculateTopCompetitor(state.history, state.profiles);
      const newWinner = calculateTopCompetitor(newHistory, state.profiles);
      const finalHistory = logTopCompetitorChange(newWinner, previousWinner, newHistory);

      return {
        ...state,
        tasks: updatedTasks,
        history: finalHistory,
        taskUpdateStatuses: newStatuses,
      };
    }

    case 'TOGGLE_TASK_SUCCESS': {
      // Clear the pending status and set to success briefly
      const newStatuses = new Map(state.taskUpdateStatuses);
      newStatuses.set(action.taskId, 'success');
      
      // Clear the success status after a short delay
      setTimeout(() => {
        // This will be handled by the component
      }, 1000);

      return {
        ...state,
        taskUpdateStatuses: newStatuses,
      };
    }

    case 'TOGGLE_TASK_FAILURE': {
      // Revert the task to its previous state
      const task = state.tasks.find(t => t.id === action.taskId);
      if (!task) return state;

      const revertedTask = {
        ...task,
        isCompleted: !task.isCompleted,
        completedBy: undefined,
        completedAt: undefined,
      };

      const newStatuses = new Map(state.taskUpdateStatuses);
      newStatuses.set(action.taskId, 'error');

      // Clear the error status after a short delay
      setTimeout(() => {
        // This will be handled by the component
      }, 2000);

      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.taskId ? revertedTask : t),
        taskUpdateStatuses: newStatuses,
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

      const newHistory = [historyEntry, ...state.history];
      const updatedTasks = state.tasks.map(t => t.id === action.taskId ? updatedTask : t);

      // Check for top competitor changes
      const previousWinner = calculateTopCompetitor(state.history, state.profiles);
      const newWinner = calculateTopCompetitor(newHistory, state.profiles);
      const finalHistory = logTopCompetitorChange(newWinner, previousWinner, newHistory);

      return {
        ...state,
        tasks: updatedTasks,
        history: finalHistory,
      };
    }

    case 'ADD_TASK': {
      const maxOrder = Math.max(...state.tasks.filter(t => t.groupId === action.task.groupId).map(t => t.order), -1);
      
      // For sub-tasks, calculate sub-task order
      let subTaskOrder = 0;
      if (action.task.isSubTask && action.task.parentTaskId) {
        const siblingSubTasks = state.tasks.filter(t => 
          t.parentTaskId === action.task.parentTaskId && t.isSubTask
        );
        subTaskOrder = Math.max(...siblingSubTasks.map(t => t.subTaskOrder || 0), -1) + 1;
      }
      
      const newTask: Task = {
        ...action.task,
        id: Date.now().toString(),
        createdAt: new Date(),
        order: maxOrder + 1,
        subTaskOrder: action.task.isSubTask ? subTaskOrder : undefined,
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
      // When deleting a task, also delete all its sub-tasks
      const taskToDelete = state.tasks.find(t => t.id === action.taskId);
      const tasksToDelete = [action.taskId];
      
      if (taskToDelete && !taskToDelete.isSubTask) {
        // If deleting a parent task, also delete all sub-tasks
        const subTasks = state.tasks.filter(t => t.parentTaskId === action.taskId);
        tasksToDelete.push(...subTasks.map(t => t.id));
      }
      
      return {
        ...state,
        tasks: state.tasks.filter(t => !tasksToDelete.includes(t.id)),
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

      // Reset the task and all its sub-tasks
      const tasksToReset = [task.id];
      if (!task.isSubTask) {
        const subTasks = state.tasks.filter(t => t.parentTaskId === task.id);
        tasksToReset.push(...subTasks.map(t => t.id));
      }

      const updatedTasks = state.tasks.map(t => {
        if (tasksToReset.includes(t.id)) {
          return {
            ...t,
            isCompleted: false,
            completedBy: undefined,
            completedAt: undefined,
          };
        }
        return t;
      });

      const historyEntry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: action.taskId,
        profileId: state.activeProfileId,
        action: 'reset',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: state.profiles.find(p => p.id === state.activeProfileId)?.name || 'Unknown',
        details: tasksToReset.length > 1 
          ? `Task and ${tasksToReset.length - 1} sub-tasks reset - unchecked but completion history preserved`
          : 'Task reset - unchecked but completion history preserved',
      };

      return {
        ...state,
        tasks: updatedTasks,
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

    case 'REORDER_GROUPS': {
      const reorderedGroups = state.groups.map(group => {
        const newOrder = action.groupIds.indexOf(group.id);
        return { ...group, order: newOrder };
      });
      
      return {
        ...state,
        groups: reorderedGroups,
      };
    }

    case 'ADD_PROFILE': {
      const maxOrder = Math.max(...state.profiles.map(p => p.order || 0), -1);
      const newProfile: UserProfile = {
        ...action.profile,
        id: Date.now().toString(),
        createdAt: new Date(),
        order: maxOrder + 1,
        // Add default meal times if not provided
        mealTimes: action.profile.mealTimes || {
          breakfast: '07:00',
          lunch: '12:00',
          dinner: '18:00',
          nightcap: '21:00',
        },
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

    case 'REORDER_PROFILES': {
      const reorderedProfiles = state.profiles.map(profile => {
        const newOrder = action.profileIds.indexOf(profile.id);
        return { ...profile, order: newOrder };
      });
      
      return {
        ...state,
        profiles: reorderedProfiles,
      };
    }

    case 'SET_ACTIVE_PROFILE': {
      // Save the active profile ID to localStorage
      localStorage.setItem('zentasks_active_profile', action.profileId);
      
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
        if (task.isCompleted && task.completedAt) {
          // Find the profile that completed the task to get meal times for meal-based tasks
          const completedByProfile = state.profiles.find(p => p.id === task.completedBy);
          
          if (shouldResetTask(
            task.completedAt, 
            task.recurrence, 
            task.recurrenceFromDate, 
            task.recurrenceConfig,
            completedByProfile
          )) {
            return {
              ...task,
              isCompleted: false,
              completedBy: undefined,
              completedAt: undefined,
            };
          }
        }
        return task;
      });

      // Log auto-resets
      const resetTasks = state.tasks.filter((task, index) => 
        task.isCompleted && !updatedTasks[index].isCompleted
      );

      const autoResetEntries: HistoryEntry[] = resetTasks.map(task => ({
        id: `auto-reset-${task.id}-${Date.now()}`,
        taskId: task.id,
        profileId: 'system',
        action: 'auto-reset',
        timestamp: new Date(),
        taskTitle: task.title,
        profileName: 'System',
        details: `Task automatically reset based on ${task.recurrence} recurrence`,
      }));

      return {
        ...state,
        tasks: updatedTasks,
        history: [...autoResetEntries, ...state.history],
      };
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

  // Load data from server on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true });
        
        // Check if server is available
        const isHealthy = await ApiService.checkHealth();
        if (!isHealthy) {
          console.warn('Server not available, using default data');
          dispatch({ type: 'SET_LOADING', loading: false });
          return;
        }

        const userData = await ApiService.getUserData();
        
        // Convert date strings back to Date objects
        if (userData.tasks) {
          userData.tasks = userData.tasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            recurrenceFromDate: task.recurrenceFromDate ? new Date(task.recurrenceFromDate) : undefined,
          }));
        }
        
        if (userData.groups) {
          userData.groups = userData.groups.map((group: any) => ({
            ...group,
            createdAt: new Date(group.createdAt),
          }));
        }
        
        if (userData.profiles) {
          userData.profiles = userData.profiles.map((profile: any) => ({
            ...profile,
            createdAt: new Date(profile.createdAt),
            // Ensure meal times exist with defaults
            mealTimes: profile.mealTimes || {
              breakfast: '07:00',
              lunch: '12:00',
              dinner: '18:00',
              nightcap: '21:00',
            },
            // Ensure order exists
            order: profile.order ?? 0,
          }));
        }
        
        if (userData.history) {
          userData.history = userData.history.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));
        }
        
        // Load active profile from localStorage if available
        const savedProfileId = localStorage.getItem('zentasks_active_profile');
        if (savedProfileId && userData.profiles.some((p: any) => p.id === savedProfileId)) {
          userData.activeProfileId = savedProfileId;
        }
        
        dispatch({ type: 'LOAD_STATE', state: userData });
      } catch (error) {
        console.error('Failed to load data:', error);
        dispatch({ type: 'SET_ERROR', error: error.message });
      }
    };

    loadData();
  }, []);

  // Handle task toggle with API confirmation
  useEffect(() => {
    const handleTaskToggle = async (taskId: string, profileId: string) => {
      try {
        // Save to server
        await ApiService.saveUserData(state);
        
        // Success - show green flash
        dispatch({ type: 'TOGGLE_TASK_SUCCESS', taskId, profileId });
        
        // Clear success status after animation
        setTimeout(() => {
          dispatch({ type: 'SET_TASK_UPDATE_STATUS', taskId, status: null });
        }, 1000);
        
      } catch (error) {
        console.error('Failed to save task update:', error);
        
        // Failure - show red flash and revert
        dispatch({ type: 'TOGGLE_TASK_FAILURE', taskId });
        
        // Clear error status after animation
        setTimeout(() => {
          dispatch({ type: 'SET_TASK_UPDATE_STATUS', taskId, status: null });
        }, 2000);
      }
    };

    // Check for pending task updates
    state.taskUpdateStatuses.forEach((status, taskId) => {
      if (status === 'pending') {
        const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
        if (activeProfile) {
          handleTaskToggle(taskId, activeProfile.id);
        }
      }
    });
  }, [state.taskUpdateStatuses, state]);

  // Save data to server whenever state changes (debounced) - but not for task toggles
  useEffect(() => {
    if (state.loading) return;

    // Don't save if there are pending task updates
    const hasPendingUpdates = Array.from(state.taskUpdateStatuses.values()).some(status => status === 'pending');
    if (hasPendingUpdates) return;

    const saveData = async () => {
      try {
        await ApiService.saveUserData(state);
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce saves by 1 second
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Reset recurring tasks on app load
  useEffect(() => {
    if (!state.loading && state.tasks.length > 0) {
      dispatch({ type: 'RESET_RECURRING_TASKS' });
    }
  }, [state.loading]);

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