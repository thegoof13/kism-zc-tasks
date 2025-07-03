import React, { useState } from 'react';
import { X, Settings, User, Shield, Brain, History, ExternalLink } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AIQueryModal } from './AIQueryModal';
import { HistoryAnalytics } from './HistoryAnalytics';
import { PasswordModal } from './PasswordModal';

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
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
    title: string;
    description: string;
    onSuccess: () => void;
    expectedPassword?: string;
    onPasswordSet?: (password: string) => void;
    isSettingPassword?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleOpenProfileInNewTab = (profile: any) => {
    const url = new URL(window.location.href);
    url.searchParams.set('profile', profile.id);
    url.searchParams.set('bypass_pin', 'true');
    window.open(url.toString(), '_blank');
  };

  const handleUpdateAISettings = (updates: Partial<typeof state.settings.ai>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: { ...state.settings.ai, ...updates }
      }
    });
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profiles' as const, label: 'Profiles', icon: User },
    { id: 'groups' as const, label: 'Groups', icon: Settings },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[95vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
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
            {/* Sidebar - Responsive width and content */}
            <div className="w-12 sm:w-16 md:w-48 border-r border-neutral-200 dark:border-neutral-700 p-2 md:p-3">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-center md:justify-start space-x-0 md:space-x-2 px-2 md:px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                      title={tab.label} // Tooltip for small screens
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {/* Hide text on small screens, show on md and up */}
                      <span className="hidden md:block text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme */}
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
                          className="input-primary max-w-xs"
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
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showCompletedCount: e.target.checked }
                            })}
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
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { enableNotifications: e.target.checked }
                            })}
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
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: { showTopCollaborator: e.target.checked }
                            })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show Top Collaborator in trophy popup
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      User Profiles
                    </h3>
                    
                    <div className="space-y-3">
                      {state.profiles.map(profile => (
                        <div key={profile.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{profile.avatar}</span>
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </h4>
                                <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span>{profile.isTaskCompetitor ? 'Task Competitor' : 'Regular User'}</span>
                                  {profile.pin && (
                                    <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full">
                                      PIN Protected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button className="btn-secondary text-sm">
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Task Groups
                    </h3>
                    
                    <div className="space-y-3">
                      {state.groups.map(group => (
                        <div key={group.id} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              <div>
                                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {group.name}
                                </h4>
                                <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span>{group.completedDisplayMode.replace('-', ' ')}</span>
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
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button className="btn-secondary text-sm">
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Security Settings
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Settings Password */}
                      <div className="card p-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                          Settings Password
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          Protect access to settings with a password
                        </p>
                        <button
                          onClick={() => {
                            setPasswordModalConfig({
                              title: isSettingsPasswordSet ? 'Change Settings Password' : 'Set Settings Password',
                              description: isSettingsPasswordSet 
                                ? 'Enter a new password to protect settings access.'
                                : 'Set a password to protect access to settings.',
                              onSuccess: () => setShowPasswordModal(false),
                              onPasswordSet: onSetSettingsPassword,
                              isSettingPassword: true,
                            });
                            setShowPasswordModal(true);
                          }}
                          className="btn-secondary text-sm"
                        >
                          {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                        </button>
                      </div>

                      {/* Profile Security */}
                      <div className="card p-4">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                          Profile Security
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          PIN-protected profiles and bypass options
                        </p>
                        
                        <div className="space-y-3">
                          {state.profiles.filter(p => p.pin).map(profile => (
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
                                onClick={() => handleOpenProfileInNewTab(profile)}
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-200"
                                title={`Open ${profile.name} in new tab (bypass PIN)`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          
                          {state.profiles.filter(p => p.pin).length === 0 && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              No PIN-protected profiles found
                            </p>
                          )}
                        </div>

                        {state.profiles.filter(p => p.pin).length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              <strong>PIN Bypass:</strong> Use the external link button to open a profile in a new tab without entering the PIN. 
                              This is useful for administrative access or when PINs are forgotten.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="p-4 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      AI Assistant
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="card p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              AI Configuration
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {state.settings.ai.enabled 
                                ? `Using ${state.settings.ai.provider} (${state.settings.ai.model})`
                                : 'AI assistant is disabled'
                              }
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowAIModal(true)}
                              className="btn-primary text-sm"
                            >
                              <span className="hidden sm:inline">Open AI Assistant</span>
                              <span className="sm:hidden">Open AI</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Provider
                            </label>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {state.settings.ai.provider || 'Not configured'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Status
                            </label>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              state.settings.ai.enabled && state.settings.ai.apiKey
                                ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                            }`}>
                              {state.settings.ai.enabled && state.settings.ai.apiKey ? 'Configured' : 'Not configured'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-4 md:p-6">
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

      {/* AI Modal */}
      <AIQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
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
          expectedPassword={passwordModalConfig.expectedPassword}
          onPasswordSet={passwordModalConfig.onPasswordSet}
          isSettingPassword={passwordModalConfig.isSettingPassword}
        />
      )}
    </>
  );
}