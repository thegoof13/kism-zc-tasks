import React, { useState, useEffect } from 'react';
import { X, Settings, Users, BarChart3, Brain, Shield, Palette, Bell, Eye, EyeOff, Plus, Edit, Trash2, Save, Cancel, GripVertical, Calendar, Clock, User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart, Lock, Unlock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile } from '../types';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type TabType = 'general' | 'groups' | 'profiles' | 'history' | 'ai' | 'security';

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

const availableAvatars = [
  '👤', '😊', '😎', '😍', '😄', '😁', '😆', '🤗',
  '🧑', '👩', '🧔', '👨‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨'
];

const availableColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  
  // All useState hooks declared at the top level, unconditionally
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366F1');
  const [newGroupIcon, setNewGroupIcon] = useState('User');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileAvatar, setNewProfileAvatar] = useState('👤');
  const [newProfileColor, setNewProfileColor] = useState('#6366F1');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [newProfilePermissions, setNewProfilePermissions] = useState({
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
  });
  const [newProfileIsCompetitor, setNewProfileIsCompetitor] = useState(false);
  const [newProfileMealTimes, setNewProfileMealTimes] = useState({
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);

  // Early return after all hooks are declared
  if (!isOpen) return null;

  const handleUpdateSettings = (updates: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', updates });
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: Omit<TaskGroup, 'id' | 'createdAt' | 'order'> = {
      name: newGroupName.trim(),
      color: newGroupColor,
      icon: newGroupIcon,
      completedDisplayMode: 'grey-out',
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };

    dispatch({ type: 'ADD_GROUP', group: newGroup });
    
    // Reset form
    setNewGroupName('');
    setNewGroupColor('#6366F1');
    setNewGroupIcon('User');
    setShowNewGroupForm(false);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<TaskGroup>) => {
    dispatch({ type: 'UPDATE_GROUP', groupId, updates });
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? All tasks in this group will also be deleted.')) {
      dispatch({ type: 'DELETE_GROUP', groupId });
    }
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;

    const newProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: newProfileName.trim(),
      avatar: newProfileAvatar,
      color: newProfileColor,
      isActive: true,
      isTaskCompetitor: newProfileIsCompetitor,
      pin: newProfilePin.trim() || undefined,
      permissions: newProfilePermissions,
      mealTimes: newProfileMealTimes,
    };

    dispatch({ type: 'ADD_PROFILE', profile: newProfile });
    
    // Reset form
    setNewProfileName('');
    setNewProfileAvatar('👤');
    setNewProfileColor('#6366F1');
    setNewProfilePin('');
    setNewProfilePermissions({
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
    });
    setNewProfileIsCompetitor(false);
    setNewProfileMealTimes({
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      nightcap: '21:00',
    });
    setShowNewProfileForm(false);
  };

  const handleUpdateProfile = (profileId: string, updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', profileId, updates });
    setEditingProfile(null);
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

  const handleSetPassword = (password: string) => {
    onSetSettingsPassword(password);
    setShowPasswordModal(false);
  };

  const handleRemovePassword = () => {
    if (window.confirm('Are you sure you want to remove the settings password?')) {
      onSetSettingsPassword('');
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'groups' as TabType, label: 'Groups', icon: BarChart3 },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Users },
    { id: 'history' as TabType, label: 'History', icon: Clock },
    { id: 'ai' as TabType, label: 'AI Assistant', icon: Brain },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
  ];

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
                {/* Theme Setting */}
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
                    onChange={(e) => handleUpdateSettings({ theme: e.target.value })}
                    className="input-primary w-32"
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
                      onChange={(e) => handleUpdateSettings({ showCompletedCount: e.target.checked })}
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
                      Receive browser notifications for tasks
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.settings.enableNotifications}
                      onChange={(e) => handleUpdateSettings({ enableNotifications: e.target.checked })}
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
                      onChange={(e) => handleUpdateSettings({ showTopCollaborator: e.target.checked })}
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
                        checked={!state.settings.viewOnlyMode}
                        onChange={(e) => handleUpdateSettings({ viewOnlyMode: !e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                    </label>
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
                onClick={() => setShowNewGroupForm(true)}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </button>
            </div>

            {/* New Group Form */}
            {showNewGroupForm && (
              <div className="card p-4 border-2 border-primary-200 dark:border-primary-800">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  New Group
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewGroupColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newGroupColor === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Icon
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {availableIcons.map(({ name, component: IconComponent }) => (
                          <button
                            key={name}
                            onClick={() => setNewGroupIcon(name)}
                            className={`p-2 rounded border ${
                              newGroupIcon === name 
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddGroup}
                      className="btn-primary text-sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => setShowNewGroupForm(false)}
                      className="btn-secondary text-sm"
                    >
                      <Cancel className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Groups List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.groups.map(group => {
                const IconComponent = availableIcons.find(icon => icon.name === group.icon)?.component || User;
                const isEditing = editingGroup === group.id;
                
                return (
                  <div key={group.id} className="card p-4">
                    {isEditing ? (
                      <EditGroupForm
                        group={group}
                        onSave={(updates) => handleUpdateGroup(group.id, updates)}
                        onCancel={() => setEditingGroup(null)}
                      />
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
                              <span>{group.completedDisplayMode}</span>
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
                            onClick={() => setEditingGroup(group.id)}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <Edit className="w-4 h-4 text-neutral-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                User Profiles
              </h3>
              <button
                onClick={() => setShowNewProfileForm(true)}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </button>
            </div>

            {/* New Profile Form */}
            {showNewProfileForm && (
              <div className="card p-4 border-2 border-primary-200 dark:border-primary-800">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  New Profile
                </h4>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
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

                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Avatar
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {availableAvatars.map(avatar => (
                        <button
                          key={avatar}
                          onClick={() => setNewProfileAvatar(avatar)}
                          className={`p-2 text-lg rounded border ${
                            newProfileAvatar === avatar 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                              : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
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
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewProfileColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newProfileColor === color ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Task Competitor */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="newTaskCompetitor"
                      checked={newProfileIsCompetitor}
                      onChange={(e) => setNewProfileIsCompetitor(e.target.checked)}
                      className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="newTaskCompetitor" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Task Competitor
                    </label>
                  </div>

                  {/* PIN Protection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      PIN Protection
                    </label>
                    <input
                      type="password"
                      value={newProfilePin}
                      onChange={(e) => setNewProfilePin(e.target.value)}
                      className="input-primary"
                      placeholder="Optional PIN (leave empty for no PIN)"
                    />
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
                          checked={newProfilePermissions.canCreateTasks}
                          onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canCreateTasks: e.target.checked }))}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={newProfilePermissions.canEditTasks}
                          onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canEditTasks: e.target.checked }))}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={newProfilePermissions.canDeleteTasks}
                          onChange={(e) => setNewProfilePermissions(prev => ({ ...prev, canDeleteTasks: e.target.checked }))}
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
                          value={newProfileMealTimes.breakfast}
                          onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
                          className="input-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
                        <input
                          type="time"
                          value={newProfileMealTimes.lunch}
                          onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
                          className="input-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
                        <input
                          type="time"
                          value={newProfileMealTimes.dinner}
                          onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
                          className="input-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
                        <input
                          type="time"
                          value={newProfileMealTimes.nightcap}
                          onChange={(e) => setNewProfileMealTimes(prev => ({ ...prev, nightcap: e.target.value }))}
                          className="input-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddProfile}
                      className="btn-primary text-sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => setShowNewProfileForm(false)}
                      className="btn-secondary text-sm"
                    >
                      <Cancel className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profiles List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.profiles.map(profile => {
                const isEditing = editingProfile === profile.id;
                
                return (
                  <div key={profile.id} className="card p-4">
                    {isEditing ? (
                      <EditProfileForm
                        profile={profile}
                        onSave={(updates) => handleUpdateProfile(profile.id, updates)}
                        onCancel={() => setEditingProfile(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-4 h-4 text-neutral-400 cursor-move" />
                          <span className="text-lg">{profile.avatar}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </h4>
                              {profile.isTaskCompetitor && (
                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                                  Competitor
                                </span>
                              )}
                              {profile.pin && (
                                <Lock className="w-3 h-3 text-warning-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <span>
                                {[
                                  profile.permissions?.canCreateTasks && 'Create',
                                  profile.permissions?.canEditTasks && 'Edit',
                                  profile.permissions?.canDeleteTasks && 'Delete'
                                ].filter(Boolean).join(', ') || 'No permissions'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingProfile(profile.id)}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <Edit className="w-4 h-4 text-neutral-500" />
                          </button>
                          {state.profiles.length > 1 && (
                            <button
                              onClick={() => handleDeleteProfile(profile.id)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
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
        );

      case 'history':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Activity History & Analytics
            </h3>
            <div className="max-h-96 overflow-y-auto">
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
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                title="AI Settings"
              >
                <Settings className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
              <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Ask me anything about your tasks!
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                I can analyze your task history, identify patterns, and provide insights to help you be more productive.
              </p>
              <button
                onClick={() => setShowAIModal(true)}
                className="btn-primary"
              >
                <Brain className="w-5 h-5 mr-2" />
                Open AI Assistant
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
            
            <div className="space-y-4">
              {/* Settings Password */}
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      Settings Password
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {isSettingsPasswordSet ? 'Password protection is enabled' : 'Protect settings access with a password'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isSettingsPasswordSet ? (
                      <>
                        <Unlock className="w-4 h-4 text-success-500" />
                        <button
                          onClick={handleRemovePassword}
                          className="btn-secondary text-sm"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-neutral-400" />
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="btn-primary text-sm"
                        >
                          Set Password
                        </button>
                      </>
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
                          <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                            {profile.name}
                          </h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {profile.pin ? 'PIN protected' : 'No PIN protection'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {profile.pin ? (
                          <Lock className="w-4 h-4 text-warning-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-neutral-400" />
                        )}
                        {profile.pin && (
                          <button
                            onClick={() => {
                              // Bypass PIN for this profile
                              const url = new URL(window.location.href);
                              url.searchParams.set('profile', profile.id);
                              url.searchParams.set('bypass_pin', 'true');
                              window.open(url.toString(), '_blank');
                            }}
                            className="btn-secondary text-xs"
                          >
                            Bypass PIN
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
        
        <div className="relative flex w-full max-w-6xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in m-4 overflow-hidden settings-modal">
          {/* Sidebar */}
          <div className="w-16 sm:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hidden sm:block">
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </div>
            
            <nav className="p-2">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center sm:justify-start space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium hidden sm:block">{tab.label}</span>
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
        onUpdateSettings={(updates) => handleUpdateSettings({ ai: { ...state.settings.ai, ...updates } })}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={handleSetPassword}
        title="Set Settings Password"
        description="Create a password to protect access to settings."
        isSettingPassword={true}
      />
    </>
  );
}

// Edit Group Form Component
function EditGroupForm({ 
  group, 
  onSave, 
  onCancel 
}: { 
  group: TaskGroup; 
  onSave: (updates: Partial<TaskGroup>) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [icon, setIcon] = useState(group.icon);
  const [completedDisplayMode, setCompletedDisplayMode] = useState(group.completedDisplayMode);
  const [enableDueDates, setEnableDueDates] = useState(group.enableDueDates);
  const [sortByDueDate, setSortByDueDate] = useState(group.sortByDueDate);
  const [defaultNotifications, setDefaultNotifications] = useState(group.defaultNotifications || false);

  const handleSave = () => {
    onSave({
      name: name.trim(),
      color,
      icon,
      completedDisplayMode,
      enableDueDates,
      sortByDueDate: enableDueDates ? sortByDueDate : false,
      defaultNotifications,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-primary"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(availableColor => (
              <button
                key={availableColor}
                onClick={() => setColor(availableColor)}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === availableColor ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
                }`}
                style={{ backgroundColor: availableColor }}
              />
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-5 gap-1">
            {availableIcons.map(({ name: iconName, component: IconComponent }) => (
              <button
                key={iconName}
                onClick={() => setIcon(iconName)}
                className={`p-1 rounded border ${
                  icon === iconName 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                <IconComponent className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Completed Display Mode
        </label>
        <select
          value={completedDisplayMode}
          onChange={(e) => setCompletedDisplayMode(e.target.value as any)}
          className="input-primary"
        >
          <option value="grey-out">Grey Out</option>
          <option value="grey-drop">Grey Drop</option>
          <option value="separate-completed">Separate Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={enableDueDates}
            onChange={(e) => setEnableDueDates(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Enable Due Dates
          </span>
        </label>

        {enableDueDates && (
          <label className="flex items-center space-x-3 ml-7">
            <input
              type="checkbox"
              checked={sortByDueDate}
              onChange={(e) => setSortByDueDate(e.target.checked)}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Sort tasks by next due date
            </span>
          </label>
        )}

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={defaultNotifications}
            onChange={(e) => setDefaultNotifications(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Default Notifications
          </span>
        </label>
      </div>

      <div className="flex space-x-2">
        <button onClick={handleSave} className="btn-primary text-sm">
          <Save className="w-4 h-4 mr-1" />
          Save
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          <Cancel className="w-4 h-4 mr-1" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// Edit Profile Form Component
function EditProfileForm({ 
  profile, 
  onSave, 
  onCancel 
}: { 
  profile: UserProfile; 
  onSave: (updates: Partial<UserProfile>) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);
  const [isTaskCompetitor, setIsTaskCompetitor] = useState(profile.isTaskCompetitor || false);
  const [pin, setPin] = useState(profile.pin || '');
  const [permissions, setPermissions] = useState(profile.permissions || {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
  });
  const [mealTimes, setMealTimes] = useState(profile.mealTimes || {
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    nightcap: '21:00',
  });

  const handleSave = () => {
    onSave({
      name: name.trim(),
      avatar,
      color,
      isTaskCompetitor,
      pin: pin.trim() || undefined,
      permissions,
      mealTimes,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Avatar
        </label>
        <div className="grid grid-cols-8 gap-2">
          {availableAvatars.map(availableAvatar => (
            <button
              key={availableAvatar}
              onClick={() => setAvatar(availableAvatar)}
              className={`p-2 text-lg rounded border ${
                avatar === availableAvatar 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              {availableAvatar}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map(availableColor => (
            <button
              key={availableColor}
              onClick={() => setColor(availableColor)}
              className={`w-6 h-6 rounded-full border-2 ${
                color === availableColor ? 'border-neutral-900 dark:border-neutral-100' : 'border-neutral-300 dark:border-neutral-600'
              }`}
              style={{ backgroundColor: availableColor }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isTaskCompetitor}
            onChange={(e) => setIsTaskCompetitor(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Task Competitor
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          PIN Protection
        </label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="input-primary"
          placeholder="Optional PIN (leave empty for no PIN)"
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
              checked={permissions.canCreateTasks}
              onChange={(e) => setPermissions(prev => ({ ...prev, canCreateTasks: e.target.checked }))}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can create tasks</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={permissions.canEditTasks}
              onChange={(e) => setPermissions(prev => ({ ...prev, canEditTasks: e.target.checked }))}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can edit tasks</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={permissions.canDeleteTasks}
              onChange={(e) => setPermissions(prev => ({ ...prev, canDeleteTasks: e.target.checked }))}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Can delete tasks</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Meal Times
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Breakfast</label>
            <input
              type="time"
              value={mealTimes.breakfast}
              onChange={(e) => setMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
              className="input-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Lunch</label>
            <input
              type="time"
              value={mealTimes.lunch}
              onChange={(e) => setMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
              className="input-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Dinner</label>
            <input
              type="time"
              value={mealTimes.dinner}
              onChange={(e) => setMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
              className="input-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">Night Cap</label>
            <input
              type="time"
              value={mealTimes.nightcap}
              onChange={(e) => setMealTimes(prev => ({ ...prev, nightcap: e.target.value }))}
              className="input-primary text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button onClick={handleSave} className="btn-primary text-sm">
          <Save className="w-4 h-4 mr-1" />
          Save
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          <Cancel className="w-4 h-4 mr-1" />
          Cancel
        </button>
      </div>
    </div>
  );
}