import { useEffect } from 'react';
import { Task, TaskGroup } from '../types';
import { NotificationService } from '../utils/notifications';

interface UseNotificationsProps {
  tasks: Task[];
  groups: TaskGroup[];
  enableNotifications: boolean;
}

export function useNotifications({ tasks, groups, enableNotifications }: UseNotificationsProps) {
  useEffect(() => {
    if (!enableNotifications) return;

    const checkNotifications = () => {
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
    };

    // Request notification permission on first load
    NotificationService.requestPermission();

    // Check notifications every 30 minutes
    const interval = setInterval(checkNotifications, 30 * 60 * 1000);

    // Check immediately
    checkNotifications();

    return () => clearInterval(interval);
  }, [tasks, groups, enableNotifications]);
}