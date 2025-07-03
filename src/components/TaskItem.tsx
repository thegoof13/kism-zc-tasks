import React, { useState, useRef, useEffect } from 'react';
import { Check, Clock, MoreVertical, Edit, Trash2, RefreshCw, X, Calendar, AlertTriangle } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  
  const taskRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isMobile = useRef(false);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedByProfile = task.completedBy ? state.profiles.find(p => p.id === task.completedBy) : null;

  // Check profile permissions
  const canEdit = activeProfile?.permissions?.canEditTasks ?? true;
  const canDelete = activeProfile?.permissions?.canDeleteTasks ?? true;

  // Check if device is mobile/touch
  useEffect(() => {
    isMobile.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

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
    setShowMenu(false);
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', taskId: task.id });
    }
    setShowMenu(false);
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  const handleEdit = () => {
    if (!canEdit) return;
    
    if (onEdit) {
      onEdit(task);
    }
    setShowMenu(false);
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  const handleReset = () => {
    dispatch({
      type: 'RESET_TASK',
      taskId: task.id,
    });
    setShowMenu(false);
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  // Touch event handlers for swipe gestures (MOBILE ONLY)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable swipe on mobile screens (md and below)
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
      setSwipeOffset(-120);
      setShowSwipeActions(true);
    } else {
      // Snap back
      setSwipeOffset(0);
      setShowSwipeActions(false);
    }
  };

  // Mouse event handlers for desktop drag (DISABLED - we want menu on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Disable mouse drag on desktop - we want the menu instead
    return;
  };

  // Close swipe actions when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (taskRef.current && !taskRef.current.contains(event.target as Node)) {
        setShowSwipeActions(false);
        setSwipeOffset(0);
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
    const baseClasses = "group flex items-center space-x-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all duration-200 relative overflow-hidden";
    
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
      {/* Swipe Actions Background - MOBILE ONLY */}
      {(showSwipeActions || swipeOffset < 0) && window.innerWidth < 768 && (
        <div className="absolute right-0 top-0 h-full flex items-center bg-neutral-100 dark:bg-neutral-700 rounded-lg">
          <div className="flex items-center space-x-2 px-4">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
                aria-label="Edit task"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {task.isCompleted && (
              <>
                <button
                  onClick={handleUncheck}
                  className="p-2 rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors duration-200"
                  aria-label="Uncheck task"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-neutral-500 text-white hover:bg-neutral-600 transition-colors duration-200"
                  aria-label="Reset task"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
            
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg bg-error-500 text-white hover:bg-error-600 transition-colors duration-200"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
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
        onMouseDown={handleMouseDown}
      >
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.isCompleted
              ? 'bg-success-500 border-success-500 scale-110 cursor-default'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-success-400 dark:hover:border-success-400 cursor-pointer'
          }`}
          aria-label={task.isCompleted ? 'Task completed - use menu to uncheck' : 'Mark as complete'}
          disabled={task.isCompleted}
        >
          {task.isCompleted && (
            <Check className="w-4 h-4 text-white animate-scale-in" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium truncate ${
                task.isCompleted 
                  ? 'line-through text-neutral-500 dark:text-neutral-400' 
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}>
                {task.title}
              </h4>
              
              {/* Due Date Display */}
              {dueDateInfo && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`flex items-center space-x-1 ${dueDateInfo.colorClass}`}>
                    {dueDateInfo.isOverdue ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Calendar className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {dueDateInfo.formattedDate}
                    </span>
                  </div>
                </div>
              )}

              {/* Recurrence Badge - Mobile responsive */}
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                  <Clock className="w-3 h-3 text-neutral-500 dark:text-neutral-400 sm:block hidden" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    {getRecurrenceLabel(task.recurrence)}
                  </span>
                </div>

                {/* Completed By Indicator */}
                {task.isCompleted && completedByProfile && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-success-100 dark:bg-success-900/20 rounded-full">
                    <span className="text-xs">{completedByProfile.avatar}</span>
                    <span className="text-xs text-success-700 dark:text-success-400 font-medium hidden sm:inline">
                      {completedByProfile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {/* Desktop Menu Button - ONLY on desktop (md and up) */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="Task options"
                >
                  <MoreVertical className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-[9999] animate-slide-down">
                    {/* Edit option - only if allowed */}
                    {canEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Edit</span>
                      </button>
                    )}
                    
                    {/* Completed task options */}
                    {task.isCompleted && (
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
                      </>
                    )}
                    
                    {/* Delete option - only if allowed */}
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                        <span className="text-sm text-error-600 dark:text-error-400">Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Swipe Indicator - ONLY on mobile (below md) */}
              <div className="md:hidden">
                {!showSwipeActions && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
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
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  );
}