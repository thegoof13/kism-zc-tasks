import React, { useState } from 'react';
import { Check, Clock, MoreVertical, Edit, Trash2, RotateCcw, RefreshCw, X } from 'lucide-react';
import { Task, CompletedDisplayMode } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel } from '../utils/recurrence';

interface TaskItemProps {
  task: Task;
  displayMode: CompletedDisplayMode;
  onEdit?: (task: Task) => void;
  onRestore?: (task: Task) => void;
}

export function TaskItem({ task, displayMode, onEdit, onRestore }: TaskItemProps) {
  const { state, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedByProfile = task.completedBy ? state.profiles.find(p => p.id === task.completedBy) : null;
  
  const handleToggle = () => {
    if (activeProfile) {
      dispatch({ 
        type: 'TOGGLE_TASK', 
        taskId: task.id, 
        profileId: activeProfile.id 
      });
    }
  };

  const handleUncheck = () => {
    if (activeProfile) {
      dispatch({ 
        type: 'TOGGLE_TASK', 
        taskId: task.id, 
        profileId: activeProfile.id 
      });
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', taskId: task.id });
    }
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
    setShowMenu(false);
  };

  const handleRestore = () => {
    if (onRestore) {
      onRestore(task);
    }
    setShowMenu(false);
  };

  const handleReset = () => {
    dispatch({
      type: 'RESET_TASK',
      taskId: task.id,
    });
    setShowMenu(false);
  };

  // Apply styling based on completion status and display mode
  const getItemClasses = () => {
    const baseClasses = "group flex items-center space-x-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all duration-200";
    
    if (task.isCompleted) {
      switch (displayMode) {
        case 'grey-out':
        case 'grey-drop':
          return `${baseClasses} opacity-60`;
        default:
          return baseClasses;
      }
    }
    
    return baseClasses;
  };

  return (
    <div className={getItemClasses()}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.isCompleted
            ? 'bg-success-500 border-success-500 scale-110'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-success-400 dark:hover:border-success-400'
        }`}
        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.isCompleted && (
          <Check className="w-4 h-4 text-white animate-scale-in" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium truncate ${
            task.isCompleted 
              ? 'line-through text-neutral-500 dark:text-neutral-400' 
              : 'text-neutral-900 dark:text-neutral-100'
          }`}>
            {task.title}
          </h4>
          
          <div className="flex items-center space-x-2 ml-2">
            {/* Recurrence Badge */}
            <div className="flex items-center space-x-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
              <Clock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                {getRecurrenceLabel(task.recurrence)}
              </span>
            </div>

            {/* Completed By Indicator */}
            {task.isCompleted && completedByProfile && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-success-100 dark:bg-success-900/20 rounded-full">
                <span className="text-xs">{completedByProfile.avatar}</span>
                <span className="text-xs text-success-700 dark:text-success-400 font-medium">
                  {completedByProfile.name}
                </span>
              </div>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Task options"
              >
                <MoreVertical className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-20 animate-slide-down">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Edit</span>
                  </button>
                  
                  {task.isCompleted ? (
                    <>
                      <button
                        onClick={handleUncheck}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <X className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Uncheck</span>
                      </button>
                      
                      <button
                        onClick={handleReset}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <RefreshCw className="w-4 h-4 text-warning-500" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Reset</span>
                      </button>
                      
                      <button
                        onClick={handleRestore}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <RotateCcw className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Restore</span>
                      </button>
                    </>
                  ) : null}
                  
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 text-error-500" />
                    <span className="text-sm text-error-600 dark:text-error-400">Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Time */}
        {task.isCompleted && task.completedAt && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Completed {new Date(task.completedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}