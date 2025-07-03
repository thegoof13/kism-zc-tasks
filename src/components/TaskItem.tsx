import React, { useState, useRef, useEffect } from 'react';
import { Check, Clock, Edit, Trash2, RefreshCw, X, Calendar, AlertTriangle, ChevronLeft } from 'lucide-react';
import { Task, CompletedDisplayMode } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel } from '../utils/recurrence';
import { NotificationService } from '../utils/notifications';

interface TaskItemProps {
  task: Task;
  displayMode: CompletedDisplayMode;
  onEdit?: (task: Task) => void;
  onRestore?: (task: Task) => void;
  showDueDate?: boolean;
}

export function TaskItem({ task, displayMode, onEdit, showDueDate }: TaskItemProps) {
  const { state, dispatch } = useApp();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  
  const taskRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedByProfile = task.completedBy ? state.profiles.find(p => p.id === task.completedBy) : null;

  // Check profile permissions
  const canEdit = activeProfile?.permissions?.canEditTasks ?? true;
  const canDelete = activeProfile?.permissions?.canDeleteTasks ?? true;

  const handleToggle = () => {
    // Only allow checking (completing) tasks, not unchecking
    if (!task.isCompleted && activeProfile) {
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
        type: 'UNCHECK_TASK', 
        taskId: task.id, 
        profileId: activeProfile.id 
      });
    }
    closeActions();
  };

  const handleDelete = () => {
    if (!canDelete) return;
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', taskId: task.id });
    }
    closeActions();
  };

  const handleEdit = () => {
    if (!canEdit) return;
    
    if (onEdit) {
      onEdit(task);
    }
    closeActions();
  };

  const handleReset = () => {
    dispatch({
      type: 'RESET_TASK',
      taskId: task.id,
    });
    closeActions();
  };

  // Function to close actions and reset position
  const closeActions = () => {
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  // Function to show actions (triggered by desktop menu button or mobile swipe)
  const showActions = () => {
    setSwipeOffset(-120);
    setShowSwipeActions(true);
  };

  // Desktop menu button click handler
  const handleMenuClick = () => {
    if (showSwipeActions) {
      closeActions();
    } else {
      showActions();
    }
  };

  // Touch event handlers for swipe gestures (MOBILE ONLY - below md breakpoint)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable swipe on mobile screens (below 768px)
    if (window.innerWidth >= 768) return;
    
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || window.innerWidth >= 768) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      const offset = Math.max(deltaX, -120); // Limit swipe to 120px
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || window.innerWidth >= 768) return;
    
    setIsDragging(false);
    const deltaX = currentX.current - startX.current;
    
    // If swiped more than 60px, show actions
    if (deltaX < -60) {
      showActions();
    } else {
      // Snap back
      closeActions();
    }
  };

  // Close swipe actions when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (taskRef.current && !taskRef.current.contains(event.target as Node)) {
        closeActions();
      }
    };

    if (showSwipeActions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSwipeActions]);

  // Apply styling based on completion status and display mode
  const getItemClasses = () => {
    const baseClasses = "group flex items-center space-x-2.5 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all duration-200 relative overflow-hidden";
    
    if (task.isCompleted) {
      switch (displayMode) {
        case 'grey-out':
        case 'grey-drop':
          return `${baseClasses} opacity-60`;
        default:
          return baseClasses;
      }
    }
    
    // Add overdue styling
    if (task.dueDate && NotificationService.isOverdue(new Date(task.dueDate))) {
      return `${baseClasses} border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/10`;
    }
    
    return baseClasses;
  };

  const getDueDateInfo = () => {
    if (!task.dueDate || !showDueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const isOverdue = NotificationService.isOverdue(dueDate);
    const isDueToday = NotificationService.shouldNotifyDueToday(dueDate);
    const formattedDate = NotificationService.formatDueDate(dueDate);
    const colorClass = NotificationService.getDueDateColor(dueDate);
    
    return {
      dueDate,
      isOverdue,
      isDueToday,
      formattedDate,
      colorClass,
    };
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <div 
      ref={taskRef}
      className="relative"
    >
      {/* Swipe Actions Background - Shows on both mobile and desktop when triggered */}
      {(showSwipeActions || swipeOffset < 0) && (
        <div className="absolute right-0 top-0 h-full flex items-center bg-neutral-100 dark:bg-neutral-700 rounded-lg">
          <div className="flex items-center space-x-1.5 px-3">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
                aria-label="Edit task"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            
            {task.isCompleted && (
              <>
                <button
                  onClick={handleUncheck}
                  className="p-1.5 rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors duration-200"
                  aria-label="Uncheck task"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg bg-neutral-500 text-white hover:bg-neutral-600 transition-colors duration-200"
                  aria-label="Reset task"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-error-500 text-white hover:bg-error-600 transition-colors duration-200"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Task Content */}
      <div 
        className={getItemClasses()}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Checkbox - Slightly smaller */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.isCompleted
              ? 'bg-success-500 border-success-500 scale-110 cursor-default'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-success-400 dark:hover:border-success-400 cursor-pointer'
          }`}
          aria-label={task.isCompleted ? 'Task completed - use menu to uncheck' : 'Mark as complete'}
          disabled={task.isCompleted}
        >
          {task.isCompleted && (
            <Check className="w-3 h-3 text-white animate-scale-in" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop Layout (md and up) - Everything in one row */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium truncate text-sm ${
                task.isCompleted 
                  ? 'line-through text-neutral-500 dark:text-neutral-400' 
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}>
                {task.title}
              </h4>
              
              {/* Due Date Display - Desktop */}
              {dueDateInfo && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <div className={`flex items-center space-x-1 ${dueDateInfo.colorClass}`}>
                    {dueDateInfo.isOverdue ? (
                      <AlertTriangle className="w-2.5 h-2.5" />
                    ) : (
                      <Calendar className="w-2.5 h-2.5" />
                    )}
                    <span className="text-xs font-medium">
                      {dueDateInfo.formattedDate}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Desktop Right Side - Recurrence + Completed By + Menu Button */}
            <div className="flex items-center space-x-1.5 ml-3">
              {/* Recurrence Badge - Desktop */}
              <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                <Clock className="w-2.5 h-2.5 text-neutral-500 dark:text-neutral-400" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {getRecurrenceLabel(task.recurrence)}
                </span>
              </div>

              {/* Completed By Indicator - Desktop */}
              {task.isCompleted && completedByProfile && (
                <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-success-100 dark:bg-success-900/20 rounded-full">
                  <span className="text-xs">{completedByProfile.avatar}</span>
                  <span className="text-xs text-success-700 dark:text-success-400 font-medium">
                    {completedByProfile.name}
                  </span>
                </div>
              )}

              {/* Desktop Menu Button - Always visible */}
              <button
                onClick={handleMenuClick}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showSwipeActions 
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                }`}
                aria-label={showSwipeActions ? 'Hide task actions' : 'Show task actions'}
              >
                <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showSwipeActions ? 'rotate-180' : ''
                }`} />
              </button>
            </div>
          </div>

          {/* Mobile Layout (below md) - Stacked layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate text-sm ${
                  task.isCompleted 
                    ? 'line-through text-neutral-500 dark:text-neutral-400' 
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}>
                  {task.title}
                </h4>
              </div>
              
              {/* Mobile Swipe Indicator */}
              <div className="ml-2">
                {!showSwipeActions && (
                  <div className="flex items-center justify-center w-5 h-5">
                    <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Second Row - Due Date */}
            {dueDateInfo && (
              <div className="flex items-center space-x-1 mt-0.5">
                <div className={`flex items-center space-x-1 ${dueDateInfo.colorClass}`}>
                  {dueDateInfo.isOverdue ? (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5" />
                  )}
                  <span className="text-xs font-medium">
                    {dueDateInfo.formattedDate}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Third Row - Recurrence + Completed By */}
            <div className="flex items-center space-x-1.5 mt-1">
              {/* Recurrence Badge - Mobile */}
              <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                <Clock className="w-2.5 h-2.5 text-neutral-500 dark:text-neutral-400" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {getRecurrenceLabel(task.recurrence)}
                </span>
              </div>

              {/* Completed By Indicator - Mobile */}
              {task.isCompleted && completedByProfile && (
                <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-success-100 dark:bg-success-900/20 rounded-full">
                  <span className="text-xs">{completedByProfile.avatar}</span>
                  <span className="text-xs text-success-700 dark:text-success-400 font-medium">
                    {completedByProfile.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Completion Time - Both layouts */}
          {task.isCompleted && task.completedAt && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Completed {new Date(task.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}