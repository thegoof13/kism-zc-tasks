import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { TaskGroup as TaskGroupType, Task } from '../types';
import { useApp } from '../contexts/AppContext';
import { TaskItem } from './TaskItem';
import { getIconComponent } from '../utils/icons';

interface TaskGroupProps {
  group: TaskGroupType;
  tasks: Task[];
  onAddTask: (groupId: string) => void;
  onEditGroup: (group: TaskGroupType) => void;
  onEditTask: (task: Task) => void;
  onRestoreTask: (task: Task) => void;
}

export function TaskGroup({ group, tasks, onAddTask, onEditTask, onRestoreTask }: TaskGroupProps) {
  const { state, dispatch } = useApp();
  
  const IconComponent = getIconComponent(group.icon);
  
  // Filter tasks based on active profile
  const profileTasks = tasks.filter(task => 
    task.profiles.includes(state.activeProfileId)
  );
  
  // Sort and filter tasks based on completion status and display mode
  const sortedTasks = [...profileTasks].sort((a, b) => a.order - b.order);
  
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

  // Don't render group if no tasks are visible for current profile
  if (profileTasks.length === 0) {
    return null;
  }

  return (
    <div className="card mb-4 overflow-hidden animate-slide-up">
      {/* Group Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-700">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_GROUP_COLLAPSE', groupId: group.id })}
          className="flex items-center space-x-3 flex-1 text-left group"
        >
          <div className="flex items-center space-x-2">
            {group.isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200" />
            )}
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors duration-200">
              {group.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {completedCount} of {totalCount} completed
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onAddTask(group.id)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            aria-label="Add task"
          >
            <Plus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {!group.isCollapsed && (
        <div className="p-4 space-y-2">
          {displayedTasks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <p className="text-sm">No tasks yet</p>
              <button
                onClick={() => onAddTask(group.id)}
                className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-1 transition-colors duration-200"
              >
                Add your first task
              </button>
            </div>
          ) : (
            displayedTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                displayMode={group.completedDisplayMode}
                onEdit={onEditTask}
                onRestore={onRestoreTask}
              />
            ))
          )}

          {/* Completed Section for Separate Mode */}
          {group.completedDisplayMode === 'separate-completed' && completedTasks.length > 0 && (
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Completed ({completedTasks.length})
              </h4>
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task}
                    displayMode="grey-out"
                    onEdit={onEditTask}
                    onRestore={onRestoreTask}
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