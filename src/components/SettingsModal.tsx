import React, { useState, useRef } from 'react';
import { X, Settings, User, Users, Folder, Brain, History, Shield, Plus, Edit, Trash2, GripVertical, Save, Ambulance as Cancel, Eye, EyeOff, TestTube, Send, MessageSquare, TrendingUp, Calendar, Target, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { HistoryAnalytics } from './HistoryAnalytics';
import { PasswordModal } from './PasswordModal';
import { AIService } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type TabType = 'general' | 'profiles' | 'groups' | 'ai' | 'history' | 'security';

interface QueryResponse {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

const availableAvatars = [
  '👤', '😊', '😎', '😍', '😄', '😁', '😆', '🤓',
  '🧑', '👨', '👩', '🧒', '👶', '🧓', '👴', '👵',
  '🙂', '😉', '😇', '🤗', '🤔', '😴', '🤠', '🥳'
];

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');
  const [selectedProfileForPassword, setSelectedProfileForPassword] = useState<string | null>(null);
  
  // AI Assistant state
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<QueryResponse[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [tempAISettings, setTempAISettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Drag and drop state
  const [draggedProfile, setDraggedProfile] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const suggestedQueries = [
    "What are my task completion patterns?",
    "Which tasks do I complete most consistently?",
    "How many tasks did I accidentally check this week?",
    "What's my productivity trend over time?",
    "Which task groups need more attention?",
    "When am I most productive during the day?",
  ];

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Users },
    { id: 'groups' as TabType, label: 'Groups', icon: Folder },
    { id: 'ai' as TabType, label: 'AI Assistant', icon: Brain },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
  ];

  if (!isOpen) return null;

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '👤',
    color: '#6366F1',
    isTaskCompetitor: false,
    pin: '',
    viewOnlyMode: false,
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

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    color: '#6366F1',
    icon: 'Folder',
    completedDisplayMode: 'grey-out' as const,
    enableDueDates: false,
    sortByDueDate: false,
    defaultNotifications: false,
  });

  const handleEditProfile = (profile: UserProfile) => {
    setProfileForm({
      name: profile.name,
      avatar: profile.avatar,
      color: profile.color,
      isTaskCompetitor: profile.isTaskCompetitor || false,
      pin: profile.pin || '',
      viewOnlyMode: profile.viewOnlyMode || false,
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
    if (!editingProfile) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile,
      updates: profileForm,
    });
    setEditingProfile(null);
  };

  const handleEditGroup = (group: TaskGroup) => {
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
    if (!editingGroup) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup,
      updates: groupForm,
    });
    setEditingGroup(null);
  };

  const handleAddProfile = () => {
    const newProfile = {
      name: 'New Profile',
      avatar: '👤',
      color: '#6366F1',
      isActive: true,
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
      icon: 'Folder',
      completedDisplayMode: 'grey-out' as const,
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };

    dispatch({ type: 'ADD_GROUP', group: newGroup });
  };

  // AI Assistant functions
  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await AIService.queryTasks({
        query: aiQuery.trim(),
        history: state.history,
        tasks: state.tasks,
        profiles: state.profiles,
        groups: state.groups,
        aiSettings: state.settings.ai,
      });

      const newResponse: QueryResponse = {
        id: Date.now().toString(),
        query: aiQuery.trim(),
        response,
        timestamp: new Date(),
      };

      setAiResponses(prev => [newResponse, ...prev]);
      setAiQuery('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setAiQuery(suggestedQuery);
  };

  const handleTestConnection = async () => {
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
    setShowAISettings(false);
    setTestResult(null);
  };

  // Drag and drop handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, profileId: string) => {
    setDraggedProfile(profileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleProfileDrop = (e: React.DragEvent, targetProfileId: string) => {
    e.preventDefault();
    if (!draggedProfile || draggedProfile === targetProfileId) return;

    const profiles = [...state.profiles];
    const draggedIndex = profiles.findIndex(p => p.id === draggedProfile);
    const targetIndex = profiles.findIndex(p => p.id === targetProfileId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder profiles
    const [draggedItem] = profiles.splice(draggedIndex, 1);
    profiles.splice(targetIndex, 0, draggedItem);

    // Update order property
    const reorderedProfiles = profiles.map((profile, index) => ({
      ...profile,
      order: index,
    }));

    // Dispatch reorder action
    dispatch({
      type: 'REORDER_PROFILES',
      profileIds: reorderedProfiles.map(p => p.id),
    });

    setDraggedProfile(null);
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroup(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggedGroup || draggedGroup === targetGroupId) return;

    const groups = [...state.groups];
    const draggedIndex = groups.findIndex(g => g.id === draggedGroup);
    const targetIndex = groups.findIndex(g => g.id === targetGroupId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder groups
    const [draggedItem] = groups.splice(draggedIndex, 1);
    groups.splice(targetIndex, 0, draggedItem);

    // Update order property
    const reorderedGroups = groups.map((group, index) => ({
      ...group,
      order: index,
    }));

    // Dispatch reorder action
    dispatch({
      type: 'REORDER_GROUPS',
      groupIds: reorderedGroups.map(g => g.id),
    });

    setDraggedGroup(null);
  };

  const handleSetProfilePassword = (profileId: string) => {
    setSelectedProfileForPassword(profileId);
    setPasswordModalType('set');
    setShowPasswordModal(true);
  };

  const handleRemoveProfilePassword = (profileId: string) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      profileId,
      updates: { pin: '' }
    });
  };

  const handlePasswordSet = (password: string) => {
    if (selectedProfileForPassword) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: selectedProfileForPassword,
        updates: { pin: password }
      });
    }
    setShowPasswordModal(false);
    setSelectedProfileForPassword(null);
  };

  const handleBypassPin = (profileId: string) => {
    // Create URL with bypass parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profileId);
    currentUrl.searchParams.set('bypass_pin', 'true');
    
    // Open in new tab
    window.open(currentUrl.toString(), '_blank');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                General Settings
              </h3>
              
              <div className="space-y-4">
                {/* View Only Mode Toggle */}
                {state.settings.viewOnlyMode && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">
                            View Only Mode Active
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            You can view tasks but cannot modify them
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Disable
                        </span>
                        <input
                          type="checkbox"
                          checked={!state.settings.viewOnlyMode}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_SETTINGS',
                            updates: { viewOnlyMode: !e.target.checked }
                          })}
                          className="w-4 h-4 text-blue-500 bg-blue-100 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Theme
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Choose your preferred color scheme
                    </p>
                  </div>
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
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Show Completed Count
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
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

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Receive browser notifications for tasks
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

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Show Top Collaborator
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Display collaboration leaderboard
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
            </div>
          </div>
        );

      case 'profiles':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Profiles
              </h3>
              <button
                onClick={handleAddProfile}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.profiles
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((profile) => (
                <div
                  key={profile.id}
                  className={`card p-4 transition-all duration-200 ${
                    draggedProfile === profile.id ? 'opacity-50 scale-95' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleProfileDragStart(e, profile.id)}
                  onDragOver={handleProfileDragOver}
                  onDrop={(e) => handleProfileDrop(e, profile.id)}
                >
                  {editingProfile === profile.id ? (
                    <div className="space-y-4">
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
                        />
                      </div>

                      {/* Avatar */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Avatar
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                          {availableAvatars.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => setProfileForm(prev => ({ ...prev, avatar }))}
                              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all duration-200 ${
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

                      {/* Color */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={profileForm.color}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-12 h-8 rounded border border-neutral-300 dark:border-neutral-600"
                          />
                          <div className="flex space-x-1">
                            {availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setProfileForm(prev => ({ ...prev, color }))}
                                className="w-6 h-6 rounded border-2 border-white dark:border-neutral-800"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Task Competitor */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`competitor-${profile.id}`}
                          checked={profileForm.isTaskCompetitor}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor={`competitor-${profile.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Task Competitor
                        </label>
                      </div>

                      {/* PIN Protection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          PIN Protection
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="password"
                            value={profileForm.pin}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, pin: e.target.value }))}
                            placeholder="Enter PIN (optional)"
                            className="input-primary flex-1"
                          />
                          <button
                            type="button"
                            className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Disable View Only Mode */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`viewonly-${profile.id}`}
                          checked={!profileForm.viewOnlyMode}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, viewOnlyMode: !e.target.checked }))}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <div>
                          <label htmlFor={`viewonly-${profile.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Disable View Only Mode
                          </label>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            When enabled, this profile cannot be accessed in view-only mode
                          </p>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Permissions
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`create-${profile.id}`}
                              checked={profileForm.permissions.canCreateTasks}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, canCreateTasks: e.target.checked }
                              }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`create-${profile.id}`} className="text-sm text-neutral-700 dark:text-neutral-300">
                              Can create tasks
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`edit-${profile.id}`}
                              checked={profileForm.permissions.canEditTasks}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, canEditTasks: e.target.checked }
                              }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`edit-${profile.id}`} className="text-sm text-neutral-700 dark:text-neutral-300">
                              Can edit tasks
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`delete-${profile.id}`}
                              checked={profileForm.permissions.canDeleteTasks}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                permissions: { ...prev.permissions, canDeleteTasks: e.target.checked }
                              }))}
                              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`delete-${profile.id}`} className="text-sm text-neutral-700 dark:text-neutral-300">
                              Can delete tasks
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Meal Times */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
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
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                mealTimes: { ...prev.mealTimes, breakfast: e.target.value }
                              }))}
                              className="input-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                              Lunch
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
                              Dinner
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
                              Night Cap
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

                      {/* Actions */}
                      <div className="flex space-x-2 pt-4">
                        <button
                          onClick={() => setEditingProfile(null)}
                          className="btn-secondary flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="btn-primary flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: profile.color + '20', color: profile.color }}
                      >
                        {profile.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {profile.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                          {profile.isTaskCompetitor && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                              Competitor
                            </span>
                          )}
                          {profile.pin && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full">
                              PIN Protected
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditProfile(profile)}
                          className="p-2 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'DELETE_PROFILE', profileId: profile.id })}
                          className="p-2 text-neutral-500 hover:text-error-600 dark:hover:text-error-400 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="space-y-6">
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.groups
                .sort((a, b) => a.order - b.order)
                .map((group) => {
                  const IconComponent = getIconComponent(group.icon);
                  return (
                    <div
                      key={group.id}
                      className={`card p-4 transition-all duration-200 ${
                        draggedGroup === group.id ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleGroupDragStart(e, group.id)}
                      onDragOver={handleGroupDragOver}
                      onDrop={(e) => handleGroupDrop(e, group.id)}
                    >
                      {editingGroup === group.id ? (
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

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Color
                            </label>
                            <input
                              type="color"
                              value={groupForm.color}
                              onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                              className="w-full h-10 rounded border border-neutral-300 dark:border-neutral-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Icon
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                              {getAvailableIcons().map(({ name, component: Icon }) => (
                                <button
                                  key={name}
                                  onClick={() => setGroupForm(prev => ({ ...prev, icon: name }))}
                                  className={`p-2 rounded border-2 transition-all duration-200 ${
                                    groupForm.icon === name
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                      : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                                  }`}
                                >
                                  <Icon className="w-5 h-5 mx-auto" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`duedates-${group.id}`}
                                checked={groupForm.enableDueDates}
                                onChange={(e) => setGroupForm(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <label htmlFor={`duedates-${group.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Enable Due Dates
                              </label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`notifications-${group.id}`}
                                checked={groupForm.defaultNotifications}
                                onChange={(e) => setGroupForm(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                              />
                              <label htmlFor={`notifications-${group.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Default Notifications
                              </label>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-4">
                            <button
                              onClick={() => setEditingGroup(null)}
                              className="btn-secondary flex-1"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveGroup}
                              className="btn-primary flex-1"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: group.color + '20', color: group.color }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {group.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {group.enableDueDates && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                                  Due Dates
                                </span>
                              )}
                              {group.defaultNotifications && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                  Notifications
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditGroup(group)}
                              className="p-2 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => dispatch({ type: 'DELETE_GROUP', groupId: group.id })}
                              className="p-2 text-neutral-500 hover:text-error-600 dark:hover:text-error-400 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
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

      case 'ai':
        if (showAISettings) {
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Assistant Settings
                </h3>
                <button
                  onClick={() => setShowAISettings(false)}
                  className="btn-secondary text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Back
                </button>
              </div>

              <div className="space-y-4">
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

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
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
          );
        }

        if (!state.settings.ai.enabled || !state.settings.ai.apiKey) {
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Task Assistant
                </h3>
                <button
                  onClick={() => setShowAISettings(true)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                  title="AI Settings"
                >
                  <Settings className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  AI Assistant Not Configured
                </h4>
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
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Task Assistant
              </h3>
              <button
                onClick={() => setShowAISettings(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                title="AI Settings"
              >
                <Settings className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="flex flex-col h-96">
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {aiResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Ask me anything about your tasks!
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      I can analyze your task history, identify patterns, and provide insights.
                    </p>
                    
                    {/* Suggested Queries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {suggestedQueries.map((suggestedQuery, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuery(suggestedQuery)}
                          className="p-3 text-left bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index < 2 ? <TrendingUp className="w-3 h-3 text-primary-600" /> :
                               index < 4 ? <Calendar className="w-3 h-3 text-primary-600" /> :
                               <Target className="w-3 h-3 text-primary-600" />}
                            </div>
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                              {suggestedQuery}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {aiResponses.map((response) => (
                      <div key={response.id} className="space-y-4">
                        {/* User Query */}
                        <div className="flex justify-end">
                          <div className="max-w-3xl bg-primary-500 text-white rounded-2xl rounded-tr-md px-4 py-3">
                            <p className="text-sm">{response.query}</p>
                          </div>
                        </div>
                        
                        {/* AI Response */}
                        <div className="flex justify-start">
                          <div className="max-w-3xl bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex items-start space-x-3">
                              <Brain className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {response.response.split('\n').map((line, index) => (
                                    <p key={index} className="mb-2 last:mb-0 text-neutral-900 dark:text-neutral-100">
                                      {line}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                  {response.timestamp.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Brain className="w-5 h-5 text-primary-500" />
                        <div className="flex items-center space-x-2">
                          <Loader className="w-4 h-4 animate-spin text-primary-500" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Analyzing your tasks...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {aiError && (
                  <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                    <p className="text-error-700 dark:text-error-400 text-sm">
                      {aiError}
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleAISubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask about your task patterns, productivity, or specific insights..."
                  className="flex-1 input-primary"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || aiLoading}
                  className="btn-primary px-6"
                >
                  {aiLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        );

      case 'history':
        return (
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
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Security Settings
            </h3>

            {/* Settings Password */}
            <div className="card p-4">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Settings Password
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isSettingsPasswordSet 
                      ? 'Password protection is enabled for settings access'
                      : 'No password protection set for settings'
                    }
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPasswordModalType(isSettingsPasswordSet ? 'remove' : 'set');
                    setShowPasswordModal(true);
                  }}
                  className={isSettingsPasswordSet ? 'btn-secondary' : 'btn-primary'}
                >
                  {isSettingsPasswordSet ? 'Remove Password' : 'Set Password'}
                </button>
              </div>
            </div>

            {/* Profile Security */}
            <div className="card p-4">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Profile Security
              </h4>
              <div className="space-y-3">
                {state.profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: profile.color + '20', color: profile.color }}
                      >
                        {profile.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {profile.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {profile.pin ? 'PIN Protected' : 'No PIN set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {profile.pin && (
                        <button
                          onClick={() => handleBypassPin(profile.id)}
                          className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-200"
                        >
                          Bypass PIN
                        </button>
                      )}
                      <button
                        onClick={() => profile.pin ? handleRemoveProfilePassword(profile.id) : handleSetProfilePassword(profile.id)}
                        className={`text-xs px-3 py-1 rounded-full transition-colors duration-200 ${
                          profile.pin 
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                        }`}
                      >
                        {profile.pin ? 'Remove PIN' : 'Set PIN'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          <div className="flex h-full">
            {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Settings
                </h2>
              </div>
              
              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            {/* Mobile Tab Navigation - Horizontal scrollable */}
            <div className="sm:hidden w-full">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
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
              
              <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex flex-col items-center space-y-1 px-4 py-3 transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Desktop Header */}
              <div className="hidden sm:flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          if (passwordModalType === 'remove') {
            if (selectedProfileForPassword) {
              handleRemoveProfilePassword(selectedProfileForPassword);
            } else {
              dispatch({ type: 'UPDATE_SETTINGS', updates: { settingsPassword: '' } });
            }
          }
          setShowPasswordModal(false);
          setSelectedProfileForPassword(null);
        }}
        title={passwordModalType === 'set' ? 'Set Password' : 'Remove Password'}
        description={
          passwordModalType === 'set' 
            ? selectedProfileForPassword 
              ? 'Set a PIN for this profile to protect access.'
              : 'Set a password to protect access to settings.'
            : selectedProfileForPassword
              ? 'Enter the current PIN to remove protection.'
              : 'Enter the current password to remove protection.'
        }
        placeholder={selectedProfileForPassword ? 'Enter new PIN...' : 'Enter new password...'}
        expectedPassword={
          passwordModalType === 'remove' 
            ? selectedProfileForPassword 
              ? state.profiles.find(p => p.id === selectedProfileForPassword)?.pin
              : state.settings.settingsPassword
            : undefined
        }
        onPasswordSet={passwordModalType === 'set' ? handlePasswordSet : undefined}
        isSettingPassword={passwordModalType === 'set'}
      />
    </>
  );
}