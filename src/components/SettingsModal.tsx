import React, { useState, useEffect } from 'react';
import { X, Settings, Users, History, Shield, Plus, Edit, Trash2, Eye, Brain, Trophy, Check, Lock, Clock, User, CheckCircle, AlertTriangle, Crown } from 'lucide-react';
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

type TabType = 'general' | 'groups' | 'profiles' | 'history' | 'security' | 'ai';

const availableAvatars = [
  '👤', '👨', '👩', '🧑', '👦', '👧', '👴', '👵', '🧔', '👱',
  '🎭', '🤖', '👽', '🦸', '🧙', '🧚', '🐱', '🐶', '🦊', '🐻'
];

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

const availableIcons = [
  { name: 'User', icon: User },
  { name: 'Briefcase', icon: Settings },
  { name: 'Heart', icon: Trophy },
  { name: 'Home', icon: Shield },
  { name: 'Book', icon: History },
  { name: 'Car', icon: Users },
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
    isSettingPassword?: boolean;
  } | null>(null);

  // AI Settings state
  const [aiProvider, setAiProvider] = useState(state.settings.ai.provider);
  const [aiModel, setAiModel] = useState(state.settings.ai.model);
  const [aiApiKey, setAiApiKey] = useState(state.settings.ai.apiKey);
  const [aiEnabled, setAiEnabled] = useState(state.settings.ai.enabled);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiMinimized, setAiMinimized] = useState(false);

  // Form states
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    setAiConfigured(state.settings.ai.enabled && !!state.settings.ai.apiKey);
    setAiMinimized(state.settings.ai.enabled && !!state.settings.ai.apiKey);
  }, [state.settings.ai]);

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: {
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey,
          enabled: aiEnabled && !!aiApiKey,
        }
      }
    });
    setAiConfigured(aiEnabled && !!aiApiKey);
    setAiMinimized(aiEnabled && !!aiApiKey);
  };

  const handleTestAI = async () => {
    // Simple test implementation
    alert('AI connection test would be implemented here');
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings. This password will be required to open settings in the future.',
      onSuccess: () => {
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    
    dispatch({
      type: 'ADD_GROUP',
      group: {
        name: newGroupName.trim(),
        color: availableColors[0],
        icon: 'User',
        completedDisplayMode: 'grey-out',
        isCollapsed: false,
        enableDueDates: false,
        sortByDueDate: false,
        defaultNotifications: false,
      }
    });
    setNewGroupName('');
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;
    
    dispatch({
      type: 'ADD_PROFILE',
      profile: {
        name: newProfileName.trim(),
        color: availableColors[0],
        avatar: availableAvatars[0],
        isActive: true,
        isTaskCompetitor: false,
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
      }
    });
    setNewProfileName('');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'groups' as TabType, label: 'Groups', icon: Trophy },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Users },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
    { id: 'ai' as TabType, label: 'AI', icon: Brain },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden flex settings-modal">
          {/* Sidebar */}
          <div className="w-16 md:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hidden md:block">
                Settings
              </h2>
              <Settings className="w-6 h-6 text-neutral-600 dark:text-neutral-400 md:hidden mx-auto" />
            </div>
            
            <nav className="p-2">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium hidden md:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Theme
                      </span>
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
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Show completed count in header
                      </span>
                      <input
                        type="checkbox"
                        checked={state.settings.showCompletedCount}
                        onChange={(e) => dispatch({
                          type: 'UPDATE_SETTINGS',
                          updates: { showCompletedCount: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Enable notifications
                      </span>
                      <input
                        type="checkbox"
                        checked={state.settings.enableNotifications}
                        onChange={(e) => dispatch({
                          type: 'UPDATE_SETTINGS',
                          updates: { enableNotifications: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Show Top Collaborator
                      </span>
                      <input
                        type="checkbox"
                        checked={state.settings.showTopCollaborator}
                        onChange={(e) => dispatch({
                          type: 'UPDATE_SETTINGS',
                          updates: { showTopCollaborator: e.target.checked }
                        })}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div className="space-y-6">
                  {/* Add Group */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New group name..."
                      className="flex-1 input-primary"
                    />
                    <button
                      onClick={handleAddGroup}
                      disabled={!newGroupName.trim()}
                      className="btn-primary px-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </button>
                  </div>

                  {/* Groups List */}
                  <div className="space-y-4">
                    {state.groups.map(group => (
                      <div key={group.id} className="card p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {group.name}
                            </h4>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingGroup(editingGroup === group.id ? null : group.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              <Edit className="w-4 h-4 text-neutral-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete group "${group.name}"?`)) {
                                  dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                                }
                              }}
                              className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20"
                            >
                              <Trash2 className="w-4 h-4 text-error-500" />
                            </button>
                          </div>
                        </div>

                        {editingGroup === group.id && (
                          <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                            {/* Completed Display Mode - Green box with tick */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </div>
                                <label className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Completed Display Mode
                                </label>
                              </div>
                              <select
                                value={group.completedDisplayMode}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_GROUP',
                                  groupId: group.id,
                                  updates: { completedDisplayMode: e.target.value as any }
                                })}
                                className="w-full input-primary"
                              >
                                <option value="grey-out">Grey Out</option>
                                <option value="grey-drop">Grey Drop</option>
                                <option value="separate-completed">Separate Completed</option>
                              </select>
                            </div>

                            {/* Due Dates & Notifications - Yellow box with clock */}
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  Date & Time Settings
                                </label>
                              </div>
                              <div className="space-y-3">
                                <label className="flex items-center justify-between">
                                  <span className="text-sm text-yellow-700 dark:text-yellow-300">Enable Due Dates</span>
                                  <input
                                    type="checkbox"
                                    checked={group.enableDueDates}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { enableDueDates: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-yellow-500 bg-neutral-100 border-neutral-300 rounded focus:ring-yellow-500"
                                  />
                                </label>
                                <label className="flex items-center justify-between">
                                  <span className="text-sm text-yellow-700 dark:text-yellow-300">Sort by Due Date</span>
                                  <input
                                    type="checkbox"
                                    checked={group.sortByDueDate}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { sortByDueDate: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-yellow-500 bg-neutral-100 border-neutral-300 rounded focus:ring-yellow-500"
                                  />
                                </label>
                                <label className="flex items-center justify-between">
                                  <span className="text-sm text-yellow-700 dark:text-yellow-300">Enable Notifications by Default</span>
                                  <input
                                    type="checkbox"
                                    checked={group.defaultNotifications || false}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { defaultNotifications: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-yellow-500 bg-neutral-100 border-neutral-300 rounded focus:ring-yellow-500"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profiles Tab */}
              {activeTab === 'profiles' && (
                <div className="space-y-6">
                  {/* Add Profile */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="New profile name..."
                      className="flex-1 input-primary"
                    />
                    <button
                      onClick={handleAddProfile}
                      disabled={!newProfileName.trim()}
                      className="btn-primary px-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Profile
                    </button>
                  </div>

                  {/* Profiles List */}
                  <div className="space-y-4">
                    {state.profiles.map(profile => (
                      <div key={profile.id} className="card p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{profile.avatar}</span>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {profile.name}
                            </h4>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingProfile(editingProfile === profile.id ? null : profile.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              <Edit className="w-4 h-4 text-neutral-500" />
                            </button>
                            {state.profiles.length > 1 && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete profile "${profile.name}"?`)) {
                                    dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20"
                              >
                                <Trash2 className="w-4 h-4 text-error-500" />
                              </button>
                            )}
                          </div>
                        </div>

                        {editingProfile === profile.id && (
                          <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                            {/* Task Competitor - Gold box with trophy */}
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                      Task Competitor
                                    </p>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
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

                            {/* PIN Protection - Blue box with padlock */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  PIN Protection
                                </label>
                              </div>
                              <input
                                type="text"
                                placeholder="Set PIN (4+ characters)"
                                value={profile.pin || ''}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_PROFILE',
                                  profileId: profile.id,
                                  updates: { pin: e.target.value || undefined }
                                })}
                                className="w-full input-primary"
                              />
                            </div>

                            {/* Permissions - Green box with shield */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                  <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </div>
                                <label className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Permissions
                                </label>
                              </div>
                              <div className="space-y-2">
                                <label className="flex items-center justify-between">
                                  <span className="text-sm text-green-700 dark:text-green-300">Can Create Tasks</span>
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
                                  <span className="text-sm text-green-700 dark:text-green-300">Can Edit Tasks</span>
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
                                  <span className="text-sm text-green-700 dark:text-green-300">Can Delete Tasks</span>
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

                            {/* Avatar Selection */}
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Avatar (or use text)
                              </label>
                              <div className="flex items-center space-x-2 mb-2">
                                <input
                                  type="text"
                                  value={profile.avatar}
                                  onChange={(e) => dispatch({
                                    type: 'UPDATE_PROFILE',
                                    profileId: profile.id,
                                    updates: { avatar: e.target.value }
                                  })}
                                  className="flex-1 input-primary"
                                  placeholder="Enter text or emoji"
                                />
                              </div>
                              <div className="grid grid-cols-10 gap-2">
                                {availableAvatars.map(avatar => (
                                  <button
                                    key={avatar}
                                    onClick={() => dispatch({
                                      type: 'UPDATE_PROFILE',
                                      profileId: profile.id,
                                      updates: { avatar }
                                    })}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                                      profile.avatar === avatar ? 'bg-primary-100 dark:bg-primary-900/20' : ''
                                    }`}
                                  >
                                    {avatar}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Analytics
                    </h4>
                    <button
                      onClick={() => setShowDetailedHistory(true)}
                      className="btn-primary"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Detailed History
                    </button>
                  </div>
                  
                  <HistoryAnalytics 
                    history={state.history}
                    tasks={state.tasks}
                    profiles={state.profiles}
                  />
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Settings Password - Yellow box with shield */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Settings Password
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Protect access to settings
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isSettingsPasswordSet && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400">Set</span>
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

                  {/* Profile Security Overview */}
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Profile Security
                    </h4>
                    <div className="space-y-3">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{profile.avatar}</span>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {profile.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {profile.pin ? (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                                <Lock className="w-3 h-3" />
                                <span className="text-xs">PIN Protected</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400 rounded-full">
                                <User className="w-3 h-3" />
                                <span className="text-xs">Open Access</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {!aiConfigured ? (
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center space-x-2 mb-4">
                          <input
                            type="checkbox"
                            checked={aiEnabled}
                            onChange={(e) => setAiEnabled(e.target.checked)}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Enable AI Assistant
                          </span>
                        </label>
                      </div>

                      {aiEnabled && (
                        <>
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

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Model
                            </label>
                            <input
                              type="text"
                              value={aiModel}
                              onChange={(e) => setAiModel(e.target.value)}
                              className="input-primary"
                              placeholder="e.g., gpt-4, claude-3-sonnet, gemini-pro"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              API Key
                            </label>
                            <input
                              type="password"
                              value={aiApiKey}
                              onChange={(e) => setAiApiKey(e.target.value)}
                              className="input-primary"
                              placeholder="Enter your API key..."
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleTestAI}
                              disabled={!aiApiKey}
                              className="btn-secondary"
                            >
                              Test Connection
                            </button>
                            <button
                              onClick={handleSaveAISettings}
                              disabled={!aiApiKey}
                              className="btn-primary"
                            >
                              Save Settings
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">
                                AI Assistant Configured
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Provider: {aiProvider} | Model: {aiModel}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAiConfigured(false)}
                            className="btn-secondary text-sm"
                          >
                            Reconfigure
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAIModal(true)}
                        className="btn-primary w-full"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Open AI Agent
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed History Modal */}
      {showDetailedHistory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailedHistory(false)} />
          
          <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Detailed Task History
              </h3>
              <button
                onClick={() => setShowDetailedHistory(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-3">
                {state.history.length === 0 ? (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                    No activity history yet
                  </p>
                ) : (
                  state.history.slice(0, 100).map(entry => (
                    <div key={entry.id} className="card p-4 bg-neutral-50 dark:bg-neutral-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {entry.taskTitle}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {entry.action} by {entry.profileName}
                          </p>
                          {entry.details && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                              {entry.details}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Query Modal */}
      {showAIModal && (
        <AIQueryModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          history={state.history}
          tasks={state.tasks}
          profiles={state.profiles}
          groups={state.groups}
          aiSettings={state.settings.ai}
        />
      )}

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
          onPasswordSet={passwordModalConfig.isSettingPassword ? onSetSettingsPassword : undefined}
          isSettingPassword={passwordModalConfig.isSettingPassword}
        />
      )}
    </>
  );
}