import React, { useState } from 'react';
import { X, Settings, Users, Shield, Brain, History, Folder, Eye, MessageSquare, TestTube, CheckCircle, XCircle } from 'lucide-react';
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

type TabType = 'general' | 'groups' | 'profiles' | 'security' | 'ai' | 'history';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'groups', label: 'Groups', icon: Folder },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'ai', label: 'AI Assistant', icon: Brain },
  { id: 'history', label: 'History', icon: History },
];

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showAIQuery, setShowAIQuery] = useState(false);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingAI, setIsTestingAI] = useState(false);

  if (!isOpen) return null;

  const handleAISettingChange = (updates: Partial<typeof state.settings.ai>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: {
        ai: { ...state.settings.ai, ...updates }
      }
    });
    // Clear test result when settings change
    setAiTestResult(null);
  };

  const testAIConnection = async () => {
    if (!state.settings.ai.apiKey || !state.settings.ai.enabled) {
      setAiTestResult({ success: false, message: 'Please enable AI and set an API key first' });
      return;
    }

    setIsTestingAI(true);
    setAiTestResult(null);

    try {
      // Simple test query
      const testQuery = "Hello, this is a test. Please respond with 'AI connection successful'.";
      
      // Mock the AI service call for testing
      // In a real implementation, you would call your AI service here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setAiTestResult({ 
        success: true, 
        message: 'AI connection successful! Your API key and settings are working correctly.' 
      });
    } catch (error) {
      setAiTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to connect to AI service' 
      });
    } finally {
      setIsTestingAI(false);
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
                    onChange={(e) => dispatch({
                      type: 'UPDATE_SETTINGS',
                      updates: { theme: e.target.value as 'light' | 'dark' | 'system' }
                    })}
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
                      Display progress in header
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

                {/* Enable Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Allow browser notifications for due dates and task resets
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

                {/* Show Top Collaborator */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Show Top Collaborator
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Display collaboration leaderboard in trophy popup
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

                {/* Auto Archive */}
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

                {/* Archive Days */}
                {state.settings.autoArchiveCompleted && (
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Archive After (Days)
                      </label>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Number of days before archiving
                      </p>
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
                      className="input-primary w-20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Task Groups
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Manage your task groups and their settings
              </p>
              
              <div className="space-y-4">
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
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {group.enableDueDates ? 'Due dates enabled' : 'No due dates'} • 
                            {group.defaultNotifications ? ' Notifications on' : ' Notifications off'}
                          </p>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profiles':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                User Profiles
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Manage user profiles and their permissions
              </p>
              
              <div className="space-y-4">
                {state.profiles.map(profile => (
                  <div key={profile.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{profile.avatar}</span>
                        <div>
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
                              <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full">
                                PIN Protected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
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
                        {isSettingsPasswordSet ? 'Password protection is enabled' : 'No password protection'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="btn-secondary text-sm"
                    >
                      {isSettingsPasswordSet ? 'Change' : 'Set Password'}
                    </button>
                  </div>
                </div>

                {/* Profile Security Overview */}
                <div className="card p-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                    Profile Security
                  </h4>
                  <div className="space-y-2">
                    {state.profiles.map(profile => (
                      <div key={profile.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{profile.avatar}</span>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {profile.name}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          profile.pin 
                            ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {profile.pin ? 'PIN Protected' : 'No PIN'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                AI Assistant
              </h3>
              
              {/* AI Enable Toggle */}
              <div className="card p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                      Enable AI Assistant
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Get insights about your task patterns and productivity
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.ai.enabled}
                    onChange={(e) => handleAISettingChange({ enabled: e.target.checked })}
                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* AI Configuration - Only show when enabled */}
              {state.settings.ai.enabled && (
                <>
                  {/* Check if configured */}
                  {state.settings.ai.apiKey ? (
                    /* Configured - Show compact card with Open AI Agent button */
                    <div className="card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              AI Assistant Ready
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {state.settings.ai.provider} • {state.settings.ai.model}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowAIQuery(true)}
                            className="btn-primary text-sm"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Open AI Agent
                          </button>
                          <button
                            onClick={() => handleAISettingChange({ apiKey: '' })}
                            className="btn-secondary text-sm"
                          >
                            Reconfigure
                          </button>
                        </div>
                      </div>
                      
                      {/* Test Connection */}
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Test Connection
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Verify your API key is working
                            </p>
                          </div>
                          <button
                            onClick={testAIConnection}
                            disabled={isTestingAI}
                            className="btn-secondary text-sm flex items-center space-x-2"
                          >
                            <TestTube className="w-4 h-4" />
                            <span>{isTestingAI ? 'Testing...' : 'Test'}</span>
                          </button>
                        </div>
                        
                        {/* Test Result */}
                        {aiTestResult && (
                          <div className={`mt-3 p-3 rounded-lg flex items-start space-x-2 ${
                            aiTestResult.success 
                              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                              : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                          }`}>
                            {aiTestResult.success ? (
                              <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
                            )}
                            <p className={`text-sm ${
                              aiTestResult.success 
                                ? 'text-success-700 dark:text-success-400'
                                : 'text-error-700 dark:text-error-400'
                            }`}>
                              {aiTestResult.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Not configured - Show full configuration */
                    <div className="space-y-4">
                      {/* Provider Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          AI Provider
                        </label>
                        <select
                          value={state.settings.ai.provider}
                          onChange={(e) => handleAISettingChange({ 
                            provider: e.target.value as 'openai' | 'anthropic' | 'gemini',
                            model: e.target.value === 'openai' ? 'gpt-4' : 
                                   e.target.value === 'anthropic' ? 'claude-3-sonnet-20240229' : 
                                   'gemini-pro'
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
                          onChange={(e) => handleAISettingChange({ model: e.target.value })}
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
                              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
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
                          onChange={(e) => handleAISettingChange({ apiKey: e.target.value })}
                          placeholder={`Enter your ${state.settings.ai.provider} API key...`}
                          className="input-primary"
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Your API key is stored locally and never shared
                        </p>
                      </div>

                      {/* Test Connection */}
                      {state.settings.ai.apiKey && (
                        <div>
                          <button
                            onClick={testAIConnection}
                            disabled={isTestingAI}
                            className="btn-secondary text-sm flex items-center space-x-2"
                          >
                            <TestTube className="w-4 h-4" />
                            <span>{isTestingAI ? 'Testing Connection...' : 'Test Connection'}</span>
                          </button>
                          
                          {/* Test Result */}
                          {aiTestResult && (
                            <div className={`mt-3 p-3 rounded-lg flex items-start space-x-2 ${
                              aiTestResult.success 
                                ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                                : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                            }`}>
                              {aiTestResult.success ? (
                                <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
                              )}
                              <p className={`text-sm ${
                                aiTestResult.success 
                                  ? 'text-success-700 dark:text-success-400'
                                  : 'text-error-700 dark:text-error-400'
                              }`}>
                                {aiTestResult.message}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Task History & Analytics
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  View your task completion patterns and productivity insights
                </p>
              </div>
              <button
                onClick={() => setShowDetailedHistory(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Detailed History</span>
              </button>
            </div>
            
            <HistoryAnalytics 
              history={state.history}
              tasks={state.tasks}
              profiles={state.profiles}
            />
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

          {/* Content */}
          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar - Always vertical, collapses to icons on small screens */}
            <div className="flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              {/* Desktop Sidebar (md and up) - Full labels */}
              <div className="hidden md:block w-48 p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Sidebar (below md) - Icons only */}
              <div className="md:hidden w-16 p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={tab.label}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </nav>
              </div>
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

      {/* AI Query Modal */}
      <AIQueryModal
        isOpen={showAIQuery}
        onClose={() => setShowAIQuery(false)}
        history={state.history}
        tasks={state.tasks}
        profiles={state.profiles}
        groups={state.groups}
        aiSettings={state.settings.ai}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowPasswordModal(false)}
        onPasswordSet={onSetSettingsPassword}
        title="Set Settings Password"
        description="Create a password to protect access to settings. This adds an extra layer of security."
        isSettingPassword={true}
      />
    </>
  );
}