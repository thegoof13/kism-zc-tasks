import React, { useState, useEffect } from 'react';
import { X, Settings, User, Shield, Brain, BarChart3, Plus, Edit, Trash2, GripVertical, Save, Eye, EyeOff, Lock, ExternalLink, TestTube, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { PasswordModal } from './PasswordModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAIQueryModal, setShowAIQueryModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  
  // AI Settings state
  const [tempAISettings, setTempAISettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

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

  // Drag and drop state
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);

  // Update temp AI settings when state changes
  useEffect(() => {
    setTempAISettings(state.settings.ai);
  }, [state.settings.ai]);

  if (!isOpen) return null;

  const handleSettingsUpdate = (updates: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', updates });
  };

  const handleAISettingsUpdate = (updates: Partial<AISettings>) => {
    setTempAISettings(prev => ({ ...prev, ...updates }));
  };

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { ai: tempAISettings }
    });
    setShowAISettingsModal(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // Import AIService dynamically to avoid circular dependencies
      const { AIService } = await import('../services/aiService');
      
      const testResponse = await AIService.queryTasks({
        query: "Test connection - please respond with 'Connection successful'",
        history: [],
        tasks: [],
        profiles: [],
        groups: [],
        aiSettings: tempAISettings,
      });

      setTestResult('✅ Connection successful! AI is working properly.');
    } catch (err) {
      setTestResult(`❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  // Group management functions
  const handleAddGroup = () => {
    const newGroup = {
      ...groupForm,
      id: Date.now().toString(),
      isCollapsed: false,
      createdAt: new Date(),
      order: state.groups.length,
    };
    dispatch({ type: 'ADD_GROUP', group: newGroup });
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

  const handleSaveGroup = () => {
    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup.id,
        updates: groupForm,
      });
      setEditingGroup(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group and all its tasks?')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  // Profile management functions
  const handleAddProfile = () => {
    const newProfile = {
      ...profileForm,
      id: Date.now().toString(),
      isActive: true,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_PROFILE', profile: newProfile });
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
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      avatar: profile.avatar,
      color: profile.color,
      isTaskCompetitor: profile.isTaskCompetitor ?? false,
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
    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile.id,
        updates: profileForm,
      });
      setEditingProfile(null);
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
    
    const groupIds = newGroups.map(g => g.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds });
    
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
    
    const profileIds = newProfiles.map(p => p.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds });
    
    setDraggedProfileIndex(null);
  };

  const generatePinBypassUrl = (profileId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?profile=${profileId}&bypass_pin=true`;
  };

  const openPinBypassUrl = (profileId: string) => {
    const url = generatePinBypassUrl(profileId);
    window.open(url, '_blank');
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          General Settings
        </h3>
        
        <div className="space-y-4">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Theme
            </label>
            <select
              value={state.settings.theme}
              onChange={(e) => handleSettingsUpdate({ theme: e.target.value })}
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
                onChange={(e) => handleSettingsUpdate({ showCompletedCount: e.target.checked })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show completed count in header
              </span>
            </label>
          </div>

          {/* Enable Notifications */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.settings.enableNotifications}
                onChange={(e) => handleSettingsUpdate({ enableNotifications: e.target.checked })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable notifications
              </span>
            </label>
          </div>

          {/* Show Top Collaborator */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.settings.showTopCollaborator}
                onChange={(e) => handleSettingsUpdate({ showTopCollaborator: e.target.checked })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show top collaborator in header
              </span>
            </label>
          </div>

          {/* Auto Archive */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.settings.autoArchiveCompleted}
                onChange={(e) => handleSettingsUpdate({ autoArchiveCompleted: e.target.checked })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Auto-archive completed tasks
              </span>
            </label>
          </div>

          {state.settings.autoArchiveCompleted && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Archive after (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={state.settings.archiveDays}
                onChange={(e) => handleSettingsUpdate({ archiveDays: parseInt(e.target.value) })}
                className="input-primary w-24"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfilesTab = () => {
    const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Profiles
          </h3>
          <button
            onClick={() => setEditingProfile({ id: 'new' } as UserProfile)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Profile
          </button>
        </div>

        <div className="space-y-3">
          {sortedProfiles.map((profile, index) => (
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
                <span className="text-lg">{profile.avatar}</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {profile.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {profile.isTaskCompetitor && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                        Competitor
                      </span>
                    )}
                    {profile.pin && (
                      <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full">
                        PIN Protected
                      </span>
                    )}
                    {profile.id === state.activeProfileId && (
                      <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full">
                        Active
                      </span>
                    )}
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

        {/* Profile Edit Modal */}
        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingProfile(null)} />
            
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {editingProfile.id === 'new' ? 'Add Profile' : 'Edit Profile'}
                </h2>
                <button
                  onClick={() => setEditingProfile(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-primary"
                    placeholder="Profile name"
                  />
                </div>

                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Avatar
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {['👤', '😊', '😎', '🤓', '😴', '🤔', '😋', '🤗', '🤯', '🧠', '🎯', '🎨', '🎭', '🎪', '🎸', '🎮'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setProfileForm(prev => ({ ...prev, avatar: emoji }))}
                        className={`p-2 text-lg rounded-lg border-2 transition-colors duration-200 ${
                          profileForm.avatar === emoji
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
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

                {/* Task Competitor */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={profileForm.isTaskCompetitor}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Task Competitor
                    </span>
                  </label>
                </div>

                {/* PIN Protection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    PIN Protection
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={profileForm.pin}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                      placeholder="Enter PIN (optional)"
                      className="input-primary pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>

                {/* Disable View Only Mode */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!state.settings.viewOnlyMode}
                      onChange={(e) => handleSettingsUpdate({ viewOnlyMode: !e.target.checked })}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Disable View Only Mode
                      </span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        When enabled, this profile cannot be accessed in view-only mode
                      </p>
                    </div>
                  </label>
                </div>

                {/* Permissions */}
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
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
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
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
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
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
                    </label>
                  </div>
                </div>

                {/* Meal Times */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Meal Times
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
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
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
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
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
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
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
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
              </div>

              <div className="flex space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingProfile.id === 'new') {
                      handleAddProfile();
                    } else {
                      handleSaveProfile();
                    }
                    setEditingProfile(null);
                  }}
                  className="flex-1 btn-primary"
                  disabled={!profileForm.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingProfile.id === 'new' ? 'Add' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupsTab = () => {
    const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Task Groups
          </h3>
          <button
            onClick={() => setEditingGroup({ id: 'new' } as TaskGroup)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </button>
        </div>

        <div className="space-y-3">
          {sortedGroups.map((group, index) => {
            const IconComponent = getIconComponent(group.icon);
            const taskCount = state.tasks.filter(t => t.groupId === group.id).length;
            
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
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <IconComponent className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {group.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{taskCount} tasks</span>
                      {group.enableDueDates && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                          Due dates
                        </span>
                      )}
                      {group.defaultNotifications && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                          Notifications
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-2 text-neutral-500 hover:text-primary-500 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {state.groups.length > 1 && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-neutral-500 hover:text-error-500 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Group Edit Modal */}
        {editingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingGroup(null)} />
            
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {editingGroup.id === 'new' ? 'Add Group' : 'Edit Group'}
                </h2>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-primary"
                    placeholder="Group name"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {getAvailableIcons().map(({ name, component: IconComponent }) => (
                      <button
                        key={name}
                        onClick={() => setGroupForm(prev => ({ ...prev, icon: name }))}
                        className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                          groupForm.icon === name
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
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

                {/* Display Mode */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Completed Tasks Display
                  </label>
                  <select
                    value={groupForm.completedDisplayMode}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                    className="input-primary"
                  >
                    <option value="grey-out">Grey out</option>
                    <option value="grey-drop">Grey out and move to bottom</option>
                    <option value="separate-completed">Separate completed section</option>
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
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Enable due dates
                    </span>
                  </label>
                </div>

                {/* Sort by Due Date */}
                {groupForm.enableDueDates && (
                  <div className="ml-7">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={groupForm.sortByDueDate}
                        onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        Sort by due date
                      </span>
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
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Enable notifications by default
                      </span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        New tasks in this group will have notifications enabled
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingGroup.id === 'new') {
                      handleAddGroup();
                    } else {
                      handleSaveGroup();
                    }
                    setEditingGroup(null);
                  }}
                  className="flex-1 btn-primary"
                  disabled={!groupForm.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingGroup.id === 'new' ? 'Add' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Security Settings
      </h3>

      {/* Settings Password */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Settings Password
        </h4>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Protect access to settings with a password
        </p>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="btn-primary"
        >
          {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
        </button>
      </div>

      {/* Profile Security */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Profile Security
        </h4>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          PIN-protected profiles and bypass options
        </p>

        <div className="space-y-3">
          {state.profiles.filter(p => p.pin && p.pin.trim().length > 0).map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{profile.avatar}</span>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {profile.name}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    PIN Protected
                  </p>
                </div>
              </div>
              <button
                onClick={() => openPinBypassUrl(profile.id)}
                className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">PIN Bypass</span>
              </button>
            </div>
          ))}

          {state.profiles.filter(p => p.pin && p.pin.trim().length > 0).length === 0 && (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
              No PIN-protected profiles found
            </p>
          )}
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>PIN Bypass:</strong> Use the external link button to open a profile in a new tab without entering 
            the PIN. This is useful for administrative access or when PINs are forgotten.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          AI Assistant
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAISettingsModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button
            onClick={() => setShowAIQueryModal(true)}
            className="btn-primary"
            disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Assistance
          </button>
        </div>
      </div>

      {!state.settings.ai.enabled || !state.settings.ai.apiKey ? (
        <div className="card p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            AI Assistant Not Configured
          </h4>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Configure your AI settings to get insights about your task patterns and productivity.
          </p>
          <button 
            onClick={() => setShowAISettingsModal(true)}
            className="btn-primary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure AI Settings
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Assistant Ready
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                Using {state.settings.ai.provider} ({state.settings.ai.model})
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Available Features
              </h5>
              <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                <li>• Task completion analysis</li>
                <li>• Productivity insights</li>
                <li>• Pattern recognition</li>
                <li>• Personalized recommendations</li>
              </ul>
            </div>
            
            <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Quick Actions
              </h5>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAIQueryModal(true)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200 text-sm"
                >
                  Ask about task patterns
                </button>
                <button
                  onClick={() => setShowAISettingsModal(true)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200 text-sm"
                >
                  Modify AI settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      {showAISettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAISettingsModal(false)} />
          
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Assistant Settings
                </h2>
              </div>
              <button
                onClick={() => setShowAISettingsModal(false)}
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
                  onChange={(e) => handleAISettingsUpdate({ provider: e.target.value as any })}
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
                  onChange={(e) => handleAISettingsUpdate({ model: e.target.value })}
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
                  onChange={(e) => handleAISettingsUpdate({ apiKey: e.target.value })}
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
                    onChange={(e) => handleAISettingsUpdate({ enabled: e.target.checked })}
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
                onClick={() => setShowAISettingsModal(false)}
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

      {/* AI Query Modal */}
      {showAIQueryModal && (
        <AIQueryModal
          isOpen={showAIQueryModal}
          onClose={() => setShowAIQueryModal(false)}
          history={state.history}
          tasks={state.tasks}
          profiles={state.profiles}
          groups={state.groups}
          aiSettings={state.settings.ai}
          onUpdateSettings={(updates) => handleSettingsUpdate({ ai: { ...state.settings.ai, ...updates } })}
        />
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        History & Analytics
      </h3>
      <HistoryAnalytics 
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden settings-modal">
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
            <nav className="space-y-2">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'profiles', label: 'Profiles', icon: User },
                { id: 'groups', label: 'Groups', icon: Settings },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'ai', label: 'AI Assistant', icon: Brain },
                { id: 'history', label: 'History', icon: BarChart3 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as SettingsTab)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === id
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
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

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title="Settings Password"
        description="Set a password to protect access to settings."
        placeholder="Enter new password..."
        isSettingPassword={true}
      />
    </div>
  );
}