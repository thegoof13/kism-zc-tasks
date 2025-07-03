import React, { useState, useEffect } from 'react';
import { X, Settings, Users, History, Brain, Shield, Plus, Edit, Trash2, Save, Eye, EyeOff, Lock, Unlock, Trophy, Crown, CheckCircle, Clock, Calendar, Bell, BellOff, User, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, CompletedDisplayMode } from '../types';
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

type SettingsTab = 'general' | 'groups' | 'profiles' | 'history' | 'ai' | 'security';

const completedDisplayModeOptions: { value: CompletedDisplayMode; label: string; description: string }[] = [
  { value: 'grey-out', label: 'Grey Out', description: 'Show completed tasks greyed out in place' },
  { value: 'grey-drop', label: 'Grey & Drop', description: 'Show completed tasks greyed out at bottom' },
  { value: 'separate-completed', label: 'Separate', description: 'Show completed tasks in separate section' },
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSettingsPasswordModal, setShowSettingsPasswordModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  // Check URL for detailed history parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('detailed_history') === 'true') {
      setShowDetailedHistory(true);
      setActiveTab('history');
    }
  }, []);

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as CompletedDisplayMode,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
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

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out',
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    });
    setEditingGroup(null);
    setShowGroupForm(false);
  };

  const resetProfileForm = () => {
    setProfileForm({
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
    setEditingProfile(null);
    setShowProfileForm(false);
  };

  const handleEditGroup = (group: TaskGroup) => {
    setGroupForm({
      name: group.name,
      color: group.color,
      icon: group.icon,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate,
      defaultNotifications: group.defaultNotifications ?? false,
    });
    setEditingGroup(group);
    setShowGroupForm(true);
  };

  const handleEditProfile = (profile: UserProfile) => {
    setProfileForm({
      name: profile.name,
      color: profile.color,
      avatar: profile.avatar,
      isTaskCompetitor: profile.isTaskCompetitor ?? false,
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
    setEditingProfile(profile);
    setShowProfileForm(true);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) return;

    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup.id,
        updates: groupForm,
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: groupForm,
      });
    }

    resetGroupForm();
  };

  const handleSaveProfile = () => {
    if (!profileForm.name.trim()) return;

    const profileData = {
      ...profileForm,
      pin: profileForm.pin || undefined,
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

    resetProfileForm();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetPin = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profile);
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = (newPin: string) => {
    if (selectedProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: selectedProfile.id,
        updates: { pin: newPin },
      });
    }
    setShowPinModal(false);
    setSelectedProfile(null);
  };

  const handleOpenProfileInNewTab = (profileId: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profileId);
    currentUrl.searchParams.set('bypass_pin', 'true');
    window.open(currentUrl.toString(), '_blank');
  };

  const handleSetSettingsPassword = () => {
    setShowSettingsPasswordModal(true);
  };

  const handleSettingsPasswordSet = (password: string) => {
    onSetSettingsPassword(password);
    setShowSettingsPasswordModal(false);
  };

  const handleOpenDetailedHistory = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('detailed_history', 'true');
    window.open(currentUrl.toString(), '_blank');
  };

  const availableIcons = getAvailableIcons();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden settings-modal">
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

          <div className="flex h-[calc(95vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
              <nav className="space-y-2">
                {[
                  { id: 'general', label: 'General', icon: Settings },
                  { id: 'groups', label: 'Groups', icon: CheckCircle },
                  { id: 'profiles', label: 'Profiles', icon: Users },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'ai', label: 'AI Assistant', icon: Brain },
                  { id: 'security', label: 'Security', icon: Shield },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    General Settings
                  </h3>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
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
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Show Completed Count
                      </h4>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Enable Notifications
                      </h4>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Show Top Collaborator
                      </h4>
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
              )}

              {activeTab === 'groups' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={() => setShowGroupForm(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </button>
                  </div>

                  {showGroupForm && (
                    <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                      <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
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
                            {availableIcons.map(({ name, component: Icon }) => (
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
                            value={groupForm.completedDisplayMode}
                            onChange={(e) => setGroupForm({ ...groupForm, completedDisplayMode: e.target.value as CompletedDisplayMode })}
                            className="input-primary"
                          >
                            {completedDisplayModeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Enable Due Dates
                            </h5>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
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
                              <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Sort by Due Date
                              </h5>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
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
                            <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Default Notifications
                            </h5>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
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

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={resetGroupForm}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveGroup}
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingGroup ? 'Update' : 'Create'} Group
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {state.groups.map(group => {
                      const IconComponent = getIconComponent(group.icon);
                      const completedDisplayOption = completedDisplayModeOptions.find(opt => opt.value === group.completedDisplayMode);
                      
                      return (
                        <div key={group.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {group.name}
                              </span>
                            </div>
                            
                            {/* Compact Indicators */}
                            <div className="flex items-center space-x-2">
                              {/* Completed Display Mode Indicator */}
                              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                                  {completedDisplayOption?.label || 'Grey Out'}
                                </span>
                              </div>
                              
                              {/* Due Dates & Notifications Indicator */}
                              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                                <Clock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <div className="flex items-center space-x-1">
                                  {group.enableDueDates && (
                                    <Calendar className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                  )}
                                  {group.defaultNotifications ? (
                                    <Bell className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                  ) : (
                                    <BellOff className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                  )}
                                </div>
                                <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                                  {group.enableDueDates ? 'Due dates' : 'No due dates'}
                                  {group.defaultNotifications ? ', Notify' : ', Silent'}
                                </span>
                              </div>
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
                              className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4 text-error-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      User Profiles
                    </h3>
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Profile
                    </button>
                  </div>

                  {showProfileForm && (
                    <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                      <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                        {editingProfile ? 'Edit Profile' : 'Add New Profile'}
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
                            Avatar (Text/Emoji)
                          </label>
                          <input
                            type="text"
                            value={profileForm.avatar}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                            className="input-primary"
                            placeholder="👤"
                            maxLength={4}
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

                      {/* Task Competitor */}
                      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <div>
                              <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Task Competitor
                              </h5>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                Participate in task completion rankings
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={profileForm.isTaskCompetitor}
                            onChange={(e) => setProfileForm({ ...profileForm, isTaskCompetitor: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Permissions
                          </h5>
                        </div>
                        <div className="space-y-2">
                          {[
                            { key: 'canCreateTasks', label: 'Can Create Tasks' },
                            { key: 'canEditTasks', label: 'Can Edit Tasks' },
                            { key: 'canDeleteTasks', label: 'Can Delete Tasks' },
                          ].map(permission => (
                            <div key={permission.key} className="flex items-center justify-between">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                {permission.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={profileForm.permissions[permission.key as keyof typeof profileForm.permissions]}
                                onChange={(e) => setProfileForm({
                                  ...profileForm,
                                  permissions: {
                                    ...profileForm.permissions,
                                    [permission.key]: e.target.checked
                                  }
                                })}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meal Times */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Meal Times
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
                            { key: 'lunch', label: 'Lunch', icon: '☀️' },
                            { key: 'dinner', label: 'Dinner', icon: '🌆' },
                            { key: 'nightcap', label: 'Night Cap', icon: '🌙' },
                          ].map(meal => (
                            <div key={meal.key}>
                              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {meal.icon} {meal.label}
                              </label>
                              <input
                                type="time"
                                value={profileForm.mealTimes[meal.key as keyof typeof profileForm.mealTimes]}
                                onChange={(e) => setProfileForm({
                                  ...profileForm,
                                  mealTimes: {
                                    ...profileForm.mealTimes,
                                    [meal.key]: e.target.value
                                  }
                                })}
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={resetProfileForm}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingProfile ? 'Update' : 'Create'} Profile
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {state.profiles.map(profile => {
                      const profileTasks = state.tasks.filter(task => task.profiles.includes(profile.id));
                      const completedTasks = profileTasks.filter(task => task.isCompleted).length;
                      const isActiveSession = profile.id === state.activeProfileId;
                      
                      return (
                        <div key={profile.id} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                                  {profile.avatar}
                                </div>
                                {isActiveSession && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800" title="Active Session" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </span>
                                  {profile.isTaskCompetitor && (
                                    <Trophy className="w-4 h-4 text-yellow-500" title="Task Competitor" />
                                  )}
                                  {isActiveSession && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {completedTasks} of {profileTasks.length} tasks completed
                                </p>
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
                                className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4 text-error-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Activity History & Analytics
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowDetailedHistory(!showDetailedHistory)}
                        className="btn-secondary text-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showDetailedHistory ? 'Show Analytics' : 'Show Detailed Log'}
                      </button>
                      <button
                        onClick={handleOpenDetailedHistory}
                        className="btn-secondary text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </button>
                    </div>
                  </div>

                  <HistoryAnalytics 
                    history={state.history} 
                    tasks={state.tasks} 
                    profiles={state.profiles}
                  />
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    {state.settings.ai.enabled && (
                      <button
                        onClick={() => setShowAIQuery(true)}
                        className="btn-primary"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Ask AI
                      </button>
                    )}
                  </div>

                  {/* AI Provider */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      AI Provider
                    </label>
                    <select
                      value={state.settings.ai.provider}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_SETTINGS',
                        updates: { 
                          ai: { 
                            ...state.settings.ai, 
                            provider: e.target.value as any 
                          } 
                        }
                      })}
                      className="input-primary max-w-xs"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>

                  {/* AI Model */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      Model
                    </label>
                    <select
                      value={state.settings.ai.model}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_SETTINGS',
                        updates: { 
                          ai: { 
                            ...state.settings.ai, 
                            model: e.target.value 
                          } 
                        }
                      })}
                      className="input-primary max-w-xs"
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
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      API Key
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="password"
                        value={state.settings.ai.apiKey}
                        onChange={(e) => dispatch({
                          type: 'UPDATE_SETTINGS',
                          updates: { 
                            ai: { 
                              ...state.settings.ai, 
                              apiKey: e.target.value 
                            } 
                          }
                        })}
                        className="input-primary flex-1"
                        placeholder="Enter your API key"
                      />
                    </div>
                  </div>

                  {/* Enable AI */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Enable AI Assistant
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Allow AI-powered task insights and recommendations
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.ai.enabled}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_SETTINGS',
                        updates: { 
                          ai: { 
                            ...state.settings.ai, 
                            enabled: e.target.checked 
                          } 
                        }
                      })}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Security Settings
                  </h3>

                  {/* Settings Password */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Settings Password
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Protect access to settings with a password
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isSettingsPasswordSet && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Lock className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                              Protected
                            </span>
                          </div>
                        )}
                        <button
                          onClick={handleSetSettingsPassword}
                          className="btn-secondary text-sm"
                        >
                          {isSettingsPasswordSet ? 'Change' : 'Set'} Password
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Security */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Profile Security
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{profile.avatar}</span>
                            <div>
                              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                {profile.pin ? (
                                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                      PIN Protected
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                                    <Unlock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                                      No PIN
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenProfileInNewTab(profile.id)}
                              className="btn-secondary text-sm"
                              title="Open profile in new tab (PIN bypass)"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </button>
                            <button
                              onClick={() => handleSetPin(profile.id)}
                              className="btn-secondary text-sm"
                            >
                              {profile.pin ? 'Change' : 'Set'} PIN
                            </button>
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

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIQuery}
        onClose={() => setShowAIQuery(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
      />

      {/* PIN Modal */}
      <PasswordModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setSelectedProfile(null);
        }}
        onSuccess={handlePinSuccess}
        title={`Set PIN for ${selectedProfile?.name}`}
        description={`Set a PIN to protect ${selectedProfile?.name}'s profile. This PIN will be required to access this profile.`}
        placeholder="Enter new PIN..."
        isSettingPassword={true}
        onPasswordSet={handlePinSuccess}
      />

      {/* Settings Password Modal */}
      <PasswordModal
        isOpen={showSettingsPasswordModal}
        onClose={() => setShowSettingsPasswordModal(false)}
        onSuccess={() => {}}
        title="Set Settings Password"
        description="Set a password to protect access to settings. This password will be required to open settings."
        placeholder="Enter new password..."
        isSettingPassword={true}
        onPasswordSet={handleSettingsPasswordSet}
      />
    </>
  );
}