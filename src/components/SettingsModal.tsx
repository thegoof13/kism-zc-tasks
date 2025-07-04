import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Users, Folder, Shield, Brain, History, User, Briefcase, Heart, Home, Book, Car, Coffee, Dumbbell, Music, ShoppingCart, Plus, Edit, Trash2, Eye, EyeOff, Lock, Crown, Trophy, Medal, Star, CheckCircle, RefreshCw, Target, Award, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, CompletedDisplayMode } from '../types';
import { getIconComponent } from '../utils/icons';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'profiles' | 'groups' | 'security' | 'ai' | 'history';

const tabConfig = [
  { id: 'general' as const, label: 'General', icon: SettingsIcon },
  { id: 'profiles' as const, label: 'Profiles', icon: Users },
  { id: 'groups' as const, label: 'Groups', icon: Folder },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
  { id: 'history' as const, label: 'History', icon: History },
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);

  if (!isOpen) return null;

  const handleSetPassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSet = (password: string) => {
    onSetSettingsPassword(password);
    setShowPasswordModal(false);
  };

  const handleOpenAI = () => {
    setShowAIModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'profiles':
        return <ProfilesSettings editingProfile={editingProfile} setEditingProfile={setEditingProfile} />;
      case 'groups':
        return <GroupsSettings editingGroup={editingGroup} setEditingGroup={setEditingGroup} />;
      case 'security':
        return <SecuritySettings onSetPassword={handleSetPassword} isPasswordSet={isSettingsPasswordSet} />;
      case 'ai':
        return <AISettings onOpenAI={handleOpenAI} />;
      case 'history':
        return <HistorySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
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
            {/* Sidebar Navigation */}
            <div className="w-16 sm:w-64 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <nav className="p-2 sm:p-4 space-y-1">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title={tab.label} // Always show tooltip for accessibility
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {/* Show label only on sm screens and up */}
                      <span className="hidden sm:block font-medium text-sm">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
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
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={handlePasswordSet}
        title="Set Settings Password"
        description="Create a password to protect access to settings. This adds an extra layer of security."
        placeholder="Enter new password..."
        isSettingPassword={true}
      />

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
        onUpdateSettings={(updates) => {
          dispatch({
            type: 'UPDATE_SETTINGS',
            updates: { ai: { ...state.settings.ai, ...updates } }
          });
        }}
      />
    </>
  );
}

// General Settings Component
function GeneralSettings() {
  const { state, dispatch } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          General Settings
        </h3>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {state.history.filter(h => h.action === 'completed').length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Tasks Completed
            </p>
          </div>

          <div className="card p-4 text-center">
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {state.history.filter(h => h.action === 'unchecked').length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Tasks Unchecked
            </p>
          </div>

          <div className="card p-4 text-center">
            <div className="w-12 h-12 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <RefreshCw className="w-6 h-6 text-error-600 dark:text-error-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {state.history.filter(h => h.action === 'reset').length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Reset Tasks
            </p>
          </div>

          <div className="card p-4 text-center">
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {Math.round(((state.history.filter(h => h.action === 'completed').length - state.history.filter(h => h.action === 'unchecked').length) / Math.max(state.history.filter(h => h.action === 'completed').length, 1)) * 100)}%
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Accuracy Rate
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Theme Setting */}
        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            Appearance
          </h4>
          <div className="space-y-3">
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
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            Notifications
          </h4>
          <div className="space-y-3">
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Get notified about due dates and task resets
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Display Options */}
        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            Display Options
          </h4>
          <div className="space-y-3">
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
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Show completed count in header
              </span>
            </label>

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
                  Display collaboration rankings in trophy modal
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Auto-archive */}
        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            Task Management
          </h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.settings.autoArchiveCompleted}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: { autoArchiveCompleted: e.target.checked }
                })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Auto-archive completed tasks
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Automatically archive old completed tasks
                </p>
              </div>
            </label>

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
                  onChange={(e) => dispatch({
                    type: 'UPDATE_SETTINGS',
                    updates: { archiveDays: parseInt(e.target.value) || 30 }
                  })}
                  className="input-primary w-24"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profiles Settings Component
