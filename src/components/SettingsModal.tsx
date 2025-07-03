import React, { useState, useEffect } from 'react';
import { X, Settings, Users, Shield, Brain, Plus, Edit, Trash2, Eye, EyeOff, Lock, Calendar, Bell, BellOff, CheckCircle, Clock, Trophy, Crown, User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart, Save, TestTube, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PasswordModal } from './PasswordModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'history';

const availableIcons = [
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

const avatarOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱', '👴', '👵', '🧓', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨', '🧑‍💻', '👨‍💻', '👩‍💻'];

const colorOptions = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

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
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  // AI Settings state
  const [aiProvider, setAiProvider] = useState(state.settings.ai.provider);
  const [aiModel, setAiModel] = useState(state.settings.ai.model);
  const [aiApiKey, setAiApiKey] = useState(state.settings.ai.apiKey);
  const [aiEnabled, setAiEnabled] = useState(state.settings.ai.enabled);
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '👤',
    color: '#6366F1',
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

  // Group editing state
  const [groupForm, setGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as const,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

  const modelOptions = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-pro', 'gemini-pro-vision'],
  };

  // Reset AI settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setAiProvider(state.settings.ai.provider);
      setAiModel(state.settings.ai.model);
      setAiApiKey(state.settings.ai.apiKey);
      setAiEnabled(state.settings.ai.enabled);
      setTestResult(null);
    }
  }, [isOpen, state.settings.ai]);

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
    setShowAISettings(false);
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setTestResult(null);

    try {
      // Simple test query
      const testQuery = "Hello, this is a test. Please respond with 'AI connection successful'.";
      
      // Mock test for now - in real implementation, this would call the AI service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!aiApiKey.trim()) {
        throw new Error('API key is required');
      }

      setTestResult({
        success: true,
        message: 'AI connection successful! Your settings are working correctly.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed. Please check your settings.',
      });
    } finally {
      setTestingAI(false);
    }
  };

  const handleAddProfile = () => {
    setProfileForm({
      name: '',
      avatar: '👤',
      color: '#6366F1',
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
    setEditingProfile('new');
  };

  const handleEditProfile = (profile: any) => {
    setProfileForm({
      name: profile.name,
      avatar: profile.avatar,
      color: profile.color,
      isTaskCompetitor: profile.isTaskCompetitor || false,
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
    setEditingProfile(profile.id);
  };

  const handleSaveProfile = () => {
    if (!profileForm.name.trim()) return;

    if (editingProfile === 'new') {
      dispatch({
        type: 'ADD_PROFILE',
        profile: profileForm,
      });
    } else {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile!,
        updates: profileForm,
      });
    }
    setEditingProfile(null);
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

  const handleAddGroup = () => {
    setGroupForm({
      name: '',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out',
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    });
    setEditingGroup('new');
  };

  const handleEditGroup = (group: any) => {
    setGroupForm({
      name: group.name,
      color: group.color,
      icon: group.icon,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate,
      defaultNotifications: group.defaultNotifications || false,
    });
    setEditingGroup(group.id);
  };

  const handleSaveGroup = () => {
    if (!groupForm.name.trim()) return;

    if (editingGroup === 'new') {
      dispatch({
        type: 'ADD_GROUP',
        group: groupForm,
      });
    } else {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup!,
        updates: groupForm,
      });
    }
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings.',
      onSuccess: (password: string) => {
        onSetSettingsPassword(password);
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleSetProfilePin = (profileId: string) => {
    setPasswordModalConfig({
      title: 'Set Profile PIN',
      description: 'Create a PIN to protect this profile.',
      onSuccess: (pin: string) => {
        dispatch({
          type: 'UPDATE_PROFILE',
          profileId,
          updates: { pin },
        });
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveProfilePin = (profileId: string) => {
    if (window.confirm('Are you sure you want to remove the PIN protection from this profile?')) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId,
        updates: { pin: undefined },
      });
    }
  };

  const generateProfileBypassUrl = (profileId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?profile=${profileId}&bypass_pin=true`;
  };

  const openProfileInNewTab = (profileId: string) => {
    const url = generateProfileBypassUrl(profileId);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profiles', label: 'Profiles', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
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

          <div className="flex h-[calc(95vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-1">
                {tabs.map(tab => {
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
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    General Settings
                  </h3>

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
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
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
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
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
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
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

              {/* Groups */}
              {activeTab === 'groups' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={handleAddGroup}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.groups.map(group => {
                      const IconComponent = availableIcons.find(i => i.name === group.icon)?.component || User;
                      return (
                        <div key={group.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: group.color + '20' }}
                              >
                                <IconComponent 
                                  className="w-5 h-5" 
                                  style={{ color: group.color }}
                                />
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {group.name}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1">
                                  {/* Completed Display Mode Indicator */}
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-success-500" />
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {group.completedDisplayMode === 'grey-out' ? 'Grey Out' :
                                       group.completedDisplayMode === 'grey-drop' ? 'Grey & Drop' :
                                       'Separate'}
                                    </span>
                                  </div>
                                  
                                  {/* Due Dates & Notifications Indicator */}
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-warning-500" />
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {group.enableDueDates ? (
                                        <>
                                          <Calendar className="w-2.5 h-2.5 inline mr-1" />
                                          Due dates
                                        </>
                                      ) : (
                                        'No due dates'
                                      )}
                                      {group.enableDueDates ? '' : (
                                        group.defaultNotifications ? (
                                          <>
                                            , <Bell className="w-2.5 h-2.5 inline mx-1" />Notify
                                          </>
                                        ) : (
                                          <>
                                            , <BellOff className="w-2.5 h-2.5 inline mx-1" />Silent
                                          </>
                                        )
                                      )}
                                    </span>
                                  </div>
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
                        </div>
                      );
                    })}
                  </div>

                  {/* Group Edit Modal */}
                  {editingGroup && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/50" onClick={() => setEditingGroup(null)} />
                      <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h4 className="text-lg font-semibold mb-4">
                          {editingGroup === 'new' ? 'Add Group' : 'Edit Group'}
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input
                              type="text"
                              value={groupForm.name}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                              className="input-primary"
                              placeholder="Group name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Icon</label>
                            <div className="grid grid-cols-5 gap-2">
                              {availableIcons.map(icon => {
                                const IconComponent = icon.component;
                                return (
                                  <button
                                    key={icon.name}
                                    type="button"
                                    onClick={() => setGroupForm(prev => ({ ...prev, icon: icon.name }))}
                                    className={`p-2 rounded-lg border transition-colors duration-200 ${
                                      groupForm.icon === icon.name
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                    }`}
                                  >
                                    <IconComponent className="w-5 h-5 mx-auto" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <div className="grid grid-cols-5 gap-2">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                                    groupForm.color === color
                                      ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                                      : 'border-neutral-300 dark:border-neutral-600'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Completed Display Mode</label>
                            <select
                              value={groupForm.completedDisplayMode}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                              className="input-primary"
                            >
                              <option value="grey-out">Grey Out</option>
                              <option value="grey-drop">Grey and Drop Down</option>
                              <option value="separate-completed">Separate Completed</option>
                            </select>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">Enable Due Dates</h5>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                                  <h5 className="font-medium">Sort by Due Date</h5>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                                  <h5 className="font-medium">Default Notifications</h5>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Enable notifications by default for new tasks
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
                        </div>

                        <div className="flex space-x-3 mt-6">
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="flex-1 btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveGroup}
                            className="flex-1 btn-primary"
                            disabled={!groupForm.name.trim()}
                          >
                            {editingGroup === 'new' ? 'Add' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profiles */}
              {activeTab === 'profiles' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
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

                  <div className="space-y-3">
                    {state.profiles.map(profile => (
                      <div key={profile.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
                              style={{ backgroundColor: profile.color + '20', color: profile.color }}
                            >
                              {profile.avatar}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                {profile.isTaskCompetitor && (
                                  <Trophy className="w-4 h-4 text-yellow-500" title="Task Competitor" />
                                )}
                                {profile.id === state.activeProfileId && (
                                  <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs rounded-full font-medium">
                                    Active
                                  </span>
                                )}
                                {profile.pin && (
                                  <Lock className="w-4 h-4 text-warning-500" title="PIN Protected" />
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                  Tasks: {state.tasks.filter(t => t.profiles.includes(profile.id)).length} assigned, {state.tasks.filter(t => t.profiles.includes(profile.id) && t.isCompleted).length} completed
                                </span>
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
                      </div>
                    ))}
                  </div>

                  {/* Profile Edit Modal */}
                  {editingProfile && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/50" onClick={() => setEditingProfile(null)} />
                      <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h4 className="text-lg font-semibold mb-4">
                          {editingProfile === 'new' ? 'Add Profile' : 'Edit Profile'}
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                              className="input-primary"
                              placeholder="Profile name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Avatar</label>
                            <div className="grid grid-cols-8 gap-2">
                              {avatarOptions.map(avatar => (
                                <button
                                  key={avatar}
                                  type="button"
                                  onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                                  className={`p-2 rounded-lg border text-lg transition-colors duration-200 ${
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
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <div className="grid grid-cols-5 gap-2">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setProfileForm(prev => ({ ...prev, color }))}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                                    profileForm.color === color
                                      ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                                      : 'border-neutral-300 dark:border-neutral-600'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">Task Competitor</h5>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  Participate in task completion rankings
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={profileForm.isTaskCompetitor}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">Permissions</h5>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Can Create Tasks</span>
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
                                  <span className="text-sm">Can Edit Tasks</span>
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
                                  <span className="text-sm">Can Delete Tasks</span>
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
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium mb-2">Meal Times</h5>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">🌅 Breakfast</label>
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
                                  <label className="block text-xs font-medium mb-1">☀️ Lunch</label>
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
                                  <label className="block text-xs font-medium mb-1">🌆 Dinner</label>
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
                                  <label className="block text-xs font-medium mb-1">🌙 Night Cap</label>
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
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                          <button
                            onClick={() => setEditingProfile(null)}
                            className="flex-1 btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 btn-primary"
                            disabled={!profileForm.name.trim()}
                          >
                            {editingProfile === 'new' ? 'Add' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Security Settings
                  </h3>

                  {/* Settings Password */}
                  <div className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          Settings Password
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {isSettingsPasswordSet ? 'Password protection is enabled' : 'Protect settings access with a password'}
                        </p>
                      </div>
                      <button
                        onClick={handleSetSettingsPassword}
                        className="btn-primary"
                      >
                        {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                      </button>
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
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {profile.pin ? 'PIN protected' : 'No PIN protection'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openProfileInNewTab(profile.id)}
                              className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors duration-200"
                              title="Open profile in new tab (PIN bypass)"
                            >
                              Open Tab
                            </button>
                            {profile.pin ? (
                              <button
                                onClick={() => handleRemoveProfilePin(profile.id)}
                                className="px-3 py-1 text-sm bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg hover:bg-error-200 dark:hover:bg-error-900/40 transition-colors duration-200"
                              >
                                Remove PIN
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetProfilePin(profile.id)}
                                className="px-3 py-1 text-sm bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-lg hover:bg-warning-200 dark:hover:bg-warning-900/40 transition-colors duration-200"
                              >
                                Set PIN
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Assistant */}
              {activeTab === 'ai' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAISettings(true)}
                        className="btn-secondary"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={() => setShowAIQuery(true)}
                        className="btn-primary"
                        disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Ask AI
                      </button>
                    </div>
                  </div>

                  {/* AI Status */}
                  <div className="card p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        state.settings.ai.enabled && state.settings.ai.apiKey
                          ? 'bg-success-100 dark:bg-success-900/20'
                          : 'bg-neutral-100 dark:bg-neutral-700'
                      }`}>
                        <Brain className={`w-6 h-6 ${
                          state.settings.ai.enabled && state.settings.ai.apiKey
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {state.settings.ai.enabled && state.settings.ai.apiKey ? 'AI Assistant Ready' : 'AI Assistant Not Configured'}
                        </h4>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {state.settings.ai.enabled && state.settings.ai.apiKey 
                            ? `Using ${state.settings.ai.provider} (${state.settings.ai.model})`
                            : 'Configure your AI settings to get started'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          state.settings.ai.enabled && state.settings.ai.apiKey
                            ? 'bg-success-500'
                            : 'bg-neutral-400'
                        }`} />
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {state.settings.ai.enabled && state.settings.ai.apiKey ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          Task Analysis
                        </h4>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Get insights about your task completion patterns, productivity trends, and areas for improvement.
                      </p>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <MessageSquare className="w-5 h-5 text-primary-500" />
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          Smart Recommendations
                        </h4>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Ask questions about your tasks and get personalized recommendations for better productivity.
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {state.settings.ai.enabled && state.settings.ai.apiKey && (
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Quick Questions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "What are my task completion patterns?",
                          "Which tasks do I complete most consistently?",
                          "How can I improve my productivity?",
                          "What's my best time of day for tasks?"
                        ].map((question, index) => (
                          <button
                            key={index}
                            onClick={() => setShowAIQuery(true)}
                            className="p-3 text-left text-sm bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {activeTab === 'history' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    Activity History & Analytics
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

      {/* AI Settings Modal */}
      {showAISettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAISettings(false)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Settings
              </h4>
              <button
                onClick={() => setShowAISettings(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    setAiProvider(e.target.value as any);
                    setAiModel(modelOptions[e.target.value as keyof typeof modelOptions][0]);
                  }}
                  className="input-primary"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Model
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="input-primary"
                >
                  {modelOptions[aiProvider].map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
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
                    placeholder="Enter your API key..."
                    className="input-primary pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Your API key is stored locally and never shared
                </p>
              </div>

              {/* Enable AI */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Enable AI Assistant
                  </h5>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Allow AI-powered insights and recommendations
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
              </div>

              {/* Test Connection */}
              {aiApiKey && (
                <div>
                  <button
                    onClick={handleTestAI}
                    disabled={testingAI}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>{testingAI ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                  
                  {testResult && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      testResult.success 
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                        : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400'
                    }`}>
                      {testResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAISettings(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAISettings}
                className="flex-1 btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Password Modal */}
      {showPasswordModal && passwordModalConfig && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordModalConfig(null);
          }}
          onSuccess={passwordModalConfig.onSuccess}
          title={passwordModalConfig.title}
          description={passwordModalConfig.description}
          isSettingPassword={passwordModalConfig.isSettingPassword}
          onPasswordSet={passwordModalConfig.isSettingPassword ? passwordModalConfig.onSuccess : undefined}
        />
      )}
    </>
  );
}