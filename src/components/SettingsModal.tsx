import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Edit, Users, Palette, Settings, Brain, Bell, Eye, EyeOff, Shield, Download, Upload, RotateCcw, Crown, Trophy, Archive, Moon, Sun, Monitor } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'ai' | 'analytics' | 'data';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState({
    title: '',
    description: '',
    onSuccess: () => {},
    isSettingPassword: false,
  });

  // Form states for different sections
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as const,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    color: '#6366F1',
    avatar: '👤',
    isTaskCompetitor: false,
    pin: '',
    permissions: {
      canEditTasks: true,
      canCreateTasks: true,
      canDeleteTasks: true,
    },
    mealTimes: {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    },
  });

  const availableIcons = getAvailableIcons();

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('general');
      setEditingGroup(null);
      setEditingProfile(null);
      setNewGroupForm({
        name: '',
        color: '#6366F1',
        icon: 'User',
        completedDisplayMode: 'grey-out',
        enableDueDates: false,
        sortByDueDate: false,
        defaultNotifications: false,
      });
      setNewProfileForm({
        name: '',
        color: '#6366F1',
        avatar: '👤',
        isTaskCompetitor: false,
        pin: '',
        permissions: {
          canEditTasks: true,
          canCreateTasks: true,
          canDeleteTasks: true,
        },
        mealTimes: {
          breakfast: '07:00',
          lunch: '12:00',
          dinner: '18:00',
          nightcap: '21:00',
        },
      });
    }
  }, [isOpen]);

  const handleSaveGroup = () => {
    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup.id,
        updates: {
          name: newGroupForm.name,
          color: newGroupForm.color,
          icon: newGroupForm.icon,
          completedDisplayMode: newGroupForm.completedDisplayMode,
          enableDueDates: newGroupForm.enableDueDates,
          sortByDueDate: newGroupForm.sortByDueDate,
          defaultNotifications: newGroupForm.defaultNotifications,
        },
      });
      setEditingGroup(null);
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: newGroupForm,
      });
    }
    
    setNewGroupForm({
      name: '',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out',
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    });
  };

  const handleSaveProfile = () => {
    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile.id,
        updates: {
          name: newProfileForm.name,
          color: newProfileForm.color,
          avatar: newProfileForm.avatar,
          isTaskCompetitor: newProfileForm.isTaskCompetitor,
          pin: newProfileForm.pin,
          permissions: newProfileForm.permissions,
          mealTimes: newProfileForm.mealTimes,
        },
      });
      setEditingProfile(null);
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: newProfileForm,
      });
    }
    
    setNewProfileForm({
      name: '',
      color: '#6366F1',
      avatar: '👤',
      isTaskCompetitor: false,
      pin: '',
      permissions: {
        canEditTasks: true,
        canCreateTasks: true,
        canDeleteTasks: true,
      },
      mealTimes: {
        breakfast: '07:00',
        lunch: '12:00',
        dinner: '18:00',
        nightcap: '21:00',
      },
    });
  };

  const handleEditGroup = (group: TaskGroup) => {
    setEditingGroup(group);
    setNewGroupForm({
      name: group.name,
      color: group.color,
      icon: group.icon,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate,
      defaultNotifications: group.defaultNotifications || false,
    });
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setNewProfileForm({
      name: profile.name,
      color: profile.color,
      avatar: profile.avatar,
      isTaskCompetitor: profile.isTaskCompetitor || false,
      pin: profile.pin || '',
      permissions: profile.permissions || {
        canEditTasks: true,
        canCreateTasks: true,
        canDeleteTasks: true,
      },
      mealTimes: profile.mealTimes || {
        breakfast: '07:00',
        lunch: '12:00',
        dinner: '18:00',
        nightcap: '21:00',
      },
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings. This password will be required to open settings in the future.',
      onSuccess: () => setShowPasswordModal(false),
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveSettingsPassword = () => {
    if (window.confirm('Are you sure you want to remove the settings password? Settings will be accessible without authentication.')) {
      onSetSettingsPassword('');
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (window.confirm('This will replace all current data. Are you sure you want to continue?')) {
          dispatch({ type: 'LOAD_STATE', state: importedData });
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid FocusFlow data file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('This will delete ALL data including tasks, groups, profiles, and history. This action cannot be undone. Are you sure?')) {
      if (window.confirm('This is your final warning. All data will be permanently lost. Continue?')) {
        // Reset to initial state
        window.location.reload();
      }
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'groups', label: 'Groups', icon: Palette },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: Trophy },
    { id: 'data', label: 'Data', icon: Archive },
  ] as const;

  return (
    <>
      {/* Main Settings Modal - z-index 40 */}
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        General Settings
                      </h3>
                      
                      {/* Theme Setting */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Theme
                          </label>
                          <div className="flex space-x-2">
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'system', label: 'System', icon: Monitor },
                            ].map(({ value, label, icon: Icon }) => (
                              <button
                                key={value}
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', updates: { theme: value as any } })}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200 ${
                                  state.settings.theme === value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                    : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notifications */}
                        <div>
                          <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-primary-500" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  Enable Notifications
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Get notified about due dates and task resets
                                </p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={state.settings.enableNotifications}
                              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { enableNotifications: e.target.checked } })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </label>
                        </div>

                        {/* Show Completed Count */}
                        <div>
                          <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <Trophy className="w-5 h-5 text-primary-500" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  Show Completed Count
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Display task completion progress in header
                                </p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={state.settings.showCompletedCount}
                              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { showCompletedCount: e.target.checked } })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </label>
                        </div>

                        {/* Show Top Collaborator */}
                        <div>
                          <label className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <Crown className="w-5 h-5 text-primary-500" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  Show Top Collaborator
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Display collaboration leaderboard in trophy modal
                                </p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={state.settings.showTopCollaborator}
                              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { showTopCollaborator: e.target.checked } })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </label>
                        </div>

                        {/* Settings Password */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Settings Protection
                          </label>
                          <div className="flex items-center space-x-3">
                            {isSettingsPasswordSet ? (
                              <>
                                <div className="flex items-center space-x-2 px-3 py-2 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-lg border border-success-200 dark:border-success-800">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm font-medium">Password Protected</span>
                                </div>
                                <button
                                  onClick={handleRemoveSettingsPassword}
                                  className="btn-secondary text-sm"
                                >
                                  Remove Password
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2 px-3 py-2 bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-lg border border-warning-200 dark:border-warning-800">
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm font-medium">No Protection</span>
                                </div>
                                <button
                                  onClick={handleSetSettingsPassword}
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

                {/* Groups Management */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task Groups
                      </h3>
                    </div>

                    {/* Add/Edit Group Form */}
                    <div className="card p-4">
                      <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Group Name
                          </label>
                          <input
                            type="text"
                            value={newGroupForm.name}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter group name..."
                            className="input-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Color
                          </label>
                          <input
                            type="color"
                            value={newGroupForm.color}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Icon
                          </label>
                          <select
                            value={newGroupForm.icon}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, icon: e.target.value }))}
                            className="input-primary"
                          >
                            {availableIcons.map(({ name }) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Completed Display Mode
                          </label>
                          <select
                            value={newGroupForm.completedDisplayMode}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                            className="input-primary"
                          >
                            <option value="grey-out">Grey Out</option>
                            <option value="grey-drop">Grey Out & Drop Down</option>
                            <option value="separate-completed">Separate Section</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={newGroupForm.enableDueDates}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable Due Dates
                          </span>
                        </label>

                        {newGroupForm.enableDueDates && (
                          <label className="flex items-center space-x-3 ml-7">
                            <input
                              type="checkbox"
                              checked={newGroupForm.sortByDueDate}
                              onChange={(e) => setNewGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Sort by Due Date
                            </span>
                          </label>
                        )}

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={newGroupForm.defaultNotifications}
                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Default Notifications for New Tasks
                          </span>
                        </label>
                      </div>

                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={handleSaveGroup}
                          disabled={!newGroupForm.name.trim()}
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingGroup ? 'Update Group' : 'Add Group'}
                        </button>
                        {editingGroup && (
                          <button
                            onClick={() => {
                              setEditingGroup(null);
                              setNewGroupForm({
                                name: '',
                                color: '#6366F1',
                                icon: 'User',
                                completedDisplayMode: 'grey-out',
                                enableDueDates: false,
                                sortByDueDate: false,
                                defaultNotifications: false,
                              });
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Existing Groups */}
                    <div className="space-y-3">
                      {state.groups.map((group) => {
                        const IconComponent = getIconComponent(group.icon);
                        return (
                          <div key={group.id} className="card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: group.color + '20' }}
                                >
                                  <IconComponent className="w-4 h-4" style={{ color: group.color }} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {group.completedDisplayMode.replace('-', ' ')} • 
                                    {group.enableDueDates ? ' Due dates enabled' : ' No due dates'} •
                                    {group.defaultNotifications ? ' Notifications on' : ' Notifications off'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditGroup(group)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4 text-neutral-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-error-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Profiles Management */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                    </div>

                    {/* Add/Edit Profile Form */}
                    <div className="card p-4">
                      <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Profile Name
                          </label>
                          <input
                            type="text"
                            value={newProfileForm.name}
                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter profile name..."
                            className="input-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Avatar
                          </label>
                          <input
                            type="text"
                            value={newProfileForm.avatar}
                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                            placeholder="Enter emoji..."
                            className="input-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Color
                          </label>
                          <input
                            type="color"
                            value={newProfileForm.color}
                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            PIN (Optional)
                          </label>
                          <input
                            type="password"
                            value={newProfileForm.pin}
                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                            placeholder="Enter PIN..."
                            className="input-primary"
                          />
                        </div>
                      </div>

                      {/* Meal Times */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Meal Times
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(newProfileForm.mealTimes).map(([meal, time]) => (
                            <div key={meal}>
                              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
                                {meal}
                              </label>
                              <input
                                type="time"
                                value={time}
                                onChange={(e) => setNewProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, [meal]: e.target.value }
                                }))}
                                className="input-primary text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Permissions
                        </label>
                        <div className="space-y-2">
                          {Object.entries(newProfileForm.permissions).map(([permission, enabled]) => (
                            <label key={permission} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setNewProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, [permission]: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                                {permission.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Task Competitor */}
                      <div className="mt-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={newProfileForm.isTaskCompetitor}
                            onChange={(e) => setNewProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Task Competitor
                          </span>
                        </label>
                      </div>

                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={!newProfileForm.name.trim()}
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingProfile ? 'Update Profile' : 'Add Profile'}
                        </button>
                        {editingProfile && (
                          <button
                            onClick={() => {
                              setEditingProfile(null);
                              setNewProfileForm({
                                name: '',
                                color: '#6366F1',
                                avatar: '👤',
                                isTaskCompetitor: false,
                                pin: '',
                                permissions: {
                                  canEditTasks: true,
                                  canCreateTasks: true,
                                  canDeleteTasks: true,
                                },
                                mealTimes: {
                                  breakfast: '07:00',
                                  lunch: '12:00',
                                  dinner: '18:00',
                                  nightcap: '21:00',
                                },
                              });
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Existing Profiles */}
                    <div className="space-y-3">
                      {state.profiles.map((profile) => (
                        <div key={profile.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                                {profile.avatar}
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                                  {profile.isTaskCompetitor && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                                      Competitor
                                    </span>
                                  )}
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full text-xs">
                                      PIN Protected
                                    </span>
                                  )}
                                  {profile.id === state.activeProfileId && (
                                    <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full text-xs">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditProfile(profile)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4 text-neutral-500" />
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-error-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Assistant */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        AI Assistant
                      </h3>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="btn-primary"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Open AI Assistant
                      </button>
                    </div>

                    <div className="card p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={state.settings.ai.enabled}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { ai: { ...state.settings.ai, enabled: e.target.checked } }
                              })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Enable AI Assistant
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            AI Provider
                          </label>
                          <select
                            value={state.settings.ai.provider}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { ai: { ...state.settings.ai, provider: e.target.value as any } }
                            })}
                            className="input-primary"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="gemini">Google Gemini</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Model
                          </label>
                          <select
                            value={state.settings.ai.model}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { ai: { ...state.settings.ai, model: e.target.value } }
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

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={state.settings.ai.apiKey}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { ai: { ...state.settings.ai, apiKey: e.target.value } }
                            })}
                            placeholder="Enter your API key..."
                            className="input-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Analytics & History
                    </h3>
                    <HistoryAnalytics 
                      history={state.history} 
                      tasks={state.tasks} 
                      profiles={state.profiles} 
                    />
                  </div>
                )}

                {/* Data Management */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Data Management
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Export Data */}
                      <div className="card p-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                          Export Data
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Download all your tasks, groups, profiles, and history as a JSON file.
                        </p>
                        <button
                          onClick={handleExportData}
                          className="btn-primary w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </button>
                      </div>

                      {/* Import Data */}
                      <div className="card p-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                          Import Data
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Replace current data with a previously exported file.
                        </p>
                        <label className="btn-secondary w-full cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Reset Data */}
                      <div className="card p-4 md:col-span-2">
                        <h4 className="font-medium text-error-600 dark:text-error-400 mb-2">
                          Reset All Data
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Permanently delete all tasks, groups, profiles, and history. This action cannot be undone.
                        </p>
                        <button
                          onClick={handleResetData}
                          className="bg-error-500 hover:bg-error-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset All Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal - z-index 50 */}
      {showAIModal && (
        <AIQueryModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          history={state.history}
          tasks={state.tasks}
          profiles={state.profiles}
          groups={state.groups}
          aiSettings={state.settings.ai}
          onUpdateSettings={(updates) => dispatch({
            type: 'UPDATE_SETTINGS',
            updates: { ai: { ...state.settings.ai, ...updates } }
          })}
        />
      )}

      {/* Password Modal - z-index 60 */}
      {showPasswordModal && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={passwordModalConfig.onSuccess}
          title={passwordModalConfig.title}
          description={passwordModalConfig.description}
          isSettingPassword={passwordModalConfig.isSettingPassword}
          onPasswordSet={onSetSettingsPassword}
        />
      )}
    </>
  );
}