import React from 'react';
import { ChevronDown, ChevronRight, Plus, Calendar } from 'lucide-react';
import { TaskGroup as TaskGroupType, Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { TaskItem } from './TaskItem';
import { getIconComponent } from '../utils/icons';
import { NotificationService } from '../utils/notifications';

interface TaskGroupProps {
  group: TaskGroupType;
  tasks: Task[];
  onAddTask: (groupId: string) => void;
  onEditGroup: (group: TaskGroupType) => void;
  onEditTask: (task: Task) => void;
}

export function TaskGroup({ group, tasks, onAddTask, onEditTask }: TaskGroupProps) {
  const { state, dispatch } = useApp();
  
  const IconComponent = getIconComponent(group.icon);
  const isViewOnlyMode = state.settings.viewOnlyMode;
  
  // Filter tasks based on active profile
  const profileTasks = tasks.filter(task => 
    task.profiles.includes(state.activeProfileId)
  );
  
  // Sort tasks based on group settings
  const sortedTasks = [...profileTasks].sort((a, b) => {
    // If group has due date sorting enabled, sort by due date first
    if (group.sortByDueDate && group.enableDueDates) {
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Both have due dates, sort by due date
      if (a.dueDate && b.dueDate) {
        const dueDateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dueDateDiff !== 0) return dueDateDiff;
      }
    }
    
    // Fall back to order sorting
    return a.order - b.order;
  });
  
  let displayedTasks: Task[];
  let completedTasks: Task[] = [];
  
  switch (group.completedDisplayMode) {
    case 'grey-out':
      displayedTasks = sortedTasks;
      break;
    
    case 'grey-drop':
      const incompleteTasks = sortedTasks.filter(t => !t.isCompleted);
      completedTasks = sortedTasks.filter(t => t.isCompleted);
      displayedTasks = [...incompleteTasks, ...completedTasks];
      break;
    
    case 'separate-completed':
      displayedTasks = sortedTasks.filter(t => !t.isCompleted);
      completedTasks = sortedTasks.filter(t => t.isCompleted);
      break;
    
    default:
      displayedTasks = sortedTasks;
  }

  const completedCount = profileTasks.filter(t => t.isCompleted).length;
  const totalCount = profileTasks.length;
  const overdueTasks = profileTasks.filter(t => 
    !t.isCompleted && t.dueDate && NotificationService.isOverdue(new Date(t.dueDate))
  ).length;

  // Check if active profile can create tasks (disabled in view only mode)
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const canCreateTasks = !isViewOnlyMode && (activeProfile?.permissions?.canCreateTasks ?? true);

  // Don't render group if no tasks are visible for current profile
  if (profileTasks.length === 0) {
    return null;
  }

  return (
    <div className="card mb-3 animate-slide-up">
      {/* Group Header - Reduced padding */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-700">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_GROUP_COLLAPSE', groupId: group.id })}
          className="flex items-center space-x-3 flex-1 text-left group"
        >
          <div className="flex items-center space-x-2">
            {group.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200" />
            )}
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            {group.enableDueDates && (
              <Calendar className="w-3.5 h-3.5 text-primary-500" title="Due dates enabled" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors duration-200">
                {group.name}
              </h3>
              {overdueTasks > 0 && (
                <span className="px-1.5 py-0.5 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-400 text-xs rounded-full font-medium">
                  {overdueTasks} overdue
                </span>
              )}
              {/* View Only Mode Indicator */}
              {isViewOnlyMode && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium">
                  View Only
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {completedCount} of {totalCount} completed
              {group.sortByDueDate && group.enableDueDates && ' • Sorted by due date'}
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-1">
          {canCreateTasks && (
            <button
              onClick={() => onAddTask(group.id)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              aria-label="Add task"
            >
              <Plus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tasks List - Reduced padding and spacing */}
      {!group.isCollapsed && (
        <div className="p-3 space-y-1.5">
          {displayedTasks.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
              <p className="text-sm">No tasks yet</p>
              {canCreateTasks && (
                <button
                  onClick={() => onAddTask(group.id)}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-1 transition-colors duration-200"
                >
                  Add your first task
                </button>
              )}
            </div>
          ) : (
            displayedTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                displayMode={group.completedDisplayMode}
                onEdit={onEditTask}
                showDueDate={group.enableDueDates}
              />
            ))
          )}

          {/* Completed Section for Separate Mode - Reduced spacing */}
          {group.completedDisplayMode === 'separate-completed' && completedTasks.length > 0 && (
            <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                Completed ({completedTasks.length})
              </h4>
              <div className="space-y-1.5">
                {completedTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task}
                    displayMode="grey-out"
                    onEdit={onEditTask}
                    showDueDate={group.enableDueDates}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}