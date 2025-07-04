import React, { useState, useRef, useEffect } from 'react';
import { Check, Clock, Edit, Trash2, RefreshCw, X, Calendar, AlertTriangle, ChevronLeft, Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { Task, CompletedDisplayMode } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel, getResetDateDescription } from '../utils/recurrence';
import { NotificationService } from '../utils/notifications';

interface TaskItemProps {
  task: Task;
  displayMode: CompletedDisplayMode;
  onEdit?: (task: Task) => void;
  onRestore?: (task: Task) => void;
  showDueDate?: boolean;
  subTasks?: Task[];
  isSubTask?: boolean;
  level?: number;
}

export function TaskItem({ task, displayMode, onEdit, showDueDate, subTasks = [], isSubTask = false, level = 0 }: TaskItemProps) {
  const { state, dispatch } = useApp();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  const [isSubTasksExpanded, setIsSubTasksExpanded] = useState(true);
  
  const taskRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedByProfile = task.completedBy ? state.profiles.find(p => p.id === task.completedBy) : null;
  const taskGroup = state.groups.find(g => g.id === task.groupId);
  const isViewOnlyMode = state.settings.viewOnlyMode;

  // Check profile permissions (disabled in view only mode)
  const canEdit = !isViewOnlyMode && (activeProfile?.permissions?.canEditTasks ?? true);
  const canDelete = !isViewOnlyMode && (activeProfile?.permissions?.canDeleteTasks ?? true);
  const canToggle = !isViewOnlyMode; // Can't check/uncheck tasks in view only mode

  // Check if notifications are enabled for this task
  const hasNotifications = task.enableNotifications ?? taskGroup?.defaultNotifications ?? false;
  const showNotificationIndicator = hasNotifications && !task.dueDate; // Only show for non-due-date tasks

  // Check if this is a parent task with sub-tasks
  const isParentTask = !task.isSubTask && subTasks.length > 0;
  const allSubTasksCompleted = subTasks.every(subTask => subTask.isCompleted);
  const canCompleteParent = !task.requireAllSubTasksComplete || allSubTasksCompleted;

  const handleToggle = () => {
    // Only allow checking (completing) tasks, not unchecking, and not in view only mode
    if (!task.isCompleted && activeProfile && canToggle) {
      // For parent tasks with requireAllSubTasksComplete, check if all sub-tasks are done
      if (isParentTask && task.requireAllSubTasksComplete && !allSubTasksCompleted) {
        return; // Don't allow completion
      }
      
      dispatch({ 
        type: 'TOGGLE_TASK', 
        taskId: task.id, 
        profileId: activeProfile.id 
      });
    }
  };

  const handleUncheck = () => {
    if (activeProfile && !isViewOnlyMode) {
      dispatch({ 
        type: 'UNCHECK_TASK', 
        taskId: task.id, 
        profileId: activeProfile.id 
      });
    }
    closeActions();
  };

  const handleDelete = () => {
    if (!canDelete || isViewOnlyMode) return;
    
    const deleteMessage = isParentTask 
      ? `Are you sure you want to delete "${task.title}" and all its sub-tasks?`
      : `Are you sure you want to delete "${task.title}"?`;
    
    if (window.confirm(deleteMessage)) {
      dispatch({ type: 'DELETE_TASK', taskId: task.id });
    }
    closeActions();
  };

  const handleEdit = () => {
    if (!canEdit || isViewOnlyMode) return;
    
    if (onEdit) {
      onEdit(task);
    }
    closeActions();
  };

  const handleReset = () => {
    if (isViewOnlyMode) return;
    
    dispatch({
      type: 'RESET_TASK',
      taskId: task.id,
    });
    closeActions();
  };

  // Count available actions to determine swipe menu width
  const availableActions = [];
  if (canEdit) availableActions.push('edit');
  if (task.isCompleted) {
    availableActions.push('uncheck', 'reset');
  }
  if (canDelete) availableActions.push('delete');

  // Calculate dynamic width based on number of actions (40px per action + padding)
  const swipeMenuWidth = availableActions.length * 45 + 10; // 45px per action + 10px padding

  // Function to close actions and reset position
  const closeActions = () => {
    setShowSwipeActions(false);
    setSwipeOffset(0);
  };

  // Function to show actions (triggered by desktop menu button or mobile swipe)
  const showActions = () => {
    setSwipeOffset(-swipeMenuWidth);
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
    // Only enable swipe on mobile screens (below 768px) and not in view only mode
    if (window.innerWidth >= 768 || isViewOnlyMode) return;
    
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || window.innerWidth >= 768 || isViewOnlyMode) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      const offset = Math.max(deltaX, -swipeMenuWidth); // Limit swipe to menu width
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || window.innerWidth >= 768 || isViewOnlyMode) return;
    
    setIsDragging(false);
    const deltaX = currentX.current - startX.current;
    
    // If swiped more than half the menu width, show actions
    if (deltaX < -(swipeMenuWidth / 2)) {
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
    let baseClasses = "group flex items-center space-x-2.5 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-sm transition-all duration-200 relative overflow-hidden";
    
    // Add indentation for sub-tasks
    if (isSubTask) {
      baseClasses += " ml-6 border-l-4 border-l-primary-300 dark:border-l-primary-600";
    }
    
    // Add view only mode styling
    if (isViewOnlyMode) {
      baseClasses += " opacity-75 cursor-default";
    }
    
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
    
    // Add parent task styling
    if (isParentTask) {
      return `${baseClasses} border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10`;
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

  // Get recurrence reset info
  const getRecurrenceInfo = () => {
    if (task.recurrence === 'daily') {
      return getRecurrenceLabel(task.recurrence, task.recurrenceConfig);
    }
    
    if (task.recurrence === 'meals') {
      // For meal-based tasks, show the meal times from active profile
      return getResetDateDescription(
        task.recurrence, 
        task.recurrenceFromDate ? new Date(task.recurrenceFromDate) : undefined,
        activeProfile,
        task.recurrenceConfig?.meals
      );
    }
    
    if (task.recurrenceFromDate) {
      return getResetDateDescription(task.recurrence, new Date(task.recurrenceFromDate));
    }
    
    return getRecurrenceLabel(task.recurrence, task.recurrenceConfig);
  };

  // Check if any actions are available (for showing menu button)
  const hasActions = availableActions.length > 0;

  return (
    <div className="space-y-1">
      <div 
        ref={taskRef}
        className="relative"
      >
        {/* Swipe Actions Background - Shows on both mobile and desktop when triggered and not in view only mode */}
        {(showSwipeActions || swipeOffset < 0) && !isViewOnlyMode && (
          <div 
            className="absolute right-0 top-0 h-full flex items-center bg-neutral-100 dark:bg-neutral-700 rounded-lg"
            style={{ width: `${swipeMenuWidth}px` }}
          >
            <div className="flex items-center space-x-1.5 px-2">
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
          {/* Sub-task Expand/Collapse Button (for parent tasks) */}
          {isParentTask && (
            <button
              onClick={() => setIsSubTasksExpanded(!isSubTasksExpanded)}
              className="flex-shrink-0 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              aria-label={isSubTasksExpanded ? 'Collapse sub-tasks' : 'Expand sub-tasks'}
            >
              {isSubTasksExpanded ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
            </button>
          )}

          {/* Checkbox - Slightly smaller */}
          <button
            onClick={handleToggle}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              task.isCompleted
                ? 'bg-success-500 border-success-500 scale-110 cursor-default'
                : canToggle && canCompleteParent
                  ? 'border-neutral-300 dark:border-neutral-600 hover:border-success-400 dark:hover:border-success-400 cursor-pointer'
                  : 'border-neutral-300 dark:border-neutral-600 cursor-default opacity-50'
            }`}
            aria-label={
              isViewOnlyMode 
                ? 'View only mode - cannot modify tasks'
                : task.isCompleted 
                  ? 'Task completed - use menu to uncheck' 
                  : isParentTask && task.requireAllSubTasksComplete && !allSubTasksCompleted
                    ? 'Complete all sub-tasks first'
                    : 'Mark as complete'
            }
            disabled={task.isCompleted || !canToggle || (isParentTask && task.requireAllSubTasksComplete && !allSubTasksCompleted)}
            title={
              isViewOnlyMode 
                ? 'View only mode - cannot modify tasks' 
                : isParentTask && task.requireAllSubTasksComplete && !allSubTasksCompleted
                  ? 'Complete all sub-tasks first'
                  : undefined
            }
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
                <div className="flex items-center space-x-2">
                  <h4 className={`font-medium truncate text-sm ${
                    task.isCompleted 
                      ? 'line-through text-neutral-500 dark:text-neutral-400' 
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {task.title}
                  </h4>
                  
                  {/* Parent Task Indicator */}
                  {isParentTask && (
                    <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full font-medium">
                      {subTasks.filter(st => st.isCompleted).length}/{subTasks.length} sub-tasks
                    </span>
                  )}
                  
                  {/* Notification Indicator - Desktop */}
                  {showNotificationIndicator && (
                    <Bell className="w-3 h-3 text-primary-500 flex-shrink-0" title="Notifications enabled" />
                  )}
                </div>
                
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
                    {getRecurrenceInfo()}
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

                {/* Desktop Menu Button - Only show if actions are available and not in view only mode */}
                {hasActions && !isViewOnlyMode && (
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
                )}
              </div>
            </div>

            {/* Mobile Layout (below md) - Stacked layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium truncate text-sm ${
                      task.isCompleted 
                        ? 'line-through text-neutral-500 dark:text-neutral-400' 
                        : 'text-neutral-900 dark:text-neutral-100'
                    }`}>
                      {task.title}
                    </h4>
                    
                    {/* Parent Task Indicator - Mobile */}
                    {isParentTask && (
                      <span className="px-1 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full font-medium">
                        {subTasks.filter(st => st.isCompleted).length}/{subTasks.length}
                      </span>
                    )}
                    
                    {/* Notification Indicator - Mobile */}
                    {showNotificationIndicator && (
                      <Bell className="w-3 h-3 text-primary-500 flex-shrink-0" title="Notifications enabled" />
                    )}
                  </div>
                </div>
                
                {/* Mobile Swipe Indicator - Only show if not in view only mode */}
                <div className="ml-2">
                  {!showSwipeActions && !isViewOnlyMode && hasActions && (
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
                    {getRecurrenceInfo()}
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

      {/* Sub-tasks */}
      {isParentTask && isSubTasksExpanded && (
        <div className="ml-4 space-y-1">
          {subTasks
            .sort((a, b) => (a.subTaskOrder || 0) - (b.subTaskOrder || 0))
            .map(subTask => (
              <TaskItem
                key={subTask.id}
                task={subTask}
                displayMode={displayMode}
                onEdit={onEdit}
                showDueDate={showDueDate}
                isSubTask={true}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}