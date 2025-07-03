import React, { useState } from 'react';
import { X, Settings, User, Brain, Shield, Trophy, Users, Plus, Edit, Trash2, Save, ExternalLink, Lock, Unlock, Eye, EyeOff, Check, Calendar, Clock, Bell, BellOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'profiles' | 'groups' | 'ai' | 'security' | 'history';

const availableIcons = [
  'User', 'Briefcase', 'Heart', 'Home', 'Book', 'Car', 'Coffee', 'Dumbbell', 'Music', 'ShoppingCart'
];

const availableColors = [
  '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

const completedDisplayModes = [
  { value: 'grey-out', label: 'Grey Out', description: 'Show completed tasks with reduced opacity' },
  { value: 'grey-drop', label: 'Grey & Drop', description: 'Grey out and move to bottom' },
  { value: 'separate-completed', label: 'Separate Section', description: 'Show in separate completed section' }
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    profileId?: string;
    isSettingPassword?: boolean;
  }>({
    title: '',
    description: '',
  });

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editProfileData, setEditProfileData] = useState<{
    name: string;
    avatar: string;
    color: string;
  }>({ name: '', avatar: '', color: '' });

  // Group editing state
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupData, setEditGroupData] = useState<{
    name: string;
    icon: string;
    color: string;
    completedDisplayMode: string;
    enableDueDates: boolean;
    sortByDueDate: boolean;
    defaultNotifications: boolean;
  }>({
    name: '',
    icon: '',
    color: '',
    completedDisplayMode: 'grey-out',
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

  if (!isOpen) return null;

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setEditingProfile(null);
    setEditingGroup(null);
  };

  const handleProfileEdit = (profile: any) => {
    setEditingProfile(profile.id);
    setEditProfileData({
      name: profile.name,
      avatar: profile.avatar,
      color: profile.color,
    });
  };

  const handleProfileSave = () => {
    if (!editingProfile) return;
    
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: editProfileData,
    });
    
    setEditingProfile(null);
  };

  const handleProfileCancel = () => {
    setEditingProfile(null);
    setEditProfileData({ name: '', avatar: '', color: '' });
  };

  const handleGroupEdit = (group: any) => {
    setEditingGroup(group.id);
    setEditGroupData({
      name: group.name,
      icon: group.icon,
      color: group.color,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate,
      defaultNotifications: group.defaultNotifications ?? false,
    });
  };

  const handleGroupSave = () => {
    if (!editingGroup) return;
    
    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
      updates: editGroupData,
    });
    
    setEditingGroup(null);
  };

  const handleGroupCancel = () => {
    setEditingGroup(null);
    setEditGroupData({
      name: '',
      icon: '',
      color: '',
      completedDisplayMode: 'grey-out',
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    });
  };

  const handleSetPin = (profileId: string) => {
    setPasswordModalConfig({
      title: 'Set Profile PIN',
      description: 'Set a PIN to protect this profile. You will need to enter this PIN to access the profile.',
      profileId,
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemovePin = (profileId: string) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId,
      updates: { pin: undefined },
    });
  };

  const handlePasswordModalSuccess = () => {
    setShowPasswordModal(false);
  };

  const handlePasswordSet = (password: string) => {
    if (passwordModalConfig.profileId) {
      // Setting profile PIN
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: passwordModalConfig.profileId,
        updates: { pin: password },
      });
    } else {
      // Setting settings password
      onSetSettingsPassword(password);
    }
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Set a password to protect access to settings. This will be required to open settings in the future.',
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveSettingsPassword = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { settingsPassword: undefined },
    });
  };

  const openProfileInNewTab = (profileId: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profileId);
    currentUrl.searchParams.set('bypass_pin', 'true');
    window.open(currentUrl.toString(), '_blank');
  };

  const handleDetailedHistoryToggle = () => {
    if (showDetailedHistory) {
      setShowDetailedHistory(false);
    } else {
      const shouldOpenNewTab = window.confirm(
        'Would you like to open the detailed history in a new tab? Click OK for new tab, Cancel to view in this page.'
      );
      
      if (shouldOpenNewTab) {
        // Open current page in new tab with detailed history
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('detailed_history', 'true');
        window.open(currentUrl.toString(), '_blank');
      } else {
        setShowDetailedHistory(true);
      }
    }
  };

  // Check URL for detailed history parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('detailed_history') === 'true') {
      setShowDetailedHistory(true);
      setActiveTab('history');
    }
  }, []);

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'groups' as const, label: 'Groups', icon: User },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'history' as const, label: 'History', icon: Trophy },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden flex flex-col settings-modal">
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
                      onClick={() => handleTabChange(tab.id)}
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
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        General Settings
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Theme */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Theme</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Choose your preferred color scheme
                            </p>
                          </div>
                          <select
                            value={state.settings.theme}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { theme: e.target.value as any }
                            })}
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                          </select>
                        </div>

                        {/* Show Completed Count */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Completed Count</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable Notifications</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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

                {/* Profiles */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                      <button
                        onClick={() => {
                          const newProfile = {
                            name: 'New Profile',
                            color: availableColors[Math.floor(Math.random() * availableColors.length)],
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
                        }}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Profile</span>
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {state.profiles.map(profile => {
                        const isEditing = editingProfile === profile.id;
                        const completedTasks = state.tasks.filter(t => t.isCompleted && t.profiles.includes(profile.id)).length;
                        const totalTasks = state.tasks.filter(t => t.profiles.includes(profile.id)).length;
                        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        
                        return (
                          <div key={profile.id} className="card p-4">
                            {isEditing ? (
                              // Edit Mode
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    Edit Profile
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={handleProfileSave}
                                      className="p-2 text-success-600 hover:bg-success-100 dark:hover:bg-success-900/20 rounded-lg transition-colors duration-200"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleProfileCancel}
                                      className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editProfileData.name}
                                      onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
                                      className="input-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Avatar
                                    </label>
                                    <input
                                      type="text"
                                      value={editProfileData.avatar}
                                      onChange={(e) => setEditProfileData(prev => ({ ...prev, avatar: e.target.value.slice(0, 2) }))}
                                      className="input-primary"
                                      maxLength={2}
                                      placeholder="👤"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Color
                                    </label>
                                    <input
                                      type="color"
                                      value={editProfileData.color}
                                      onChange={(e) => setEditProfileData(prev => ({ ...prev, color: e.target.value }))}
                                      className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div 
                                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium text-white"
                                      style={{ backgroundColor: profile.color }}
                                    >
                                      {profile.avatar}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {profile.name}
                                      </h4>
                                      <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">
                                          {completedTasks}/{totalTasks} tasks ({completionPercentage}%)
                                        </span>
                                        {profile.id === state.activeProfileId && (
                                          <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs rounded-full font-medium">
                                            Active Session
                                          </span>
                                        )}
                                        {profile.isTaskCompetitor && (
                                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium">
                                            Task Competitor
                                          </span>
                                        )}
                                        {profile.pin && (
                                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium">
                                            PIN Protected
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleProfileEdit(profile)}
                                      className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    {state.profiles.length > 1 && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete "${profile.name}"?`)) {
                                            dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                                          }
                                        }}
                                        className="p-2 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/20 rounded-lg transition-colors duration-200"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Task Competitor */}
                                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                          Task Competitor
                                        </p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                          Participate in task completion rankings
                                        </p>
                                      </div>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={profile.isTaskCompetitor || false}
                                      onChange={(e) => dispatch({
                                        type: 'UPDATE_PROFILE',
                                        profileId: profile.id,
                                        updates: { isTaskCompetitor: e.target.checked }
                                      })}
                                      className="w-4 h-4 text-yellow-500 bg-neutral-100 border-neutral-300 rounded focus:ring-yellow-500"
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
                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                          PIN Protection
                                        </p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                          {profile.pin ? 'Profile is protected with a PIN' : 'No PIN protection set'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {profile.pin ? (
                                        <>
                                          <button
                                            onClick={() => handleRemovePin(profile.id)}
                                            className="px-3 py-1 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-400 text-xs rounded-full hover:bg-error-200 dark:hover:bg-error-900/30 transition-colors duration-200"
                                          >
                                            Remove PIN
                                          </button>
                                          <button
                                            onClick={() => handleSetPin(profile.id)}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200"
                                          >
                                            Change PIN
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => handleSetPin(profile.id)}
                                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200"
                                        >
                                          Set PIN
                                        </button>
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
                                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                        Permissions
                                      </p>
                                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Control what this profile can do
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="flex items-center justify-between">
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Create Tasks</span>
                                      <input
                                        type="checkbox"
                                        checked={profile.permissions?.canCreateTasks ?? true}
                                        onChange={(e) => dispatch({
                                          type: 'UPDATE_PROFILE',
                                          profileId: profile.id,
                                          updates: {
                                            permissions: {
                                              ...profile.permissions,
                                              canCreateTasks: e.target.checked
                                            }
                                          }
                                        })}
                                        className="w-4 h-4 text-green-500 bg-neutral-100 border-neutral-300 rounded focus:ring-green-500"
                                      />
                                    </label>
                                    <label className="flex items-center justify-between">
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Edit Tasks</span>
                                      <input
                                        type="checkbox"
                                        checked={profile.permissions?.canEditTasks ?? true}
                                        onChange={(e) => dispatch({
                                          type: 'UPDATE_PROFILE',
                                          profileId: profile.id,
                                          updates: {
                                            permissions: {
                                              ...profile.permissions,
                                              canEditTasks: e.target.checked
                                            }
                                          }
                                        })}
                                        className="w-4 h-4 text-green-500 bg-neutral-100 border-neutral-300 rounded focus:ring-green-500"
                                      />
                                    </label>
                                    <label className="flex items-center justify-between">
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Delete Tasks</span>
                                      <input
                                        type="checkbox"
                                        checked={profile.permissions?.canDeleteTasks ?? true}
                                        onChange={(e) => dispatch({
                                          type: 'UPDATE_PROFILE',
                                          profileId: profile.id,
                                          updates: {
                                            permissions: {
                                              ...profile.permissions,
                                              canDeleteTasks: e.target.checked
                                            }
                                          }
                                        })}
                                        className="w-4 h-4 text-green-500 bg-neutral-100 border-neutral-300 rounded focus:ring-green-500"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Groups */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task Groups
                      </h3>
                      <button
                        onClick={() => {
                          const newGroup = {
                            name: 'New Group',
                            color: availableColors[Math.floor(Math.random() * availableColors.length)],
                            icon: 'User',
                            completedDisplayMode: 'grey-out' as const,
                            isCollapsed: false,
                            enableDueDates: false,
                            sortByDueDate: false,
                            defaultNotifications: false,
                          };
                          dispatch({ type: 'ADD_GROUP', group: newGroup });
                        }}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Group</span>
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {state.groups.map(group => {
                        const isEditing = editingGroup === group.id;
                        const groupTasks = state.tasks.filter(t => t.groupId === group.id);
                        const completedTasks = groupTasks.filter(t => t.isCompleted).length;
                        
                        return (
                          <div key={group.id} className="card p-4">
                            {isEditing ? (
                              // Edit Mode
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    Edit Group
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={handleGroupSave}
                                      className="p-2 text-success-600 hover:bg-success-100 dark:hover:bg-success-900/20 rounded-lg transition-colors duration-200"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleGroupCancel}
                                      className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editGroupData.name}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, name: e.target.value }))}
                                      className="input-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Icon
                                    </label>
                                    <select
                                      value={editGroupData.icon}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, icon: e.target.value }))}
                                      className="input-primary"
                                    >
                                      {availableIcons.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Color
                                    </label>
                                    <input
                                      type="color"
                                      value={editGroupData.color}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, color: e.target.value }))}
                                      className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Display Mode
                                    </label>
                                    <select
                                      value={editGroupData.completedDisplayMode}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, completedDisplayMode: e.target.value }))}
                                      className="input-primary"
                                    >
                                      {completedDisplayModes.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={editGroupData.enableDueDates}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable Due Dates</span>
                                  </label>
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={editGroupData.sortByDueDate}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Sort by Due Date</span>
                                  </label>
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={editGroupData.defaultNotifications}
                                      onChange={(e) => setEditGroupData(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Default Notifications</span>
                                  </label>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div 
                                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                                      style={{ backgroundColor: group.color }}
                                    >
                                      <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {group.name}
                                      </h4>
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {completedTasks}/{groupTasks.length} tasks completed
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleGroupEdit(group)}
                                      className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    {state.groups.length > 1 && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete "${group.name}"? This will also delete all tasks in this group.`)) {
                                            dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                                          }
                                        }}
                                        className="p-2 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/20 rounded-lg transition-colors duration-200"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Completed Display Mode */}
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                        Completed Display Mode
                                      </p>
                                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                        {completedDisplayModes.find(m => m.value === group.completedDisplayMode)?.label || 'Grey Out'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Due Dates & Notifications */}
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                                      <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                        Due Dates & Notifications
                                      </p>
                                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Time-based features for this group
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-center space-x-2">
                                      {group.enableDueDates ? (
                                        <Calendar className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Calendar className="w-4 h-4 text-neutral-400" />
                                      )}
                                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Due Dates: {group.enableDueDates ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {group.sortByDueDate ? (
                                        <Clock className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-neutral-400" />
                                      )}
                                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Sort by Due Date: {group.sortByDueDate ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {group.defaultNotifications ? (
                                        <Bell className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <BellOff className="w-4 h-4 text-neutral-400" />
                                      )}
                                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Default Notifications: {group.defaultNotifications ? 'On' : 'Off'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                      {state.settings.ai.enabled && (
                        <button
                          onClick={() => setShowAIModal(true)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Brain className="w-4 h-4" />
                          <span>Open AI Assistant</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Enable AI */}
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Assistant</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Get AI-powered insights about your task patterns
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={state.settings.ai.enabled}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: {
                              ai: { ...state.settings.ai, enabled: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>

                      {/* AI Provider */}
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">AI Provider</h4>
                        <select
                          value={state.settings.ai.provider}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: {
                              ai: { ...state.settings.ai, provider: e.target.value as any }
                            }
                          })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="gemini">Google Gemini</option>
                        </select>
                      </div>

                      {/* AI Model */}
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">AI Model</h4>
                        <select
                          value={state.settings.ai.model}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: {
                              ai: { ...state.settings.ai, model: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">API Key</h4>
                        <input
                          type="password"
                          value={state.settings.ai.apiKey}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: {
                              ai: { ...state.settings.ai, apiKey: e.target.value }
                            }
                          })}
                          placeholder="Enter your API key..."
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          Your API key is stored locally and never shared.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security */}
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
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {isSettingsPasswordSet ? 'Password protection is enabled' : 'No password protection set'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {isSettingsPasswordSet && (
                              <div className="w-3 h-3 bg-green-500 rounded-full" title="Password is set" />
                            )}
                            <div className="flex items-center space-x-2">
                              {isSettingsPasswordSet ? (
                                <>
                                  <button
                                    onClick={handleRemoveSettingsPassword}
                                    className="px-3 py-1 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-400 text-sm rounded-lg hover:bg-error-200 dark:hover:bg-error-900/30 transition-colors duration-200"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={handleSetSettingsPassword}
                                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors duration-200"
                                  >
                                    Change
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={handleSetSettingsPassword}
                                  className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors duration-200"
                                >
                                  Set Password
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Security */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Profile Security</h4>
                        {state.profiles.map(profile => (
                          <div key={profile.id} className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                  style={{ backgroundColor: profile.color }}
                                >
                                  {profile.avatar}
                                </div>
                                <div>
                                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </h5>
                                  <div className="flex items-center space-x-2">
                                    {profile.pin ? (
                                      <div className="flex items-center space-x-1">
                                        <Lock className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                          Protected
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <Unlock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                          Open
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {profile.pin && (
                                  <button
                                    onClick={() => openProfileInNewTab(profile.id)}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200 flex items-center space-x-1"
                                    title="Open profile in new tab without PIN"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Open</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Activity History
                      </h3>
                      <button
                        onClick={handleDetailedHistoryToggle}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{showDetailedHistory ? 'Show Recent Activity' : 'View Detailed History'}</span>
                      </button>
                    </div>

                    <HistoryAnalytics 
                      history={state.history} 
                      tasks={state.tasks} 
                      profiles={state.profiles}
                      showDetailedHistory={showDetailedHistory}
                    />
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
        onPasswordSet={handlePasswordSet}
        title={passwordModalConfig.title}
        description={passwordModalConfig.description}
        isSettingPassword={passwordModalConfig.isSettingPassword}
      />
    </>
  );
}