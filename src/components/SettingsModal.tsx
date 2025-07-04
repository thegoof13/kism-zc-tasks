import React, { useState, useRef, useEffect } from 'react';
import { X, Settings, Users, FolderOpen, BarChart3, Brain, Shield, Plus, Edit, Trash2, Save, ChevronDown, ChevronUp, GripVertical, Eye, EyeOff, Trophy, Lock, Palette, Clock, Bell, BellOff, TestTube, MessageSquare, TrendingUp, Calendar, Target, Crown, RefreshCw, CheckCircle, User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart } from 'lucide-react';
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

type TabType = 'general' | 'profiles' | 'groups' | 'ai' | 'security' | 'history';

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

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

const availableAvatars = ['👤', '👨', '👩', '🧑', '👶', '👴', '👵', '🙋‍♂️', '🙋‍♀️', '💼', '👨‍💻', '👩‍💻', '🎨', '🏃‍♂️', '🏃‍♀️'];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: (password: string) => void;
    isSettingPassword: boolean;
  } | null>(null);

  // Profile management state
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [draggedProfile, setDraggedProfile] = useState<string | null>(null);
  const [dragOverProfile, setDragOverProfile] = useState<string | null>(null);

  // Group management state
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Form states for editing
  const [profileForm, setProfileForm] = useState<any>({});
  const [groupForm, setGroupForm] = useState<any>({});

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Users },
    { id: 'groups' as TabType, label: 'Groups', icon: FolderOpen },
    { id: 'ai' as TabType, label: 'AI Assistant', icon: Brain },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
    { id: 'history' as TabType, label: 'History', icon: BarChart3 },
  ];

  // Calculate statistics
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.isCompleted).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalProfiles = state.profiles.length;
  const activeProfiles = state.profiles.filter(p => p.isActive).length;

  // Profile management functions
  const handleEditProfile = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      setProfileForm({
        name: profile.name,
        avatar: profile.avatar,
        color: profile.color,
        isTaskCompetitor: profile.isTaskCompetitor || false,
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
      setEditingProfile(profileId);
    }
  };

  const handleSaveProfile = (profileId: string) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId,
      updates: profileForm,
    });
    setEditingProfile(null);
    setProfileForm({});
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

  const handleAddProfile = () => {
    const newProfile = {
      name: 'New Profile',
      avatar: '👤',
      color: '#6366F1',
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
    };
    
    dispatch({ type: 'ADD_PROFILE', profile: newProfile });
  };

  // Group management functions
  const handleEditGroup = (groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      setGroupForm({
        name: group.name,
        icon: group.icon,
        color: group.color,
        completedDisplayMode: group.completedDisplayMode,
        enableDueDates: group.enableDueDates || false,
        sortByDueDate: group.sortByDueDate || false,
        defaultNotifications: group.defaultNotifications || false,
      });
      setEditingGroup(groupId);
    }
  };

  const handleSaveGroup = (groupId: string) => {
    dispatch({
      type: 'UPDATE_GROUP',
      groupId,
      updates: groupForm,
    });
    setEditingGroup(null);
    setGroupForm({});
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupTasks = state.tasks.filter(t => t.groupId === groupId);
    if (groupTasks.length > 0) {
      if (!window.confirm(`This group contains ${groupTasks.length} tasks. Are you sure you want to delete it? All tasks in this group will also be deleted.`)) {
        return;
      }
    }
    
    dispatch({ type: 'DELETE_GROUP', groupId });
  };

  const handleAddGroup = () => {
    const newGroup = {
      name: 'New Group',
      icon: 'FolderOpen',
      color: '#6366F1',
      completedDisplayMode: 'grey-out' as const,
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };
    
    dispatch({ type: 'ADD_GROUP', group: newGroup });
  };

  // Drag and drop handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, profileId: string) => {
    setDraggedProfile(profileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent, profileId: string) => {
    e.preventDefault();
    setDragOverProfile(profileId);
  };

  const handleProfileDrop = (e: React.DragEvent, targetProfileId: string) => {
    e.preventDefault();
    
    if (draggedProfile && draggedProfile !== targetProfileId) {
      const draggedIndex = state.profiles.findIndex(p => p.id === draggedProfile);
      const targetIndex = state.profiles.findIndex(p => p.id === targetProfileId);
      
      const newProfiles = [...state.profiles];
      const [draggedItem] = newProfiles.splice(draggedIndex, 1);
      newProfiles.splice(targetIndex, 0, draggedItem);
      
      const reorderedIds = newProfiles.map(p => p.id);
      dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedIds });
    }
    
    setDraggedProfile(null);
    setDragOverProfile(null);
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroup(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDragOverGroup(groupId);
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    
    if (draggedGroup && draggedGroup !== targetGroupId) {
      const draggedIndex = state.groups.findIndex(g => g.id === draggedGroup);
      const targetIndex = state.groups.findIndex(g => g.id === targetGroupId);
      
      const newGroups = [...state.groups];
      const [draggedItem] = newGroups.splice(draggedIndex, 1);
      newGroups.splice(targetIndex, 0, draggedItem);
      
      const reorderedIds = newGroups.map(g => g.id);
      dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedIds });
    }
    
    setDraggedGroup(null);
    setDragOverGroup(null);
  };

  // AI Assistant functions
  const handleOpenAIQuery = () => {
    if (!state.settings.ai.enabled || !state.settings.ai.apiKey) {
      alert('Please configure AI settings first');
      return;
    }
    setShowAIQuery(true);
  };

  const handleUpdateAISettings = (updates: Partial<typeof state.settings.ai>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: { ...state.settings.ai, ...updates }
      }
    });
  };

  // Security functions
  const handleSetSettingsPassword = () => {
    setPasswordModalConfig({
      title: 'Set Settings Password',
      description: 'Create a password to protect access to settings. This password will be required to open settings in the future.',
      onSuccess: (password: string) => {
        onSetSettingsPassword(password);
        setShowPasswordModal(false);
        setPasswordModalConfig(null);
      },
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full bg-white dark:bg-neutral-800 shadow-xl animate-scale-in flex flex-col md:flex-row max-h-screen">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
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

          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 lg:w-80 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
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

            {/* Navigation Tabs */}
            <nav className="p-2 md:p-4">
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap md:whitespace-normal ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {/* Show labels on sm and up, hide on smaller screens */}
                      <span className="hidden sm:block font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Statistics Cards */}
            <div className="hidden md:block p-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="space-y-3">
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Tasks</span>
                    <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  <div className="mt-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Profiles</span>
                    <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {activeProfiles}/{totalProfiles}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme Setting */}
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Theme</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Choose your preferred theme</p>
                        </div>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { theme: e.target.value as any }
                          })}
                          className="px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>

                      {/* Show Completed Count */}
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Completed Count</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Display task completion progress in header</p>
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
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable Notifications</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow browser notifications for tasks</p>
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
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Display collaboration rankings in trophy view</p>
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
                    </div>
                  </div>
                </div>
              )}

              {/* Profiles Management */}
              {activeTab === 'profiles' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Profiles
                    </h3>
                    <button
                      onClick={handleAddProfile}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Profile</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.profiles
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(profile => (
                        <div
                          key={profile.id}
                          draggable
                          onDragStart={(e) => handleProfileDragStart(e, profile.id)}
                          onDragOver={(e) => handleProfileDragOver(e, profile.id)}
                          onDrop={(e) => handleProfileDrop(e, profile.id)}
                          className={`bg-white dark:bg-neutral-800 rounded-lg border transition-all duration-200 ${
                            dragOverProfile === profile.id
                              ? 'border-primary-500 shadow-lg'
                              : 'border-neutral-200 dark:border-neutral-700'
                          } ${
                            draggedProfile === profile.id ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          {/* Profile Header */}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                              <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: profile.color }}>
                                {profile.avatar}
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs">
                                  {profile.isTaskCompetitor && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                                      <Trophy className="w-3 h-3 inline mr-1" />
                                      Competitor
                                    </span>
                                  )}
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full">
                                      <Lock className="w-3 h-3 inline mr-1" />
                                      PIN
                                    </span>
                                  )}
                                  {profile.id === state.activeProfileId && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editingProfile === profile.id ? setEditingProfile(null) : handleEditProfile(profile.id)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                              >
                                {editingProfile === profile.id ? (
                                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                                ) : (
                                  <Edit className="w-4 h-4 text-neutral-500" />
                                )}
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable Edit Form */}
                          {editingProfile === profile.id && (
                            <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                              {/* Name */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.name || ''}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                                />
                              </div>

                              {/* Avatar */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  Avatar
                                </label>
                                <div className="grid grid-cols-8 gap-2">
                                  {availableAvatars.map(avatar => (
                                    <button
                                      key={avatar}
                                      onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
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

                              {/* Color */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  Color
                                </label>
                                <div className="grid grid-cols-10 gap-2">
                                  {availableColors.map(color => (
                                    <button
                                      key={color}
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

                              {/* PIN */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                  PIN (optional)
                                </label>
                                <input
                                  type="password"
                                  value={profileForm.pin || ''}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                                  placeholder="Leave empty for no PIN"
                                  className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                                />
                              </div>

                              {/* Task Competitor */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Task Competitor</h4>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Participate in task completion rankings</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.isTaskCompetitor || false}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                </label>
                              </div>

                              {/* Permissions */}
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Permissions</h4>
                                <div className="space-y-2">
                                  {[
                                    { key: 'canCreateTasks', label: 'Can Create Tasks' },
                                    { key: 'canEditTasks', label: 'Can Edit Tasks' },
                                    { key: 'canDeleteTasks', label: 'Can Delete Tasks' },
                                  ].map(permission => (
                                    <label key={permission.key} className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={profileForm.permissions?.[permission.key] || false}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          permissions: {
                                            ...prev.permissions,
                                            [permission.key]: e.target.checked
                                          }
                                        }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {permission.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Meal Times */}
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Meal Times</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { key: 'breakfast', label: 'Breakfast' },
                                    { key: 'lunch', label: 'Lunch' },
                                    { key: 'dinner', label: 'Dinner' },
                                    { key: 'nightcap', label: 'Night Cap' },
                                  ].map(meal => (
                                    <div key={meal.key}>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                        {meal.label}
                                      </label>
                                      <input
                                        type="time"
                                        value={profileForm.mealTimes?.[meal.key] || ''}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          mealTimes: {
                                            ...prev.mealTimes,
                                            [meal.key]: e.target.value
                                          }
                                        }))}
                                        className="w-full px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Save Button */}
                              <div className="flex justify-end space-x-2 pt-2">
                                <button
                                  onClick={() => setEditingProfile(null)}
                                  className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveProfile(profile.id)}
                                  className="btn-primary flex items-center space-x-2"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Groups Management */}
              {activeTab === 'groups' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={handleAddGroup}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Group</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.groups
                      .sort((a, b) => a.order - b.order)
                      .map(group => {
                        const groupTasks = state.tasks.filter(t => t.groupId === group.id);
                        const completedGroupTasks = groupTasks.filter(t => t.isCompleted);
                        const IconComponent = availableIcons.find(icon => icon.name === group.icon)?.component || FolderOpen;
                        
                        return (
                          <div
                            key={group.id}
                            draggable
                            onDragStart={(e) => handleGroupDragStart(e, group.id)}
                            onDragOver={(e) => handleGroupDragOver(e, group.id)}
                            onDrop={(e) => handleGroupDrop(e, group.id)}
                            className={`bg-white dark:bg-neutral-800 rounded-lg border transition-all duration-200 ${
                              dragOverGroup === group.id
                                ? 'border-primary-500 shadow-lg'
                                : 'border-neutral-200 dark:border-neutral-700'
                            } ${
                              draggedGroup === group.id ? 'opacity-50 scale-95' : ''
                            }`}
                          >
                            {/* Group Header */}
                            <div className="flex items-center justify-between p-4">
                              <div className="flex items-center space-x-3">
                                <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: group.color }}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                      {completedGroupTasks.length}/{groupTasks.length} tasks
                                    </span>
                                    {group.enableDueDates && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        Due dates
                                      </span>
                                    )}
                                    {group.defaultNotifications && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                        <Bell className="w-3 h-3 inline mr-1" />
                                        Notifications
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => editingGroup === group.id ? setEditingGroup(null) : handleEditGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  {editingGroup === group.id ? (
                                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                                  ) : (
                                    <Edit className="w-4 h-4 text-neutral-500" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>

                            {/* Expandable Edit Form */}
                            {editingGroup === group.id && (
                              <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                                {/* Name */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={groupForm.name || ''}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                                  />
                                </div>

                                {/* Icon */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Icon
                                  </label>
                                  <div className="grid grid-cols-5 gap-2">
                                    {availableIcons.map(icon => {
                                      const Icon = icon.component;
                                      return (
                                        <button
                                          key={icon.name}
                                          onClick={() => setGroupForm(prev => ({ ...prev, icon: icon.name }))}
                                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                            groupForm.icon === icon.name
                                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                              : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300'
                                          }`}
                                        >
                                          <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Color */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Color
                                  </label>
                                  <div className="grid grid-cols-10 gap-2">
                                    {availableColors.map(color => (
                                      <button
                                        key={color}
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

                                {/* Display Mode */}
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Completed Tasks Display
                                  </label>
                                  <select
                                    value={groupForm.completedDisplayMode || 'grey-out'}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                                  >
                                    <option value="grey-out">Grey Out</option>
                                    <option value="grey-drop">Grey Out & Drop Down</option>
                                    <option value="separate-completed">Separate Section</option>
                                  </select>
                                </div>

                                {/* Due Dates */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable Due Dates</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow tasks in this group to have due dates</p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={groupForm.enableDueDates || false}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                  </label>
                                </div>

                                {/* Sort by Due Date */}
                                {groupForm.enableDueDates && (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Sort by Due Date</h4>
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Sort tasks by due date instead of manual order</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.sortByDueDate || false}
                                        onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                    </label>
                                  </div>
                                )}

                                {/* Default Notifications */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Default Notifications</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Enable notifications by default for new tasks in this group</p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={groupForm.defaultNotifications || false}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                                  </label>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end space-x-2 pt-2">
                                  <button
                                    onClick={() => setEditingGroup(null)}
                                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveGroup(group.id)}
                                    className="btn-primary flex items-center space-x-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
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

              {/* AI Assistant */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    {state.settings.ai.enabled && state.settings.ai.apiKey && (
                      <button
                        onClick={handleOpenAIQuery}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open AI Chat</span>
                      </button>
                    )}
                  </div>

                  {/* AI Status Card */}
                  <div className={`p-6 rounded-lg border-2 ${
                    state.settings.ai.enabled && state.settings.ai.apiKey
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                      : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        state.settings.ai.enabled && state.settings.ai.apiKey
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-neutral-100 dark:bg-neutral-700'
                      }`}>
                        <Brain className={`w-6 h-6 ${
                          state.settings.ai.enabled && state.settings.ai.apiKey
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {state.settings.ai.enabled && state.settings.ai.apiKey ? 'AI Assistant Active' : 'AI Assistant Inactive'}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {state.settings.ai.enabled && state.settings.ai.apiKey
                            ? `Using ${state.settings.ai.provider} (${state.settings.ai.model})`
                            : 'Configure AI settings to get task insights'
                          }
                        </p>
                      </div>
                    </div>

                    {/* AI Configuration */}
                    <div className="space-y-4">
                      {/* Provider Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          AI Provider
                        </label>
                        <select
                          value={state.settings.ai.provider}
                          onChange={(e) => handleUpdateAISettings({ provider: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
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
                          onChange={(e) => handleUpdateAISettings({ model: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
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
                          onChange={(e) => handleUpdateAISettings({ apiKey: e.target.value })}
                          placeholder="Enter your API key..."
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                        />
                      </div>

                      {/* Enable AI */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Assistant</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow AI to analyze your task patterns</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.settings.ai.enabled}
                            onChange={(e) => handleUpdateAISettings({ enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Feature Overview */}
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                      <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        AI Features
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-3 bg-white dark:bg-neutral-700 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-primary-500" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Productivity Analysis
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              Analyze completion patterns
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white dark:bg-neutral-700 rounded-lg">
                          <Target className="w-5 h-5 text-primary-500" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Smart Recommendations
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              Get personalized insights
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Security Settings
                  </h3>

                  <div className="space-y-4">
                    {/* Settings Password */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {isSettingsPasswordSet ? 'Password protection is enabled' : 'Protect settings access with a password'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSettingsPasswordSet ? (
                          <button
                            onClick={handleRemoveSettingsPassword}
                            className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors duration-200"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={handleSetSettingsPassword}
                            className="px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200"
                          >
                            Set Password
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profile PINs Summary */}
                    <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Profile Security</h4>
                      <div className="space-y-2">
                        {state.profiles.map(profile => (
                          <div key={profile.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: profile.color }}>
                                {profile.avatar}
                              </div>
                              <span className="text-sm text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {profile.pin ? (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                  <Lock className="w-3 h-3 inline mr-1" />
                                  PIN Protected
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                                  No PIN
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3">
                        Configure individual profile PINs in the Profiles section
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIQuery}
        onClose={() => setShowAIQuery(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
        onUpdateSettings={handleUpdateAISettings}
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
          onPasswordSet={passwordModalConfig.isSettingPassword ? passwordModalConfig.onSuccess : undefined}
          isSettingPassword={passwordModalConfig.isSettingPassword}
        />
      )}
    </>
  );
}