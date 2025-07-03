import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, Bell, BellOff } from 'lucide-react';
import { RecurrenceType } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel } from '../utils/recurrence';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGroupId?: string;
}

const basicRecurrenceOptions: RecurrenceType[] = [
  'daily',
  'meals',
  'days',
  'weekly',
  'fortnightly',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
];

const mealOptions = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌆' },
  { value: 'nightcap', label: 'Night Cap', icon: '🌙' },
] as const;

const dayOptions = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

export function AddTaskModal({ isOpen, onClose, initialGroupId }: AddTaskModalProps) {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || state.groups[0]?.id || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([state.activeProfileId]);
  const [dueDate, setDueDate] = useState('');
  const [recurrenceFromDate, setRecurrenceFromDate] = useState('');
  const [enableNotifications, setEnableNotifications] = useState<boolean | undefined>(undefined);
  
  // Recurrence config state
  const [selectedMeals, setSelectedMeals] = useState<('breakfast' | 'lunch' | 'dinner' | 'nightcap')[]>(['breakfast']);
  const [selectedDays, setSelectedDays] = useState<(0 | 1 | 2 | 3 | 4 | 5 | 6)[]>([1, 2, 3, 4, 5]); // Weekdays by default

  const selectedGroup = state.groups.find(g => g.id === groupId);
  const showDueDate = selectedGroup?.enableDueDates;
  const showRecurrenceFromDate = recurrence !== 'daily';
  const showMealConfig = recurrence === 'meals';
  const showDayConfig = recurrence === 'days';
  
  // Show notifications option only for non-due-date tasks
  const showNotifications = !showDueDate;
  
  // Get the effective notification setting (task-level or group default)
  const effectiveNotifications = enableNotifications ?? selectedGroup?.defaultNotifications ?? false;

  // Update notification default when group changes
  React.useEffect(() => {
    if (enableNotifications === undefined) {
      // Only auto-update if user hasn't explicitly set it
      setEnableNotifications(undefined);
    }
  }, [groupId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !groupId) return;

    const taskData: any = {
      title: title.trim(),
      groupId,
      recurrence,
      isCompleted: false,
      profiles: selectedProfiles,
    };

    // Add recurrence config
    if (showMealConfig && selectedMeals.length > 0) {
      taskData.recurrenceConfig = { meals: selectedMeals };
    } else if (showDayConfig && selectedDays.length > 0) {
      taskData.recurrenceConfig = { days: selectedDays };
    }

    // Add due date if the group supports it and a date is provided
    if (showDueDate && dueDate) {
      taskData.dueDate = new Date(dueDate);
    }

    // Add recurrence from date if provided and not daily
    if (showRecurrenceFromDate && recurrenceFromDate) {
      taskData.recurrenceFromDate = new Date(recurrenceFromDate);
    }

    // Add notifications setting (only for non-due-date tasks)
    if (showNotifications && enableNotifications !== undefined) {
      taskData.enableNotifications = enableNotifications;
    }

    dispatch({
      type: 'ADD_TASK',
      task: taskData,
    });

    // Reset form
    setTitle('');
    setGroupId(initialGroupId || state.groups[0]?.id || '');
    setRecurrence('daily');
    setSelectedProfiles([state.activeProfileId]);
    setDueDate('');
    setRecurrenceFromDate('');
    setEnableNotifications(undefined);
    setSelectedMeals(['breakfast']);
    setSelectedDays([1, 2, 3, 4, 5]);
    onClose();
  };

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleMeal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'nightcap') => {
    setSelectedMeals(prev => 
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const toggleDay = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
    setSelectedDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectAllWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectAllWeekends = () => {
    setSelectedDays([0, 6]);
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Add Task
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                autoFocus
                required
              />
            </div>

            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                required
              >
                {state.groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.enableDueDates ? '(Due dates)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurrence Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Recurrence Type
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
              >
                {basicRecurrenceOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'meals' ? 'Meal Times' : 
                     option === 'days' ? 'Specific Days' : 
                     getRecurrenceLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Selection */}
            {showMealConfig && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Meal Times
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {mealOptions.map(meal => (
                    <label
                      key={meal.value}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedMeals.includes(meal.value)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMeals.includes(meal.value)}
                        onChange={() => toggleMeal(meal.value)}
                        className="w-3.5 h-3.5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">{meal.icon}</span>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {meal.label}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedMeals.length === 0 && (
                  <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                    Please select at least one meal time
                  </p>
                )}
              </div>
            )}

            {/* Day Selection */}
            {showDayConfig && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Days of Week
                </label>
                
                {/* Quick Select Buttons */}
                <div className="flex space-x-1 mb-2">
                  <button
                    type="button"
                    onClick={selectAllWeekdays}
                    className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={selectAllWeekends}
                    className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                  >
                    Weekends
                  </button>
                  <button
                    type="button"
                    onClick={selectAllDays}
                    className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                  >
                    All Days
                  </button>
                </div>

                {/* Day Checkboxes */}
                <div className="grid grid-cols-2 gap-1.5">
                  {dayOptions.map(day => (
                    <label
                      key={day.value}
                      className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedDays.includes(day.value)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.value)}
                        onChange={() => toggleDay(day.value)}
                        className="w-3.5 h-3.5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {day.label}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                    Please select at least one day
                  </p>
                )}
              </div>
            )}

            {/* Recurrence From Date (conditional) */}
            {showRecurrenceFromDate && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recurrence From Date</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  value={recurrenceFromDate}
                  onChange={(e) => setRecurrenceFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  When should this task start recurring? Leave empty to start immediately.
                </p>
              </div>
            )}

            {/* Due Date (conditional) */}
            {showDueDate && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due Date</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Notifications at 25% time remaining and on due date
                </p>
              </div>
            )}

            {/* Notifications (conditional - only for non-due-date tasks) */}
            {showNotifications && (
              <div>
                <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      effectiveNotifications 
                        ? 'bg-primary-100 dark:bg-primary-900/20' 
                        : 'bg-neutral-100 dark:bg-neutral-700'
                    }`}>
                      {effectiveNotifications ? (
                        <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <BellOff className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Enable Notifications
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {enableNotifications === undefined 
                          ? `Group default: ${selectedGroup?.defaultNotifications ? 'On' : 'Off'}`
                          : 'Notify at 10% before task reset'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {enableNotifications !== undefined && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setEnableNotifications(undefined);
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        Reset
                      </button>
                    )}
                    <input
                      type="checkbox"
                      checked={effectiveNotifications}
                      onChange={(e) => setEnableNotifications(e.target.checked)}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                  </div>
                </label>
              </div>
            )}

            {/* Profile Selection - Compact */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Assign to Profiles
              </label>
              <div className="space-y-1.5">
                {state.profiles.map(profile => (
                  <label
                    key={profile.id}
                    className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProfiles.includes(profile.id)}
                      onChange={() => toggleProfile(profile.id)}
                      className="w-3.5 h-3.5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm">{profile.avatar}</span>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {profile.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex space-x-2.5 p-4 border-t border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md text-sm"
            disabled={
              !title.trim() || 
              !groupId || 
              selectedProfiles.length === 0 ||
              (showMealConfig && selectedMeals.length === 0) ||
              (showDayConfig && selectedDays.length === 0)
            }
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}