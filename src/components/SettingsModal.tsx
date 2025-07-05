import React, { useState, useRef } from 'react';
import { X, Save, Download, Upload, AlertTriangle, Trash2, Plus, Edit2, Users, Brain, Bell, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
    isSettingPassword?: boolean;
  } | null>(null);
  const [showTaskIconsSection, setShowTaskIconsSection] = useState(false);
  const [taskIconsStatus, setTaskIconsStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [taskIconsMessage, setTaskIconsMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group management state
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');

  // Profile management state
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfilePermissions, setNewProfilePermissions] = useState({
    canEditTasks: true,
    canCreateTasks: true,
    canDeleteTasks: true,
  });
  const [newProfileIsCompetitor, setNewProfileIsCompetitor] = useState(false);
  const [newProfileMealTimes, setNewProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });

  const availableIcons = getAvailableIcons();

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
        
        // Validate the imported data structure
        if (!importedData.tasks || !importedData.groups || !importedData.profiles) {
          alert('Invalid data format. Please ensure you\'re importing a valid FocusFlow backup file.');
          return;
        }

        // Show confirmation dialog
        const confirmImport = window.confirm(
          'This will replace all current data with the imported data. This action cannot be undone. Are you sure you want to continue?'
        );

        if (confirmImport) {
          dispatch({ type: 'LOAD_STATE', state: importedData });
          alert('Data imported successfully!');
          onClose();
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    dispatch({
      type: 'ADD_GROUP',
      group: {
        name: newGroupName.trim(),
        color: newGroupColor,
        icon: newGroupIcon,
        completedDisplayMode: 'grey-out',
        isCollapsed: false,
        enableDueDates: false,
        sortByDueDate: false,
        defaultNotifications: false,
      },
    });

    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
  };

  const handleUpdateGroup = () => {
    if (!editingGroup || !newGroupName.trim()) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup.id,
      updates: {
        name: newGroupName.trim(),
        color: newGroupColor,
        icon: newGroupIcon,
      },
    });

    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
  };

  const handleEditGroup = (group: TaskGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupColor(group.color);
    setNewGroupIcon(group.icon);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    const tasksInGroup = state.tasks.filter(t => t.groupId === groupId);
    
    const confirmMessage = tasksInGroup.length > 0
      ? `Are you sure you want to delete "${group?.name}"? This will also delete ${tasksInGroup.length} task(s) in this group.`
      : `Are you sure you want to delete "${group?.name}"?`;

    if (window.confirm(confirmMessage)) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;

    dispatch({
      type: 'ADD_PROFILE',
      profile: {
        name: newProfileName.trim(),
        avatar: newProfileAvatar,
        color: newProfileColor,
        isActive: true,
        isTaskCompetitor: newProfileIsCompetitor,
        pin: newProfilePin.trim() || undefined,
        permissions: newProfilePermissions,
        mealTimes: newProfileMealTimes,
      },
    });

    // Reset form
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfilePin('');
    setNewProfilePermissions({
      canEditTasks: true,
      canCreateTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(false);
    setNewProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const handleUpdateProfile = () => {
    if (!editingProfile || !newProfileName.trim()) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile.id,
      updates: {
        name: newProfileName.trim(),
        avatar: newProfileAvatar,
        color: newProfileColor,
        isTaskCompetitor: newProfileIsCompetitor,
        pin: newProfilePin.trim() || undefined,
        permissions: newProfilePermissions,
        mealTimes: newProfileMealTimes,
      },
    });

    // Reset form
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfilePin('');
    setNewProfilePermissions({
      canEditTasks: true,
      canCreateTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(false);
    setNewProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setNewProfileName(profile.name);
    setNewProfileAvatar(profile.avatar);
    setNewProfileColor(profile.color);
    setNewProfilePin(profile.pin || '');
    setNewProfilePermissions(profile.permissions || {
      canEditTasks: true,
      canCreateTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(profile.isTaskCompetitor || false);
    setNewProfileMealTimes(profile.mealTimes || {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile. At least one profile must exist.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${profile?.name}"?`)) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings. This will be required every time someone tries to access the settings.',
      onSuccess: () => {
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
      isSettingPassword: true,
    });
    setShowPasswordModal(true);
  };

  const handleRemoveSettingsPassword = () => {
    if (window.confirm('Are you sure you want to remove the settings password? Anyone will be able to access settings without authentication.')) {
      dispatch({
        type: 'UPDATE_SETTINGS',
        updates: { settingsPassword: undefined }
      });
    }
  };

  const handleGenerateTaskIcons = async () => {
    if (!state.settings.ai.enabled || !state.settings.ai.apiKey) {
      setTaskIconsMessage('AI must be configured first. Please set up AI in the AI Assistant section.');
      setTaskIconsStatus('error');
      return;
    }

    setTaskIconsStatus('generating');
    setTaskIconsMessage('Generating task icons with AI...');

    try {
      const response = await fetch('/api/generate-task-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: state.tasks,
          groups: state.groups,
          aiSettings: state.settings.ai,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate task icons');
      }

      const taskIcons = await response.json();
      const iconCount = Object.keys(taskIcons).length;
      
      setTaskIconsStatus('success');
      setTaskIconsMessage(`Successfully generated icons for ${iconCount} tasks! Icons will appear in the Kiosk Portal.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setTaskIconsStatus('idle');
        setTaskIconsMessage('');
      }, 5000);

    } catch (error) {
      console.error('Error generating task icons:', error);
      setTaskIconsStatus('error');
      setTaskIconsMessage('Failed to generate task icons. Please check your AI configuration and try again.');
      
      // Clear error message after 10 seconds
      setTimeout(() => {
        setTaskIconsStatus('idle');
        setTaskIconsMessage('');
      }, 10000);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Save },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'data', label: 'Data', icon: Download },
    { id: 'analytics', label: 'Analytics', icon: Brain },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
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

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
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
                        <select
                          value={state.settings.theme}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { theme: e.target.value as any }
                          })}
                          className="input-primary"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Show Completed Count */}
                      <div>
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
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Show completed count in header
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Display task completion progress in the header
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Enable Notifications */}
                      <div>
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
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Enable notifications
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Show browser notifications for due dates and task resets
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Show Top Collaborator */}
                      <div>
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
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Show Top Collaborator
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Display collaboration rankings in the trophy modal
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Settings Password */}
                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                          Settings Protection
                        </h4>
                        
                        {isSettingsPasswordSet ? (
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm text-green-700 dark:text-green-400">
                                Settings are password protected
                              </span>
                            </div>
                            <button
                              onClick={handleRemoveSettingsPassword}
                              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                            >
                              Remove Password
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm text-amber-700 dark:text-amber-400">
                                Settings are not protected
                              </span>
                            </div>
                            <button
                              onClick={handleSetSettingsPassword}
                              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                            >
                              Set Password
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Kiosk Task Icons Section */}
                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => setShowTaskIconsSection(!showTaskIconsSection)}
                          className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Sparkles className="w-5 h-5 text-primary-500" />
                            <div className="text-left">
                              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Kiosk Task Icons
                              </h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Generate AI-powered icons for child-friendly task recognition
                              </p>
                            </div>
                          </div>
                          <div className="text-neutral-400">
                            {showTaskIconsSection ? '−' : '+'}
                          </div>
                        </button>

                        {showTaskIconsSection && (
                          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg space-y-4">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                              <p className="mb-2">
                                Generate emoji icons for tasks to help young children understand what each task is about in the Kiosk Portal.
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>AI analyzes task names and generates 2 relevant emoji icons per task</li>
                                <li>Icons are designed for children ages 4-10</li>
                                <li>Icons appear on both sides of task names in the Kiosk Portal</li>
                                <li>Requires AI to be configured in the AI Assistant section</li>
                              </ul>
                            </div>

                            <button
                              onClick={handleGenerateTaskIcons}
                              disabled={taskIconsStatus === 'generating' || !state.settings.ai.enabled}
                              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-colors duration-200 ${
                                taskIconsStatus === 'generating' || !state.settings.ai.enabled
                                  ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
                                  : 'bg-primary-500 hover:bg-primary-600 text-white'
                              }`}
                            >
                              {taskIconsStatus === 'generating' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                                  <span>Generating Icons...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  <span>Generate Task Icons</span>
                                </>
                              )}
                            </button>

                            {taskIconsMessage && (
                              <div className={`p-3 rounded-lg text-sm ${
                                taskIconsStatus === 'success'
                                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                  : taskIconsStatus === 'error'
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                              }`}>
                                {taskIconsMessage}
                              </div>
                            )}

                            {!state.settings.ai.enabled && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                  AI must be configured first. Please set up your AI provider and API key in the AI Assistant section.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Task Groups
                    </h3>

                    {/* Add/Edit Group Form */}
                    <div className="card p-4 mb-6">
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name"
                            className="input-primary"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Color
                          </label>
                          <input
                            type="color"
                            value={newGroupColor}
                            onChange={(e) => setNewGroupColor(e.target.value)}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Icon
                          </label>
                          <select
                            value={newGroupIcon}
                            onChange={(e) => setNewGroupIcon(e.target.value)}
                            className="input-primary"
                          >
                            {availableIcons.map(icon => (
                              <option key={icon.name} value={icon.name}>
                                {icon.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                          disabled={!newGroupName.trim()}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editingGroup ? 'Update Group' : 'Add Group'}
                        </button>
                        
                        {editingGroup && (
                          <button
                            onClick={() => {
                              setEditingGroup(null);
                              setNewGroupName('');
                              setNewGroupColor('#6366F1');
                              setNewGroupIcon('User');
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Groups List */}
                    <div className="space-y-3">
                      {state.groups.map(group => {
                        const IconComponent = getIconComponent(group.icon);
                        const tasksCount = state.tasks.filter(t => t.groupId === group.id).length;
                        
                        return (
                          <div key={group.id} className="card p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {tasksCount} task{tasksCount !== 1 ? 's' : ''}
                                    {group.enableDueDates && ' • Due dates enabled'}
                                    {group.defaultNotifications && ' • Notifications enabled'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditGroup(group)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Edit2 className="w-4 h-4 text-neutral-500" />
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
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      User Profiles
                    </h3>

                    {/* Add/Edit Profile Form */}
                    <div className="card p-4 mb-6">
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Avatar (Emoji)
                            </label>
                            <input
                              type="text"
                              value={newProfileAvatar}
                              onChange={(e) => setNewProfileAvatar(e.target.value)}
                              placeholder="👤"
                              className="input-primary"
                              maxLength={2}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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

                        {/* Meal Times */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Meal Times
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(newProfileMealTimes).map(([meal, time]) => (
                              <div key={meal}>
                                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
                                  {meal}
                                </label>
                                <input
                                  type="time"
                                  value={time}
                                  onChange={(e) => setNewProfileMealTimes(prev => ({
                                    ...prev,
                                    [meal]: e.target.value
                                  }))}
                                  className="input-primary text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Permissions */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Permissions
                          </label>
                          <div className="space-y-2">
                            {Object.entries(newProfilePermissions).map(([permission, enabled]) => (
                              <label key={permission} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  onChange={(e) => setNewProfilePermissions(prev => ({
                                    ...prev,
                                    [permission]: e.target.checked
                                  }))}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {permission === 'canCreateTasks' ? 'Can create tasks' :
                                   permission === 'canEditTasks' ? 'Can edit tasks' :
                                   permission === 'canDeleteTasks' ? 'Can delete tasks' : permission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Task Competitor */}
                        <div>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={newProfileIsCompetitor}
                              onChange={(e) => setNewProfileIsCompetitor(e.target.checked)}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Task Competitor
                              </span>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Participate in task completion rankings
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={editingProfile ? handleUpdateProfile : handleAddProfile}
                          disabled={!newProfileName.trim()}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editingProfile ? 'Update Profile' : 'Add Profile'}
                        </button>
                        
                        {editingProfile && (
                          <button
                            onClick={() => {
                              setEditingProfile(null);
                              setNewProfileName('');
                              setNewProfileAvatar('👤');
                              setNewProfileColor('#6366F1');
                              setNewProfilePin('');
                              setNewProfilePermissions({
                                canEditTasks: true,
                                canCreateTasks: true,
                                canDeleteTasks: true,
                              });
                              setNewProfileIsCompetitor(false);
                              setNewProfileMealTimes({
                                breakfast: '07:00',
                                lunch: '12:00',
                                dinner: '18:00',
                                nightcap: '21:00',
                              });
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profiles List */}
                    <div className="space-y-3">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">{profile.avatar}</div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {profile.name}
                                  </h4>
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 text-xs rounded-full">
                                      PIN Protected
                                    </span>
                                  )}
                                  {profile.isTaskCompetitor && (
                                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                                      Competitor
                                    </span>
                                  )}
                                  {profile.id === state.activeProfileId && (
                                    <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {profile.permissions?.canCreateTasks ? 'Can create' : 'Cannot create'} • 
                                  {profile.permissions?.canEditTasks ? ' Can edit' : ' Cannot edit'} • 
                                  {profile.permissions?.canDeleteTasks ? ' Can delete' : ' Cannot delete'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditProfile(profile)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                              >
                                <Edit2 className="w-4 h-4 text-neutral-500" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteProfile(profile.id)}
                                disabled={state.profiles.length <= 1}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4 text-error-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <div>
                        <label className="flex items-center space-x-3">
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
                          <div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Enable AI Assistant
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Get insights about your task patterns and productivity
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* AI Provider */}
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

                      {/* Model Selection */}
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

                      {/* API Key */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          API Key
                        </label>
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
                          className="input-primary"
                        />
                      </div>

                      {/* AI Query Button */}
                      {state.settings.ai.enabled && state.settings.ai.apiKey && (
                        <div className="pt-4">
                          <button
                            onClick={() => setShowAIModal(true)}
                            className="btn-primary"
                          >
                            <Brain className="w-4 h-4 mr-2" />
                            Open AI Assistant
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Data Management
                    </h3>

                    <div className="space-y-4">
                      {/* Export Data */}
                      <div className="card p-4">
                        <div className="flex items-start space-x-3">
                          <Download className="w-5 h-5 text-primary-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                              Export Data
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                              Download all your tasks, groups, profiles, and settings as a JSON file.
                            </p>
                            <button
                              onClick={handleExportData}
                              className="btn-primary"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export Data
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Import Data */}
                      <div className="card p-4">
                        <div className="flex items-start space-x-3">
                          <Upload className="w-5 h-5 text-warning-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                              Import Data
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                              Replace all current data with data from a backup file.
                            </p>
                            
                            {/* FIXED: Import Data Warning with proper dark mode styling */}
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-3">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Warning: This will replace all current data
                                  </p>
                                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    Make sure to export your current data first if you want to keep it.
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".json"
                              onChange={handleImportData}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-secondary"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import Data
                            </button>
                          </div>
                        </div>
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

      {/* AI Query Modal */}
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

      {/* Password Modal */}
      {passwordModalConfig && (
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