import React, { useState, useEffect } from 'react';
import { X, Settings, User, Palette, Shield, Brain, BarChart3, Users, Plus, Edit, Trash2, Eye, EyeOff, Lock, Save, TestTube, MessageSquare, Sparkles, TrendingUp, Target, Calendar, Bell, BellOff, Clock, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
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

type SettingsTab = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'analytics';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  currentSettings: any;
}

function AISettingsModal({ isOpen, onClose, onSave, currentSettings }: AISettingsModalProps) {
  const [provider, setProvider] = useState(currentSettings.provider || 'openai');
  const [model, setModel] = useState(currentSettings.model || 'gpt-4');
  const [apiKey, setApiKey] = useState(currentSettings.apiKey || '');
  const [enabled, setEnabled] = useState(currentSettings.enabled || false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const modelOptions = {
    openai: [
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
    gemini: [
      { value: 'gemini-pro', label: 'Gemini Pro' },
      { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
    ],
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    // Reset model to first option for new provider
    const firstModel = modelOptions[newProvider as keyof typeof modelOptions][0];
    setModel(firstModel.value);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Simple test query
      const testQuery = "Hello, this is a test. Please respond with 'Test successful'.";
      
      let response;
      switch (provider) {
        case 'openai':
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: testQuery }],
              max_tokens: 50,
            }),
          });
          break;
          
        case 'anthropic':
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model,
              max_tokens: 50,
              messages: [{ role: 'user', content: testQuery }],
            }),
          });
          break;
          
        case 'gemini':
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: testQuery }] }],
              generationConfig: { maxOutputTokens: 50 },
            }),
          });
          break;
          
        default:
          throw new Error('Unsupported provider');
      }

      if (response?.ok) {
        setTestResult({ success: true, message: 'Connection successful! API key is working.' });
      } else {
        const errorData = await response?.json();
        setTestResult({ 
          success: false, 
          message: errorData?.error?.message || `HTTP ${response?.status}: Connection failed` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      provider,
      model,
      apiKey: apiKey.trim(),
      enabled,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              AI Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="input-primary"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-primary"
            >
              {modelOptions[provider as keyof typeof modelOptions].map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="input-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Your API key is stored locally and never shared
            </p>
          </div>

          {/* Test Connection */}
          <div>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 text-white rounded-lg transition-colors duration-200"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
            
            {testResult && (
              <div className={`mt-2 p-3 rounded-lg ${
                testResult.success 
                  ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' 
                  : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
              }`}>
                <p className={`text-sm ${
                  testResult.success 
                    ? 'text-success-700 dark:text-success-400' 
                    : 'text-error-700 dark:text-error-400'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          {/* Enable AI */}
          <div>
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-all duration-200">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Enable AI Assistant
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Allow AI to analyze your task data and provide insights
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '',
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

  const availableIcons = getAvailableIcons();

  useEffect(() => {
    if (editingProfile) {
      const profile = state.profiles.find(p => p.id === editingProfile);
      if (profile) {
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
      }
    }
  }, [editingProfile, state.profiles]);

  useEffect(() => {
    if (editingGroup) {
      const group = state.groups.find(g => g.id === editingGroup);
      if (group) {
        setGroupForm({
          name: group.name,
          color: group.color,
          icon: group.icon,
          completedDisplayMode: group.completedDisplayMode,
          enableDueDates: group.enableDueDates,
          sortByDueDate: group.sortByDueDate,
          defaultNotifications: group.defaultNotifications || false,
        });
      }
    }
  }, [editingGroup, state.groups]);

  const handleSaveProfile = () => {
    if (!editingProfile) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: profileForm,
    });

    setEditingProfile(null);
  };

  const handleSaveGroup = () => {
    if (!editingGroup) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
      updates: groupForm,
    });

    setEditingGroup(null);
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

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleAddProfile = () => {
    const newProfile = {
      name: 'New Profile',
      avatar: '👤',
      color: '#6366F1',
      isActive: false,
      isTaskCompetitor: false,
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
    };

    dispatch({ type: 'ADD_PROFILE', profile: newProfile });
  };

  const handleAddGroup = () => {
    const newGroup = {
      name: 'New Group',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out' as const,
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };

    dispatch({ type: 'ADD_GROUP', group: newGroup });
  };

  const handleAISettingsSave = (settings: any) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: settings,
      },
    });
  };

  const handleSetPassword = (password: string) => {
    onSetSettingsPassword(password);
    setShowPasswordModal(false);
  };

  const formatMealTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'groups', label: 'Groups', icon: Palette },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] as const;

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
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <nav className="p-2 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
              <div className="p-4">
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      General Settings
                    </h3>

                    {/* Theme */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Appearance
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { theme: e.target.value as 'light' | 'dark' | 'system' }
                          })}
                          className="input-primary max-w-xs"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Notifications
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.enableNotifications}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { enableNotifications: e.target.checked }
                            })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Enable Notifications
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Get notified about due dates and task resets
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Display Options */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Display Options
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.showCompletedCount}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showCompletedCount: e.target.checked }
                            })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Show Completed Count
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Display task completion progress in header
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.showTopCollaborator}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showTopCollaborator: e.target.checked }
                            })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Show Top Collaborator
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Display collaboration rankings in trophy popup
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'groups' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task Groups
                      </h3>
                      <button
                        onClick={handleAddGroup}
                        className="btn-primary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Group
                      </button>
                    </div>

                    <div className="space-y-3">
                      {state.groups.map(group => {
                        const IconComponent = getIconComponent(group.icon);
                        const isEditing = editingGroup === group.id;

                        return (
                          <div key={group.id} className="card p-4">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={groupForm.name}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                      className="input-primary text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Color
                                    </label>
                                    <input
                                      type="color"
                                      value={groupForm.color}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                                      className="w-full h-8 rounded border border-neutral-300 dark:border-neutral-600"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Icon
                                  </label>
                                  <div className="grid grid-cols-8 gap-2">
                                    {availableIcons.map(({ name, component: Icon }) => (
                                      <button
                                        key={name}
                                        type="button"
                                        onClick={() => setGroupForm(prev => ({ ...prev, icon: name }))}
                                        className={`p-2 rounded-lg border transition-colors duration-200 ${
                                          groupForm.icon === name
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                        }`}
                                      >
                                        <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Completed Display Mode
                                  </label>
                                  <select
                                    value={groupForm.completedDisplayMode}
                                    onChange={(e) => setGroupForm(prev => ({ 
                                      ...prev, 
                                      completedDisplayMode: e.target.value as any 
                                    }))}
                                    className="input-primary text-sm"
                                  >
                                    <option value="grey-out">Grey Out</option>
                                    <option value="grey-drop">Grey & Drop Down</option>
                                    <option value="separate-completed">Separate Section</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={groupForm.enableDueDates}
                                      onChange={(e) => setGroupForm(prev => ({ 
                                        ...prev, 
                                        enableDueDates: e.target.checked,
                                        sortByDueDate: e.target.checked ? prev.sortByDueDate : false
                                      }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                      Due Dates
                                    </span>
                                  </label>

                                  {groupForm.enableDueDates && (
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.sortByDueDate}
                                        onChange={(e) => setGroupForm(prev => ({ 
                                          ...prev, 
                                          sortByDueDate: e.target.checked 
                                        }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        Sort by Due Date
                                      </span>
                                    </label>
                                  )}
                                </div>

                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={groupForm.defaultNotifications}
                                    onChange={(e) => setGroupForm(prev => ({ 
                                      ...prev, 
                                      defaultNotifications: e.target.checked 
                                    }))}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <div>
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                      Default Notifications
                                    </span>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      New tasks in this group will have notifications enabled by default
                                    </p>
                                  </div>
                                </label>

                                <div className="flex space-x-2 pt-2">
                                  <button
                                    onClick={() => setEditingGroup(null)}
                                    className="btn-secondary text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveGroup}
                                    className="btn-primary text-sm"
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                  <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                  <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                      {group.name}
                                    </h4>
                                    <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                                      <span>{group.completedDisplayMode.replace('-', ' ')}</span>
                                      {group.enableDueDates && (
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>Due dates</span>
                                        </span>
                                      )}
                                      {group.defaultNotifications && (
                                        <span className="flex items-center space-x-1">
                                          <Bell className="w-3 h-3" />
                                          <span>Notifications</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setEditingGroup(group.id)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  >
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  >
                                    <Trash2 className="w-4 h-4 text-error-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'profiles' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                      <button
                        onClick={handleAddProfile}
                        className="btn-primary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </button>
                    </div>

                    <div className="space-y-3">
                      {state.profiles.map(profile => {
                        const isEditing = editingProfile === profile.id;

                        return (
                          <div key={profile.id} className="card p-4">
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={profileForm.name}
                                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                      className="input-primary text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                      Avatar
                                    </label>
                                    <input
                                      type="text"
                                      value={profileForm.avatar}
                                      onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                                      className="input-primary text-sm"
                                      placeholder="👤"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="color"
                                    value={profileForm.color}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-20 h-8 rounded border border-neutral-300 dark:border-neutral-600"
                                  />
                                </div>

                                {/* PIN Setting */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    PIN Protection
                                  </label>
                                  <input
                                    type="password"
                                    value={profileForm.pin}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                                    className="input-primary text-sm max-w-xs"
                                    placeholder="Enter PIN (leave empty to disable)"
                                  />
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Set a PIN to protect this profile from unauthorized access
                                  </p>
                                </div>

                                {/* Meal Times */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Meal Times
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
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
                                        className="input-primary text-sm"
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
                                        className="input-primary text-sm"
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
                                        className="input-primary text-sm"
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
                                        className="input-primary text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Permissions
                                  </label>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canCreateTasks}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          permissions: { ...prev.permissions, canCreateTasks: e.target.checked }
                                        }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        Can Create Tasks
                                      </span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canEditTasks}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          permissions: { ...prev.permissions, canEditTasks: e.target.checked }
                                        }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        Can Edit Tasks
                                      </span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canDeleteTasks}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          permissions: { ...prev.permissions, canDeleteTasks: e.target.checked }
                                        }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        Can Delete Tasks
                                      </span>
                                    </label>
                                  </div>
                                </div>

                                {/* Task Competitor */}
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.isTaskCompetitor}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <div>
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                      Task Competitor
                                    </span>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      Participate in task completion rankings
                                    </p>
                                  </div>
                                </label>

                                <div className="flex space-x-2 pt-2">
                                  <button
                                    onClick={() => setEditingProfile(null)}
                                    className="btn-secondary text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveProfile}
                                    className="btn-primary text-sm"
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                                    {profile.avatar}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {profile.name}
                                      </h4>
                                      {profile.id === state.activeProfileId && (
                                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                                          Active
                                        </span>
                                      )}
                                      {profile.pin && (
                                        <Lock className="w-3 h-3 text-warning-500" title="PIN Protected" />
                                      )}
                                      {profile.isTaskCompetitor && (
                                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                                          Competitor
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                                      <span>🌅 {formatMealTime(profile.mealTimes?.breakfast || '07:00')}</span>
                                      <span>☀️ {formatMealTime(profile.mealTimes?.lunch || '12:00')}</span>
                                      <span>🌆 {formatMealTime(profile.mealTimes?.dinner || '18:00')}</span>
                                      <span>🌙 {formatMealTime(profile.mealTimes?.nightcap || '21:00')}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setEditingProfile(profile.id)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  >
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                  </button>
                                  {state.profiles.length > 1 && (
                                    <button
                                      onClick={() => handleDeleteProfile(profile.id)}
                                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                    >
                                      <Trash2 className="w-4 h-4 text-error-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Security Settings
                    </h3>

                    {/* Settings Password */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Settings Protection
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            Settings Password
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {isSettingsPasswordSet 
                              ? 'Password protection is enabled for settings access'
                              : 'No password protection set for settings'
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="btn-primary text-sm"
                        >
                          {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                        </button>
                      </div>
                    </div>

                    {/* Profile Security Info */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Profile Security
                      </h4>
                      <div className="space-y-3">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Individual profile PIN protection can be configured in the Profiles section.
                        </p>
                        
                        <div className="space-y-2">
                          {state.profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{profile.avatar}</span>
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  {profile.name}
                                </span>
                                {profile.pin && (
                                  <Lock className="w-3 h-3 text-warning-500" title="PIN Protected" />
                                )}
                              </div>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {profile.pin ? 'PIN Protected' : 'No PIN'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        AI Assistant
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowAISettings(true)}
                          className="btn-secondary text-sm"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </button>
                        <button
                          onClick={() => setShowAIQuery(true)}
                          disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
                          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Ask AI
                        </button>
                      </div>
                    </div>

                    {/* AI Status */}
                    <div className="card p-4">
                      <div className="flex items-center space-x-3">
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
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                            AI Assistant Status
                          </h4>
                          <p className={`text-sm ${
                            state.settings.ai.enabled && state.settings.ai.apiKey
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            {state.settings.ai.enabled && state.settings.ai.apiKey
                              ? `Ready (${state.settings.ai.provider} - ${state.settings.ai.model})`
                              : 'Not configured'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              Task Analysis
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Analyze completion patterns
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Get insights about your task completion habits, productivity trends, and areas for improvement.
                        </p>
                      </div>

                      <div className="card p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              Smart Recommendations
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Personalized suggestions
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Receive AI-powered recommendations for optimizing your task management and productivity.
                        </p>
                      </div>
                    </div>

                    {/* Quick Questions */}
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
                              className="p-3 text-left bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                            >
                              <div className="flex items-start space-x-2">
                                <Target className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {question}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        onSave={handleAISettingsSave}
        currentSettings={state.settings.ai}
      />

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
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleSetPassword}
        onPasswordSet={handleSetPassword}
        title={isSettingsPasswordSet ? 'Change Settings Password' : 'Set Settings Password'}
        description={isSettingsPasswordSet 
          ? 'Enter a new password to protect settings access.'
          : 'Set a password to protect access to settings.'
        }
        placeholder="Enter new password..."
        isSettingPassword={true}
      />
    </>
  );
}