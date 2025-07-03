export class NotificationService {
  private static hasPermission = false;

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/image.png',
        badge: '/image.png',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  static getDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getTimeUntilDue(dueDate: Date): { days: number; hours: number; minutes: number } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  }

  static shouldNotify25Percent(dueDate: Date, createdDate: Date): boolean {
    const now = new Date();
    const totalTime = dueDate.getTime() - createdDate.getTime();
    const elapsed = now.getTime() - createdDate.getTime();
    const progress = elapsed / totalTime;
    
    // Notify when 75% of time has passed (25% remaining)
    return progress >= 0.75 && progress < 0.8;
  }

  static shouldNotifyDueToday(dueDate: Date): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    
    return (
      now.getDate() === due.getDate() &&
      now.getMonth() === due.getMonth() &&
      now.getFullYear() === due.getFullYear()
    );
  }

  static isOverdue(dueDate: Date): boolean {
    const now = new Date();
    return now > dueDate;
  }

  static formatDueDate(dueDate: Date): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return due.toLocaleDateString();
    }
  }

  static getDueDateColor(dueDate: Date): string {
    const daysUntil = this.getDaysUntilDue(dueDate);
    
    if (daysUntil < 0) {
      return 'text-error-600 dark:text-error-400'; // Overdue
    } else if (daysUntil === 0) {
      return 'text-warning-600 dark:text-warning-400'; // Due today
    } else if (daysUntil <= 3) {
      return 'text-warning-600 dark:text-warning-400'; // Due soon
    } else {
      return 'text-neutral-600 dark:text-neutral-400'; // Normal
    }
  }

  // NEW: Task recurrence notification methods
  static getTimeUntilReset(task: any, recurrenceFromDate?: Date): { totalHours: number; remainingHours: number; progress: number } {
    const now = new Date();
    const startDate = recurrenceFromDate || task.createdAt;
    
    let resetDate = new Date(startDate);
    
    // Calculate next reset date based on recurrence type
    switch (task.recurrence) {
      case 'meals':
        if (task.recurrenceConfig?.meals) {
          // Find the next meal time
          const currentHour = now.getHours();
          const mealHours = {
            breakfast: 6,
            lunch: 11,
            dinner: 17,
            nightcap: 21
          };
          
          let nextMealHour = 24; // Default to next day
          for (const meal of task.recurrenceConfig.meals) {
            const mealHour = mealHours[meal];
            if (mealHour > currentHour) {
              nextMealHour = Math.min(nextMealHour, mealHour);
            }
          }
          
          if (nextMealHour === 24) {
            // No more meals today, find first meal tomorrow
            const firstMealTomorrow = Math.min(...task.recurrenceConfig.meals.map(m => mealHours[m]));
            resetDate = new Date(now);
            resetDate.setDate(resetDate.getDate() + 1);
            resetDate.setHours(firstMealTomorrow, 0, 0, 0);
          } else {
            resetDate = new Date(now);
            resetDate.setHours(nextMealHour, 0, 0, 0);
          }
        }
        break;
        
      case 'days':
        if (task.recurrenceConfig?.days) {
          // Find next selected day
          const currentDay = now.getDay();
          let nextDay = task.recurrenceConfig.days.find(day => day > currentDay);
          
          if (nextDay === undefined) {
            // No more days this week, find first day next week
            nextDay = Math.min(...task.recurrenceConfig.days);
            resetDate = new Date(now);
            resetDate.setDate(resetDate.getDate() + (7 - currentDay + nextDay));
          } else {
            resetDate = new Date(now);
            resetDate.setDate(resetDate.getDate() + (nextDay - currentDay));
          }
          resetDate.setHours(0, 0, 0, 0);
        }
        break;
        
      case 'daily':
        resetDate = new Date(now);
        resetDate.setDate(resetDate.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
        
      case 'weekly':
        resetDate = new Date(startDate);
        resetDate.setDate(resetDate.getDate() + 7);
        break;
        
      case 'fortnightly':
        resetDate = new Date(startDate);
        resetDate.setDate(resetDate.getDate() + 14);
        break;
        
      case 'monthly':
        resetDate = new Date(startDate);
        resetDate.setMonth(resetDate.getMonth() + 1);
        break;
        
      case 'quarterly':
        resetDate = new Date(startDate);
        resetDate.setMonth(resetDate.getMonth() + 3);
        break;
        
      case 'half-yearly':
        resetDate = new Date(startDate);
        resetDate.setMonth(resetDate.getMonth() + 6);
        break;
        
      case 'yearly':
        resetDate = new Date(startDate);
        resetDate.setFullYear(resetDate.getFullYear() + 1);
        break;
    }
    
    const totalTime = resetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const remaining = resetDate.getTime() - now.getTime();
    
    const totalHours = totalTime / (1000 * 60 * 60);
    const remainingHours = Math.max(0, remaining / (1000 * 60 * 60));
    const progress = Math.min(1, Math.max(0, elapsed / totalTime));
    
    return { totalHours, remainingHours, progress };
  }

  static shouldNotifyTaskReset(task: any, recurrenceFromDate?: Date): boolean {
    if (task.isCompleted) return false; // Don't notify for completed tasks
    
    const { progress } = this.getTimeUntilReset(task, recurrenceFromDate);
    
    // Notify when 90% of time has passed (10% remaining)
    return progress >= 0.9 && progress < 0.95;
  }

  static formatTimeUntilReset(task: any, recurrenceFromDate?: Date): string {
    const { remainingHours } = this.getTimeUntilReset(task, recurrenceFromDate);
    
    if (remainingHours < 1) {
      const minutes = Math.ceil(remainingHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (remainingHours < 24) {
      const hours = Math.ceil(remainingHours);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.ceil(remainingHours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}