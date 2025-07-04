import React, { useState } from 'react';
import { X, Settings, Users, BarChart3, Brain, Shield, History, Eye, EyeOff, Plus, Edit, Trash2, Save, Ambulance as Cancel, GripVertical, Bell, Calendar, Clock, TestTube, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
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

type TabType = 'general' | 'groups' | 'profiles' | 'analytics' | 'ai' | 'security';

const availableAvatars = [
  '👤', '😊', '👨', '👩', '😎', '🤓', '😄', '🙂',
  '👶', '👴', '🧑', '👱', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🎓'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');
  const [tempSettings, setTempSettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form states for editing
  const [groupForm, setGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as const,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

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

  const isViewOnlyMode = state.settings.viewOnlyMode;

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'groups' as const, label: 'Groups', icon: BarChart3 },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'analytics' as const, label: 'History', icon: History },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  const handleAddGroup = () => {
    if (!groupForm.name.trim()) return;

    dispatch({
      type: 'ADD_GROUP',
      group: {
        ...groupForm,
        name: groupForm.name.trim(),
      },
    });

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

  const handleEditGroup = (group: TaskGroup) => {
    setEditingGroup(group.id);
    setGroupForm({
      name: group.name,
      color: group.color,
      icon: group.icon,
      completedDisplayMode: group.completedDisplayMode,
      enableDueDates: group.enableDueDates,
      sortByDueDate: group.sortByDueDate || false,
      defaultNotifications: group.defaultNotifications || false,
    });
  };

  const handleSaveGroup = () => {
    if (!editingGroup || !groupForm.name.trim()) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
      updates: {
        ...groupForm,
        name: groupForm.name.trim(),
      },
    });

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

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleAddProfile = () => {
    if (!profileForm.name.trim()) return;

    dispatch({
      type: 'ADD_PROFILE',
      profile: {
        ...profileForm,
        name: profileForm.name.trim(),
        isActive: true,
      },
    });

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

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile.id);
    setProfileForm({
      name: profile.name,
      color: profile.color,
      avatar: profile.avatar,
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
  };

  const handleSaveProfile = () => {
    if (!editingProfile || !profileForm.name.trim()) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: {
        ...profileForm,
        name: profileForm.name.trim(),
        pin: profileForm.pin.trim() || undefined,
      },
    });

    setEditingProfile(null);
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

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }

    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleDisableViewOnlyMode = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { viewOnlyMode: false }
    });
  };

  const handleSetPassword = () => {
    setPasswordModalType('set');
    setShowPasswordModal(true);
  };

  const handleRemovePassword = () => {
    setPasswordModalType('remove');
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = (password?: string) => {
    if (passwordModalType === 'set' && password) {
      onSetSettingsPassword(password);
    } else if (passwordModalType === 'remove') {
      onSetSettingsPassword('');
    }
    setShowPasswordModal(false);
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${tempSettings.apiKey}`,
        },
      });

      if (testResponse.ok) {
        setTestResult('✅ Connection successful! API key is valid.');
      } else {
        setTestResult('❌ Connection failed: Invalid API key or insufficient permissions.');
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { ai: tempSettings }
    });
    setShowAISettings(false);
    setTestResult(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* View Only Mode Toggle */}
            {isViewOnlyMode && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">View Only Mode Active</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">You can view tasks but cannot modify them</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisableViewOnlyMode}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Disable View Only</span>
                  </button>
                </div>
              </div>
            )}

            {/* Theme Setting */}
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

            {/* Notifications */}
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
                    Enable Notifications
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Get notified about due dates and task resets
                  </p>
                </div>
              </label>
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
                    Show Completed Count in Header
                  </span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Display task completion progress in the header
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
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Display collaboration rankings in the trophy view
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="space-y-6">
            {/* Add New Group */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Add New Group
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Group name..."
                    className="input-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Color
                    </label>
                    <input
                      type="color"
                      value={groupForm.color}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Icon
                    </label>
                    <select
                      value={groupForm.icon}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="input-primary"
                    >
                      {getAvailableIcons().map(({ name }) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Completed Display Mode
                  </label>
                  <select
                    value={groupForm.completedDisplayMode}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                    className="input-primary"
                  >
                    <option value="grey-out">Grey Out</option>
                    <option value="grey-drop">Grey Out + Drop Down</option>
                    <option value="separate-completed">Separate Section</option>
                  </select>
                </div>

                {/* Enable Due Dates */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={groupForm.enableDueDates}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Enable Due Dates
                      </span>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Allow tasks in this group to have due dates
                      </p>
                    </div>
                  </label>
                </div>

                {/* Sort by Due Date - Only show when due dates are enabled */}
                {groupForm.enableDueDates && (
                  <div className="ml-6">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={groupForm.sortByDueDate}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          Sort tasks by next Due Date
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Tasks with earlier due dates appear first
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Default Notifications */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={groupForm.defaultNotifications}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Default Notifications
                      </span>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        New tasks in this group will have notifications enabled by default
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleAddGroup}
                  disabled={!groupForm.name.trim()}
                  className="btn-primary w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </button>
              </div>
            </div>

            {/* Existing Groups */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.groups.map(group => {
                const IconComponent = getIconComponent(group.icon);
                const isEditing = editingGroup === group.id;

                return (
                  <div key={group.id} className="card p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                            className="input-primary"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <input
                              type="color"
                              value={groupForm.color}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                              className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Icon
                            </label>
                            <select
                              value={groupForm.icon}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, icon: e.target.value }))}
                              className="input-primary"
                            >
                              {getAvailableIcons().map(({ name }) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Completed Display Mode
                          </label>
                          <select
                            value={groupForm.completedDisplayMode}
                            onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                            className="input-primary"
                          >
                            <option value="grey-out">Grey Out</option>
                            <option value="grey-drop">Grey Out + Drop Down</option>
                            <option value="separate-completed">Separate Section</option>
                          </select>
                        </div>

                        {/* Enable Due Dates */}
                        <div>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={groupForm.enableDueDates}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Enable Due Dates
                              </span>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                Allow tasks in this group to have due dates
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Sort by Due Date - Only show when due dates are enabled */}
                        {groupForm.enableDueDates && (
                          <div className="ml-6">
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={groupForm.sortByDueDate}
                                onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  Sort tasks by next Due Date
                                </span>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                  Tasks with earlier due dates appear first
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

                        {/* Default Notifications */}
                        <div>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={groupForm.defaultNotifications}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Default Notifications
                              </span>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                New tasks in this group will have notifications enabled by default
                              </p>
                            </div>
                          </label>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveGroup}
                            className="btn-primary flex-1"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="btn-secondary flex-1"
                          >
                            <Cancel className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-4 h-4 text-neutral-400" />
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {group.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <span>{group.completedDisplayMode}</span>
                              {group.enableDueDates && (
                                <>
                                  <span>•</span>
                                  <Calendar className="w-3 h-3" />
                                  <span>Due dates</span>
                                </>
                              )}
                              {group.sortByDueDate && (
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>Sorted</span>
                                </>
                              )}
                              {group.defaultNotifications && (
                                <>
                                  <span>•</span>
                                  <Bell className="w-3 h-3" />
                                  <span>Notifications</span>
                                </>
                              )}
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
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
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
        );

      case 'profiles':
        return (
          <div className="space-y-6">
            {/* Add New Profile */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Add New Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Profile name..."
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Avatar
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {availableAvatars.map(avatar => (
                      <button
                        key={avatar}
                        onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-colors duration-200 ${
                          profileForm.avatar === avatar
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={profileForm.color}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={profileForm.isTaskCompetitor}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Task Competitor
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    PIN Protection
                  </label>
                  <input
                    type="password"
                    value={profileForm.pin}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                    placeholder="Optional PIN..."
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profileForm.permissions.canCreateTasks}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canCreateTasks: e.target.checked }
                        }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">Can create tasks</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profileForm.permissions.canEditTasks}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canEditTasks: e.target.checked }
                        }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">Can edit tasks</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profileForm.permissions.canDeleteTasks}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canDeleteTasks: e.target.checked }
                        }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">Can delete tasks</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Meal Times
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
                      <input
                        type="time"
                        value={profileForm.mealTimes.breakfast}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          mealTimes: { ...prev.mealTimes, breakfast: e.target.value }
                        }))}
                        className="input-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
                      <input
                        type="time"
                        value={profileForm.mealTimes.lunch}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          mealTimes: { ...prev.mealTimes, lunch: e.target.value }
                        }))}
                        className="input-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
                      <input
                        type="time"
                        value={profileForm.mealTimes.dinner}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          mealTimes: { ...prev.mealTimes, dinner: e.target.value }
                        }))}
                        className="input-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
                      <input
                        type="time"
                        value={profileForm.mealTimes.nightcap}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          mealTimes: { ...prev.mealTimes, nightcap: e.target.value }
                        }))}
                        className="input-primary"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddProfile}
                  disabled={!profileForm.name.trim()}
                  className="btn-primary w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Profile
                </button>
              </div>
            </div>

            {/* Existing Profiles */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.profiles.map(profile => {
                const isEditing = editingProfile === profile.id;

                return (
                  <div key={profile.id} className="card p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            className="input-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Avatar
                          </label>
                          <div className="grid grid-cols-8 gap-2">
                            {availableAvatars.map(avatar => (
                              <button
                                key={avatar}
                                onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-colors duration-200 ${
                                  profileForm.avatar === avatar
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                                }`}
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Color
                          </label>
                          <input
                            type="color"
                            value={profileForm.color}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                          />
                        </div>

                        <div>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={profileForm.isTaskCompetitor}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Task Competitor
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            PIN Protection
                          </label>
                          <input
                            type="password"
                            value={profileForm.pin}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                            placeholder="Optional PIN..."
                            className="input-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Permissions
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={profileForm.permissions.canCreateTasks}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canCreateTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-900 dark:text-neutral-100">Can create tasks</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={profileForm.permissions.canEditTasks}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canEditTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-900 dark:text-neutral-100">Can edit tasks</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={profileForm.permissions.canDeleteTasks}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, canDeleteTasks: e.target.checked }
                                }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-neutral-900 dark:text-neutral-100">Can delete tasks</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Meal Times
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
                              <input
                                type="time"
                                value={profileForm.mealTimes.breakfast}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, breakfast: e.target.value }
                                }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
                              <input
                                type="time"
                                value={profileForm.mealTimes.lunch}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, lunch: e.target.value }
                                }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
                              <input
                                type="time"
                                value={profileForm.mealTimes.dinner}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, dinner: e.target.value }
                                }))}
                                className="input-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
                              <input
                                type="time"
                                value={profileForm.mealTimes.nightcap}
                                onChange={(e) => setProfileForm(prev => ({
                                  ...prev,
                                  mealTimes: { ...prev.mealTimes, nightcap: e.target.value }
                                }))}
                                className="input-primary"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveProfile}
                            className="btn-primary flex-1"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProfile(null)}
                            className="btn-secondary flex-1"
                          >
                            <Cancel className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-4 h-4 text-neutral-400" />
                          <span className="text-lg">{profile.avatar}</span>
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {profile.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {profile.isTaskCompetitor && <span>Competitor</span>}
                              {profile.pin && (
                                <>
                                  {profile.isTaskCompetitor && <span>•</span>}
                                  <span>PIN Protected</span>
                                </>
                              )}
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
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
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
        );

      case 'analytics':
        return (
          <div className="max-h-96 overflow-y-auto">
            <HistoryAnalytics 
              history={state.history} 
              tasks={state.tasks} 
              profiles={state.profiles} 
            />
          </div>
        );

      case 'ai':
        if (!state.settings.ai.enabled || !state.settings.ai.apiKey) {
          return (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                AI Assistant Not Configured
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                Configure your AI settings to get insights about your task patterns and productivity.
              </p>
              <button 
                onClick={() => setShowAISettings(true)}
                className="btn-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure AI Settings
              </button>
            </div>
          );
        }

        return (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-primary-500" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              AI Task Assistant
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              Get insights about your task patterns, productivity trends, and personalized recommendations.
            </p>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setShowAIQuery(true)}
                className="btn-primary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </button>
              <button 
                onClick={() => setShowAISettings(true)}
                className="btn-secondary"
              >
                <Settings className="w-4 h-4 mr-2" />
                AI Settings
              </button>
            </div>
          </div>
        );

      case 'security':
        const protectedProfiles = state.profiles.filter(p => p.pin && p.pin.trim().length > 0);
        
        return (
          <div className="space-y-6">
            {/* Settings Password */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Settings Password
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isSettingsPasswordSet 
                      ? 'Settings are protected with a password'
                      : 'No password protection for settings'
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  {isSettingsPasswordSet ? (
                    <button
                      onClick={handleRemovePassword}
                      className="btn-secondary"
                    >
                      Remove Password
                    </button>
                  ) : (
                    <button
                      onClick={handleSetPassword}
                      className="btn-primary"
                    >
                      Set Password
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Security */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Profile Security
              </h3>
              {protectedProfiles.length > 0 ? (
                <div className="space-y-3">
                  {protectedProfiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{profile.avatar}</span>
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                            {profile.name}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            PIN Protected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Set active profile and disable view only mode
                          dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profile.id });
                          dispatch({ type: 'UPDATE_SETTINGS', updates: { viewOnlyMode: false } });
                          onClose();
                        }}
                        className="btn-secondary text-sm"
                      >
                        Bypass PIN
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 dark:text-neutral-400">
                  No profiles have PIN protection enabled.
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {/* Show label on larger screens, hide on smaller screens */}
                      <span className="hidden sm:block">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
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
        onUpdateSettings={(updates) => dispatch({
          type: 'UPDATE_SETTINGS',
          updates: { ai: { ...state.settings.ai, ...updates } }
        })}
      />

      {/* AI Settings Modal */}
      {showAISettings && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAISettings(false)} />
          
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Assistant Settings
                </h2>
              </div>
              <button
                onClick={() => setShowAISettings(false)}
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
                  value={tempSettings.provider}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, provider: e.target.value as any }))}
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
                  value={tempSettings.model}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="input-primary"
                >
                  {tempSettings.provider === 'openai' && (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {tempSettings.provider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </>
                  )}
                  {tempSettings.provider === 'gemini' && (
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
                  value={tempSettings.apiKey}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key..."
                  className="input-primary"
                />
              </div>

              {/* Enable AI */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={tempSettings.enabled}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Enable AI Assistant
                  </span>
                </label>
              </div>

              {/* Test Connection */}
              {tempSettings.apiKey && (
                <div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                  >
                    {testLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {testLoading ? 'Testing...' : 'Test Connection'}
                    </span>
                  </button>
                  
                  {testResult && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      testResult.startsWith('✅') 
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                        : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400'
                    }`}>
                      {testResult}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
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
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        onPasswordSet={passwordModalType === 'set' ? handlePasswordSuccess : undefined}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={
          passwordModalType === 'set' 
            ? 'Set a password to protect access to settings.'
            : 'Enter your current password to remove protection.'
        }
        placeholder={passwordModalType === 'set' ? 'Enter new password...' : 'Enter current password...'}
        expectedPassword={passwordModalType === 'remove' ? state.settings.settingsPassword : undefined}
        isSettingPassword={passwordModalType === 'set'}
      />
    </>
  );
}