import React, { useState, useRef } from 'react';
import { X, Settings, Users, History, Brain, Shield, User, Plus, Edit, Trash2, Trophy, Crown, Eye, ExternalLink, Lock, Unlock, CheckCircle, AlertCircle, Bell, Calendar, Palette, Monitor, Sun, Moon, Key, Save, Cancel } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type TabType = 'general' | 'profiles' | 'groups' | 'history' | 'ai' | 'security';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
    isSettingPassword?: boolean;
  }>({
    title: '',
    description: '',
    onSuccess: () => {},
  });

  // Profile editing states
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');
  const [editProfileColor, setEditProfileColor] = useState('');

  // AI settings state
  const [aiProvider, setAiProvider] = useState(state.settings.ai.provider);
  const [aiModel, setAiModel] = useState(state.settings.ai.model);
  const [aiApiKey, setAiApiKey] = useState(state.settings.ai.apiKey);
  const [aiEnabled, setAiEnabled] = useState(state.settings.ai.enabled);
  const [isAiMinimized, setIsAiMinimized] = useState(!state.settings.ai.enabled);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDetailedHistoryClick = () => {
    const userChoice = window.confirm(
      "How would you like to view the detailed history?\n\n" +
      "OK = Open in new tab (formatted table)\n" +
      "Cancel = View in this modal (100 items)"
    );

    if (userChoice) {
      // Open in new tab with formatted HTML
      const historyHtml = generateHistoryHTML();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(historyHtml);
        newWindow.document.close();
      }
    } else {
      // Show in modal
      setShowDetailedHistory(true);
    }
  };

  const generateHistoryHTML = () => {
    const sortedHistory = [...state.history].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ZenTasks - Detailed History</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: 600; }
          .completed { color: #059669; }
          .unchecked { color: #d97706; }
          .reset { color: #7c3aed; }
          .restored { color: #dc2626; }
          .timestamp { font-size: 0.875rem; color: #6b7280; }
          .task-title { font-weight: 500; }
          .profile-name { font-size: 0.875rem; color: #374151; }
          .details { font-size: 0.875rem; color: #6b7280; font-style: italic; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .summary { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>ZenTasks - Detailed Activity History</h1>
        <div class="summary">
          <strong>Total Entries:</strong> ${sortedHistory.length}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Task</th>
              <th>Action</th>
              <th>Profile</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${sortedHistory.map(entry => `
              <tr>
                <td class="timestamp">${new Date(entry.timestamp).toLocaleString()}</td>
                <td class="task-title">${entry.taskTitle}</td>
                <td class="${entry.action}">${entry.action}</td>
                <td class="profile-name">${entry.profileName}</td>
                <td class="details">${entry.details || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

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
    
    if (aiEnabled && aiApiKey) {
      setIsAiMinimized(true);
    }
  };

  const handleAddProfile = () => {
    const newProfile = {
      name: 'New Profile',
      color: '#6366F1',
      avatar: '👤',
      isActive: false,
      isTaskCompetitor: false,
      permissions: {
        canEditTasks: true,
        canCreateTasks: true,
        canDeleteTasks: true,
      },
    };

    dispatch({ type: 'ADD_PROFILE', profile: newProfile });
  };

  const handleEditProfile = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      setEditingProfile(profileId);
      setEditProfileName(profile.name);
      setEditProfileAvatar(profile.avatar);
      setEditProfileColor(profile.color);
    }
  };

  const handleSaveProfile = () => {
    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile,
        updates: {
          name: editProfileName,
          avatar: editProfileAvatar,
          color: editProfileColor,
        },
      });
      setEditingProfile(null);
    }
  };

  const handleCancelEditProfile = () => {
    setEditingProfile(null);
    setEditProfileName('');
    setEditProfileAvatar('');
    setEditProfileColor('');
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile && window.confirm(`Are you sure you want to delete "${profile.name}"?`)) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleUpdateProfilePermissions = (profileId: string, permission: string, value: boolean) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId,
        updates: {
          permissions: {
            ...profile.permissions,
            [permission]: value,
          },
        },
      });
    }
  };

  const handleToggleTaskCompetitor = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId,
        updates: {
          isTaskCompetitor: !profile.isTaskCompetitor,
        },
      });
    }
  };

  const handleSetProfilePin = (profileId: string) => {
    setPasswordModalConfig({
      title: 'Set Profile PIN',
      description: 'Set a PIN to protect this profile. The PIN will be required to access this profile.',
      isSettingPassword: true,
      onSuccess: () => {
        setShowPasswordModal(false);
      },
    });
    setShowPasswordModal(true);
  };

  const handleRemoveProfilePin = (profileId: string) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId,
      updates: { pin: undefined },
    });
  };

  const handlePasswordModalSuccess = (password?: string) => {
    if (passwordModalConfig.isSettingPassword && password) {
      // This would be handled by the profile PIN setting logic
      // For now, we'll just close the modal
    }
    passwordModalConfig.onSuccess();
  };

  const generateProfileBypassUrl = (profileId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?profile=${profileId}&bypass_pin=true`;
  };

  const openProfileInNewTab = (profileId: string) => {
    const bypassUrl = generateProfileBypassUrl(profileId);
    window.open(bypassUrl, '_blank');
  };

  // Calculate task statistics for each profile
  const getProfileStats = (profileId: string) => {
    const profileTasks = state.tasks.filter(task => task.profiles.includes(profileId));
    const completedTasks = profileTasks.filter(task => task.isCompleted);
    const totalTasks = profileTasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    
    return {
      completed: completedTasks.length,
      total: totalTasks,
      percentage: completionPercentage,
    };
  };

  // Get group statistics
  const getGroupStats = (groupId: string) => {
    const groupTasks = state.tasks.filter(task => task.groupId === groupId);
    const completedTasks = groupTasks.filter(task => task.isCompleted);
    return {
      completed: completedTasks.length,
      total: groupTasks.length,
    };
  };

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Users },
    { id: 'groups' as TabType, label: 'Groups', icon: Palette },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'ai' as TabType, label: 'AI', icon: Brain },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden flex flex-col settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
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

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Responsive */}
            <div className="w-16 md:w-48 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <nav className="p-2 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="hidden md:block font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        General Settings
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Theme */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              {isDark ? <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">Theme</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {state.settings.theme === 'system' ? 'System' : state.settings.theme === 'dark' ? 'Dark' : 'Light'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={toggleTheme}
                            className="btn-secondary"
                          >
                            Toggle
                          </button>
                        </div>

                        {/* Show Completed Count */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">Show Completed Count</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Display progress in header</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.settings.showCompletedCount}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showCompletedCount: e.target.checked }
                            })}
                            className="w-5 h-5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        {/* Enable Notifications */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                              <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">Enable Notifications</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Browser notifications for due dates and task resets</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.settings.enableNotifications}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { enableNotifications: e.target.checked }
                            })}
                            className="w-5 h-5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        {/* Show Top Collaborator */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Display collaboration leaderboard in trophy popup</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.settings.showTopCollaborator}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showTopCollaborator: e.target.checked }
                            })}
                            className="w-5 h-5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                      <button
                        onClick={handleAddProfile}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </button>
                    </div>

                    <div className="space-y-4">
                      {state.profiles.map(profile => {
                        const stats = getProfileStats(profile.id);
                        const isEditing = editingProfile === profile.id;
                        
                        return (
                          <div key={profile.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editProfileAvatar}
                                      onChange={(e) => setEditProfileAvatar(e.target.value)}
                                      className="w-8 text-center bg-transparent border-none outline-none text-lg"
                                      maxLength={2}
                                    />
                                  ) : (
                                    profile.avatar
                                  )}
                                </div>
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={editProfileName}
                                        onChange={(e) => setEditProfileName(e.target.value)}
                                        className="input-primary text-sm"
                                        placeholder="Profile name"
                                      />
                                      <input
                                        type="color"
                                        value={editProfileColor}
                                        onChange={(e) => setEditProfileColor(e.target.value)}
                                        className="w-16 h-8 rounded border border-neutral-300 dark:border-neutral-600"
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                          {profile.name}
                                        </h4>
                                        
                                        {/* Status Badges */}
                                        {profile.id === state.activeProfileId && (
                                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full font-medium flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span>Active</span>
                                          </span>
                                        )}
                                        
                                        {profile.isTaskCompetitor && (
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium flex items-center space-x-1">
                                            <Trophy className="w-3 h-3" />
                                            <span>Competitor</span>
                                          </span>
                                        )}
                                        
                                        {profile.pin && (
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium flex items-center space-x-1">
                                            <Lock className="w-3 h-3" />
                                            <span>PIN Protected</span>
                                          </span>
                                        )}
                                      </div>
                                      
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {stats.completed}/{stats.total} tasks ({stats.percentage}%)
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={handleSaveProfile}
                                      className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors duration-200"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEditProfile}
                                      className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditProfile(profile.id)}
                                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                    >
                                      <Edit className="w-4 h-4 text-neutral-500" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProfile(profile.id)}
                                      className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                    >
                                      <Trash2 className="w-4 h-4 text-error-500" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {!isEditing && (
                              <>
                                {/* Task Competitor Toggle */}
                                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">Task Competitor</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Participate in task completion rankings</p>
                                      </div>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={profile.isTaskCompetitor || false}
                                      onChange={() => handleToggleTaskCompetitor(profile.id)}
                                      className="w-5 h-5 text-yellow-500 bg-neutral-100 border-neutral-300 rounded focus:ring-yellow-500"
                                    />
                                  </div>
                                </div>

                                {/* PIN Protection */}
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">PIN Protection</p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                          {profile.pin ? 'PIN is set' : 'No PIN protection'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {profile.pin ? (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Protected</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                                          <span className="text-xs text-neutral-500 dark:text-neutral-400">Open</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Permissions */}
                                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Permissions</p>
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Control what this profile can do</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {[
                                      { key: 'canCreateTasks', label: 'Can Create Tasks' },
                                      { key: 'canEditTasks', label: 'Can Edit Tasks' },
                                      { key: 'canDeleteTasks', label: 'Can Delete Tasks' },
                                    ].map(permission => (
                                      <label key={permission.key} className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                          {permission.label}
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={profile.permissions?.[permission.key as keyof typeof profile.permissions] ?? true}
                                          onChange={(e) => handleUpdateProfilePermissions(profile.id, permission.key, e.target.checked)}
                                          className="w-4 h-4 text-green-500 bg-neutral-100 border-neutral-300 rounded focus:ring-green-500"
                                        />
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>

                    <div className="space-y-4">
                      {state.groups.map(group => {
                        const stats = getGroupStats(group.id);
                        
                        return (
                          <div key={group.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: group.color + '20' }}
                                >
                                  <div 
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {stats.completed}/{stats.total} completed
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Completed Display Mode */}
                              <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Display Mode</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                      {group.completedDisplayMode === 'grey-out' && 'Grey Out'}
                                      {group.completedDisplayMode === 'grey-drop' && 'Grey & Drop'}
                                      {group.completedDisplayMode === 'separate-completed' && 'Separate'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Due Dates & Notifications */}
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Features</p>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                      {group.enableDueDates && <div>• Due dates enabled</div>}
                                      {group.sortByDueDate && <div>• Sort by due date</div>}
                                      {group.defaultNotifications && <div>• Notifications by default</div>}
                                      {!group.enableDueDates && !group.sortByDueDate && !group.defaultNotifications && (
                                        <div>No special features</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Activity History
                      </h3>
                      <button
                        onClick={handleDetailedHistoryClick}
                        className="btn-primary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Detailed History
                      </button>
                    </div>

                    {showDetailedHistory ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            Detailed Activity Log (Last 100 entries)
                          </h4>
                          <button
                            onClick={() => setShowDetailedHistory(false)}
                            className="btn-secondary"
                          >
                            Show Analytics
                          </button>
                        </div>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {state.history.slice(0, 100).map(entry => (
                            <div key={entry.id} className="card p-3 bg-neutral-50 dark:bg-neutral-800">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {entry.taskTitle}
                                  </p>
                                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                    {entry.action} by {entry.profileName}
                                  </p>
                                  {entry.details && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                      {entry.details}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <HistoryAnalytics 
                        history={state.history}
                        tasks={state.tasks}
                        profiles={state.profiles}
                      />
                    )}
                  </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>

                    {!isAiMinimized ? (
                      <div className="space-y-4">
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
                          <input
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder="Enter your API key..."
                            className="input-primary"
                          />
                        </div>

                        {/* Enable AI */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Assistant</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow AI-powered task insights</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={aiEnabled}
                            onChange={(e) => setAiEnabled(e.target.checked)}
                            className="w-5 h-5 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={handleSaveAISettings}
                          className="btn-primary"
                        >
                          Save AI Settings
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        {state.settings.ai.enabled && state.settings.ai.apiKey ? (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto">
                              <Brain className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                              AI Assistant Ready
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              Provider: {state.settings.ai.provider} • Model: {state.settings.ai.model}
                            </p>
                            <div className="flex justify-center space-x-3">
                              <button
                                onClick={() => setShowAIModal(true)}
                                className="btn-primary"
                              >
                                <Brain className="w-4 h-4 mr-2" />
                                Open AI Agent
                              </button>
                              <button
                                onClick={() => setIsAiMinimized(false)}
                                className="btn-secondary"
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Configure
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Brain className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600" />
                            <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                              AI Assistant Not Configured
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              Configure your AI settings to enable intelligent task insights
                            </p>
                            <button
                              onClick={() => setIsAiMinimized(false)}
                              className="btn-primary"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Configure AI
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Security Settings
                    </h3>

                    <div className="space-y-4">
                      {/* Settings Password */}
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Protect access to settings
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {isSettingsPasswordSet ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Protected</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-neutral-400 rounded-full"></div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Not Set</span>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setPasswordModalConfig({
                                  title: 'Set Settings Password',
                                  description: 'Set a password to protect access to settings.',
                                  isSettingPassword: true,
                                  onSuccess: () => setShowPasswordModal(false),
                                });
                                setShowPasswordModal(true);
                              }}
                              className="btn-secondary text-sm"
                            >
                              {isSettingsPasswordSet ? 'Change' : 'Set Password'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Profile Security */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Profile Security</h4>
                        
                        {state.profiles.map(profile => (
                          <div key={profile.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{profile.avatar}</span>
                                <div>
                                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </p>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {profile.pin ? 'PIN protected' : 'No PIN protection'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {profile.pin ? (
                                  <>
                                    <div className="flex items-center space-x-1">
                                      <Lock className="w-4 h-4 text-green-500" />
                                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Protected</span>
                                    </div>
                                    <button
                                      onClick={() => openProfileInNewTab(profile.id)}
                                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-200"
                                      title="Open profile in new tab (PIN bypass)"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProfilePin(profile.id)}
                                      className="btn-secondary text-sm"
                                    >
                                      Remove PIN
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center space-x-1">
                                      <Unlock className="w-4 h-4 text-neutral-400" />
                                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Open</span>
                                    </div>
                                    <button
                                      onClick={() => handleSetProfilePin(profile.id)}
                                      className="btn-secondary text-sm"
                                    >
                                      Set PIN
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordModalSuccess}
        onPasswordSet={onSetSettingsPassword}
        title={passwordModalConfig.title}
        description={passwordModalConfig.description}
        isSettingPassword={passwordModalConfig.isSettingPassword}
      />
    </>
  );
}