import React, { useState, useRef } from 'react';
import { X, Settings, Users, Layers, Shield, Brain, History, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Crown, Trophy, Calendar, Target, Award, Clock, RefreshCw, CheckCircle, TrendingUp, Medal, Star, Save, TestTube, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIService } from '../services/aiService';

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
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  
  // AI Settings state
  const [tempAISettings, setTempAISettings] = useState<AISettings>(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const profilesRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'groups' as const, label: 'Groups', icon: Layers },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  // Profile drag and drop handlers
  const handleProfileDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProfileIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProfileIndex === null || draggedProfileIndex === index) return;

    const profiles = [...state.profiles];
    const draggedProfile = profiles[draggedProfileIndex];
    profiles.splice(draggedProfileIndex, 1);
    profiles.splice(index, 0, draggedProfile);

    // Update order property
    const reorderedProfiles = profiles.map((profile, idx) => ({
      ...profile,
      order: idx,
    }));

    dispatch({
      type: 'REORDER_PROFILES',
      profileIds: reorderedProfiles.map(p => p.id),
    });

    setDraggedProfileIndex(index);
  };

  const handleProfileDragEnd = () => {
    setDraggedProfileIndex(null);
  };

  // Group drag and drop handlers
  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedGroupIndex === null || draggedGroupIndex === index) return;

    const groups = [...state.groups];
    const draggedGroup = groups[draggedGroupIndex];
    groups.splice(draggedGroupIndex, 1);
    groups.splice(index, 0, draggedGroup);

    // Update order property
    const reorderedGroups = groups.map((group, idx) => ({
      ...group,
      order: idx,
    }));

    dispatch({
      type: 'REORDER_GROUPS',
      groupIds: reorderedGroups.map(g => g.id),
    });

    setDraggedGroupIndex(index);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupIndex(null);
  };

  // AI Settings handlers
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

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          General Settings
        </h3>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {state.tasks.filter(t => t.isCompleted).length}
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
              {Math.round(((state.tasks.filter(t => t.isCompleted).length - state.history.filter(h => h.action === 'unchecked').length) / Math.max(state.tasks.filter(t => t.isCompleted).length, 1)) * 100)}%
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Accuracy Rate
            </p>
          </div>
        </div>

        <div className="space-y-4">
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
                Receive browser notifications for due dates and task resets
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
                Display collaboration rankings in trophy view
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

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Auto-archive Completed Tasks
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Automatically archive old completed tasks
              </p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.autoArchiveCompleted}
              onChange={(e) => dispatch({
                type: 'UPDATE_SETTINGS',
                updates: { autoArchiveCompleted: e.target.checked }
              })}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>

          {state.settings.autoArchiveCompleted && (
            <div className="flex items-center justify-between ml-6">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Archive after (days)
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Number of days before archiving completed tasks
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={state.settings.archiveDays}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: { archiveDays: parseInt(e.target.value) }
                })}
                className="input-primary w-20"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfilesSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Profiles
        </h3>
        <button
          onClick={() => setEditingProfile({
            id: '',
            name: '',
            color: '#6366F1',
            avatar: '👤',
            isActive: true,
            createdAt: new Date(),
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
          })}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      {/* Horizontal scrollable profiles */}
      <div 
        ref={profilesRef}
        className="flex space-x-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {state.profiles
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((profile, index) => (
          <div
            key={profile.id}
            draggable
            onDragStart={(e) => handleProfileDragStart(e, index)}
            onDragOver={(e) => handleProfileDragOver(e, index)}
            onDragEnd={handleProfileDragEnd}
            className={`flex-shrink-0 w-64 card p-4 cursor-move transition-all duration-200 ${
              draggedProfileIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                {profile.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {profile.name}
                </h4>
                <div className="flex items-center space-x-2">
                  {profile.isTaskCompetitor && (
                    <Trophy className="w-3 h-3 text-yellow-500" title="Task Competitor" />
                  )}
                  {profile.pin && (
                    <div className="w-2 h-2 bg-warning-500 rounded-full" title="PIN Protected" />
                  )}
                  {profile.id === state.activeProfileId && (
                    <div className="w-2 h-2 bg-success-500 rounded-full" title="Active Profile" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Create Tasks:</span>
                <span>{profile.permissions?.canCreateTasks ? '✓' : '✗'}</span>
              </div>
              <div className="flex justify-between">
                <span>Edit Tasks:</span>
                <span>{profile.permissions?.canEditTasks ? '✓' : '✗'}</span>
              </div>
              <div className="flex justify-between">
                <span>Delete Tasks:</span>
                <span>{profile.permissions?.canDeleteTasks ? '✓' : '✗'}</span>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setEditingProfile(profile)}
                className="flex-1 btn-secondary text-xs py-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </button>
              {state.profiles.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete profile "${profile.name}"?`)) {
                      dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                    }
                  }}
                  className="flex-1 bg-error-500 hover:bg-error-600 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        💡 Drag profiles to reorder them. The order affects profile selection and display throughout the app.
      </div>
    </div>
  );

  const renderGroupsSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Task Groups
        </h3>
        <button
          onClick={() => setEditingGroup({
            id: '',
            name: '',
            color: '#6366F1',
            icon: 'Layers',
            completedDisplayMode: 'grey-out',
            isCollapsed: false,
            order: state.groups.length,
            createdAt: new Date(),
            enableDueDates: false,
            sortByDueDate: false,
            defaultNotifications: false,
          })}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </button>
      </div>

      {/* Horizontal scrollable groups */}
      <div 
        ref={groupsRef}
        className="flex space-x-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {state.groups
          .sort((a, b) => a.order - b.order)
          .map((group, index) => {
            const IconComponent = getIconComponent(group.icon);
            const groupTasks = state.tasks.filter(t => t.groupId === group.id);
            
            return (
              <div
                key={group.id}
                draggable
                onDragStart={(e) => handleGroupDragStart(e, index)}
                onDragOver={(e) => handleGroupDragOver(e, index)}
                onDragEnd={handleGroupDragEnd}
                className={`flex-shrink-0 w-64 card p-4 cursor-move transition-all duration-200 ${
                  draggedGroupIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    <IconComponent 
                      className="w-6 h-6" 
                      style={{ color: group.color }} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {group.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Due Dates:</span>
                    <span>{group.enableDueDates ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sort by Due Date:</span>
                    <span>{group.sortByDueDate ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Notifications:</span>
                    <span>{group.defaultNotifications ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Display Mode:</span>
                    <span className="capitalize">{group.completedDisplayMode.replace('-', ' ')}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="flex-1 btn-secondary text-xs py-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  {state.groups.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete group "${group.name}" and all its tasks?`)) {
                          dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                        }
                      }}
                      className="flex-1 bg-error-500 hover:bg-error-600 text-white text-xs py-1 px-2 rounded transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        💡 Drag groups to reorder them. The order affects how task groups appear in the main interface.
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Security Settings
      </h3>

      {/* Settings Password */}
      <div className="card p-6">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Settings Password
        </h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Profile Security
        </h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    PIN Protected
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('profile', profile.id);
                  url.searchParams.set('bypass_pin', 'true');
                  window.open(url.toString(), '_blank');
                }}
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
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          AI Assistant
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAISettings(true)}
            className="btn-secondary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure AI
          </button>
          {state.settings.ai.enabled && state.settings.ai.apiKey && (
            <button
              onClick={() => setShowAIQuery(true)}
              className="btn-primary"
            >
              <Brain className="w-4 h-4 mr-2" />
              Ask AI
            </button>
          )}
        </div>
      </div>

      {/* AI Status */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            state.settings.ai.enabled && state.settings.ai.apiKey
              ? 'bg-success-100 dark:bg-success-900/20'
              : 'bg-neutral-100 dark:bg-neutral-700'
          }`}>
            <Brain className={`w-6 h-6 ${
              state.settings.ai.enabled && state.settings.ai.apiKey
                ? 'text-success-600 dark:text-success-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`} />
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
              {state.settings.ai.enabled && state.settings.ai.apiKey ? 'AI Assistant Active' : 'AI Assistant Inactive'}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {state.settings.ai.enabled && state.settings.ai.apiKey
                ? `Using ${state.settings.ai.provider} (${state.settings.ai.model})`
                : 'Configure AI settings to enable intelligent task analysis'
              }
            </p>
          </div>
        </div>

        {state.settings.ai.enabled && state.settings.ai.apiKey ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Provider:</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {state.settings.ai.provider}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Model:</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {state.settings.ai.model}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
              <span className="text-success-600 dark:text-success-400 font-medium">
                Ready
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              AI Assistant is not configured. Set up your API key to enable intelligent task analysis and insights.
            </p>
            <button
              onClick={() => setShowAISettings(true)}
              className="btn-primary"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure AI Settings
            </button>
          </div>
        )}
      </div>

      {/* AI Features */}
      <div className="card p-6">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          AI Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                Productivity Analysis
              </h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get insights about your task completion patterns and trends
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                Smart Recommendations
              </h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Receive AI-powered suggestions for improving your workflow
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                Pattern Recognition
              </h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Identify when you're most productive and optimize your schedule
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Award className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                Performance Insights
              </h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Understand your task completion accuracy and consistency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistorySettings = () => (
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'profiles':
        return renderProfilesSettings();
      case 'groups':
        return renderGroupsSettings();
      case 'security':
        return renderSecuritySettings();
      case 'ai':
        return renderAISettings();
      case 'history':
        return renderHistorySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in m-4 overflow-hidden flex settings-modal">
          {/* Sidebar Navigation - Responsive width */}
          <div className="w-16 sm:w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hidden sm:block">
                Settings
              </h2>
              <Settings className="w-6 h-6 text-neutral-900 dark:text-neutral-100 sm:hidden mx-auto" />
            </div>
            
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium hidden sm:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title="Settings Password"
        description="Set a password to protect access to settings."
        isSettingPassword={true}
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

      {/* Profile Edit Modal */}
      {editingProfile && (
        <ProfileEditModal
          profile={editingProfile}
          onSave={(profile) => {
            if (profile.id) {
              dispatch({ type: 'UPDATE_PROFILE', profileId: profile.id, updates: profile });
            } else {
              dispatch({ type: 'ADD_PROFILE', profile });
            }
            setEditingProfile(null);
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* Group Edit Modal */}
      {editingGroup && (
        <GroupEditModal
          group={editingGroup}
          onSave={(group) => {
            if (group.id) {
              dispatch({ type: 'UPDATE_GROUP', groupId: group.id, updates: group });
            } else {
              dispatch({ type: 'ADD_GROUP', group });
            }
            setEditingGroup(null);
          }}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </>
  );
}

// Profile Edit Modal Component
function ProfileEditModal({ 
  profile, 
  onSave, 
  onClose 
}: { 
  profile: UserProfile; 
  onSave: (profile: UserProfile) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(profile);
  const [showPin, setShowPin] = useState(false);

  const avatarOptions = [
    '👤', '😊', '😎', '🤓', '😇', '🤗', '🤔', '🤩',
    '🧑‍💼', '👩‍💼', '🧑‍🎓', '👩‍🎓', '🧑‍💻', '👩‍💻', '🧑‍🎨', '👩‍🎨'
  ];

  const colorOptions = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
    '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {profile.id ? 'Edit Profile' : 'Add Profile'}
          </h2>
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
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-primary"
              required
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-8 gap-2">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all duration-200 ${
                    formData.avatar === avatar
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
            <div className="flex space-x-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    formData.color === color
                      ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Task Competitor */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isTaskCompetitor}
                onChange={(e) => setFormData(prev => ({ ...prev, isTaskCompetitor: e.target.checked }))}
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
                value={formData.pin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
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

          {/* View Only Mode */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.viewOnlyMode || false}
                onChange={(e) => setFormData(prev => ({ ...prev, viewOnlyMode: e.target.checked }))}
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
                  checked={formData.permissions?.canCreateTasks ?? true}
                  onChange={(e) => setFormData(prev => ({
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
                  checked={formData.permissions?.canEditTasks ?? true}
                  onChange={(e) => setFormData(prev => ({
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
                  checked={formData.permissions?.canDeleteTasks ?? true}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.mealTimes?.breakfast || '07:00'}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.mealTimes?.lunch || '12:00'}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.mealTimes?.dinner || '18:00'}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.mealTimes?.nightcap || '21:00'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    mealTimes: { ...prev.mealTimes, nightcap: e.target.value }
                  }))}
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
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Group Edit Modal Component
function GroupEditModal({ 
  group, 
  onSave, 
  onClose 
}: { 
  group: TaskGroup; 
  onSave: (group: TaskGroup) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(group);
  const availableIcons = getAvailableIcons();

  const colorOptions = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
    '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {group.id ? 'Edit Group' : 'Add Group'}
          </h2>
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
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-primary"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableIcons.map(({ name, component: IconComponent }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    formData.icon === name
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
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
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    formData.color === color
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Completed Tasks Display
            </label>
            <select
              value={formData.completedDisplayMode}
              onChange={(e) => setFormData(prev => ({ ...prev, completedDisplayMode: e.target.value as any }))}
              className="input-primary"
            >
              <option value="grey-out">Grey Out</option>
              <option value="grey-drop">Grey Out & Drop Down</option>
              <option value="separate-completed">Separate Section</option>
            </select>
          </div>

          {/* Due Dates */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.enableDueDates}
                onChange={(e) => setFormData(prev => ({ ...prev, enableDueDates: e.target.checked }))}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable Due Dates
              </span>
            </label>
          </div>

          {/* Sort by Due Date */}
          {formData.enableDueDates && (
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.sortByDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortByDueDate: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Sort by Due Date
                </span>
              </label>
            </div>
          )}

          {/* Default Notifications */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.defaultNotifications}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultNotifications: e.target.checked }))}
                className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Default Notifications
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
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}