function ProfilesSettings({ editingProfile, setEditingProfile }: { editingProfile: UserProfile | null; setEditingProfile: (profile: UserProfile | null) => void }) {
  const { state, dispatch } = useApp();

  const handleAddProfile = () => {
    const newProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: 'New Profile',
      color: '#6366F1',
      avatar: '👤',
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

  const handleDeleteProfile = (profileId: string) => {
    if (state.profiles.length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }

    if (window.confirm('Are you sure you want to delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', profileId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Profiles
        </h3>
        <button
          onClick={handleAddProfile}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.profiles
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(profile => (
            <div key={profile.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                    {profile.avatar}
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {profile.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {profile.isTaskCompetitor && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                          <Trophy className="w-3 h-3" />
                          <span>Competitor</span>
                        </span>
                      )}
                      {profile.pin && profile.pin.trim().length > 0 && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full">
                          <Lock className="w-3 h-3" />
                          <span>PIN</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                  {state.profiles.length > 1 && (
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4 text-error-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Can create tasks:</span>
                  <span className={profile.permissions?.canCreateTasks ? 'text-success-600' : 'text-error-600'}>
                    {profile.permissions?.canCreateTasks ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Can edit tasks:</span>
                  <span className={profile.permissions?.canEditTasks ? 'text-success-600' : 'text-error-600'}>
                    {profile.permissions?.canEditTasks ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Can delete tasks:</span>
                  <span className={profile.permissions?.canDeleteTasks ? 'text-success-600' : 'text-error-600'}>
                    {profile.permissions?.canDeleteTasks ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={(updates) => {
            dispatch({
              type: 'UPDATE_PROFILE',
              profileId: editingProfile.id,
              updates
            });
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
}

// Groups Settings Component
function GroupsSettings({ editingGroup, setEditingGroup }: { editingGroup: TaskGroup | null; setEditingGroup: (group: TaskGroup | null) => void }) {
  const { state, dispatch } = useApp();

  const handleAddGroup = () => {
    const newGroup: Omit<TaskGroup, 'id' | 'createdAt' | 'order'> = {
      name: 'New Group',
      color: '#6366F1',
      icon: 'Folder',
      completedDisplayMode: 'grey-out',
      isCollapsed: false,
      enableDueDates: false,
      sortByDueDate: false,
      defaultNotifications: false,
    };

    dispatch({ type: 'ADD_GROUP', group: newGroup });
  };

  const handleDeleteGroup = (groupId: string) => {
    const tasksInGroup = state.tasks.filter(task => task.groupId === groupId);
    
    if (tasksInGroup.length > 0) {
      if (!window.confirm(`This group contains ${tasksInGroup.length} tasks. Are you sure you want to delete it? All tasks in this group will also be deleted.`)) {
        return;
      }
    }

    dispatch({ type: 'DELETE_GROUP', groupId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Task Groups
        </h3>
        <button
          onClick={handleAddGroup}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.groups
          .sort((a, b) => a.order - b.order)
          .map(group => {
            const IconComponent = getIconComponent(group.icon);
            const tasksInGroup = state.tasks.filter(task => task.groupId === group.id);
            
            return (
              <div key={group.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: group.color + '20' }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: group.color }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {group.name}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {tasksInGroup.length} task{tasksInGroup.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingGroup(group)}
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

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Display mode:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 capitalize">
                      {group.completedDisplayMode.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Due dates:</span>
                    <span className={group.enableDueDates ? 'text-success-600' : 'text-neutral-500'}>
                      {group.enableDueDates ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Default notifications:</span>
                    <span className={group.defaultNotifications ? 'text-success-600' : 'text-neutral-500'}>
                      {group.defaultNotifications ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={(updates) => {
            dispatch({
              type: 'UPDATE_GROUP',
              groupId: editingGroup.id,
              updates
            });
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
}

// Security Settings Component
function SecuritySettings({ onSetPassword, isPasswordSet }: { onSetPassword: () => void; isPasswordSet: boolean }) {
  const { state } = useApp();

  // Get PIN-protected profiles
  const pinProtectedProfiles = state.profiles.filter(profile => 
    profile.pin && profile.pin.trim().length > 0
  );

  const generatePinBypassUrl = (profileId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?profile=${profileId}&bypass_pin=true`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Security Settings
      </h3>

      {/* Settings Password */}
      <div className="card p-6">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Settings Password
        </h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Protect access to settings with a password
        </p>
        
        <button
          onClick={onSetPassword}
          className="btn-primary"
        >
          {isPasswordSet ? 'Change Password' : 'Set Password'}
        </button>
      </div>

      {/* Profile Security */}
      <div className="card p-6">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Profile Security
        </h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          PIN-protected profiles and bypass options
        </p>

        {pinProtectedProfiles.length > 0 ? (
          <div className="space-y-3">
            {pinProtectedProfiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{profile.avatar}</span>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {profile.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      PIN Protected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const url = generatePinBypassUrl(profile.id);
                    window.open(url, '_blank');
                  }}
                  className="btn-secondary text-sm"
                  title="Open profile in new tab without PIN requirement"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Bypass PIN
                </button>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>PIN Bypass:</strong> Use the external link button to open a profile in a new tab without entering 
                the PIN. This is useful for administrative access or when PINs are forgotten.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No PIN-protected profiles configured. Set up PINs in the Profiles section for additional security.
          </p>
        )}
      </div>
    </div>
  );
}

// AI Settings Component
function AISettings({ onOpenAI }: { onOpenAI: () => void }) {
  const { state, dispatch } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          AI Assistant
        </h3>
        {state.settings.ai.enabled && state.settings.ai.apiKey && (
          <button
            onClick={onOpenAI}
            className="btn-primary"
          >
            <Brain className="w-4 h-4 mr-2" />
            Open AI Assistant
          </button>
        )}
      </div>

      <div className="card p-6">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          Configuration
        </h4>
        
        <div className="space-y-4">
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
                  ai: { 
                    ...state.settings.ai, 
                    provider: e.target.value as any,
                    model: e.target.value === 'openai' ? 'gpt-4' :
                           e.target.value === 'anthropic' ? 'claude-3-sonnet-20240229' :
                           'gemini-pro'
                  } 
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
                updates: { ai: { ...state.settings.ai, model: e.target.value } }
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
                updates: { ai: { ...state.settings.ai, apiKey: e.target.value } }
              })}
              placeholder="Enter your API key..."
              className="input-primary"
            />
          </div>

          {/* Enable AI */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.settings.ai.enabled}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: { ai: { ...state.settings.ai, enabled: e.target.checked } }
                })}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable AI Assistant
              </span>
            </label>
          </div>
        </div>

        {!state.settings.ai.enabled || !state.settings.ai.apiKey ? (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Configure your AI settings above and enable the assistant to get insights about your task patterns and productivity.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
            <p className="text-sm text-success-700 dark:text-success-300">
              AI Assistant is configured and ready to use! Click "Open AI Assistant" to start asking questions about your tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// History Settings Component
function HistorySettings() {
  const { state } = useApp();

  return (
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
}

// Edit Profile Modal Component
function EditProfileModal({ 
  profile, 
  onClose, 
  onSave 
}: { 
  profile: UserProfile; 
  onClose: () => void; 
  onSave: (updates: Partial<UserProfile>) => void; 
}) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);
  const [isTaskCompetitor, setIsTaskCompetitor] = useState(profile.isTaskCompetitor || false);
  const [pin, setPin] = useState(profile.pin || '');
  const [showPin, setShowPin] = useState(false);
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

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👶', '🧓', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨', '🧑‍💻', '👨‍💻', '👩‍💻'];
  const colorOptions = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      avatar,
      color,
      isTaskCompetitor,
      pin: pin.trim() || undefined,
      permissions,
      mealTimes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-primary"
              required
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {avatarOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvatar(option)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    avatar === option
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-lg">{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Color
            </label>
            <div className="flex space-x-2">
              {colorOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    color === option
                      ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          {/* Task Competitor */}
          <div>
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

          {/* PIN Protection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              PIN Protection
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN (optional)"
                className="input-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
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

          {/* Meal Times */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
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

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Group Modal Component
function EditGroupModal({ 
  group, 
  onClose, 
  onSave 
}: { 
  group: TaskGroup; 
  onClose: () => void; 
  onSave: (updates: Partial<TaskGroup>) => void; 
}) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [icon, setIcon] = useState(group.icon);
  const [completedDisplayMode, setCompletedDisplayMode] = useState<CompletedDisplayMode>(group.completedDisplayMode);
  const [enableDueDates, setEnableDueDates] = useState(group.enableDueDates);
  const [sortByDueDate, setSortByDueDate] = useState(group.sortByDueDate);
  const [defaultNotifications, setDefaultNotifications] = useState(group.defaultNotifications || false);

  const iconOptions = [
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

  const colorOptions = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      color,
      icon,
      completedDisplayMode,
      enableDueDates,
      sortByDueDate,
      defaultNotifications,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Group
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-primary"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map(option => {
                const IconComponent = option.component;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setIcon(option.name)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      icon === option.name
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mx-auto" />
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
            <div className="flex space-x-2">
              {colorOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    color === option
                      ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          {/* Completed Display Mode */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Completed Tasks Display
            </label>
            <select
              value={completedDisplayMode}
              onChange={(e) => setCompletedDisplayMode(e.target.value as CompletedDisplayMode)}
              className="input-primary"
            >
              <option value="grey-out">Grey out completed tasks</option>
              <option value="grey-drop">Grey out and move to bottom</option>
              <option value="separate-completed">Separate completed section</option>
            </select>
          </div>

          {/* Due Dates */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enableDueDates}
                onChange={(e) => setEnableDueDates(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Enable due dates
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Allow tasks in this group to have due dates
                </p>
              </div>
            </label>
          </div>

          {/* Sort by Due Date */}
          {enableDueDates && (
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={sortByDueDate}
                  onChange={(e) => setSortByDueDate(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                checked={defaultNotifications}
                onChange={(e) => setDefaultNotifications(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default notifications
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  New tasks in this group will have notifications enabled by default
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}