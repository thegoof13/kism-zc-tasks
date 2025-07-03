import React, { useState } from 'react';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { RecurrenceType } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel } from '../utils/recurrence';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGroupId?: string;
}

const recurrenceOptions: RecurrenceType[] = [
  'daily',
  'breakfast',
  'lunch',
  'dinner',
  'work-daily',
  'weekend-daily',
  'weekly',
  'fortnightly',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
];

export function AddTaskModal({ isOpen, onClose, initialGroupId }: AddTaskModalProps) {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || state.groups[0]?.id || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([state.activeProfileId]);
  const [dueDate, setDueDate] = useState('');
  const [recurrenceFromDate, setRecurrenceFromDate] = useState('');

  const selectedGroup = state.groups.find(g => g.id === groupId);
  const showDueDate = selectedGroup?.enableDueDates;
  const showRecurrenceFromDate = recurrence !== 'daily';

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

    // Add due date if the group supports it and a date is provided
    if (showDueDate && dueDate) {
      taskData.dueDate = new Date(dueDate);
    }

    // Add recurrence from date if provided and not daily
    if (showRecurrenceFromDate && recurrenceFromDate) {
      taskData.recurrenceFromDate = new Date(recurrenceFromDate);
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
    onClose();
  };

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
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

            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
              >
                {recurrenceOptions.map(option => (
                  <option key={option} value={option}>
                    {getRecurrenceLabel(option)}
                  </option>
                ))}
              </select>
            </div>

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
            disabled={!title.trim() || !groupId || selectedProfiles.length === 0}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5 inline" />
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}