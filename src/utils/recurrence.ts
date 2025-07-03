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

/**
 * Calculate the next due date based on recurrence pattern
 * This function handles year rollovers automatically
 */
export function calculateNextDueDate(currentDueDate: Date, recurrence: RecurrenceType): Date {
  const nextDue = new Date(currentDueDate);

  switch (recurrence) {
    case 'breakfast':
    case 'lunch':
    case 'dinner':
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    
    case 'work-daily':
      // Move to next work day
      do {
        nextDue.setDate(nextDue.getDate() + 1);
      } while (nextDue.getDay() === 0 || nextDue.getDay() === 6); // Skip weekends
      break;
    
    case 'weekend-daily':
      // Move to next weekend day
      do {
        nextDue.setDate(nextDue.getDate() + 1);
      } while (nextDue.getDay() !== 0 && nextDue.getDay() !== 6); // Only weekends
      break;
    
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    
    case 'fortnightly':
      nextDue.setDate(nextDue.getDate() + 14);
      break;
    
    case 'monthly':
      // Add one month, handling year rollover automatically
      const currentMonth = nextDue.getMonth();
      nextDue.setMonth(currentMonth + 1);
      
      // Handle edge case where the day doesn't exist in the next month
      // (e.g., Jan 31 -> Feb 31 becomes Feb 28/29)
      if (nextDue.getMonth() !== (currentMonth + 1) % 12) {
        nextDue.setDate(0); // Set to last day of previous month
      }
      break;
    
    case 'quarterly':
      // Add 3 months, handling year rollover automatically
      const currentQuarterMonth = nextDue.getMonth();
      nextDue.setMonth(currentQuarterMonth + 3);
      
      // Handle edge case for day overflow
      if (nextDue.getMonth() !== (currentQuarterMonth + 3) % 12) {
        nextDue.setDate(0);
      }
      break;
    
    case 'half-yearly':
      // Add 6 months, handling year rollover automatically
      const currentHalfMonth = nextDue.getMonth();
      nextDue.setMonth(currentHalfMonth + 6);
      
      // Handle edge case for day overflow
      if (nextDue.getMonth() !== (currentHalfMonth + 6) % 12) {
        nextDue.setDate(0);
      }
      break;
    
    case 'yearly':
      // Add one year
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      
      // Handle leap year edge case (Feb 29 -> Feb 28)
      if (nextDue.getMonth() !== currentDueDate.getMonth()) {
        nextDue.setDate(0); // Set to last day of February
      }
      break;
  }

  return nextDue;
}

/**
 * Get a human-readable description of when the next due date will be
 */
export function getNextDueDateDescription(currentDueDate: Date, recurrence: RecurrenceType): string {
  const nextDue = calculateNextDueDate(currentDueDate, recurrence);
  const now = new Date();
  const diffTime = nextDue.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (diffDays === 1) {
    return `Tomorrow (${formatDate(nextDue)})`;
  } else if (diffDays <= 7) {
    return `In ${diffDays} days (${formatDate(nextDue)})`;
  } else {
    return formatDate(nextDue);
  }
}