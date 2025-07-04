import React, { useState } from 'react';
import { X, Save, Palette, Users, Settings as SettingsIcon, Brain, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getAvailableIcons } from '../utils/icons';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';
import { HistoryAnalytics } from './HistoryAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'ai' | 'analytics';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');

  // Group management
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');
  const [newGroupDisplayMode, setNewGroupDisplayMode] = useState<'grey-out' | 'grey-drop' | 'separate-completed'>('grey-out');
  const [newGroupEnableDueDates, setNewGroupEnableDueDates] = useState(false);
  const [newGroupSortByDueDate, setNewGroupSortByDueDate] = useState(false);
  const [newGroupDefaultNotifications, setNewGroupDefaultNotifications] = useState(false);

  // Profile management
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newProfileIsCompetitor, setNewProfileIsCompetitor] = useState(false);
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfileCanEdit, setNewProfileCanEdit] = useState(true);
  const [newProfileCanCreate, setNewProfileCanCreate] = useState(true);
  const [newProfileCanDelete, setNewProfileCanDelete] = useState(true);
  const [newProfileMealTimes, setNewProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });

  const availableIcons = getAvailableIcons();

  const handleUpdateSettings = (updates: Partial<typeof state.settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', updates });
  };

  const handleSetPassword = () => {
    setPasswordModalType('set');
    setShowPasswordModal(true);
  };

  const handleRemovePassword = () => {
    setPasswordModalType('remove');
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = (password?: string) => {
    if (passwordModalType === 'set' && password) {
      onSetSettingsPassword(password);
    } else if (passwordModalType === 'remove') {
      onSetSettingsPassword('');
    }
    setShowPasswordModal(false);
  };

  // Group management functions
  const startEditingGroup = (group: TaskGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupColor(group.color);
    setNewGroupIcon(group.icon);
    setNewGroupDisplayMode(group.completedDisplayMode);
    setNewGroupEnableDueDates(group.enableDueDates);
    setNewGroupSortByDueDate(group.sortByDueDate);
    setNewGroupDefaultNotifications(group.defaultNotifications || false);
  };

  const startAddingGroup = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setNewGroupDisplayMode('grey-out');
    setNewGroupEnableDueDates(false);
    setNewGroupSortByDueDate(false);
    setNewGroupDefaultNotifications(false);
  };

  const saveGroup = () => {
    if (!newGroupName.trim()) return;

    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup.id,
        updates: {
          name: newGroupName.trim(),
          color: newGroupColor,
          icon: newGroupIcon,
          completedDisplayMode: newGroupDisplayMode,
          enableDueDates: newGroupEnableDueDates,
          sortByDueDate: newGroupSortByDueDate,
          defaultNotifications: newGroupDefaultNotifications,
        },
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: {
          name: newGroupName.trim(),
          color: newGroupColor,
          icon: newGroupIcon,
          completedDisplayMode: newGroupDisplayMode,
          isCollapsed: false,
          enableDueDates: newGroupEnableDueDates,
          sortByDueDate: newGroupSortByDueDate,
          defaultNotifications: newGroupDefaultNotifications,
        },
      });
    }

    setEditingGroup(null);
  };

  const deleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  // Profile management functions
  const startEditingProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setNewProfileName(profile.name);
    setNewProfileAvatar(profile.avatar);
    setNewProfileColor(profile.color);
    setNewProfileIsCompetitor(profile.isTaskCompetitor || false);
    setNewProfilePin(profile.pin || '');
    setNewProfileCanEdit(profile.permissions?.canEditTasks ?? true);
    setNewProfileCanCreate(profile.permissions?.canCreateTasks ?? true);
    setNewProfileCanDelete(profile.permissions?.canDeleteTasks ?? true);
    setNewProfileMealTimes(profile.mealTimes || {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const startAddingProfile = () => {
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfileIsCompetitor(false);
    setNewProfilePin('');
    setNewProfileCanEdit(true);
    setNewProfileCanCreate(true);
    setNewProfileCanDelete(true);
    setNewProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const saveProfile = () => {
    if (!newProfileName.trim()) return;

    const profileData = {
      name: newProfileName.trim(),
      avatar: newProfileAvatar,
      color: newProfileColor,
      isActive: true,
      isTaskCompetitor: newProfileIsCompetitor,
      pin: newProfilePin.trim() || undefined,
      permissions: {
        canEditTasks: newProfileCanEdit,
        canCreateTasks: newProfileCanCreate,
        canDeleteTasks: newProfileCanDelete,
      },
      mealTimes: newProfileMealTimes,
    };

    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile.id,
        updates: profileData,
      });
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: profileData,
      });
    }

    setEditingProfile(null);
  };

  const deleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-1">
                {[
                  { id: 'general', label: 'General', icon: SettingsIcon },
                  { id: 'groups', label: 'Task Groups', icon: Palette },
                  { id: 'profiles', label: 'Profiles', icon: Users },
                  { id: 'ai', label: 'AI Assistant', icon: Brain },
                  { id: 'analytics', label: 'Analytics', icon: Eye },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme Setting */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
                          className="input-primary"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Show Completed Count */}
                      <div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.showCompletedCount}
                            onChange={(e) => handleUpdateSettings({ showCompletedCount: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show completed task count in header
                          </span>
                        </label>
                      </div>

                      {/* Enable Notifications */}
                      <div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.enableNotifications}
                            onChange={(e) => handleUpdateSettings({ enableNotifications: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable notifications
                          </span>
                        </label>
                      </div>

                      {/* Show Top Collaborator */}
                      <div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.showTopCollaborator}
                            onChange={(e) => handleUpdateSettings({ showTopCollaborator: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show top collaborator in trophy modal
                          </span>
                        </label>
                      </div>

                      {/* Settings Password */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Settings Password Protection
                        </label>
                        <div className="flex items-center space-x-3">
                          {isSettingsPasswordSet ? (
                            <>
                              <div className="flex items-center space-x-2 px-3 py-2 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                                <span className="text-sm text-success-700 dark:text-success-400">
                                  Password protection enabled
                                </span>
                              </div>
                              <button
                                onClick={handleRemovePassword}
                                className="btn-secondary text-sm"
                              >
                                Remove Password
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg">
                                <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                  No password protection
                                </span>
                              </div>
                              <button
                                onClick={handleSetPassword}
                                className="btn-primary text-sm"
                              >
                                Set Password
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={startAddingGroup}
                      className="btn-primary"
                    >
                      Add Group
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {state.groups.map(group => (
                      <div key={group.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {group.name}
                              </h4>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {state.tasks.filter(t => t.groupId === group.id).length} tasks
                                {group.enableDueDates && ' • Due dates enabled'}
                                {group.defaultNotifications && ' • Notifications default on'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditingGroup(group)}
                              className="btn-secondary text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteGroup(group.id)}
                              className="text-error-600 hover:text-error-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group Edit Form */}
                  {(editingGroup !== null || newGroupName !== '') && (
                    <div className="card p-6 border-primary-200 dark:border-primary-700">
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Group Name
                          </label>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="input-primary"
                            placeholder="Enter group name..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <input
                              type="color"
                              value={newGroupColor}
                              onChange={(e) => setNewGroupColor(e.target.value)}
                              className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Icon
                            </label>
                            <select
                              value={newGroupIcon}
                              onChange={(e) => setNewGroupIcon(e.target.value)}
                              className="input-primary"
                            >
                              {availableIcons.map(icon => (
                                <option key={icon.name} value={icon.name}>
                                  {icon.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Completed Task Display
                          </label>
                          <select
                            value={newGroupDisplayMode}
                            onChange={(e) => setNewGroupDisplayMode(e.target.value as any)}
                            className="input-primary"
                          >
                            <option value="grey-out">Grey out completed tasks</option>
                            <option value="grey-drop">Grey out and move to bottom</option>
                            <option value="separate-completed">Separate completed section</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={newGroupEnableDueDates}
                              onChange={(e) => setNewGroupEnableDueDates(e.target.checked)}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Enable due dates for tasks in this group
                            </span>
                          </label>

                          {newGroupEnableDueDates && (
                            <label className="flex items-center space-x-3 ml-7">
                              <input
                                type="checkbox"
                                checked={newGroupSortByDueDate}
                                onChange={(e) => setNewGroupSortByDueDate(e.target.checked)}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Sort tasks by due date
                              </span>
                            </label>
                          )}

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={newGroupDefaultNotifications}
                              onChange={(e) => setNewGroupDefaultNotifications(e.target.checked)}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Enable notifications by default for new tasks
                            </span>
                          </label>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={saveGroup}
                            className="btn-primary"
                            disabled={!newGroupName.trim()}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingGroup ? 'Update Group' : 'Add Group'}
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      User Profiles
                    </h3>
                    <button
                      onClick={startAddingProfile}
                      className="btn-primary"
                    >
                      Add Profile
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {state.profiles.map(profile => (
                      <div key={profile.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                              {profile.avatar}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                {profile.id === state.activeProfileId && (
                                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full font-medium">
                                    Active
                                  </span>
                                )}
                                {profile.isTaskCompetitor && (
                                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium">
                                    Competitor
                                  </span>
                                )}
                                {profile.pin && profile.pin.trim().length > 0 && (
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">
                                    PIN Protected
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {state.tasks.filter(t => t.profiles.includes(profile.id)).length} tasks assigned
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditingProfile(profile)}
                              className="btn-secondary text-sm"
                            >
                              Edit
                            </button>
                            {state.profiles.length > 1 && (
                              <button
                                onClick={() => deleteProfile(profile.id)}
                                className="text-error-600 hover:text-error-700 text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Profile Edit Form */}
                  {(editingProfile !== null || newProfileName !== '') && (
                    <div className="card p-6 border-primary-200 dark:border-primary-700">
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              className="input-primary"
                              placeholder="Enter profile name..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Avatar (Emoji)
                            </label>
                            <input
                              type="text"
                              value={newProfileAvatar}
                              onChange={(e) => setNewProfileAvatar(e.target.value)}
                              className="input-primary"
                              placeholder="👤"
                              maxLength={2}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <input
                              type="color"
                              value={newProfileColor}
                              onChange={(e) => setNewProfileColor(e.target.value)}
                              className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              PIN (Optional)
                            </label>
                            <input
                              type="password"
                              value={newProfilePin}
                              onChange={(e) => setNewProfilePin(e.target.value)}
                              className="input-primary"
                              placeholder="Enter PIN..."
                            />
                          </div>
                        </div>

                        {/* Meal Times */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Meal Times (24-hour format)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                Breakfast
                              </label>
                              <input
                                type="time"
                                value={newProfileMealTimes.breakfast}
                                onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                Lunch
                              </label>
                              <input
                                type="time"
                                value={newProfileMealTimes.lunch}
                                onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                Dinner
                              </label>
                              <input
                                type="time"
                                value={newProfileMealTimes.dinner}
                                onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                Night Cap
                              </label>
                              <input
                                type="time"
                                value={newProfileMealTimes.nightcap}
                                onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, nightcap: e.target.value }))}
                                className="input-primary"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={newProfileIsCompetitor}
                              onChange={(e) => setNewProfileIsCompetitor(e.target.checked)}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Task Competitor (participate in leaderboards)
                            </span>
                          </label>

                          <div className="ml-7 space-y-2">
                            <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Permissions
                            </h5>
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={newProfileCanCreate}
                                onChange={(e) => setNewProfileCanCreate(e.target.checked)}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Can create tasks
                              </span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={newProfileCanEdit}
                                onChange={(e) => setNewProfileCanEdit(e.target.checked)}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Can edit tasks
                              </span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={newProfileCanDelete}
                                onChange={(e) => setNewProfileCanDelete(e.target.checked)}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Can delete tasks
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={saveProfile}
                            className="btn-primary"
                            disabled={!newProfileName.trim()}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingProfile ? 'Update Profile' : 'Add Profile'}
                          </button>
                          <button
                            onClick={() => setEditingProfile(null)}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="btn-primary"
                      disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Open AI Assistant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Enable AI */}
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={state.settings.ai.enabled}
                          onChange={(e) => handleUpdateSettings({ 
                            ai: { ...state.settings.ai, enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Enable AI Assistant
                        </span>
                      </label>
                    </div>

                    {/* AI Provider */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        AI Provider
                      </label>
                      <select
                        value={state.settings.ai.provider}
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, provider: e.target.value as any }
                        })}
                        className="input-primary"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                    </div>

                    {/* AI Model */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Model
                      </label>
                      <select
                        value={state.settings.ai.model}
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, model: e.target.value }
                        })}
                        className="input-primary"
                      >
                        {state.settings.ai.provider === 'openai' && (
                          <>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          </>
                        )}
                        {state.settings.ai.provider === 'anthropic' && (
                          <>
                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                          </>
                        )}
                        {state.settings.ai.provider === 'gemini' && (
                          <>
                            <option value="gemini-pro">Gemini Pro</option>
                            <option value="gemini-pro-vision">Gemini Pro Vision</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={state.settings.ai.apiKey}
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, apiKey: e.target.value }
                        })}
                        placeholder="Enter your API key..."
                        className="input-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Task Analytics
                  </h3>
                  
                  <HistoryAnalytics 
                    history={state.history}
                    tasks={state.tasks}
                    profiles={state.profiles}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
        onUpdateSettings={(updates) => handleUpdateSettings({ ai: { ...state.settings.ai, ...updates } })}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={
          passwordModalType === 'set' 
            ? 'Set a password to protect access to settings. This password will be required to open settings in the future.'
            : 'Enter your current settings password to remove password protection.'
        }
        placeholder={passwordModalType === 'set' ? 'Enter new password...' : 'Enter current password...'}
        expectedPassword={passwordModalType === 'remove' ? state.settings.settingsPassword : undefined}
        onPasswordSet={passwordModalType === 'set' ? handlePasswordSuccess : undefined}
        isSettingPassword={passwordModalType === 'set'}
      />
    </>
  );
}