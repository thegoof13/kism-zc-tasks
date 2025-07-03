import React, { useState } from 'react';
import { X, Settings, Users, FolderOpen, History, Brain, Palette, Bell, Archive, Plus, Edit, Trash2, Save, Calendar, Type, Trophy, Lock, Shield, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'history' | 'ai' | 'security';

const tabs = [
  { id: 'general' as const, icon: Settings, label: 'General' },
  { id: 'groups' as const, icon: FolderOpen, label: 'Groups' },
  { id: 'profiles' as const, icon: Users, label: 'Profiles' },
  { id: 'history' as const, icon: History, label: 'History' },
  { id: 'ai' as const, icon: Brain, label: 'AI Assistant' },
  { id: 'security' as const, icon: Shield, label: 'Security' },
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');

  if (!isOpen) return null;

  const handleOpenProfileInNewTab = (profileId: string) => {
    // Create a new URL with the profile parameter
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('profile', profileId);
    currentUrl.searchParams.set('bypass_pin', 'true');
    
    // Open in new tab
    window.open(currentUrl.toString(), '_blank');
  };

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary-500" />
          Security Settings
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Configure password protection for settings access and profile PINs.
        </p>
      </div>

      {/* Settings Password */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-warning-500" />
          Settings Password Protection
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password Protection Status
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isSettingsPasswordSet 
                  ? 'Settings are protected with a password' 
                  : 'Settings are not password protected'
                }
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isSettingsPasswordSet 
                ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                : 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400'
            }`}>
              {isSettingsPasswordSet ? 'Protected' : 'Unprotected'}
            </div>
          </div>

          <div className="flex space-x-3">
            {!isSettingsPasswordSet ? (
              <button
                onClick={() => {
                  setPasswordModalType('set');
                  setShowPasswordModal(true);
                }}
                className="btn-primary"
              >
                <Lock className="w-4 h-4 mr-2" />
                Set Password
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setPasswordModalType('set');
                    setShowPasswordModal(true);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Change Password
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove password protection from settings?')) {
                      dispatch({
                        type: 'UPDATE_SETTINGS',
                        updates: { settingsPassword: undefined }
                      });
                    }
                  }}
                  className="px-4 py-2 bg-error-100 hover:bg-error-200 dark:bg-error-900/20 dark:hover:bg-error-900/30 text-error-700 dark:text-error-400 font-medium rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Password
                </button>
              </>
            )}
          </div>

          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-1">
                  Security Notice
                </h5>
                <p className="text-xs text-warning-700 dark:text-warning-300">
                  Passwords are stored in plain text on the server for simplicity. 
                  Do not use passwords that you use for other important accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile PIN Information */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary-500" />
          Profile PIN Protection
        </h4>
        
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Individual profiles can be protected with PINs. Configure PINs in the Profiles tab.
          </p>

          <div className="space-y-3">
            {state.profiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-600 flex items-center justify-center text-sm">
                    {profile.avatar}
                  </div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {profile.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.pin 
                      ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                      : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {profile.pin ? 'PIN Protected' : 'No PIN'}
                  </div>
                  {profile.pin && (
                    <button
                      onClick={() => handleOpenProfileInNewTab(profile.id)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                      title={`Open ${profile.name} in new tab (bypass PIN)`}
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Profile Access Control
                </h5>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  When a profile has a PIN set, users must enter the correct PIN to access that profile. 
                  The browser remembers the selected profile, bypassing PIN requirements for subsequent visits.
                  Click the <ExternalLink className="w-3 h-3 inline mx-1" /> icon to open a PIN-protected profile in a new tab without entering the PIN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Appearance
        </h3>
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
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show Completed Count
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Display completion progress in header
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
                Show Top Collaborator
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Display Top Collaborator section in Trophy popup
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

      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Enable Notifications
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Get notified about due dates and overdue tasks
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
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Task Management
        </h3>
        <div className="space-y-4">
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
            <div className="flex items-center justify-between ml-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Archive after (days)
                </label>
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

  const renderGroupSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Task Groups
        </h3>
        <button
          onClick={() => {
            const newGroup = {
              name: 'New Group',
              color: '#6366F1',
              icon: 'FolderOpen',
              completedDisplayMode: 'grey-out' as const,
              isCollapsed: false,
              enableDueDates: false,
              sortByDueDate: false,
            };
            dispatch({ type: 'ADD_GROUP', group: newGroup });
          }}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </button>
      </div>

      <div className="space-y-3">
        {state.groups.map(group => (
          <div key={group.id} className="card p-4">
            {editingGroup === group.id ? (
              <GroupEditForm
                group={group}
                onSave={(updates) => {
                  dispatch({ type: 'UPDATE_GROUP', groupId: group.id, updates });
                  setEditingGroup(null);
                }}
                onCancel={() => setEditingGroup(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {React.createElement(getIconComponent(group.icon), {
                    className: "w-5 h-5 text-neutral-600 dark:text-neutral-400"
                  })}
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {group.name}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{getCompletedDisplayModeLabel(group.completedDisplayMode)}</span>
                      {group.enableDueDates && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due dates {group.sortByDueDate ? '(sorted)' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingGroup(group.id)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete group "${group.name}"? All tasks in this group will be deleted.`)) {
                        dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 text-error-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          User Profiles
        </h3>
        <button
          onClick={() => {
            const newProfile = {
              name: 'New Profile',
              color: '#6366F1',
              avatar: '👤',
              isActive: false,
              isTaskCompetitor: false,
              permissions: {
                canEditTasks: true,
                canCreateTasks: true,
                canDeleteTasks: true,
              },
            };
            dispatch({ type: 'ADD_PROFILE', profile: newProfile });
          }}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      <div className="space-y-3">
        {state.profiles.map(profile => (
          <div key={profile.id} className="card p-4">
            {editingProfile === profile.id ? (
              <ProfileEditForm
                profile={profile}
                onSave={(updates) => {
                  dispatch({ type: 'UPDATE_PROFILE', profileId: profile.id, updates });
                  setEditingProfile(null);
                }}
                onCancel={() => setEditingProfile(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg font-medium">
                    {profile.avatar}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {profile.name}
                      </h4>
                      {profile.isTaskCompetitor && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                          <Trophy className="w-3 h-3" />
                          <span>Competitor</span>
                        </div>
                      )}
                      {profile.pin && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 text-xs rounded-full">
                          <Lock className="w-3 h-3" />
                          <span>PIN</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {profile.id === state.activeProfileId ? 'Active' : 'Inactive'}
                      {profile.isTaskCompetitor && ' • Participating in task competition'}
                      {profile.pin && ' • PIN protected'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        Permissions:
                      </span>
                      {profile.permissions?.canCreateTasks && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1 rounded">Create</span>
                      )}
                      {profile.permissions?.canEditTasks && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1 rounded">Edit</span>
                      )}
                      {profile.permissions?.canDeleteTasks && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-1 rounded">Delete</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {profile.pin && (
                    <button
                      onClick={() => handleOpenProfileInNewTab(profile.id)}
                      className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                      title={`Open ${profile.name} in new tab (bypass PIN)`}
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingProfile(profile.id)}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                  {state.profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete profile "${profile.name}"?`)) {
                          dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4 text-error-500" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistorySettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Activity History & Analytics
        </h3>
        <button
          onClick={() => setShowDetailedHistory(!showDetailedHistory)}
          className="btn-secondary text-sm"
        >
          {showDetailedHistory ? 'Show Analytics' : 'Show Detailed Log'}
        </button>
      </div>
      
      {!showDetailedHistory ? (
        <HistoryAnalytics 
          history={state.history}
          tasks={state.tasks}
          profiles={state.profiles}
        />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.history.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
              No activity history yet
            </p>
          ) : (
            state.history.slice(0, 50).map(entry => (
              <div key={entry.id} className="card p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {entry.taskTitle}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {entry.action} by {entry.profileName}
                    </p>
                    {entry.details && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {entry.timestamp.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          AI Assistant
        </h3>
        <button
          onClick={() => setShowAIModal(true)}
          className="btn-primary text-sm"
          disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
        >
          <Brain className="w-4 h-4 mr-2" />
          Open AI Chat
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Enable AI Assistant
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Get AI-powered insights about your tasks
            </p>
          </div>
          <input
            type="checkbox"
            checked={state.settings.ai.enabled}
            onChange={(e) => dispatch({
              type: 'UPDATE_SETTINGS',
              updates: {
                ai: { ...state.settings.ai, enabled: e.target.checked }
              }
            })}
            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
          />
        </div>

        {state.settings.ai.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                AI Provider
              </label>
              <select
                value={state.settings.ai.provider}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: {
                    ai: { ...state.settings.ai, provider: e.target.value as any }
                  }
                })}
                className="input-primary"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Model
              </label>
              <select
                value={state.settings.ai.model}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: {
                    ai: { ...state.settings.ai, model: e.target.value }
                  }
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={state.settings.ai.apiKey}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: {
                    ai: { ...state.settings.ai, apiKey: e.target.value }
                  }
                })}
                placeholder="Enter your API key..."
                className="input-primary"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
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

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar Navigation - Icon Only */}
            <div className="w-16 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`p-4 flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title={tab.label}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs font-medium hidden sm:block">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'groups' && renderGroupSettings()}
              {activeTab === 'profiles' && renderProfileSettings()}
              {activeTab === 'history' && renderHistorySettings()}
              {activeTab === 'ai' && renderAISettings()}
              {activeTab === 'security' && renderSecuritySettings()}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
        }}
        onPasswordSet={onSetSettingsPassword}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={passwordModalType === 'set' 
          ? 'Set a password to protect access to settings. This password will be required to open settings in the future.'
          : 'Enter the current password to remove protection from settings.'
        }
        isSettingPassword={passwordModalType === 'set'}
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
      />
    </>
  );
}

// Helper function to get display mode labels
function getCompletedDisplayModeLabel(mode: string): string {
  switch (mode) {
    case 'grey-out':
      return 'Grey out only';
    case 'grey-drop':
      return 'Grey out and drop to bottom of group';
    case 'separate-completed':
      return 'Grey out and put in completed section';
    default:
      return mode;
  }
}

// Group Edit Form Component
function GroupEditForm({ 
  group, 
  onSave, 
  onCancel 
}: { 
  group: any; 
  onSave: (updates: any) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [icon, setIcon] = useState(group.icon);
  const [completedDisplayMode, setCompletedDisplayMode] = useState(group.completedDisplayMode);
  const [enableDueDates, setEnableDueDates] = useState(group.enableDueDates || false);
  const [sortByDueDate, setSortByDueDate] = useState(group.sortByDueDate || false);

  const availableIcons = getAvailableIcons();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      color,
      icon,
      completedDisplayMode,
      enableDueDates,
      sortByDueDate: enableDueDates ? sortByDueDate : false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Icon
        </label>
        <div className="grid grid-cols-6 gap-2">
          {availableIcons.map(({ name, component: IconComponent }) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={`p-2 rounded-lg border transition-colors duration-200 ${
                icon === name
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <IconComponent className="w-5 h-5 mx-auto" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Completed Display Mode
        </label>
        <select
          value={completedDisplayMode}
          onChange={(e) => setCompletedDisplayMode(e.target.value)}
          className="input-primary"
        >
          <option value="grey-out">Grey out only</option>
          <option value="grey-drop">Grey out and drop to bottom of group</option>
          <option value="separate-completed">Grey out and put in completed section</option>
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
          <input
            type="checkbox"
            checked={enableDueDates}
            onChange={(e) => setEnableDueDates(e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
          />
        </div>

        {enableDueDates && (
          <div className="flex items-center justify-between ml-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Sort by Due Date
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Automatically sort tasks by due date
              </p>
            </div>
            <input
              type="checkbox"
              checked={sortByDueDate}
              onChange={(e) => setSortByDueDate(e.target.checked)}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button type="submit" className="flex-1 btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
      </div>
    </form>
  );
}

// Profile Edit Form Component
function ProfileEditForm({ 
  profile, 
  onSave, 
  onCancel 
}: { 
  profile: any; 
  onSave: (updates: any) => void; 
  onCancel: () => void; 
}) {
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [isTaskCompetitor, setIsTaskCompetitor] = useState(profile.isTaskCompetitor || false);
  const [pin, setPin] = useState(profile.pin || '');
  const [permissions, setPermissions] = useState({
    canEditTasks: profile.permissions?.canEditTasks ?? true,
    canCreateTasks: profile.permissions?.canCreateTasks ?? true,
    canDeleteTasks: profile.permissions?.canDeleteTasks ?? true,
  });
  const [avatarType, setAvatarType] = useState<'emoji' | 'text'>(
    // Detect if current avatar is likely an emoji or text
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(profile.avatar) ? 'emoji' : 'text'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      name, 
      color, 
      avatar, 
      isTaskCompetitor,
      pin: pin.trim() || undefined, // Only save PIN if it's not empty
      permissions,
    });
  };

  const commonEmojis = ['👤', '👨', '👩', '🧑', '👶', '👴', '👵', '🙋‍♂️', '🙋‍♀️', '💼', '👨‍💻', '👩‍💻', '🎓', '👨‍🎓', '👩‍🎓'];
  
  const commonTextIcons = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Avatar
        </label>
        
        {/* Avatar Type Toggle */}
        <div className="flex items-center space-x-4 mb-3">
          <button
            type="button"
            onClick={() => setAvatarType('emoji')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200 ${
              avatarType === 'emoji'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="text-lg">😊</span>
            <span className="text-sm font-medium">Emoji</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAvatarType('text')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200 ${
              avatarType === 'text'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm font-medium">Text</span>
          </button>
        </div>

        {/* Avatar Selection Grid */}
        {avatarType === 'emoji' ? (
          <div className="grid grid-cols-8 gap-2 mb-3">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`p-2 rounded-lg border text-lg transition-colors duration-200 ${
                  avatar === emoji
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-2 mb-3">
            {commonTextIcons.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => setAvatar(letter)}
                className={`p-2 rounded-lg border text-sm font-bold transition-colors duration-200 ${
                  avatar === letter
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Custom Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder={avatarType === 'emoji' ? "Or enter custom emoji..." : "Or enter custom text..."}
            className="input-primary"
            maxLength={avatarType === 'emoji' ? 4 : 3}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {avatarType === 'emoji' 
              ? 'Choose from emojis above or enter any emoji (up to 4 characters)'
              : 'Choose from letters above or enter custom text (up to 3 characters)'
            }
          </p>
        </div>

        {/* Preview */}
        <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Preview:</p>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-lg font-medium">
              {avatar}
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {name}
            </span>
          </div>
        </div>
      </div>

      {/* Task Permissions */}
      <div className="space-y-3">
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
            <label className="text-sm font-medium text-green-800 dark:text-green-200">
              Task Permissions
            </label>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mb-3">
            Control what this profile can do with tasks. Unchecked permissions will hide related buttons and actions.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canCreateTasks}
                onChange={(e) => setPermissions(prev => ({ ...prev, canCreateTasks: e.target.checked }))}
                className="w-4 h-4 text-green-500 bg-green-100 border-green-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-green-700 dark:text-green-300">Can Create Tasks</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canEditTasks}
                onChange={(e) => setPermissions(prev => ({ ...prev, canEditTasks: e.target.checked }))}
                className="w-4 h-4 text-blue-500 bg-blue-100 border-blue-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-blue-700 dark:text-blue-300">Can Edit Tasks</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canDeleteTasks}
                onChange={(e) => setPermissions(prev => ({ ...prev, canDeleteTasks: e.target.checked }))}
                className="w-4 h-4 text-red-500 bg-red-100 border-red-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-red-700 dark:text-red-300">Can Delete Tasks</span>
            </label>
          </div>
        </div>
      </div>

      {/* PIN Protection */}
      <div className="space-y-3">
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
              PIN Protection
            </label>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
            Set a PIN to protect this profile. Users will need to enter the PIN to access this profile's tasks.
          </p>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 4-6 digit PIN (optional)"
            className="input-primary"
            maxLength={6}
            pattern="[0-9]*"
          />
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Leave empty to remove PIN protection. PIN must be 4-6 digits.
          </p>
        </div>
      </div>

      {/* Task Competitor Checkbox */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <label className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Task Competitor
              </label>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Participate in task completion rankings and compete with other profiles
            </p>
          </div>
          <input
            type="checkbox"
            checked={isTaskCompetitor}
            onChange={(e) => setIsTaskCompetitor(e.target.checked)}
            className="w-4 h-4 text-yellow-500 bg-yellow-100 border-yellow-300 rounded focus:ring-yellow-500"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button type="submit" className="flex-1 btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
      </div>
    </form>
  );
}