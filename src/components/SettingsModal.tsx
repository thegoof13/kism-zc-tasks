import React, { useState, useEffect } from 'react';
import { X, Settings, Users, Palette, History, Brain, Shield, Eye, EyeOff, Plus, Edit, Trash2, GripVertical, Save, Cancel, ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile } from '../types';
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

const availableAvatars = [
  '👤', '😊', '👨', '👩', '😎', '🤓', '😇', '🥳',
  '👶', '👴', '🧙‍♂️', '🧙‍♀️', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🎨'
];

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');

  // Group editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
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
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
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

  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);

  // Reset forms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingGroupId(null);
      setEditingProfileId(null);
      setActiveTab('general');
    }
  }, [isOpen]);

  const handleGroupEdit = (group: TaskGroup) => {
    setEditingGroupId(group.id);
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
    if (editingGroupId) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroupId,
        updates: groupForm,
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: groupForm,
      });
    }
    setEditingGroupId(null);
  };

  const handleGroupCancel = () => {
    setEditingGroupId(null);
  };

  const handleGroupDelete = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleProfileEdit = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
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
  };

  const handleProfileSave = () => {
    if (editingProfileId) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfileId,
        updates: profileForm,
      });
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: profileForm,
      });
    }
    setEditingProfileId(null);
  };

  const handleProfileCancel = () => {
    setEditingProfileId(null);
  };

  const handleProfileDelete = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }
    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  const handleSetPassword = () => {
    setPasswordModalType('set');
    setShowPasswordModal(true);
  };

  const handleRemovePassword = () => {
    setPasswordModalType('remove');
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    if (passwordModalType === 'remove') {
      onSetSettingsPassword('');
    }
    setShowPasswordModal(false);
  };

  const handlePasswordSet = (password: string) => {
    onSetSettingsPassword(password);
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
    
    const reorderedIds = newGroups.map(group => group.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedIds });
    
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
    
    const reorderedIds = newProfiles.map(profile => profile.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedIds });
    
    setDraggedProfileIndex(null);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'groups' as const, label: 'Groups', icon: Palette },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);
  const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full h-full max-w-6xl max-h-[95vh] mx-4 bg-white dark:bg-neutral-800 rounded-none sm:rounded-2xl shadow-xl animate-scale-in overflow-hidden flex flex-col settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
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
            {/* Sidebar - Responsive width */}
            <div className="w-16 sm:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <nav className="p-2 sm:p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-center sm:justify-start space-x-3 px-2 sm:px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="hidden sm:block font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        General Settings
                      </h3>
                      
                      <div className="space-y-4">
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
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={state.settings.showCompletedCount}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { showCompletedCount: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Enable Notifications */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Enable Notifications
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Allow browser notifications for tasks
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={state.settings.enableNotifications}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { enableNotifications: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Show Top Collaborator */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Show Top Collaborator
                            </label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Display collaboration leaderboard in trophy view
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={state.settings.showTopCollaborator}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { showTopCollaborator: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Disable View Only Mode */}
                        {state.settings.viewOnlyMode && (
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Disable View Only Mode
                              </label>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Allow full access to modify tasks and settings
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    dispatch({
                                      type: 'UPDATE_SETTINGS',
                                      updates: { viewOnlyMode: false }
                                    });
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Groups Settings */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Task Groups
                      </h3>
                      <button
                        onClick={() => {
                          setEditingGroupId('new');
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

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {sortedGroups.map((group, index) => {
                        const IconComponent = getIconComponent(group.icon);
                        const isEditing = editingGroupId === group.id;

                        return (
                          <div
                            key={group.id}
                            className="card p-4"
                            draggable={!isEditing}
                            onDragStart={(e) => handleGroupDragStart(e, index)}
                            onDragOver={handleGroupDragOver}
                            onDrop={(e) => handleGroupDrop(e, index)}
                          >
                            {isEditing ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Group Name
                                  </label>
                                  <input
                                    type="text"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                    className="input-primary"
                                    placeholder="Enter group name..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Color
                                    </label>
                                    <div className="flex space-x-2">
                                      {availableColors.map(color => (
                                        <button
                                          key={color}
                                          onClick={() => setGroupForm({ ...groupForm, color })}
                                          className={`w-8 h-8 rounded-full border-2 ${
                                            groupForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
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
                                    <select
                                      value={groupForm.icon}
                                      onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
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
                                    onChange={(e) => setGroupForm({ ...groupForm, completedDisplayMode: e.target.value as any })}
                                    className="input-primary"
                                  >
                                    <option value="grey-out">Grey Out</option>
                                    <option value="grey-drop">Grey Out & Drop Down</option>
                                    <option value="separate-completed">Separate Completed Section</option>
                                  </select>
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
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.enableDueDates}
                                        onChange={(e) => setGroupForm({ ...groupForm, enableDueDates: e.target.checked })}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                    </label>
                                  </div>

                                  {groupForm.enableDueDates && (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                          Sort tasks by next Due Date
                                        </label>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                          Automatically sort tasks by due date
                                        </p>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={groupForm.sortByDueDate}
                                          onChange={(e) => setGroupForm({ ...groupForm, sortByDueDate: e.target.checked })}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                      </label>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <div>
                                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Default Notifications
                                      </label>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Enable notifications by default for new tasks
                                      </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.defaultNotifications}
                                        onChange={(e) => setGroupForm({ ...groupForm, defaultNotifications: e.target.checked })}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                    </label>
                                  </div>
                                </div>

                                <div className="flex space-x-3">
                                  <button onClick={handleGroupSave} className="btn-primary">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button onClick={handleGroupCancel} className="btn-secondary">
                                    <Cancel className="w-4 h-4 mr-2" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <GripVertical className="w-4 h-4 text-neutral-400 cursor-move" />
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
                                      <span>{group.completedDisplayMode.replace('-', ' ')}</span>
                                      {group.enableDueDates && (
                                        <>
                                          <span>•</span>
                                          <span>Due dates enabled</span>
                                        </>
                                      )}
                                      {group.defaultNotifications && (
                                        <>
                                          <span>•</span>
                                          <Bell className="w-3 h-3" />
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

                      {/* New Group Form */}
                      {editingGroupId === 'new' && (
                        <div className="card p-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Group Name
                              </label>
                              <input
                                type="text"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                className="input-primary"
                                placeholder="Enter group name..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  Color
                                </label>
                                <div className="flex space-x-2">
                                  {availableColors.map(color => (
                                    <button
                                      key={color}
                                      onClick={() => setGroupForm({ ...groupForm, color })}
                                      className={`w-8 h-8 rounded-full border-2 ${
                                        groupForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
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
                                <select
                                  value={groupForm.icon}
                                  onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
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
                                onChange={(e) => setGroupForm({ ...groupForm, completedDisplayMode: e.target.value as any })}
                                className="input-primary"
                              >
                                <option value="grey-out">Grey Out</option>
                                <option value="grey-drop">Grey Out & Drop Down</option>
                                <option value="separate-completed">Separate Completed Section</option>
                              </select>
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
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={groupForm.enableDueDates}
                                    onChange={(e) => setGroupForm({ ...groupForm, enableDueDates: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                              </div>

                              {groupForm.enableDueDates && (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                      Sort tasks by next Due Date
                                    </label>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      Automatically sort tasks by due date
                                    </p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={groupForm.sortByDueDate}
                                      onChange={(e) => setGroupForm({ ...groupForm, sortByDueDate: e.target.checked })}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                  </label>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Default Notifications
                                  </label>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Enable notifications by default for new tasks
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={groupForm.defaultNotifications}
                                    onChange={(e) => setGroupForm({ ...groupForm, defaultNotifications: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <button onClick={handleGroupSave} className="btn-primary">
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </button>
                              <button onClick={handleGroupCancel} className="btn-secondary">
                                <Cancel className="w-4 h-4 mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profiles Settings */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        User Profiles
                      </h3>
                      <button
                        onClick={() => {
                          setEditingProfileId('new');
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
                        }}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {sortedProfiles.map((profile, index) => {
                        const isEditing = editingProfileId === profile.id;

                        return (
                          <div
                            key={profile.id}
                            className="card p-4"
                            draggable={!isEditing}
                            onDragStart={(e) => handleProfileDragStart(e, index)}
                            onDragOver={handleProfileDragOver}
                            onDrop={(e) => handleProfileDrop(e, index)}
                          >
                            {isEditing ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="input-primary"
                                    placeholder="Enter name..."
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
                                        onClick={() => setProfileForm({ ...profileForm, avatar })}
                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                                          profileForm.avatar === avatar 
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400'
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
                                  <div className="flex space-x-2">
                                    {availableColors.map(color => (
                                      <button
                                        key={color}
                                        onClick={() => setProfileForm({ ...profileForm, color })}
                                        className={`w-8 h-8 rounded-full border-2 ${
                                          profileForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
                                        }`}
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Task Competitor
                                      </label>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Participate in task completion rankings
                                      </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.isTaskCompetitor}
                                        onChange={(e) => setProfileForm({ ...profileForm, isTaskCompetitor: e.target.checked })}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    PIN Protection
                                  </label>
                                  <input
                                    type="password"
                                    value={profileForm.pin}
                                    onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                                    className="input-primary"
                                    placeholder="Enter PIN (optional)..."
                                  />
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    Leave empty for no PIN protection
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                    Permissions
                                  </label>
                                  <div className="space-y-2">
                                    <label className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canCreateTasks}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          permissions: { ...profileForm.permissions, canCreateTasks: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canEditTasks}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          permissions: { ...profileForm.permissions, canEditTasks: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions.canDeleteTasks}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          permissions: { ...profileForm.permissions, canDeleteTasks: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                    Meal Times
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                        Breakfast
                                      </label>
                                      <input
                                        type="time"
                                        value={profileForm.mealTimes.breakfast}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          mealTimes: { ...profileForm.mealTimes, breakfast: e.target.value }
                                        })}
                                        className="input-primary"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                        Lunch
                                      </label>
                                      <input
                                        type="time"
                                        value={profileForm.mealTimes.lunch}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          mealTimes: { ...profileForm.mealTimes, lunch: e.target.value }
                                        })}
                                        className="input-primary"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                        Dinner
                                      </label>
                                      <input
                                        type="time"
                                        value={profileForm.mealTimes.dinner}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          mealTimes: { ...profileForm.mealTimes, dinner: e.target.value }
                                        })}
                                        className="input-primary"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                        Night Cap
                                      </label>
                                      <input
                                        type="time"
                                        value={profileForm.mealTimes.nightcap}
                                        onChange={(e) => setProfileForm({
                                          ...profileForm,
                                          mealTimes: { ...profileForm.mealTimes, nightcap: e.target.value }
                                        })}
                                        className="input-primary"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-3">
                                  <button onClick={handleProfileSave} className="btn-primary">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button onClick={handleProfileCancel} className="btn-secondary">
                                    <Cancel className="w-4 h-4 mr-2" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <GripVertical className="w-4 h-4 text-neutral-400 cursor-move" />
                                  <div className="text-2xl">{profile.avatar}</div>
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
                                    onClick={() => handleProfileEdit(profile)}
                                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  >
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                  </button>
                                  {state.profiles.length > 1 && (
                                    <button
                                      onClick={() => handleProfileDelete(profile.id)}
                                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
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

                      {/* New Profile Form */}
                      {editingProfileId === 'new' && (
                        <div className="card p-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="input-primary"
                                placeholder="Enter name..."
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
                                    onClick={() => setProfileForm({ ...profileForm, avatar })}
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                                      profileForm.avatar === avatar 
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                        : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400'
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
                              <div className="flex space-x-2">
                                {availableColors.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setProfileForm({ ...profileForm, color })}
                                    className={`w-8 h-8 rounded-full border-2 ${
                                      profileForm.color === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Task Competitor
                                  </label>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Participate in task completion rankings
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.isTaskCompetitor}
                                    onChange={(e) => setProfileForm({ ...profileForm, isTaskCompetitor: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                PIN Protection
                              </label>
                              <input
                                type="password"
                                value={profileForm.pin}
                                onChange={(e) => setProfileForm({ ...profileForm, pin: e.target.value })}
                                className="input-primary"
                                placeholder="Enter PIN (optional)..."
                              />
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Leave empty for no PIN protection
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                Permissions
                              </label>
                              <div className="space-y-2">
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.permissions.canCreateTasks}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      permissions: { ...profileForm.permissions, canCreateTasks: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                                </label>
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.permissions.canEditTasks}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      permissions: { ...profileForm.permissions, canEditTasks: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                                </label>
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.permissions.canDeleteTasks}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      permissions: { ...profileForm.permissions, canDeleteTasks: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                Meal Times
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                    Breakfast
                                  </label>
                                  <input
                                    type="time"
                                    value={profileForm.mealTimes.breakfast}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      mealTimes: { ...profileForm.mealTimes, breakfast: e.target.value }
                                    })}
                                    className="input-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                    Lunch
                                  </label>
                                  <input
                                    type="time"
                                    value={profileForm.mealTimes.lunch}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      mealTimes: { ...profileForm.mealTimes, lunch: e.target.value }
                                    })}
                                    className="input-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                    Dinner
                                  </label>
                                  <input
                                    type="time"
                                    value={profileForm.mealTimes.dinner}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      mealTimes: { ...profileForm.mealTimes, dinner: e.target.value }
                                    })}
                                    className="input-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                    Night Cap
                                  </label>
                                  <input
                                    type="time"
                                    value={profileForm.mealTimes.nightcap}
                                    onChange={(e) => setProfileForm({
                                      ...profileForm,
                                      mealTimes: { ...profileForm.mealTimes, nightcap: e.target.value }
                                    })}
                                    className="input-primary"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <button onClick={handleProfileSave} className="btn-primary">
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </button>
                              <button onClick={handleProfileCancel} className="btn-secondary">
                                <Cancel className="w-4 h-4 mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task History & Analytics
                    </h3>
                    
                    <div className="max-h-96 overflow-y-auto">
                      <HistoryAnalytics 
                        history={state.history}
                        tasks={state.tasks}
                        profiles={state.profiles}
                      />
                    </div>
                  </div>
                )}

                {/* AI Assistant Tab */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        AI Task Assistant
                      </h3>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                        title="AI Settings"
                      >
                        <Settings className="w-5 h-5 text-neutral-500" />
                      </button>
                    </div>
                    
                    {state.settings.ai.enabled && state.settings.ai.apiKey ? (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 mx-auto mb-4 text-primary-500" />
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                          AI Assistant Ready
                        </h4>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                          Your AI assistant is configured and ready to analyze your task patterns.
                        </p>
                        <button 
                          onClick={() => setShowAIModal(true)}
                          className="btn-primary"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Open AI Assistant
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                          AI Assistant Not Configured
                        </h4>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                          Configure your AI settings to get insights about your task patterns and productivity.
                        </p>
                        <button 
                          onClick={() => setShowAIModal(true)}
                          className="btn-primary"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configure AI Settings
                        </button>
                      </div>
                    )}
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
                                : 'No password protection for settings access'
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
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
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
                                    {profile.pin ? 'PIN Protected' : 'No PIN Protection'}
                                  </p>
                                </div>
                              </div>
                              {profile.pin && (
                                <button
                                  onClick={() => {
                                    // Set active profile and disable view only mode
                                    dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profile.id });
                                    dispatch({ type: 'UPDATE_SETTINGS', updates: { viewOnlyMode: false } });
                                    onClose();
                                  }}
                                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                                >
                                  Bypass PIN
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
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
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        onPasswordSet={handlePasswordSet}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={
          passwordModalType === 'set' 
            ? 'Set a password to protect access to settings. This password will be required to open the settings modal.'
            : 'Enter your current settings password to remove password protection.'
        }
        placeholder={passwordModalType === 'set' ? 'Enter new password...' : 'Enter current password...'}
        expectedPassword={passwordModalType === 'remove' ? state.settings.settingsPassword : undefined}
        isSettingPassword={passwordModalType === 'set'}
      />
    </>
  );
}