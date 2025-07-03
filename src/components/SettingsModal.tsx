import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Edit, Trash2, Eye, EyeOff, Lock, Users, Brain, TestTube, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'analytics';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: (password: string) => void;
    isSettingPassword: boolean;
  } | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  // Group editing state
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as const,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    color: '#6366F1',
    avatar: '👤',
    isTaskCompetitor: false,
    pin: '',
    permissions: {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    },
    mealTimes: {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    },
  });

  // AI settings state
  const [aiSettings, setAiSettings] = useState(state.settings.ai);

  // Reset forms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingGroup(null);
      setEditingProfile(null);
      setActiveTab('general');
      setAiTestResult(null);
    }
  }, [isOpen]);

  // Update AI settings when state changes
  useEffect(() => {
    setAiSettings(state.settings.ai);
  }, [state.settings.ai]);

  if (!isOpen) return null;

  const handleGroupEdit = (groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      setGroupForm({
        name: group.name,
        color: group.color,
        icon: group.icon,
        completedDisplayMode: group.completedDisplayMode,
        enableDueDates: group.enableDueDates,
        sortByDueDate: group.sortByDueDate,
        defaultNotifications: group.defaultNotifications ?? false,
      });
      setEditingGroup(groupId);
    }
  };

  const handleGroupSave = () => {
    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup,
        updates: groupForm,
      });
      setEditingGroup(null);
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: groupForm,
      });
    }
    setGroupForm({
      name: '',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out',
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    });
  };

  const handleGroupDelete = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleProfileEdit = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      setProfileForm({
        name: profile.name,
        color: profile.color,
        avatar: profile.avatar,
        isTaskCompetitor: profile.isTaskCompetitor ?? false,
        pin: profile.pin || '',
        permissions: profile.permissions || {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
        },
        mealTimes: profile.mealTimes || {
          breakfast: '07:00',
          lunch: '12:00',
          dinner: '18:00',
          nightcap: '21:00',
        },
      });
      setEditingProfile(profileId);
    }
  };

  const handleProfileSave = () => {
    const profileData = {
      ...profileForm,
      pin: profileForm.pin || undefined, // Convert empty string to undefined
    };

    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile,
        updates: profileData,
      });
      setEditingProfile(null);
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: profileData,
      });
    }
    setProfileForm({
      name: '',
      color: '#6366F1',
      avatar: '👤',
      isTaskCompetitor: false,
      pin: '',
      permissions: {
        canCreateTasks: true,
        canEditTasks: true,
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

  const handleProfileDelete = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings. This password will be required to open settings in the future.',
      onSuccess: (password: string) => {
        onSetSettingsPassword(password);
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveSettingsPassword = () => {
    if (window.confirm('Are you sure you want to remove the settings password? Settings will be accessible without a password.')) {
      dispatch({
        type: 'UPDATE_SETTINGS',
        updates: { settingsPassword: undefined }
      });
    }
  };

  const handleSetProfilePin = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    setPasswordModalConfig({
      title: `Set PIN for ${profile.name}`,
      description: `Create a PIN to protect access to ${profile.name}'s profile. This PIN will be required when switching to this profile.`,
      onSuccess: (pin: string) => {
        dispatch({
          type: 'UPDATE_PROFILE',
          profileId,
          updates: { pin }
        });
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveProfilePin = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (window.confirm(`Are you sure you want to remove the PIN for ${profile.name}? The profile will be accessible without a PIN.`)) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId,
        updates: { pin: undefined }
      });
    }
  };

  const handleOpenProfileInNewTab = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) return;

    // Create URL with profile bypass parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profileId);
    currentUrl.searchParams.set('bypass_pin', 'true');
    
    // Open in new tab
    window.open(currentUrl.toString(), '_blank');
  };

  const handleAITest = async () => {
    if (!aiSettings.apiKey || !aiSettings.enabled) {
      setAiTestResult('Please configure AI settings first');
      return;
    }

    setAiTesting(true);
    setAiTestResult(null);

    try {
      // Simple test query
      const testQuery = "Hello, this is a test query. Please respond with a brief confirmation that you're working correctly.";
      
      // Mock AI response for testing (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setAiTestResult(`✅ AI connection successful! Provider: ${aiSettings.provider}, Model: ${aiSettings.model}`);
    } catch (error) {
      setAiTestResult(`❌ AI test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiTesting(false);
    }
  };

  const handleAISave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { ai: aiSettings }
    });
    setAiTestResult('AI settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'groups', label: 'Groups', icon: '📁' },
    { id: 'profiles', label: 'Profiles', icon: '👥' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ] as const;

  const availableIcons = getAvailableIcons();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 p-3">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { theme: e.target.value as any }
                          })}
                          className="input-primary max-w-xs"
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
                            Show Completed Count in Header
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Display task completion progress in the header
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

              {/* Groups Settings */}
              {activeTab === 'groups' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={() => setEditingGroup('new')}
                      className="btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </button>
                  </div>

                  {/* Group Form */}
                  {editingGroup && (
                    <div className="card p-4 space-y-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {editingGroup === 'new' ? 'Add New Group' : 'Edit Group'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            className="input-primary"
                            placeholder="Group name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Color
                          </label>
                          <input
                            type="color"
                            value={groupForm.color}
                            onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Icon
                          </label>
                          <select
                            value={groupForm.icon}
                            onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
                            className="input-primary"
                          >
                            {availableIcons.map(({ name, component: IconComponent }) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Completed Display
                          </label>
                          <select
                            value={groupForm.completedDisplayMode}
                            onChange={(e) => setGroupForm({ ...groupForm, completedDisplayMode: e.target.value as any })}
                            className="input-primary"
                          >
                            <option value="grey-out">Grey Out</option>
                            <option value="grey-drop">Grey & Drop Down</option>
                            <option value="separate-completed">Separate Section</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Enable Due Dates
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Allow tasks in this group to have due dates
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={groupForm.enableDueDates}
                            onChange={(e) => setGroupForm({ ...groupForm, enableDueDates: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        {groupForm.enableDueDates && (
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Sort by Due Date
                              </label>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Sort tasks by due date instead of manual order
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={groupForm.sortByDueDate}
                              onChange={(e) => setGroupForm({ ...groupForm, sortByDueDate: e.target.checked })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Default Notifications
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Enable notifications by default for new tasks in this group
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={groupForm.defaultNotifications}
                            onChange={(e) => setGroupForm({ ...groupForm, defaultNotifications: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => setEditingGroup(null)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGroupSave}
                          className="btn-primary"
                          disabled={!groupForm.name.trim()}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingGroup === 'new' ? 'Add Group' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Groups List */}
                  <div className="space-y-3">
                    {state.groups.map(group => {
                      const IconComponent = getIconComponent(group.icon);
                      return (
                        <div key={group.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {group.name}
                                </h4>
                                <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span>{group.completedDisplayMode.replace('-', ' ')}</span>
                                  {group.enableDueDates && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                                      Due dates
                                    </span>
                                  )}
                                  {group.defaultNotifications && (
                                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                                      Notifications
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleGroupEdit(group.id)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4 text-neutral-500" />
                              </button>
                              <button
                                onClick={() => handleGroupDelete(group.id)}
                                className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
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

              {/* Profiles Settings */}
              {activeTab === 'profiles' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      User Profiles
                    </h3>
                    <button
                      onClick={() => setEditingProfile('new')}
                      className="btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Profile
                    </button>
                  </div>

                  {/* Profile Form */}
                  {editingProfile && (
                    <div className="card p-4 space-y-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {editingProfile === 'new' ? 'Add New Profile' : 'Edit Profile'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="input-primary"
                            placeholder="Profile name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Avatar
                          </label>
                          <input
                            type="text"
                            value={profileForm.avatar}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                            className="input-primary"
                            placeholder="👤"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Color
                          </label>
                          <input
                            type="color"
                            value={profileForm.color}
                            onChange={(e) => setProfileForm({ ...profileForm, color: e.target.value })}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            PIN (Optional)
                          </label>
                          <input
                            type="password"
                            value={profileForm.pin}
                            onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                            className="input-primary"
                            placeholder="Leave empty for no PIN"
                          />
                        </div>
                      </div>

                      {/* Meal Times */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                          Meal Times
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              🌅 Breakfast
                            </label>
                            <input
                              type="time"
                              value={profileForm.mealTimes.breakfast}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                mealTimes: { ...profileForm.mealTimes, breakfast: e.target.value }
                              })}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              ☀️ Lunch
                            </label>
                            <input
                              type="time"
                              value={profileForm.mealTimes.lunch}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                mealTimes: { ...profileForm.mealTimes, lunch: e.target.value }
                              })}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              🌆 Dinner
                            </label>
                            <input
                              type="time"
                              value={profileForm.mealTimes.dinner}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                mealTimes: { ...profileForm.mealTimes, dinner: e.target.value }
                              })}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              🌙 Night Cap
                            </label>
                            <input
                              type="time"
                              value={profileForm.mealTimes.nightcap}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                mealTimes: { ...profileForm.mealTimes, nightcap: e.target.value }
                              })}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                          Permissions
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Create Tasks</span>
                            <input
                              type="checkbox"
                              checked={profileForm.permissions.canCreateTasks}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                permissions: { ...profileForm.permissions, canCreateTasks: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Edit Tasks</span>
                            <input
                              type="checkbox"
                              checked={profileForm.permissions.canEditTasks}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                permissions: { ...profileForm.permissions, canEditTasks: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Delete Tasks</span>
                            <input
                              type="checkbox"
                              checked={profileForm.permissions.canDeleteTasks}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                permissions: { ...profileForm.permissions, canDeleteTasks: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Task Competitor */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Task Competitor
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Participate in task completion rankings
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileForm.isTaskCompetitor}
                          onChange={(e) => setProfileForm({ ...profileForm, isTaskCompetitor: e.target.checked })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => setEditingProfile(null)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleProfileSave}
                          className="btn-primary"
                          disabled={!profileForm.name.trim()}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingProfile === 'new' ? 'Add Profile' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Profiles List */}
                  <div className="space-y-3">
                    {state.profiles.map(profile => (
                      <div key={profile.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{profile.avatar}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                {profile.isTaskCompetitor && (
                                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                    Competitor
                                  </span>
                                )}
                                {profile.pin && (
                                  <Lock className="w-4 h-4 text-warning-500" title="PIN Protected" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <span>
                                  {profile.permissions?.canCreateTasks && profile.permissions?.canEditTasks && profile.permissions?.canDeleteTasks
                                    ? 'Full Access'
                                    : 'Limited Access'
                                  }
                                </span>
                                {profile.id === state.activeProfileId && (
                                  <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleProfileEdit(profile.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4 text-neutral-500" />
                            </button>
                            {state.profiles.length > 1 && (
                              <button
                                onClick={() => handleProfileDelete(profile.id)}
                                className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
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

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Security Settings
                  </h3>

                  {/* Settings Password */}
                  <div className="card p-4">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      Settings Password
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {isSettingsPasswordSet 
                            ? 'Settings are protected with a password'
                            : 'Settings are not password protected'
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {isSettingsPasswordSet ? (
                          <button
                            onClick={handleRemoveSettingsPassword}
                            className="btn-secondary text-sm"
                          >
                            Remove Password
                          </button>
                        ) : (
                          <button
                            onClick={handleSetSettingsPassword}
                            className="btn-primary text-sm"
                          >
                            Set Password
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Security */}
                  <div className="card p-4">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                      Profile Security
                    </h4>
                    <div className="space-y-3">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{profile.avatar}</span>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {profile.pin ? 'PIN Protected' : 'No PIN'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {profile.pin && (
                              <button
                                onClick={() => handleOpenProfileInNewTab(profile.id)}
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-200"
                                title={`Open ${profile.name} in new tab (bypass PIN)`}
                              >
                                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                            {profile.pin ? (
                              <button
                                onClick={() => handleRemoveProfilePin(profile.id)}
                                className="btn-secondary text-sm"
                              >
                                Remove PIN
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetProfilePin(profile.id)}
                                className="btn-primary text-sm"
                              >
                                Set PIN
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* PIN Protected Profiles Info */}
                    {state.profiles.some(p => p.pin) && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              PIN Bypass Feature
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Click the external link icon next to PIN-protected profiles to open them in a new tab without requiring the PIN. 
                              This is useful for administrative access or when you need to quickly access a protected profile.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Settings */}
              {activeTab === 'ai' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="btn-primary text-sm"
                      disabled={!aiSettings.enabled || !aiSettings.apiKey}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Ask AI
                    </button>
                  </div>

                  {/* AI Configuration */}
                  <div className="card p-4 space-y-4">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      Configuration
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          AI Provider
                        </label>
                        <select
                          value={aiSettings.provider}
                          onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value as any })}
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
                          value={aiSettings.model}
                          onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                          className="input-primary"
                        >
                          {aiSettings.provider === 'openai' && (
                            <>
                              <option value="gpt-4">GPT-4</option>
                              <option value="gpt-4-turbo">GPT-4 Turbo</option>
                              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </>
                          )}
                          {aiSettings.provider === 'anthropic' && (
                            <>
                              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                            </>
                          )}
                          {aiSettings.provider === 'gemini' && (
                            <>
                              <option value="gemini-pro">Gemini Pro</option>
                              <option value="gemini-pro-vision">Gemini Pro Vision</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={aiSettings.apiKey}
                          onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                          className="input-primary pr-10"
                          placeholder="Enter your API key..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Lock className="w-4 h-4 text-neutral-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Enable AI Assistant
                        </label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Allow AI-powered task insights and analysis
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiSettings.enabled}
                        onChange={(e) => setAiSettings({ ...aiSettings, enabled: e.target.checked })}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </div>

                    {/* Test Result */}
                    {aiTestResult && (
                      <div className={`p-3 rounded-lg ${
                        aiTestResult.startsWith('✅') 
                          ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                          : aiTestResult.startsWith('❌')
                          ? 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      }`}>
                        <p className={`text-sm ${
                          aiTestResult.startsWith('✅') 
                            ? 'text-success-700 dark:text-success-300'
                            : aiTestResult.startsWith('❌')
                            ? 'text-error-700 dark:text-error-300'
                            : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          {aiTestResult}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleAITest}
                        className="btn-secondary"
                        disabled={!aiSettings.apiKey || aiTesting}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        {aiTesting ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        onClick={handleAISave}
                        className="btn-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics */}
              {activeTab === 'analytics' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
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

      {/* Password Modal */}
      {showPasswordModal && passwordModalConfig && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordModalConfig(null);
          }}
          onSuccess={passwordModalConfig.onSuccess}
          onPasswordSet={passwordModalConfig.isSettingPassword ? passwordModalConfig.onSuccess : undefined}
          title={passwordModalConfig.title}
          description={passwordModalConfig.description}
          isSettingPassword={passwordModalConfig.isSettingPassword}
        />
      )}

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={aiSettings}
      />
    </>
  );
}