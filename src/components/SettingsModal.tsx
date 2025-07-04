import React, { useState } from 'react';
import { X, Settings, User, Users, History, Brain, Shield, Eye, EyeOff, Calendar, Bell, BellOff, Palette, Moon, Sun, Monitor, Save, Plus, Edit, Trash2, ChevronDown, ChevronRight, Trophy, Crown, GripVertical, Database, Download, Upload, BarChart3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type TabType = 'general' | 'groups' | 'profiles' | 'data' | 'history' | 'ai' | 'security';

const availableAvatars = [
  '👤', '😊', '😎', '😍', '🤔', '😴', '🤗', '🤓',
  '👨', '👩', '🧑', '👶', '👴', '👵', '🧔', '👱'
];

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const { isDark, toggleTheme } = useTheme();
  
  // All useState hooks must be declared at the top, unconditionally
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');
  const [profilePin, setProfilePin] = useState('');
  const [profilePermissions, setProfilePermissions] = useState({
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true
  });
  const [profileMealTimes, setProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00'
  });
  const [isTaskCompetitor, setIsTaskCompetitor] = useState(false);
  const [groupDisplayMode, setGroupDisplayMode] = useState<'grey-out' | 'grey-drop' | 'separate-completed'>('grey-out');
  const [enableDueDates, setEnableDueDates] = useState(false);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [defaultNotifications, setDefaultNotifications] = useState(false);
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [draggedProfileId, setDraggedProfileId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);

  // Early return AFTER all hooks are declared
  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as TabType, name: 'General', icon: Settings },
    { id: 'groups' as TabType, name: 'Groups', icon: Users },
    { id: 'profiles' as TabType, name: 'Profiles', icon: User },
    { id: 'data' as TabType, name: 'Data', icon: Database },
    { id: 'history' as TabType, name: 'History', icon: History },
    { id: 'ai' as TabType, name: 'AI Assistant', icon: Brain },
    { id: 'security' as TabType, name: 'Security', icon: Shield },
    { id: 'data' as TabType, name: 'Data', icon: Database },
  ];

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;

    const profileData = {
      name: newProfileName.trim(),
      avatar: newProfileAvatar,
      color: newProfileColor,
      isActive: true,
      isTaskCompetitor,
      pin: profilePin || undefined,
      permissions: profilePermissions,
      mealTimes: profileMealTimes,
    };

    if (editingProfile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        profileId: editingProfile,
        updates: profileData,
      });
    } else {
      dispatch({
        type: 'ADD_PROFILE',
        profile: profileData,
      });
    }

    // Reset form
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setProfilePin('');
    setIsTaskCompetitor(false);
    setProfilePermissions({
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true
    });
    setProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00'
    });
    setShowAddProfileForm(false);
  };

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile.id);
    setNewProfileName(profile.name);
    setNewProfileAvatar(profile.avatar);
    setNewProfileColor(profile.color);
    setProfilePin(profile.pin || '');
    setIsTaskCompetitor(profile.isTaskCompetitor || false);
    setProfilePermissions(profile.permissions || {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true
    });
    setProfileMealTimes(profile.mealTimes || {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00'
    });
    setShowAddProfileForm(true);
  };

  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return;

    const groupData = {
      name: newGroupName.trim(),
      color: newGroupColor,
      icon: newGroupIcon,
      completedDisplayMode: groupDisplayMode,
      isCollapsed: false,
      enableDueDates,
      sortByDueDate: enableDueDates ? sortByDueDate : false,
      defaultNotifications,
    };

    if (editingGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        groupId: editingGroup,
        updates: groupData,
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        group: groupData,
      });
    }

    // Reset form
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setGroupDisplayMode('grey-out');
    setEnableDueDates(false);
    setSortByDueDate(false);
    setDefaultNotifications(false);
    setShowAddGroupForm(false);
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group.id);
    setNewGroupName(group.name);
    setNewGroupColor(group.color);
    setNewGroupIcon(group.icon);
    setGroupDisplayMode(group.completedDisplayMode);
    setEnableDueDates(group.enableDueDates || false);
    setSortByDueDate(group.sortByDueDate || false);
    setDefaultNotifications(group.defaultNotifications || false);
    setShowAddGroupForm(true);
  };

  const handleStartAddProfile = () => {
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setProfilePin('');
    setIsTaskCompetitor(false);
    setProfilePermissions({
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true
    });
    setProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00'
    });
    setShowAddProfileForm(true);
  };

  const handleStartAddGroup = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setGroupDisplayMode('grey-out');
    setEnableDueDates(false);
    setSortByDueDate(false);
    setDefaultNotifications(false);
    setShowAddGroupForm(true);
  };

  // Drag and drop handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, profileId: string) => {
    setDraggedProfileId(profileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleProfileDrop = (e: React.DragEvent, targetProfileId: string) => {
    e.preventDefault();
    if (!draggedProfileId || draggedProfileId === targetProfileId) return;

    const profiles = [...state.profiles];
    const draggedIndex = profiles.findIndex(p => p.id === draggedProfileId);
    const targetIndex = profiles.findIndex(p => p.id === targetProfileId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder profiles
    const [draggedProfile] = profiles.splice(draggedIndex, 1);
    profiles.splice(targetIndex, 0, draggedProfile);

    // Update order values
    const reorderedProfileIds = profiles.map(p => p.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedProfileIds });

    setDraggedProfileId(null);
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;

    const groups = [...state.groups];
    const draggedIndex = groups.findIndex(g => g.id === draggedGroupId);
    const targetIndex = groups.findIndex(g => g.id === targetGroupId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder groups
    const [draggedGroup] = groups.splice(draggedIndex, 1);
    groups.splice(targetIndex, 0, draggedGroup);

    // Update order values
    const reorderedGroupIds = groups.map(g => g.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedGroupIds });

    setDraggedGroupId(null);
  };

  // Data management functions
  const downloadData = async (type: 'json' | 'log') => {
    try {
      let data;
      let filename;
      let mimeType;
      
      if (type === 'json') {
        // Download current application state
        data = JSON.stringify(state, null, 2);
        filename = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Download activity log from server
        const response = await fetch('/api/activity/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch activity log');
        }
        const logData = await response.json();
        data = logData.map(entry => 
          `[${entry.timestamp}] ${JSON.stringify(entry)}`
        ).join('\n');
        filename = `focusflow-activity-${new Date().toISOString().split('T')[0]}.log`;
        mimeType = 'text/plain';
      }
      
      // Create and download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download data. Please try again.');
    }
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
              
              {/* Theme Setting */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Theme</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Choose your preferred theme
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="btn-secondary"
                  >
                    {isDark ? 'Light' : 'Dark'}
                  </button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      {state.settings.enableNotifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Notifications</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Enable browser notifications
                      </p>
                    </div>
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

                {/* Show Completed Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Show Completed Count</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Display task completion progress in header
                      </p>
                    </div>
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

                {/* Show Top Collaborator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Display collaboration leaderboard
                      </p>
                    </div>
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
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">View Only Mode Active</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You can view tasks but cannot modify them
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch({
                        type: 'UPDATE_SETTINGS',
                        updates: { viewOnlyMode: false }
                      })}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span className="text-sm font-medium">Disable</span>
                    </button>
                  </div>
                )}
              </div>
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
                onClick={handleStartAddGroup}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </button>
            </div>

            {/* Group Form */}
            {showAddGroupForm && (
              <div className="card p-4 space-y-4">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {editingGroup ? 'Edit Group' : 'New Group'}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="input-primary"
                    placeholder="Enter group name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewGroupColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          newGroupColor === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Display Mode
                  </label>
                  <select
                    value={groupDisplayMode}
                    onChange={(e) => setGroupDisplayMode(e.target.value as any)}
                    className="input-primary"
                  >
                    <option value="grey-out">Grey Out Completed</option>
                    <option value="grey-drop">Grey Out and Drop Down</option>
                    <option value="separate-completed">Separate Completed Section</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Enable Due Dates</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Allow tasks in this group to have due dates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableDueDates}
                      onChange={(e) => setEnableDueDates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {enableDueDates && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">Sort by Due Date</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Sort tasks by due date instead of manual order
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sortByDueDate}
                        onChange={(e) => setSortByDueDate(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Default Notifications</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Enable notifications by default for new tasks
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultNotifications}
                      onChange={(e) => setDefaultNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddGroupForm(false)}
                    className="btn-secondary flex-1"
                  >
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
            )}

            {/* Groups List with Drag and Drop */}
            <div className="space-y-3">
              {state.groups
                .sort((a, b) => a.order - b.order)
                .map(group => (
                <div 
                  key={group.id} 
                  className="card p-4 cursor-move"
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, group.id)}
                  onDragOver={handleGroupDragOver}
                  onDrop={(e) => handleGroupDrop(e, group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {group.name}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {group.completedDisplayMode.replace('-', ' ')}
                          {group.enableDueDates && ' • Due dates enabled'}
                          {group.sortByDueDate && ' • Sorted by due date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete group "${group.name}"? This will also delete all tasks in this group.`)) {
                            dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-error-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profiles':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                User Profiles
              </h3>
              <button
                onClick={handleStartAddProfile}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </button>
            </div>

            {/* Profile Form */}
            {showAddProfileForm && (
              <div className="card p-4 space-y-4">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {editingProfile ? 'Edit Profile' : 'New Profile'}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="input-primary"
                    placeholder="Enter profile name..."
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
                        onClick={() => setNewProfileAvatar(avatar)}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                          newProfileAvatar === avatar 
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
                        onClick={() => setNewProfileColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          newProfileColor === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">Task Competitor</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Participate in task completion rankings
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaskCompetitor}
                      onChange={(e) => setIsTaskCompetitor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    PIN Protection
                  </label>
                  <input
                    type="password"
                    value={profilePin}
                    onChange={(e) => setProfilePin(e.target.value)}
                    className="input-primary"
                    placeholder="Optional PIN for profile protection..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profilePermissions.canCreateTasks}
                        onChange={(e) => setProfilePermissions(prev => ({
                          ...prev,
                          canCreateTasks: e.target.checked
                        }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profilePermissions.canEditTasks}
                        onChange={(e) => setProfilePermissions(prev => ({
                          ...prev,
                          canEditTasks: e.target.checked
                        }))}
                        className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={profilePermissions.canDeleteTasks}
                        onChange={(e) => setProfilePermissions(prev => ({
                          ...prev,
                          canDeleteTasks: e.target.checked
                        }))}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
                      <input
                        type="time"
                        value={profileMealTimes.breakfast}
                        onChange={(e) => setProfileMealTimes(prev => ({
                          ...prev,
                          breakfast: e.target.value
                        }))}
                        className="input-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
                      <input
                        type="time"
                        value={profileMealTimes.lunch}
                        onChange={(e) => setProfileMealTimes(prev => ({
                          ...prev,
                          lunch: e.target.value
                        }))}
                        className="input-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
                      <input
                        type="time"
                        value={profileMealTimes.dinner}
                        onChange={(e) => setProfileMealTimes(prev => ({
                          ...prev,
                          dinner: e.target.value
                        }))}
                        className="input-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
                      <input
                        type="time"
                        value={profileMealTimes.nightcap}
                        onChange={(e) => setProfileMealTimes(prev => ({
                          ...prev,
                          nightcap: e.target.value
                        }))}
                        className="input-primary text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddProfileForm(false)}
                    className="btn-secondary flex-1"
                  >
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
            )}

            {/* Profiles List with Drag and Drop */}
            <div className="space-y-3">
              {state.profiles
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(profile => (
                <div 
                  key={profile.id} 
                  className="card p-4 cursor-move"
                  draggable
                  onDragStart={(e) => handleProfileDragStart(e, profile.id)}
                  onDragOver={handleProfileDragOver}
                  onDrop={(e) => handleProfileDrop(e, profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="w-4 h-4 text-neutral-400" />
                      <div className="text-2xl">{profile.avatar}</div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {profile.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                          {profile.isTaskCompetitor && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                              Competitor
                            </span>
                          )}
                          {profile.pin && (
                            <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full text-xs">
                              PIN Protected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProfile(profile)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {state.profiles.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete profile "${profile.name}"?`)) {
                              dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-error-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex-shrink-0">
              Task History & Analytics
            </h3>
            <div className="flex-1 overflow-y-auto">
              <HistoryAnalytics 
                history={state.history} 
                tasks={state.tasks} 
                profiles={state.profiles} 
              />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                AI Task Assistant
              </h3>
              <button
                onClick={() => setShowAIModal(true)}
                className="btn-primary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Open AI Assistant
              </button>
            </div>

            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                AI Task Assistant
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                Get insights about your task patterns, productivity trends, and personalized recommendations.
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="btn-primary"
              >
                <Brain className="w-4 h-4 mr-2" />
                Start AI Assistant
              </button>
            </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isSettingsPasswordSet ? 'Password is set' : 'No password set'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-secondary"
                >
                  {isSettingsPasswordSet ? 'Change' : 'Set'} Password
                </button>
              </div>
            </div>

            {/* Profile Security */}
            <div className="card p-4">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">Profile Security</h4>
              <div className="space-y-3">
                {state.profiles.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">{profile.avatar}</div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{profile.name}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {profile.pin ? 'PIN Protected' : 'No PIN'}
                        </p>
                      </div>
                    </div>
                    {profile.pin && (
                      <a
                        href={`?profile=${profile.id}&bypass_pin=true`}
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Bypass PIN
                      </a>
                    )}
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
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in m-4 flex overflow-hidden">
          {/* Sidebar - Responsive */}
          <div className="w-16 md:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="hidden md:block text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </div>
            
            <nav className="p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center md:justify-start space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden md:block font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
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
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title="Set Settings Password"
        description="Set a password to protect access to settings."
        isSettingPassword={true}
      />
    </>
  );
}