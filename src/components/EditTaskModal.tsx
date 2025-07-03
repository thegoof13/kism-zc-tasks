import React, { useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { Task, RecurrenceType } from '../types';
import { useApp } from '../contexts/AppContext';
import { getRecurrenceLabel } from '../utils/recurrence';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
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

export function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState(task.title);
  const [groupId, setGroupId] = useState(task.groupId);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(task.recurrence);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(task.profiles);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
  );

  const selectedGroup = state.groups.find(g => g.id === groupId);
  const showDueDate = selectedGroup?.enableDueDates;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !groupId) return;

    const updates: any = {
      title: title.trim(),
      groupId,
      recurrence,
      profiles: selectedProfiles,
    };

    // Handle due date
    if (showDueDate && dueDate) {
      updates.dueDate = new Date(dueDate);
    } else if (!showDueDate) {
      // Remove due date if group doesn't support it
      updates.dueDate = undefined;
    }

    dispatch({
      type: 'UPDATE_TASK',
      taskId: task.id,
      updates,
    });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="input-primary"
              autoFocus
              required
            />
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="input-primary"
              required
            >
              {state.groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.enableDueDates ? '(Due dates enabled)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date (conditional) */}
          {showDueDate && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </div>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-primary"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                You'll receive notifications at 25% time remaining and on the due date
              </p>
            </div>
          )}

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="input-primary"
            >
              {recurrenceOptions.map(option => (
                <option key={option} value={option}>
                  {getRecurrenceLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profiles
            </label>
            <div className="space-y-2">
              {state.profiles.map(profile => (
                <label
                  key={profile.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(profile.id)}
                    onChange={() => toggleProfile(profile.id)}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-lg">{profile.avatar}</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {profile.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={!title.trim() || !groupId || selectedProfiles.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}