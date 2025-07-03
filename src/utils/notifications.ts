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
        icon: '/icon-192.png',
        badge: '/icon-192.png',
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
}