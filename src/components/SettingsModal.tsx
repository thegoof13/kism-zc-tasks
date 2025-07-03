import React, { useState } from 'react';
import { X, Settings, User, Palette, Shield, Brain, Bell, Users, Plus, Edit, Trash2, Eye, EyeOff, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'profiles' | 'ai' | 'analytics';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
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

    // Reset form
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

    // Reset form
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

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }

    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleCancelEdit = () => {
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

  // Format meal time for display
  const formatMealTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Check if profile has meal-based tasks
  const profileHasMealTasks = (profileId: string) => {
    return state.tasks.some(task => 
      task.profiles.includes(profileId) && 
      task.recurrence === 'meals'
    );
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: Bell },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
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

                      {/* Settings Password */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Settings Password
                          </label>
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
                                  {profileHasMealTasks(profile.id) && (
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                                      Has Meal Tasks
                                    </span>
                                  )}
                                </div>
                                
                                {/* Show meal times if profile has meal-based tasks */}
                                {profileHasMealTasks(profile.id) && profile.mealTimes && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                                      Meal Times:
                                    </p>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 grid grid-cols-2 gap-1">
                                      <div>🌅 Breakfast: {formatMealTime(profile.mealTimes.breakfast)}</div>
                                      <div>☀️ Lunch: {formatMealTime(profile.mealTimes.lunch)}</div>
                                      <div>🌆 Dinner: {formatMealTime(profile.mealTimes.dinner)}</div>
                                      <div>🌙 Night Cap: {formatMealTime(profile.mealTimes.nightcap)}</div>
                                    </div>
                                  </div>
                                )}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Permissions and Settings */}
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

                          {/* Meal Times Configuration */}
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>Meal Times</span>
                              </div>
                            </label>
                            <div className="space-y-3">
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
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                These times will be used for meal-based recurring tasks
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        {editingProfile && (
                          <button
                            onClick={handleCancelEdit}
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

              {activeTab === 'analytics' && (
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