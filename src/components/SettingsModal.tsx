import React, { useState } from 'react';
import { X, Settings, User, Palette, Shield, Brain, Bell, Users, Plus, Edit, Trash2, Eye, EyeOff, Home, Calendar, BarChart3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { getIconComponent, getAvailableIcons } from '../utils/icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'history';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  
  // Profile form state
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfilePermissions, setNewProfilePermissions] = useState({
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
  });
  const [newProfileIsCompetitor, setNewProfileIsCompetitor] = useState(false);
  const [newProfileMealTimes, setNewProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });

  // Group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');
  const [newGroupDisplayMode, setNewGroupDisplayMode] = useState<'grey-out' | 'grey-drop' | 'separate-completed'>('grey-out');
  const [newGroupEnableDueDates, setNewGroupEnableDueDates] = useState(false);
  const [newGroupSortByDueDate, setNewGroupSortByDueDate] = useState(false);
  const [newGroupDefaultNotifications, setNewGroupDefaultNotifications] = useState(false);

  // AI Settings
  const [aiProvider, setAiProvider] = useState(state.settings.ai.provider);
  const [aiModel, setAiModel] = useState(state.settings.ai.model);
  const [aiApiKey, setAiApiKey] = useState(state.settings.ai.apiKey);
  const [aiEnabled, setAiEnabled] = useState(state.settings.ai.enabled);

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: {
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey,
          enabled: aiEnabled,
        },
      },
    });
  };

  // Profile handlers
  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;

    dispatch({
      type: 'ADD_PROFILE',
      profile: {
        name: newProfileName.trim(),
        avatar: newProfileAvatar,
        color: newProfileColor,
        isActive: false,
        pin: newProfilePin || undefined,
        permissions: newProfilePermissions,
        isTaskCompetitor: newProfileIsCompetitor,
        mealTimes: newProfileMealTimes,
      },
    });

    resetProfileForm();
  };

  const handleEditProfile = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    setNewProfileName(profile.name);
    setNewProfileAvatar(profile.avatar);
    setNewProfileColor(profile.color);
    setNewProfilePin(profile.pin || '');
    setNewProfilePermissions(profile.permissions || {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(profile.isTaskCompetitor || false);
    setNewProfileMealTimes(profile.mealTimes || {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
    setEditingProfile(profileId);
  };

  const handleUpdateProfile = () => {
    if (!editingProfile || !newProfileName.trim()) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: {
        name: newProfileName.trim(),
        avatar: newProfileAvatar,
        color: newProfileColor,
        pin: newProfilePin || undefined,
        permissions: newProfilePermissions,
        isTaskCompetitor: newProfileIsCompetitor,
        mealTimes: newProfileMealTimes,
      },
    });

    resetProfileForm();
  };

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }

    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const resetProfileForm = () => {
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfilePin('');
    setNewProfilePermissions({
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(false);
    setNewProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
    setEditingProfile(null);
  };

  // Group handlers
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

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

    resetGroupForm();
  };

  const handleEditGroup = (groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    setNewGroupName(group.name);
    setNewGroupColor(group.color);
    setNewGroupIcon(group.icon);
    setNewGroupDisplayMode(group.completedDisplayMode);
    setNewGroupEnableDueDates(group.enableDueDates);
    setNewGroupSortByDueDate(group.sortByDueDate);
    setNewGroupDefaultNotifications(group.defaultNotifications || false);
    setEditingGroup(groupId);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup || !newGroupName.trim()) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
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

    resetGroupForm();
  };

  const handleDeleteGroup = (groupId: string) => {
    const tasksInGroup = state.tasks.filter(t => t.groupId === groupId);
    if (tasksInGroup.length > 0) {
      if (!window.confirm(`This group contains ${tasksInGroup.length} task(s). Deleting the group will also delete all tasks in it. Are you sure?`)) {
        return;
      }
    }

    dispatch({ type: 'DELETE_GROUP', groupId });
  };

  const resetGroupForm = () => {
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setNewGroupDisplayMode('grey-out');
    setNewGroupEnableDueDates(false);
    setNewGroupSortByDueDate(false);
    setNewGroupDefaultNotifications(false);
    setEditingGroup(null);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'groups', label: 'Groups', icon: Home },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'history', label: 'History', icon: BarChart3 },
  ] as const;

  const availableIcons = getAvailableIcons();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
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
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Theme
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Choose your preferred color scheme
                          </p>
                        </div>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { theme: e.target.value as any }
                          })}
                          className="input-primary w-32"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Show Completed Count */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show Completed Count
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Display task completion progress in header
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={state.settings.showCompletedCount}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { showCompletedCount: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>

                      {/* Enable Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable Notifications
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Allow browser notifications for due dates and task resets
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={state.settings.enableNotifications}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { enableNotifications: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>

                      {/* Show Top Collaborator */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show Top Collaborator
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Display collaboration leaderboard in trophy popup
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={state.settings.showTopCollaborator}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { showTopCollaborator: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Task Groups
                    </h3>
                    
                    {/* Existing Groups */}
                    <div className="space-y-4 mb-6">
                      {state.groups.map(group => {
                        const IconComponent = getIconComponent(group.icon);
                        const tasksInGroup = state.tasks.filter(t => t.groupId === group.id);
                        
                        return (
                          <div key={group.id} className="card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: group.color + '20', color: group.color }}
                                >
                                  <IconComponent className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>{tasksInGroup.length} task{tasksInGroup.length !== 1 ? 's' : ''}</span>
                                    {group.enableDueDates && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                                        Due dates
                                      </span>
                                    )}
                                    {group.defaultNotifications && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                        Notifications
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  title="Edit group"
                                >
                                  <Edit className="w-4 h-4 text-neutral-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                  title="Delete group"
                                >
                                  <Trash2 className="w-4 h-4 text-error-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add/Edit Group Form */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Info */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              placeholder="Group name"
                              className="input-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Icon
                            </label>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: newGroupColor + '20', color: newGroupColor }}
                              >
                                {React.createElement(getIconComponent(newGroupIcon), { className: "w-5 h-5" })}
                              </div>
                              <select
                                value={newGroupIcon}
                                onChange={(e) => setNewGroupIcon(e.target.value)}
                                className="input-primary flex-1"
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
                              Completed Display Mode
                            </label>
                            <select
                              value={newGroupDisplayMode}
                              onChange={(e) => setNewGroupDisplayMode(e.target.value as any)}
                              className="input-primary"
                            >
                              <option value="grey-out">Grey out completed</option>
                              <option value="grey-drop">Grey out and drop down</option>
                              <option value="separate-completed">Separate completed section</option>
                            </select>
                          </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                              Group Features
                            </label>
                            <div className="space-y-3">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newGroupEnableDueDates}
                                  onChange={(e) => setNewGroupEnableDueDates(e.target.checked)}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <div>
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable due dates</span>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Allow tasks in this group to have due dates
                                  </p>
                                </div>
                              </label>

                              {newGroupEnableDueDates && (
                                <label className="flex items-center space-x-2 ml-6">
                                  <input
                                    type="checkbox"
                                    checked={newGroupSortByDueDate}
                                    onChange={(e) => setNewGroupSortByDueDate(e.target.checked)}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Sort by due date</span>
                                </label>
                              )}

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newGroupDefaultNotifications}
                                  onChange={(e) => setNewGroupDefaultNotifications(e.target.checked)}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <div>
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Default notifications</span>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    New tasks in this group will have notifications enabled by default
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        {editingGroup && (
                          <button
                            onClick={resetGroupForm}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                          disabled={!newGroupName.trim()}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {editingGroup ? 'Update Group' : 'Add Group'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      User Profiles
                    </h3>
                    
                    {/* Existing Profiles */}
                    <div className="space-y-4 mb-6">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
                                style={{ backgroundColor: profile.color + '20', color: profile.color }}
                              >
                                {profile.avatar}
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                  {profile.id === state.activeProfileId && (
                                    <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                                      Active
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                  {profile.isTaskCompetitor && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                                      Competitor
                                    </span>
                                  )}
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full">
                                      PIN Protected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditProfile(profile.id)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                title="Edit profile"
                              >
                                <Edit className="w-4 h-4 text-neutral-500" />
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                  title="Delete profile"
                                >
                                  <Trash2 className="w-4 h-4 text-error-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add/Edit Profile Form */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              placeholder="Profile name"
                              className="input-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Avatar
                            </label>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                style={{ backgroundColor: newProfileColor + '20', color: newProfileColor }}
                              >
                                {newProfileAvatar}
                              </div>
                              <input
                                type="text"
                                value={newProfileAvatar}
                                onChange={(e) => setNewProfileAvatar(e.target.value)}
                                placeholder="👤"
                                className="input-primary flex-1"
                                maxLength={2}
                              />
                            </div>
                          </div>

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
                              placeholder="Leave empty for no PIN"
                              className="input-primary"
                            />
                          </div>
                        </div>

                        {/* Permissions, Settings, and Meal Times */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                              Permissions
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newProfilePermissions.canCreateTasks}
                                  onChange={(e) => setNewProfilePermissions(prev => ({
                                    ...prev,
                                    canCreateTasks: e.target.checked
                                  }))}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newProfilePermissions.canEditTasks}
                                  onChange={(e) => setNewProfilePermissions(prev => ({
                                    ...prev,
                                    canEditTasks: e.target.checked
                                  }))}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newProfilePermissions.canDeleteTasks}
                                  onChange={(e) => setNewProfilePermissions(prev => ({
                                    ...prev,
                                    canDeleteTasks: e.target.checked
                                  }))}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newProfileIsCompetitor}
                                onChange={(e) => setNewProfileIsCompetitor(e.target.checked)}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Task Competitor</span>
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-6">
                              Participate in task completion rankings
                            </p>
                          </div>

                          {/* Meal Times */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                              Meal Times
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                  🌅 Breakfast
                                </label>
                                <input
                                  type="time"
                                  value={newProfileMealTimes.breakfast}
                                  onChange={(e) => setNewProfileMealTimes(prev => ({
                                    ...prev,
                                    breakfast: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                  ☀️ Lunch
                                </label>
                                <input
                                  type="time"
                                  value={newProfileMealTimes.lunch}
                                  onChange={(e) => setNewProfileMealTimes(prev => ({
                                    ...prev,
                                    lunch: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                  🌆 Dinner
                                </label>
                                <input
                                  type="time"
                                  value={newProfileMealTimes.dinner}
                                  onChange={(e) => setNewProfileMealTimes(prev => ({
                                    ...prev,
                                    dinner: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                  🌙 Night Cap
                                </label>
                                <input
                                  type="time"
                                  value={newProfileMealTimes.nightcap}
                                  onChange={(e) => setNewProfileMealTimes(prev => ({
                                    ...prev,
                                    nightcap: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        {editingProfile && (
                          <button
                            onClick={resetProfileForm}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={editingProfile ? handleUpdateProfile : handleAddProfile}
                          disabled={!newProfileName.trim()}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {editingProfile ? 'Update Profile' : 'Add Profile'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Security Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Settings Password */}
                      <div className="card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Settings Password
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {isSettingsPasswordSet ? 'Password protection is enabled' : 'Protect settings with a password'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className="btn-secondary text-sm"
                          >
                            {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                          </button>
                        </div>
                      </div>

                      {/* Profile Security Summary */}
                      <div className="card p-4">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                          Profile Security
                        </h4>
                        <div className="space-y-2">
                          {state.profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{profile.avatar}</span>
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {profile.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {profile.pin ? (
                                  <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs rounded-full">
                                    PIN Protected
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                                    No PIN
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      AI Assistant
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Enable AI */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable AI Assistant
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Get insights about your task patterns and productivity
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiEnabled}
                          onChange={(e) => setAiEnabled(e.target.checked)}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>

                      {/* AI Provider */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          AI Provider
                        </label>
                        <select
                          value={aiProvider}
                          onChange={(e) => setAiProvider(e.target.value as any)}
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
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          className="input-primary"
                        >
                          {aiProvider === 'openai' && (
                            <>
                              <option value="gpt-4">GPT-4</option>
                              <option value="gpt-4-turbo">GPT-4 Turbo</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </>
                          )}
                          {aiProvider === 'anthropic' && (
                            <>
                              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                            </>
                          )}
                          {aiProvider === 'gemini' && (
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
                        <div className="relative">
                          <input
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="input-primary pr-10"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <Eye className="w-4 h-4 text-neutral-400" />
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Your API key is stored locally and never shared
                        </p>
                      </div>

                      {/* Save Button */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveAISettings}
                          className="btn-primary"
                        >
                          Save AI Settings
                        </button>
                        {aiEnabled && aiApiKey && (
                          <button
                            onClick={() => setShowAIModal(true)}
                            className="btn-secondary"
                          >
                            Test AI Assistant
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-6">
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

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title={isSettingsPasswordSet ? "Change Settings Password" : "Set Settings Password"}
        description={isSettingsPasswordSet ? "Enter a new password to protect settings access." : "Set a password to protect access to settings."}
        isSettingPassword={true}
      />

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={{
          ...state.settings.ai,
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey,
          enabled: aiEnabled,
        }}
      />
    </>
  );
}