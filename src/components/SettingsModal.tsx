import React, { useState, useRef } from 'react';
import { X, Settings, Users, Folder, Brain, History, Shield, Eye, EyeOff, Plus, Edit, Trash2, Save, Cancel, GripVertical, User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart, Bell, BellOff, Trophy, Crown, Target, TrendingUp, Calendar, Award, Clock, RefreshCw, CheckCircle, MessageSquare, TestTube, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserProfile, TaskGroup, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';
import { AIService } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'profiles' | 'groups' | 'ai' | 'history' | 'security';

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

const availableAvatars = [
  '👤', '👨', '👩', '🧑', '👶', '👴', '👵', '🙋‍♂️', '🙋‍♀️', '💼',
  '👨‍💻', '👩‍💻', '👨‍🎓', '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '🎯', '⭐'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [draggedProfile, setDraggedProfile] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // AI Settings state
  const [tempAISettings, setTempAISettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [groupForm, setGroupForm] = useState<Partial<TaskGroup>>({});

  const dragRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'groups' as const, label: 'Groups', icon: Folder },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  const handleProfileEdit = (profile: UserProfile) => {
    setEditingProfile(profile.id);
    setProfileForm({
      ...profile,
      mealTimes: profile.mealTimes || {
        breakfast: '07:00',
        lunch: '12:00',
        dinner: '18:00',
        nightcap: '21:00',
      },
      permissions: profile.permissions || {
        canEditTasks: true,
        canCreateTasks: true,
        canDeleteTasks: true,
      },
    });
  };

  const handleProfileSave = () => {
    if (!editingProfile || !profileForm.name) return;
    
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: profileForm,
    });
    
    setEditingProfile(null);
    setProfileForm({});
  };

  const handleProfileCancel = () => {
    setEditingProfile(null);
    setProfileForm({});
  };

  const handleGroupEdit = (group: TaskGroup) => {
    setEditingGroup(group.id);
    setGroupForm(group);
  };

  const handleGroupSave = () => {
    if (!editingGroup || !groupForm.name) return;
    
    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
      updates: groupForm,
    });
    
    setEditingGroup(null);
    setGroupForm({});
  };

  const handleGroupCancel = () => {
    setEditingGroup(null);
    setGroupForm({});
  };

  const handleAddProfile = () => {
    const newProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: 'New Profile',
      color: availableColors[0],
      avatar: availableAvatars[0],
      isActive: true,
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

  const handleAddGroup = () => {
    const newGroup: Omit<TaskGroup, 'id' | 'createdAt' | 'order'> = {
      name: 'New Group',
      color: availableColors[0],
      icon: 'Folder',
      completedDisplayMode: 'grey-out',
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };
    
    dispatch({ type: 'ADD_GROUP', group: newGroup });
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

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  // Drag and drop handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, profileId: string) => {
    setDraggedProfile(profileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleProfileDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedProfile) return;
    
    const profiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedIndex = profiles.findIndex(p => p.id === draggedProfile);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const reorderedProfiles = [...profiles];
    const [draggedItem] = reorderedProfiles.splice(draggedIndex, 1);
    reorderedProfiles.splice(targetIndex, 0, draggedItem);
    
    const profileIds = reorderedProfiles.map(p => p.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds });
    
    setDraggedProfile(null);
    setDragOverIndex(null);
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroup(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleGroupDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedGroup) return;
    
    const groups = [...state.groups].sort((a, b) => a.order - b.order);
    const draggedIndex = groups.findIndex(g => g.id === draggedGroup);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    const reorderedGroups = [...groups];
    const [draggedItem] = reorderedGroups.splice(draggedIndex, 1);
    reorderedGroups.splice(targetIndex, 0, draggedItem);
    
    const groupIds = reorderedGroups.map(g => g.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds });
    
    setDraggedGroup(null);
    setDragOverIndex(null);
  };

  const handleTestAIConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
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

  const handleSaveAISettings = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { ai: tempAISettings }
    });
    setTestResult(null);
  };

  if (!isOpen) return null;

  const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full h-full max-w-6xl max-h-[95vh] mx-4 bg-white dark:bg-neutral-800 rounded-none sm:rounded-2xl shadow-xl animate-scale-in overflow-hidden flex flex-col settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
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

          <div className="flex flex-1 overflow-hidden">
            {/* Mobile Tab Navigation (Top) */}
            <div className="sm:hidden w-full">
              <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center p-3 min-w-[60px] transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'text-primary-600 dark:text-primary-400 bg-white dark:bg-neutral-800 border-b-2 border-primary-500'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium hidden xs:block">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className="hidden sm:flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <nav className="flex-1 p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        General Settings
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Theme Setting */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
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
                            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                          </select>
                        </div>

                        {/* Show Completed Count */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
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
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Enable Notifications */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
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
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Show Top Collaborator */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Display collaboration leaderboard in header</p>
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
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Disable View Only Mode */}
                        {state.settings.viewOnlyMode && (
                          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <EyeOff className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-100">View Only Mode Active</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">You can view tasks but cannot modify them</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!state.settings.viewOnlyMode}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_SETTINGS',
                                  updates: { viewOnlyMode: !e.target.checked }
                                })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        )}

                        {/* Auto Archive */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Auto Archive Completed</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">Automatically archive old completed tasks</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={state.settings.autoArchiveCompleted}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { autoArchiveCompleted: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        {/* Archive Days */}
                        {state.settings.autoArchiveCompleted && (
                          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Archive After Days</h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Number of days before archiving completed tasks</p>
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={state.settings.archiveDays}
                              onChange={(e) => dispatch({
                                type: 'UPDATE_SETTINGS',
                                updates: { archiveDays: parseInt(e.target.value) || 30 }
                              })}
                              className="w-20 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-center"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Profiles */}
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
                      {sortedProfiles.map((profile, index) => (
                        <div
                          key={profile.id}
                          ref={(el) => dragRefs.current[profile.id] = el}
                          draggable
                          onDragStart={(e) => handleProfileDragStart(e, profile.id)}
                          onDragOver={(e) => handleProfileDragOver(e, index)}
                          onDrop={(e) => handleProfileDrop(e, index)}
                          className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-all duration-200 ${
                            draggedProfile === profile.id ? 'opacity-50 scale-95' : ''
                          } ${
                            dragOverIndex === index ? 'border-primary-500 shadow-lg' : ''
                          }`}
                        >
                          {editingProfile === profile.id ? (
                            // Edit Form
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={profileForm.name || ''}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="input-primary"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Avatar
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {availableAvatars.map(avatar => (
                                      <button
                                        key={avatar}
                                        onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-colors duration-200 ${
                                          profileForm.avatar === avatar
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                                        }`}
                                      >
                                        {avatar}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Color
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                      <button
                                        key={color}
                                        onClick={() => setProfileForm(prev => ({ ...prev, color }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                          profileForm.color === color
                                            ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                                            : 'border-neutral-300 dark:border-neutral-600'
                                        }`}
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    PIN (Optional)
                                  </label>
                                  <input
                                    type="password"
                                    value={profileForm.pin || ''}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                                    placeholder="Enter PIN..."
                                    className="input-primary"
                                  />
                                </div>
                              </div>

                              {/* Permissions */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                  Permissions
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={profileForm.permissions?.canCreateTasks ?? true}
                                      onChange={(e) => setProfileForm(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          canCreateTasks: e.target.checked,
                                          canEditTasks: prev.permissions?.canEditTasks ?? true,
                                          canDeleteTasks: prev.permissions?.canDeleteTasks ?? true,
                                        }
                                      }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Create</span>
                                  </label>
                                  
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={profileForm.permissions?.canEditTasks ?? true}
                                      onChange={(e) => setProfileForm(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          canCreateTasks: prev.permissions?.canCreateTasks ?? true,
                                          canEditTasks: e.target.checked,
                                          canDeleteTasks: prev.permissions?.canDeleteTasks ?? true,
                                        }
                                      }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Edit</span>
                                  </label>
                                  
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={profileForm.permissions?.canDeleteTasks ?? true}
                                      onChange={(e) => setProfileForm(prev => ({
                                        ...prev,
                                        permissions: {
                                          ...prev.permissions,
                                          canCreateTasks: prev.permissions?.canCreateTasks ?? true,
                                          canEditTasks: prev.permissions?.canEditTasks ?? true,
                                          canDeleteTasks: e.target.checked,
                                        }
                                      }))}
                                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Can Delete</span>
                                  </label>
                                </div>
                              </div>

                              {/* Task Competitor */}
                              <div>
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={profileForm.isTaskCompetitor ?? false}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <div>
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Task Competitor</span>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Participate in task completion rankings</p>
                                  </div>
                                </label>
                              </div>

                              {/* Meal Times */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                                  Meal Times
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {Object.entries(profileForm.mealTimes || {}).map(([meal, time]) => (
                                    <div key={meal}>
                                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
                                        {meal}
                                      </label>
                                      <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setProfileForm(prev => ({
                                          ...prev,
                                          mealTimes: {
                                            ...prev.mealTimes,
                                            [meal]: e.target.value
                                          }
                                        }))}
                                        className="input-primary text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <button
                                  onClick={handleProfileSave}
                                  className="btn-primary flex items-center space-x-2"
                                >
                                  <Save className="w-4 h-4" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleProfileCancel}
                                  className="btn-secondary flex items-center space-x-2"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display Mode
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <GripVertical className="w-5 h-5 text-neutral-400 cursor-grab" />
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                    style={{ backgroundColor: profile.color + '20', color: profile.color }}
                                  >
                                    {profile.avatar}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                      {profile.name}
                                    </h4>
                                    <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                                      {profile.isTaskCompetitor && (
                                        <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                                          <Trophy className="w-3 h-3" />
                                          <span>Competitor</span>
                                        </span>
                                      )}
                                      {profile.pin && (
                                        <span className="flex items-center space-x-1 px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full text-xs">
                                          <Shield className="w-3 h-3" />
                                          <span>PIN</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleProfileEdit(profile)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                </button>
                                {state.profiles.length > 1 && (
                                  <button
                                    onClick={() => handleDeleteProfile(profile.id)}
                                    className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                  >
                                    <Trash2 className="w-4 h-4 text-error-600 dark:text-error-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups */}
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
                      {sortedGroups.map((group, index) => {
                        const IconComponent = getIconComponent(group.icon);
                        return (
                          <div
                            key={group.id}
                            ref={(el) => dragRefs.current[group.id] = el}
                            draggable
                            onDragStart={(e) => handleGroupDragStart(e, group.id)}
                            onDragOver={(e) => handleGroupDragOver(e, index)}
                            onDrop={(e) => handleGroupDrop(e, index)}
                            className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-all duration-200 ${
                              draggedGroup === group.id ? 'opacity-50 scale-95' : ''
                            } ${
                              dragOverIndex === index ? 'border-primary-500 shadow-lg' : ''
                            }`}
                          >
                            {editingGroup === group.id ? (
                              // Edit Form
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={groupForm.name || ''}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                      className="input-primary"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Icon
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {getAvailableIcons().map(({ name, component: Icon }) => (
                                        <button
                                          key={name}
                                          onClick={() => setGroupForm(prev => ({ ...prev, icon: name }))}
                                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors duration-200 ${
                                            groupForm.icon === name
                                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                              : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                                          }`}
                                        >
                                          <Icon className="w-5 h-5" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Color
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                      <button
                                        key={color}
                                        onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                          groupForm.color === color
                                            ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                                            : 'border-neutral-300 dark:border-neutral-600'
                                        }`}
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                      Completed Display Mode
                                    </label>
                                    <select
                                      value={groupForm.completedDisplayMode || 'grey-out'}
                                      onChange={(e) => setGroupForm(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
                                      className="input-primary"
                                    >
                                      <option value="grey-out">Grey Out</option>
                                      <option value="grey-drop">Grey & Drop Down</option>
                                      <option value="separate-completed">Separate Section</option>
                                    </select>
                                  </div>

                                  <div className="space-y-3">
                                    <label className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.enableDueDates ?? false}
                                        onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Enable Due Dates</span>
                                    </label>

                                    {groupForm.enableDueDates && (
                                      <label className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={groupForm.sortByDueDate ?? false}
                                          onChange={(e) => setGroupForm(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Sort by Due Date</span>
                                      </label>
                                    )}

                                    <label className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={groupForm.defaultNotifications ?? false}
                                        onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Default Notifications</span>
                                    </label>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                  <button
                                    onClick={handleGroupSave}
                                    className="btn-primary flex items-center space-x-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={handleGroupCancel}
                                    className="btn-secondary flex items-center space-x-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display Mode
                              <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <GripVertical className="w-5 h-5 text-neutral-400 cursor-grab" />
                                  <div className="flex items-center space-x-3">
                                    <div 
                                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: group.color + '20', color: group.color }}
                                    >
                                      <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {group.name}
                                      </h4>
                                      <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="capitalize">{group.completedDisplayMode.replace('-', ' ')}</span>
                                        {group.enableDueDates && (
                                          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                            <Calendar className="w-3 h-3" />
                                            <span>Due Dates</span>
                                          </span>
                                        )}
                                        {group.defaultNotifications && (
                                          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs">
                                            <Bell className="w-3 h-3" />
                                            <span>Notifications</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleGroupEdit(group)}
                                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                                  >
                                    <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                  >
                                    <Trash2 className="w-4 h-4 text-error-600 dark:text-error-400" />
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
                          onClick={() => setShowAIQuery(true)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Open AI Chat</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Provider Selection */}
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">AI Provider</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Choose your AI service provider</p>
                        </div>
                        <select
                          value={tempAISettings.provider}
                          onChange={(e) => setTempAISettings(prev => ({ ...prev, provider: e.target.value as any }))}
                          className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="gemini">Google Gemini</option>
                        </select>
                      </div>

                      {/* Model Selection */}
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Model</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Select the AI model to use</p>
                        </div>
                        <select
                          value={tempAISettings.model}
                          onChange={(e) => setTempAISettings(prev => ({ ...prev, model: e.target.value }))}
                          className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
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
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Assistant</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow AI-powered task insights and analysis</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempAISettings.enabled}
                            onChange={(e) => setTempAISettings(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* Test Connection */}
                      {tempAISettings.apiKey && (
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                          <button
                            onClick={handleTestAIConnection}
                            disabled={testLoading}
                            className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded-lg transition-colors duration-200"
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
                            <div className={`mt-3 p-3 rounded-lg text-sm ${
                              testResult.startsWith('✅') 
                                ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400'
                            }`}>
                              {testResult}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Save Settings */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveAISettings}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save AI Settings</span>
                        </button>
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

                {/* Security */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Security Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Settings Password */}
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {isSettingsPasswordSet ? 'Password protection is enabled' : 'Protect settings access with a password'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            isSettingsPasswordSet
                              ? 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 hover:bg-warning-200 dark:hover:bg-warning-900/30'
                              : 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/30'
                          }`}
                        >
                          {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                        </button>
                      </div>

                      {/* Profile PINs Summary */}
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Profile Security</h4>
                        <div className="space-y-2">
                          {state.profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{profile.avatar}</span>
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">{profile.name}</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                profile.pin && profile.pin.trim().length > 0
                                  ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                  : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {profile.pin && profile.pin.trim().length > 0 ? 'PIN Protected' : 'No PIN'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                          Configure individual profile PINs in the Profiles section
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Query Modal */}
      {showAIQuery && (
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
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title={isSettingsPasswordSet ? "Change Settings Password" : "Set Settings Password"}
        description={isSettingsPasswordSet ? "Enter a new password to protect settings access." : "Set a password to protect access to settings."}
        placeholder="Enter new password..."
        isSettingPassword={true}
      />
    </>
  );
}