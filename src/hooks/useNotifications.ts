import { useEffect } from 'react';
import { Task, TaskGroup, UserProfile } from '../types';
import { NotificationService } from '../utils/notifications';

interface UseNotificationsProps {
  tasks: Task[];
  groups: TaskGroup[];
  profiles: UserProfile[];
  activeProfileId: string;
  enableNotifications: boolean;
}

export function useNotifications({ tasks, groups, profiles, activeProfileId, enableNotifications }: UseNotificationsProps) {
  useEffect(() => {
    if (!enableNotifications) return;

    const checkNotifications = () => {
      // Check due date notifications for tasks with due dates
      const dueDateGroups = groups.filter(group => group.enableDueDates);
      
      dueDateGroups.forEach(group => {
        const groupTasks = tasks.filter(task => 
          task.groupId === group.id && 
          !task.isCompleted && 
          task.dueDate
        );

        groupTasks.forEach(task => {
          if (!task.dueDate) return;

          const dueDate = new Date(task.dueDate);
          const createdDate = new Date(task.createdAt);

          // Check for 25% remaining notification
          if (NotificationService.shouldNotify25Percent(dueDate, createdDate)) {
            const timeRemaining = NotificationService.getTimeUntilDue(dueDate);
            NotificationService.showNotification(
              `Task Due Soon: ${task.title}`,
              {
                body: `Due in ${timeRemaining.days} days, ${timeRemaining.hours} hours`,
                tag: `task-25-${task.id}`,
              }
            );
          }

          // Check for due today notification
          if (NotificationService.shouldNotifyDueToday(dueDate)) {
            NotificationService.showNotification(
              `Task Due Today: ${task.title}`,
              {
                body: `This task is due today in the ${group.name} group`,
                tag: `task-due-${task.id}`,
              }
            );
          }

          // Check for overdue notification
          if (NotificationService.isOverdue(dueDate)) {
            const daysOverdue = Math.abs(NotificationService.getDaysUntilDue(dueDate));
            NotificationService.showNotification(
              `Overdue Task: ${task.title}`,
              {
                body: `This task is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
                tag: `task-overdue-${task.id}`,
              }
            );
          }
        });
      });

      // NEW: Check recurrence reset notifications for tasks with notifications enabled
      const notificationTasks = tasks.filter(task => {
        // Skip tasks with due dates (handled above)
        if (task.dueDate) return false;
        
        // Check if notifications are enabled for this task
        const group = groups.find(g => g.id === task.groupId);
        const hasNotifications = task.enableNotifications ?? group?.defaultNotifications ?? false;
        
        return hasNotifications && !task.isCompleted;
      });

      notificationTasks.forEach(task => {
        // Get the user profile for meal times (if needed)
        const userProfile = profiles.find(p => p.id === activeProfileId);
        
        if (NotificationService.shouldNotifyTaskReset(task, task.recurrenceFromDate, userProfile)) {
          const timeRemaining = NotificationService.formatTimeUntilReset(task, task.recurrenceFromDate, userProfile);
          const group = groups.find(g => g.id === task.groupId);
          
          NotificationService.showNotification(
            `Task Reset Soon: ${task.title}`,
            {
              body: `This task will reset in ${timeRemaining} (${group?.name || 'Unknown'} group)`,
              tag: `task-reset-${task.id}`,
            }
          );
        }
      });
    };

    // Request notification permission on first load
    NotificationService.requestPermission();

    // Check notifications every 30 minutes
    const interval = setInterval(checkNotifications, 30 * 60 * 1000);

    // Check immediately
    checkNotifications();

    return () => clearInterval(interval);
  }, [tasks, groups, profiles, activeProfileId, enableNotifications]);
}