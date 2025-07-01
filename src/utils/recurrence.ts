import { RecurrenceType } from '../types';

export function getRecurrenceLabel(recurrence: RecurrenceType): string {
  const labels: Record<RecurrenceType, string> = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
    'daily': 'Daily',
    'work-daily': 'Work Days',
    'weekend-daily': 'Weekends',
    'weekly': 'Weekly',
    'fortnightly': 'Fortnightly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'half-yearly': 'Half-Yearly',
    'yearly': 'Yearly'
  };
  return labels[recurrence];
}

export function shouldResetTask(lastCompleted: Date, recurrence: RecurrenceType): boolean {
  const now = new Date();
  const lastCompletedDate = new Date(lastCompleted);
  
  switch (recurrence) {
    case 'breakfast':
      return now.getHours() >= 6 && (
        now.getDate() !== lastCompletedDate.getDate() ||
        now.getMonth() !== lastCompletedDate.getMonth() ||
        now.getFullYear() !== lastCompletedDate.getFullYear()
      );
    
    case 'lunch':
      return now.getHours() >= 11 && (
        now.getDate() !== lastCompletedDate.getDate() ||
        now.getMonth() !== lastCompletedDate.getMonth() ||
        now.getFullYear() !== lastCompletedDate.getFullYear()
      );
    
    case 'dinner':
      return now.getHours() >= 17 && (
        now.getDate() !== lastCompletedDate.getDate() ||
        now.getMonth() !== lastCompletedDate.getMonth() ||
        now.getFullYear() !== lastCompletedDate.getFullYear()
      );
    
    case 'daily':
      return now.getDate() !== lastCompletedDate.getDate() ||
             now.getMonth() !== lastCompletedDate.getMonth() ||
             now.getFullYear() !== lastCompletedDate.getFullYear();
    
    case 'work-daily':
      const isWorkDay = now.getDay() >= 1 && now.getDay() <= 5;
      return isWorkDay && (
        now.getDate() !== lastCompletedDate.getDate() ||
        now.getMonth() !== lastCompletedDate.getMonth() ||
        now.getFullYear() !== lastCompletedDate.getFullYear()
      );
    
    case 'weekend-daily':
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      return isWeekend && (
        now.getDate() !== lastCompletedDate.getDate() ||
        now.getMonth() !== lastCompletedDate.getMonth() ||
        now.getFullYear() !== lastCompletedDate.getFullYear()
      );
    
    case 'weekly':
      const weeksDiff = Math.floor((now.getTime() - lastCompletedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff >= 1;
    
    case 'fortnightly':
      const fortnightsDiff = Math.floor((now.getTime() - lastCompletedDate.getTime()) / (14 * 24 * 60 * 60 * 1000));
      return fortnightsDiff >= 1;
    
    case 'monthly':
      return now.getMonth() !== lastCompletedDate.getMonth() ||
             now.getFullYear() !== lastCompletedDate.getFullYear();
    
    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const lastQuarter = Math.floor(lastCompletedDate.getMonth() / 3);
      return currentQuarter !== lastQuarter ||
             now.getFullYear() !== lastCompletedDate.getFullYear();
    
    case 'half-yearly':
      const currentHalf = Math.floor(now.getMonth() / 6);
      const lastHalf = Math.floor(lastCompletedDate.getMonth() / 6);
      return currentHalf !== lastHalf ||
             now.getFullYear() !== lastCompletedDate.getFullYear();
    
    case 'yearly':
      return now.getFullYear() !== lastCompletedDate.getFullYear();
    
    default:
      return false;
  }
}

export function getNextRecurrenceDate(recurrence: RecurrenceType, lastDate?: Date): Date {
  const base = lastDate ? new Date(lastDate) : new Date();
  const next = new Date(base);

  switch (recurrence) {
    case 'breakfast':
    case 'lunch':
    case 'dinner':
    case 'daily':
    case 'work-daily':
    case 'weekend-daily':
      next.setDate(next.getDate() + 1);
      break;
    
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    
    case 'fortnightly':
      next.setDate(next.getDate() + 14);
      break;
    
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    
    case 'half-yearly':
      next.setMonth(next.getMonth() + 6);
      break;
    
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}