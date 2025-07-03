import React, { useState } from 'react';
import { X, Settings, Users, Shield, Brain, BarChart3, Plus, Edit, Trash2, Eye, EyeOff, Save, TestTube, Loader, CheckCircle, AlertCircle, Bell, BellOff, Calendar, Palette, Home, User, Briefcase, Heart, Book, Car, Coffee, Dumbbell, Music, ShoppingCart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { PasswordModal } from './PasswordModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type TabType = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'history';

const iconOptions = [
  { name: 'User', component: User },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Heart', component: Heart },
  { name: 'Home', component: Home },
  { name: 'Book', component: Book },
  { name: 'Car', component: Car },
  { name: 'Coffee', component: Coffee },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Music', component: Music },
  { name: 'ShoppingCart', component: ShoppingCart },
];

const colorOptions = [
  '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4',
  '#84CC16', '#F97316', '#EC4899', '#6B7280', '#14B8A6', '#F59E0B'
];

const avatarOptions = [
  '👤', '👨', '👩', '🧑', '👶', '👴', '👵', '🧔', '👱', '👨‍💼',
  '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎨',
  '👩‍🎨', '👨‍💻', '👩‍💻', '🧑‍🚀', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
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

  // Group editing state
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
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
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
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

  // AI testing state
  const [aiTestQuery, setAiTestQuery] = useState('');
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'groups' as const, label: 'Groups', icon: Palette },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'ai' as const, label: 'AI', icon: Brain },
    { id: 'history' as const, label: 'History', icon: BarChart3 },
  ];

  const handleGroupEdit = (group: TaskGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      color: group.color,
      icon: group.icon,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate,
      defaultNotifications: group.defaultNotifications ?? false,
    });
  };

  const handleGroupSave = () => {
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

    setEditingGroup(null);
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

  const handleProfileEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
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
  };

  const handleProfileSave = () => {
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

    setEditingProfile(null);
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
      description: 'Create a password to protect access to settings.',
      onSuccess: () => setShowPasswordModal(false),
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveSettingsPassword = () => {
    if (window.confirm('Are you sure you want to remove the settings password?')) {
      dispatch({
        type: 'UPDATE_SETTINGS',
        updates: { settingsPassword: undefined }
      });
    }
  };

  const testAIConnection = async () => {
    if (!state.settings.ai.apiKey || !aiTestQuery.trim()) return;

    setAiTesting(true);
    setAiTestResult(null);

    try {
      // Simple test query
      const testResponse = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiTestQuery,
          settings: state.settings.ai,
        }),
      });

      if (testResponse.ok) {
        setAiTestResult({ success: true, message: 'AI connection successful!' });
      } else {
        setAiTestResult({ success: false, message: 'AI connection failed. Check your API key and settings.' });
      }
    } catch (error) {
      setAiTestResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setAiTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden flex flex-col settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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
            <div className="w-full sm:w-48 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
              <div className="p-2">
                {/* Mobile: Horizontal scroll tabs */}
                <div className="sm:hidden flex space-x-1 overflow-x-auto pb-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop: Vertical tabs */}
                <div className="hidden sm:block space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
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

                        {/* Auto Archive */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Auto-archive Completed Tasks
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Automatically archive old completed tasks
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={state.settings.autoArchiveCompleted}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { autoArchiveCompleted: e.target.checked }
                            })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        {/* Archive Days */}
                        {state.settings.autoArchiveCompleted && (
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Archive after (days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={state.settings.archiveDays}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { archiveDays: parseInt(e.target.value) || 30 }
                              })}
                              className="input-primary max-w-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task Groups
                      </h3>
                      <button
                        onClick={() => {
                          setEditingGroup(null);
                          setGroupForm({
                            name: '',
                            color: '#6366F1',
                            icon: 'User',
                            completedDisplayMode: 'grey-out',
                            enableDueDates: false,
                            sortByDueDate: false,
                            defaultNotifications: false,
                          });
                        }}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Group
                      </button>
                    </div>

                    {/* Group Form */}
                    {(editingGroup !== null || groupForm.name) && (
                      <div className="card p-4 space-y-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {editingGroup ? 'Edit Group' : 'New Group'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={groupForm.name}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                              className="input-primary"
                              placeholder="Group name..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <div className="flex space-x-2">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    groupForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Icon
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                              {iconOptions.map(({ name, component: Icon }) => (
                                <button
                                  key={name}
                                  onClick={() => setGroupForm(prev => ({ ...prev, icon: name }))}
                                  className={`p-2 rounded-lg border ${
                                    groupForm.icon === name
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                      : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                  }`}
                                >
                                  <Icon className="w-4 h-4 mx-auto" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Completed Display
                            </label>
                            <select
                              value={groupForm.completedDisplayMode}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
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
                              onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
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
                                onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                          )}

                          {!groupForm.enableDueDates && (
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
                                onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setEditingGroup(null);
                              setGroupForm({
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
                          <button
                            onClick={handleGroupSave}
                            className="btn-primary"
                            disabled={!groupForm.name.trim()}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingGroup ? 'Update' : 'Create'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Groups List */}
                    <div className="space-y-3">
                      {state.groups.map(group => {
                        const IconComponent = iconOptions.find(opt => opt.name === group.icon)?.component || User;
                        return (
                          <div key={group.id} className="card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: group.color + '20' }}
                                >
                                  <IconComponent className="w-5 h-5" style={{ color: group.color }} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>{group.completedDisplayMode.replace('-', ' ')}</span>
                                    {group.enableDueDates && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>Due dates</span>
                                        </div>
                                      </>
                                    )}
                                    {!group.enableDueDates && group.defaultNotifications && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center space-x-1">
                                          <Bell className="w-3 h-3" />
                                          <span>Notifications</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleGroupEdit(group)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4 text-neutral-500" />
                                </button>
                                <button
                                  onClick={() => handleGroupDelete(group.id)}
                                  className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
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

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                      <button
                        onClick={() => {
                          setEditingProfile(null);
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
                        }}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </button>
                    </div>

                    {/* Profile Form */}
                    {(editingProfile !== null || profileForm.name) && (
                      <div className="card p-4 space-y-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {editingProfile ? 'Edit Profile' : 'New Profile'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                              className="input-primary"
                              placeholder="Profile name..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <div className="flex space-x-2">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setProfileForm(prev => ({ ...prev, color }))}
                                  className={`w-8 h-8 rounded-full border-2 ${
                                    profileForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Avatar
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {avatarOptions.map(avatar => (
                                <button
                                  key={avatar}
                                  onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                                  className={`p-2 rounded-lg border text-lg ${
                                    profileForm.avatar === avatar
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                      : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                  }`}
                                >
                                  {avatar}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              PIN (Optional)
                            </label>
                            <input
                              type="password"
                              value={profileForm.pin}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                              className="input-primary"
                              placeholder="Leave empty for no PIN..."
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
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, breakfast: e.target.value }
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
                                value={profileForm.mealTimes.lunch}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, lunch: e.target.value }
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
                                value={profileForm.mealTimes.dinner}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, dinner: e.target.value }
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
                                value={profileForm.mealTimes.nightcap}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, nightcap: e.target.value }
                                }))}
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
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canCreateTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Edit Tasks</span>
                              <input
                                type="checkbox"
                                checked={profileForm.permissions.canEditTasks}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canEditTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Delete Tasks</span>
                              <input
                                type="checkbox"
                                checked={profileForm.permissions.canDeleteTasks}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canDeleteTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">Task Competitor</span>
                              <input
                                type="checkbox"
                                checked={profileForm.isTaskCompetitor}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setEditingProfile(null);
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
                            }}
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
                            {editingProfile ? 'Update' : 'Create'}
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
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                                style={{ backgroundColor: profile.color + '20' }}
                              >
                                {profile.avatar}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </h4>
                                  {profile.id === state.activeProfileId && (
                                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                                      Active
                                    </span>
                                  )}
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 text-xs rounded-full">
                                      PIN Protected
                                    </span>
                                  )}
                                  {profile.isTaskCompetitor && (
                                    <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300 text-xs rounded-full">
                                      Competitor
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                  <div>
                                    🌅 {profile.mealTimes?.breakfast || '07:00'} • 
                                    ☀️ {profile.mealTimes?.lunch || '12:00'} • 
                                    🌆 {profile.mealTimes?.dinner || '18:00'} • 
                                    🌙 {profile.mealTimes?.nightcap || '21:00'}
                                  </div>
                                  <div className="mt-1">
                                    Permissions: {[
                                      profile.permissions?.canCreateTasks && 'Create',
                                      profile.permissions?.canEditTasks && 'Edit',
                                      profile.permissions?.canDeleteTasks && 'Delete'
                                    ].filter(Boolean).join(', ') || 'View Only'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleProfileEdit(profile)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4 text-neutral-500" />
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => handleProfileDelete(profile.id)}
                                  className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
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

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Security Settings
                    </h3>

                    <div className="space-y-4">
                      {/* Settings Password */}
                      <div className="card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              Settings Password
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {isSettingsPasswordSet 
                                ? 'Password protection is enabled for settings access'
                                : 'No password protection set for settings'
                              }
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isSettingsPasswordSet ? (
                              <>
                                <button
                                  onClick={handleSetSettingsPassword}
                                  className="btn-secondary text-sm"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={handleRemoveSettingsPassword}
                                  className="btn-secondary text-sm text-error-600 hover:text-error-700"
                                >
                                  Remove
                                </button>
                              </>
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

                      {/* Profile Security Overview */}
                      <div className="card p-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                          Profile Security
                        </h4>
                        <div className="space-y-3">
                          {state.profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{profile.avatar}</span>
                                <div>
                                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {profile.pin ? 'PIN Protected' : 'No PIN protection'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {profile.pin ? (
                                  <div className="flex items-center space-x-1 text-success-600 dark:text-success-400">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Protected</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Open</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>

                    {/* AI Enable Toggle */}
                    <div className="card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                            Enable AI Assistant
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Get AI-powered insights about your task patterns and productivity
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
                    </div>

                    {/* AI Configuration - Only show if enabled */}
                    {state.settings.ai.enabled && (
                      <>
                        <div className="card p-4 space-y-4">
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                            AI Configuration
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                AI Provider
                              </label>
                              <select
                                value={state.settings.ai.provider}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_SETTINGS',
                                  updates: { 
                                    ai: { ...state.settings.ai, provider: e.target.value as any }
                                  }
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
                                  updates: { 
                                    ai: { ...state.settings.ai, model: e.target.value }
                                  }
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
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              API Key
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                value={state.settings.ai.apiKey}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_SETTINGS',
                                  updates: { 
                                    ai: { ...state.settings.ai, apiKey: e.target.value }
                                  }
                                })}
                                className="input-primary pr-10"
                                placeholder="Enter your API key..."
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {state.settings.ai.apiKey ? (
                                  <EyeOff className="w-4 h-4 text-neutral-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              Your API key is stored locally and never shared
                            </p>
                          </div>

                          {/* AI Test Section */}
                          {state.settings.ai.apiKey && (
                            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                              <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                                Test AI Connection
                              </h5>
                              <div className="flex space-x-3">
                                <input
                                  type="text"
                                  value={aiTestQuery}
                                  onChange={(e) => setAiTestQuery(e.target.value)}
                                  placeholder="Enter a test query..."
                                  className="flex-1 input-primary"
                                />
                                <button
                                  onClick={testAIConnection}
                                  disabled={aiTesting || !aiTestQuery.trim()}
                                  className="btn-primary"
                                >
                                  {aiTesting ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <TestTube className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              
                              {aiTestResult && (
                                <div className={`mt-3 p-3 rounded-lg ${
                                  aiTestResult.success 
                                    ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                                    : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                                }`}>
                                  <div className="flex items-center space-x-2">
                                    {aiTestResult.success ? (
                                      <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-error-600 dark:text-error-400" />
                                    )}
                                    <p className={`text-sm ${
                                      aiTestResult.success 
                                        ? 'text-success-700 dark:text-success-400'
                                        : 'text-error-700 dark:text-error-400'
                                    }`}>
                                      {aiTestResult.message}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Open AI Agent Button - Only show if configured */}
                        {state.settings.ai.enabled && state.settings.ai.apiKey && (
                          <div className="card p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  AI Task Assistant
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  Ask questions about your task history and get productivity insights
                                </p>
                              </div>
                              <button
                                onClick={() => setShowAIModal(true)}
                                className="btn-primary"
                              >
                                <Brain className="w-4 h-4 mr-2" />
                                Open AI Agent
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task History & Analytics
                      </h3>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="btn-secondary"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Detailed Task History
                      </button>
                    </div>

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
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={passwordModalConfig.onSuccess}
        onPasswordSet={onSetSettingsPassword}
        title={passwordModalConfig.title}
        description={passwordModalConfig.description}
        isSettingPassword={passwordModalConfig.isSettingPassword}
      />

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
    </>
  );
}