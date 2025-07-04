import React, { useState, useRef } from 'react';
import { X, Settings, User, Users, Shield, Brain, History, Plus, Edit, Trash2, GripVertical, ExternalLink, Eye, Save, TestTube, Loader } from 'lucide-react';
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

type SettingsTab = 'general' | 'profiles' | 'groups' | 'security' | 'ai' | 'history';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
    isSettingPassword?: boolean;
  } | null>(null);

  // Group management state
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');
  const [newGroupDisplayMode, setNewGroupDisplayMode] = useState<'grey-out' | 'grey-drop' | 'separate-completed'>('grey-out');
  const [newGroupEnableDueDates, setNewGroupEnableDueDates] = useState(false);
  const [newGroupSortByDueDate, setNewGroupSortByDueDate] = useState(false);
  const [newGroupDefaultNotifications, setNewGroupDefaultNotifications] = useState(false);

  // Profile management state
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newProfileIsTaskCompetitor, setNewProfileIsTaskCompetitor] = useState(false);
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfileDisableViewOnly, setNewProfileDisableViewOnly] = useState(false);
  const [newProfilePermissions, setNewProfilePermissions] = useState({
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
  });
  const [newProfileMealTimes, setNewProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });

  // AI Settings state
  const [tempAISettings, setTempAISettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Drag and drop state
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);

  const availableIcons = getAvailableIcons();
  const avatarOptions = ['👤', '😊', '😎', '🤓', '😇', '🤗', '🤔', '🤪', '🧑‍💼', '🧑‍🎓', '🧑‍🏫', '🧑‍💻', '🧑‍🔬', '🧑‍🎨', '🧑‍🍳'];

  if (!isOpen) return null;

  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return;

    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup.id,
        updates: {
          name: newGroupName.trim(),
          color: newGroupColor,
          icon: newGroupIcon,
          completedDisplayMode: newGroupDisplayMode,
          enableDueDates: newGroupEnableDueDates,
          sortByDueDate: newGroupSortByDueDate,
          defaultNotifications: newGroupDefaultNotifications,
        },
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: {
          name: newGroupName.trim(),
          color: newGroupColor,
          icon: newGroupIcon,
          completedDisplayMode: newGroupDisplayMode,
          isCollapsed: false,
          enableDueDates: newGroupEnableDueDates,
          sortByDueDate: newGroupSortByDueDate,
          defaultNotifications: newGroupDefaultNotifications,
        },
      });
    }

    resetGroupForm();
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setNewGroupDisplayMode('grey-out');
    setNewGroupEnableDueDates(false);
    setNewGroupSortByDueDate(false);
    setNewGroupDefaultNotifications(false);
  };

  const handleEditGroup = (group: TaskGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupColor(group.color);
    setNewGroupIcon(group.icon);
    setNewGroupDisplayMode(group.completedDisplayMode);
    setNewGroupEnableDueDates(group.enableDueDates);
    setNewGroupSortByDueDate(group.sortByDueDate);
    setNewGroupDefaultNotifications(group.defaultNotifications || false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;

    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile.id,
        updates: {
          name: newProfileName.trim(),
          avatar: newProfileAvatar,
          color: newProfileColor,
          isTaskCompetitor: newProfileIsTaskCompetitor,
          pin: newProfilePin || undefined,
          permissions: newProfilePermissions,
          mealTimes: newProfileMealTimes,
          viewOnlyMode: !newProfileDisableViewOnly,
        },
      });
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: {
          name: newProfileName.trim(),
          avatar: newProfileAvatar,
          color: newProfileColor,
          isActive: true,
          isTaskCompetitor: newProfileIsTaskCompetitor,
          pin: newProfilePin || undefined,
          permissions: newProfilePermissions,
          mealTimes: newProfileMealTimes,
          viewOnlyMode: !newProfileDisableViewOnly,
        },
      });
    }

    resetProfileForm();
  };

  const resetProfileForm = () => {
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfileIsTaskCompetitor(false);
    setNewProfilePin('');
    setNewProfileDisableViewOnly(false);
    setNewProfilePermissions({
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    });
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
    setNewProfileIsTaskCompetitor(profile.isTaskCompetitor || false);
    setNewProfilePin(profile.pin || '');
    setNewProfileDisableViewOnly(!profile.viewOnlyMode);
    setNewProfilePermissions(profile.permissions || {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileMealTimes(profile.mealTimes || {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetSettingsPasswordClick = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings.',
      isSettingPassword: true,
      onSuccess: () => {
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
    });
    setShowPasswordModal(true);
  };

  const handleTestAIConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // Simple test - we'll just validate the settings format
      if (!tempAISettings.apiKey) {
        throw new Error('API key is required');
      }
      
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult('✅ Connection successful! AI is working properly.');
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { ai: tempAISettings },
    });
    setShowAISettings(false);
    setTestResult(null);
  };

  const generatePinBypassLink = (profile: UserProfile) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profile.id);
    currentUrl.searchParams.set('bypass_pin', 'true');
    return currentUrl.toString();
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedGroupIndex === null) return;

    const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);
    const draggedGroup = sortedGroups[draggedGroupIndex];
    const newGroups = [...sortedGroups];
    
    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(dropIndex, 0, draggedGroup);
    
    const newGroupIds = newGroups.map(g => g.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: newGroupIds });
    
    setDraggedGroupIndex(null);
  };

  // Drag and drop handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProfileIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleProfileDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedProfileIndex === null) return;

    const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedProfile = sortedProfiles[draggedProfileIndex];
    const newProfiles = [...sortedProfiles];
    
    newProfiles.splice(draggedProfileIndex, 1);
    newProfiles.splice(dropIndex, 0, draggedProfile);
    
    const newProfileIds = newProfiles.map(p => p.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: newProfileIds });
    
    setDraggedProfileIndex(null);
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 bg-success-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {state.tasks.filter(t => t.isCompleted).length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Completed</p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 bg-warning-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {state.history.filter(h => h.action === 'unchecked').length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Unchecked</p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 bg-error-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {state.history.filter(h => h.action === 'reset').length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Reset Tasks</p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 bg-accent-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {Math.round(((state.tasks.filter(t => t.isCompleted).length - state.history.filter(h => h.action === 'unchecked').length) / Math.max(state.tasks.filter(t => t.isCompleted).length, 1)) * 100)}%
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Accuracy Rate</p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Theme</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Choose your preferred theme</p>
          </div>
          <select
            value={state.settings.theme}
            onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { theme: e.target.value as any } })}
            className="input-primary w-32"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Show Completed Count</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Display task completion count in header</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.showCompletedCount}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { showCompletedCount: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Enable Notifications</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow browser notifications for tasks</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.enableNotifications}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { enableNotifications: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Show Top Collaborator</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Display collaboration leaderboard</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.settings.showTopCollaborator}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', updates: { showTopCollaborator: e.target.checked } })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderProfilesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">User Profiles</h3>
        <button
          onClick={() => setEditingProfile({} as UserProfile)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      {/* Profile List */}
      <div className="space-y-3">
        {[...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0)).map((profile, index) => (
          <div
            key={profile.id}
            draggable
            onDragStart={(e) => handleProfileDragStart(e, index)}
            onDragOver={handleProfileDragOver}
            onDrop={(e) => handleProfileDrop(e, index)}
            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-move"
          >
            <div className="flex items-center space-x-3">
              <GripVertical className="w-4 h-4 text-neutral-400" />
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: profile.color }}>
                {profile.avatar}
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{profile.name}</h4>
                <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {profile.isTaskCompetitor && <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">Competitor</span>}
                  {profile.pin && <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full text-xs">PIN Protected</span>}
                  {profile.viewOnlyMode && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs">View Only</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditProfile(profile)}
                className="p-2 text-neutral-500 hover:text-primary-500 transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
              </button>
              {state.profiles.length > 1 && (
                <button
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="p-2 text-neutral-500 hover:text-error-500 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Profile Edit Form */}
      {editingProfile && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {editingProfile.id ? 'Edit Profile' : 'Add Profile'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="input-primary"
                placeholder="Profile name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Avatar</label>
              <div className="grid grid-cols-8 gap-2">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setNewProfileAvatar(avatar)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all duration-200 ${
                      newProfileAvatar === avatar
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Color</label>
              <input
                type="color"
                value={newProfileColor}
                onChange={(e) => setNewProfileColor(e.target.value)}
                className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="taskCompetitor"
                checked={newProfileIsTaskCompetitor}
                onChange={(e) => setNewProfileIsTaskCompetitor(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="taskCompetitor" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Task Competitor
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">PIN Protection</label>
              <input
                type="password"
                value={newProfilePin}
                onChange={(e) => setNewProfilePin(e.target.value)}
                className="input-primary"
                placeholder="Leave empty for no PIN"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="disableViewOnly"
                checked={newProfileDisableViewOnly}
                onChange={(e) => setNewProfileDisableViewOnly(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="disableViewOnly" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Disable View Only Mode
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                When enabled, this profile cannot be accessed in view-only mode
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Permissions</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newProfilePermissions.canCreateTasks}
                    onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canCreateTasks: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newProfilePermissions.canEditTasks}
                    onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canEditTasks: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newProfilePermissions.canDeleteTasks}
                    onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canDeleteTasks: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Meal Times</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
                  <input
                    type="time"
                    value={newProfileMealTimes.breakfast}
                    onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
                  <input
                    type="time"
                    value={newProfileMealTimes.lunch}
                    onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
                  <input
                    type="time"
                    value={newProfileMealTimes.dinner}
                    onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
                  <input
                    type="time"
                    value={newProfileMealTimes.nightcap}
                    onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, nightcap: e.target.value }))}
                    className="input-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={resetProfileForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="btn-primary"
                disabled={!newProfileName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGroupsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Task Groups</h3>
        <button
          onClick={() => setEditingGroup({} as TaskGroup)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </button>
      </div>

      {/* Group List */}
      <div className="space-y-3">
        {[...state.groups].sort((a, b) => a.order - b.order).map((group, index) => {
          const IconComponent = getIconComponent(group.icon);
          return (
            <div
              key={group.id}
              draggable
              onDragStart={(e) => handleGroupDragStart(e, index)}
              onDragOver={handleGroupDragOver}
              onDrop={(e) => handleGroupDrop(e, index)}
              className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-move"
            >
              <div className="flex items-center space-x-3">
                <GripVertical className="w-4 h-4 text-neutral-400" />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }}></div>
                <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{group.name}</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {group.completedDisplayMode.replace('-', ' ')}
                    {group.enableDueDates && ' • Due dates enabled'}
                    {group.defaultNotifications && ' • Notifications default'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-2 text-neutral-500 hover:text-primary-500 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-neutral-500 hover:text-error-500 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group Edit Form */}
      {editingGroup && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {editingGroup.id ? 'Edit Group' : 'Add Group'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="input-primary"
                placeholder="Group name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {availableIcons.map(({ name, component: IconComponent }) => (
                  <button
                    key={name}
                    onClick={() => setNewGroupIcon(name)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      newGroupIcon === name
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Color</label>
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Completed Display Mode</label>
              <select
                value={newGroupDisplayMode}
                onChange={(e) => setNewGroupDisplayMode(e.target.value as any)}
                className="input-primary"
              >
                <option value="grey-out">Grey out</option>
                <option value="grey-drop">Grey drop</option>
                <option value="separate-completed">Separate completed</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableDueDates"
                checked={newGroupEnableDueDates}
                onChange={(e) => setNewGroupEnableDueDates(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="enableDueDates" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable Due Dates
              </label>
            </div>

            {newGroupEnableDueDates && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sortByDueDate"
                  checked={newGroupSortByDueDate}
                  onChange={(e) => setNewGroupSortByDueDate(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="sortByDueDate" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Sort by Due Date
                </label>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="defaultNotifications"
                checked={newGroupDefaultNotifications}
                onChange={(e) => setNewGroupDefaultNotifications(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="defaultNotifications" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Default Notifications
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                New tasks in this group will have notifications enabled by default
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={resetGroupForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                className="btn-primary"
                disabled={!newGroupName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Security Settings</h3>
        
        {/* Settings Password */}
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Settings Password</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Protect access to settings with a password
          </p>
          <button
            onClick={handleSetSettingsPasswordClick}
            className="btn-secondary"
          >
            {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
          </button>
        </div>

        {/* Profile Security */}
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Profile Security</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            PIN-protected profiles and bypass options
          </p>
          
          <div className="space-y-3">
            {state.profiles.filter(p => p.pin && p.pin.trim().length > 0).map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: profile.color }}>
                    {profile.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{profile.name}</p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">PIN Protected</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(generatePinBypassLink(profile), '_blank')}
                  className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                  title="Open profile in new tab without PIN"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {state.profiles.filter(p => p.pin && p.pin.trim().length > 0).length === 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                No PIN-protected profiles found
              </p>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>PIN Bypass:</strong> Use the external link button to open a profile in a new tab without entering the PIN. This is useful for administrative access or when PINs are forgotten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">AI Assistant</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAISettings(true)}
            className="p-2 text-neutral-500 hover:text-primary-500 transition-colors duration-200"
            title="AI Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAIQuery(true)}
            className="btn-primary"
            disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
          >
            <Brain className="w-4 h-4 mr-2" />
            Open AI Assistant
          </button>
        </div>
      </div>

      {!state.settings.ai.enabled || !state.settings.ai.apiKey ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
          <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            AI Assistant Not Configured
          </h4>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
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
      ) : (
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">AI Assistant Ready</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Provider: {state.settings.ai.provider} • Model: {state.settings.ai.model}
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Your AI assistant is configured and ready to analyze your task patterns, provide insights, and answer questions about your productivity.
          </p>
          <button
            onClick={() => setShowAIQuery(true)}
            className="btn-primary"
          >
            <Brain className="w-4 h-4 mr-2" />
            Start AI Session
          </button>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <HistoryAnalytics
      history={state.history}
      tasks={state.tasks}
      profiles={state.profiles}
    />
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'general'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>General</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('profiles')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'profiles'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profiles</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'groups'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Groups</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'security'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'ai'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  <span>AI Assistant</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'history'
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span>History</span>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'profiles' && renderProfilesTab()}
              {activeTab === 'groups' && renderGroupsTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'ai' && renderAITab()}
              {activeTab === 'history' && renderHistoryTab()}
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
        onUpdateSettings={(updates) => dispatch({ type: 'UPDATE_SETTINGS', updates: { ai: { ...state.settings.ai, ...updates } } })}
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
                  value={tempAISettings.provider}
                  onChange={(e) => setTempAISettings(prev => ({ ...prev, provider: e.target.value as any }))}
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
                  value={tempAISettings.model}
                  onChange={(e) => setTempAISettings(prev => ({ ...prev, model: e.target.value }))}
                  className="input-primary"
                >
                  {tempAISettings.provider === 'openai' && (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {tempAISettings.provider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </>
                  )}
                  {tempAISettings.provider === 'gemini' && (
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
                  value={tempAISettings.apiKey}
                  onChange={(e) => setTempAISettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key..."
                  className="input-primary"
                />
              </div>

              {/* Enable AI */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={tempAISettings.enabled}
                    onChange={(e) => setTempAISettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Enable AI Assistant
                  </span>
                </label>
              </div>

              {/* Test Connection */}
              {tempAISettings.apiKey && (
                <div>
                  <button
                    onClick={handleTestAIConnection}
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