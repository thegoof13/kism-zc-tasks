import React, { useState } from 'react';
import { X, Settings, User, Users, Shield, Brain, BarChart3, Save, Eye, EyeOff, Lock, Unlock, GripVertical, TestTube, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { PasswordModal } from './PasswordModal';
import { AIQueryModal } from './AIQueryModal';

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
  const [showAIQueryModal, setShowAIQueryModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');
  
  // Editing states
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  
  // Drag and drop states
  const [draggedProfileId, setDraggedProfileId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  
  // AI Settings state
  const [tempAISettings, setTempAISettings] = useState(state.settings.ai);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetPassword = () => {
    setPasswordModalType('set');
    setShowPasswordModal(true);
  };

  const handleRemovePassword = () => {
    setPasswordModalType('remove');
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = (password?: string) => {
    if (passwordModalType === 'set' && password) {
      onSetSettingsPassword(password);
    } else if (passwordModalType === 'remove') {
      onSetSettingsPassword('');
    }
    setShowPasswordModal(false);
  };

  const handleProfilePinBypass = (profileId: string) => {
    const profile = state.profiles.find(p => p.id === profileId);
    if (profile) {
      const url = new URL(window.location.href);
      url.searchParams.set('profile', profileId);
      url.searchParams.set('bypass_pin', 'true');
      
      // Copy to clipboard
      navigator.clipboard.writeText(url.toString()).then(() => {
        alert(`PIN bypass link copied to clipboard for ${profile.name}`);
      });
    }
  };

  // Profile drag and drop handlers
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
    
    if (!draggedProfileId || draggedProfileId === targetProfileId) {
      setDraggedProfileId(null);
      return;
    }

    const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedIndex = sortedProfiles.findIndex(p => p.id === draggedProfileId);
    const targetIndex = sortedProfiles.findIndex(p => p.id === targetProfileId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder the profiles
    const reorderedProfiles = [...sortedProfiles];
    const [draggedProfile] = reorderedProfiles.splice(draggedIndex, 1);
    reorderedProfiles.splice(targetIndex, 0, draggedProfile);

    // Update order values
    const profileIds = reorderedProfiles.map(p => p.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds });
    
    setDraggedProfileId(null);
  };

  // Group drag and drop handlers
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
    
    if (!draggedGroupId || draggedGroupId === targetGroupId) {
      setDraggedGroupId(null);
      return;
    }

    const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedGroups.findIndex(g => g.id === draggedGroupId);
    const targetIndex = sortedGroups.findIndex(g => g.id === targetGroupId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder the groups
    const reorderedGroups = [...sortedGroups];
    const [draggedGroup] = reorderedGroups.splice(draggedIndex, 1);
    reorderedGroups.splice(targetIndex, 0, draggedGroup);

    // Update order values
    const groupIds = reorderedGroups.map(g => g.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds });
    
    setDraggedGroupId(null);
  };

  const handleTestAIConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      // Simple test - we'll just validate the settings format
      if (!tempAISettings.apiKey) {
        throw new Error('API key is required');
      }
      
      if (!tempAISettings.provider) {
        throw new Error('Provider is required');
      }
      
      if (!tempAISettings.model) {
        throw new Error('Model is required');
      }

      setTestResult('✅ Settings validated! AI configuration looks good.');
    } catch (err) {
      setTestResult(`❌ Configuration error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'profiles' as const, label: 'Profiles', icon: Users },
    { id: 'groups' as const, label: 'Groups', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'ai' as const, label: 'AI Assistant', icon: Brain },
    { id: 'history' as const, label: 'History', icon: BarChart3 },
  ];

  // Sort profiles and groups by order
  const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
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
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-1">
                {tabs.map(tab => {
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
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
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
                          className="input-primary"
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
                            Show top collaborator in competition
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profiles Tab */}
              {activeTab === 'profiles' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      User Profiles
                    </h3>
                    <button
                      onClick={() => {
                        const newProfile = {
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
                      }}
                      className="btn-primary"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add Profile
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sortedProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        draggable
                        onDragStart={(e) => handleProfileDragStart(e, profile.id)}
                        onDragOver={handleProfileDragOver}
                        onDrop={(e) => handleProfileDrop(e, profile.id)}
                        className={`card p-4 cursor-move hover:shadow-md transition-all duration-200 ${
                          draggedProfileId === profile.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: profile.color }}>
                              {profile.avatar}
                            </div>
                            <div>
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                                {profile.isTaskCompetitor && (
                                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                                    Task Competitor
                                  </span>
                                )}
                                {profile.pin && (
                                  <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-full text-xs">
                                    PIN Protected
                                  </span>
                                )}
                                {state.settings.viewOnlyMode && state.activeProfileId === profile.id && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                    View Only Mode
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Disable View Only Mode Checkbox */}
                            {state.settings.viewOnlyMode && state.activeProfileId === profile.id && (
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => {
                                    dispatch({
                                      type: 'UPDATE_SETTINGS',
                                      updates: { viewOnlyMode: false }
                                    });
                                  }}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  Disable View Only
                                </span>
                              </label>
                            )}
                            
                            <button
                              onClick={() => setEditingProfile(editingProfile === profile.id ? null : profile.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                            >
                              <Settings className="w-4 h-4 text-neutral-500" />
                            </button>
                          </div>
                        </div>

                        {/* Profile Edit Form */}
                        {editingProfile === profile.id && (
                          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={profile.name}
                                  onChange={(e) => dispatch({
                                    type: 'UPDATE_PROFILE',
                                    profileId: profile.id,
                                    updates: { name: e.target.value }
                                  })}
                                  className="input-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                  Avatar
                                </label>
                                <input
                                  type="text"
                                  value={profile.avatar}
                                  onChange={(e) => dispatch({
                                    type: 'UPDATE_PROFILE',
                                    profileId: profile.id,
                                    updates: { avatar: e.target.value }
                                  })}
                                  className="input-primary"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                PIN (optional)
                              </label>
                              <input
                                type="password"
                                value={profile.pin || ''}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_PROFILE',
                                  profileId: profile.id,
                                  updates: { pin: e.target.value }
                                })}
                                placeholder="Enter PIN for profile protection..."
                                className="input-primary"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={profile.isTaskCompetitor || false}
                                  onChange={(e) => dispatch({
                                    type: 'UPDATE_PROFILE',
                                    profileId: profile.id,
                                    updates: { isTaskCompetitor: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  Task Competitor
                                </span>
                              </label>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingProfile(null)}
                                className="btn-secondary"
                              >
                                Done
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${profile.name}?`)) {
                                      dispatch({ type: 'DELETE_PROFILE', profileId: profile.id });
                                      setEditingProfile(null);
                                    }
                                  }}
                                  className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors duration-200"
                                >
                                  Delete
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

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <button
                      onClick={() => {
                        const newGroup = {
                          name: 'New Group',
                          color: '#6366F1',
                          icon: 'User',
                          completedDisplayMode: 'grey-out' as const,
                          isCollapsed: false,
                          enableDueDates: false,
                          sortByDueDate: false,
                          defaultNotifications: false,
                        };
                        dispatch({ type: 'ADD_GROUP', group: newGroup });
                      }}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sortedGroups.map((group) => {
                      const IconComponent = getIconComponent(group.icon);
                      return (
                        <div
                          key={group.id}
                          draggable
                          onDragStart={(e) => handleGroupDragStart(e, group.id)}
                          onDragOver={handleGroupDragOver}
                          onDrop={(e) => handleGroupDrop(e, group.id)}
                          className={`card p-4 cursor-move hover:shadow-md transition-all duration-200 ${
                            draggedGroupId === group.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <GripVertical className="w-4 h-4 text-neutral-400" />
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                <div>
                                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {group.name}
                                  </h4>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {group.completedDisplayMode.replace('-', ' ')}
                                    {group.enableDueDates && ' • Due dates enabled'}
                                    {group.defaultNotifications && ' • Notifications default'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setEditingGroup(editingGroup === group.id ? null : group.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                            >
                              <Settings className="w-4 h-4 text-neutral-500" />
                            </button>
                          </div>

                          {/* Group Edit Form */}
                          {editingGroup === group.id && (
                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { name: e.target.value }
                                    })}
                                    className="input-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Color
                                  </label>
                                  <input
                                    type="color"
                                    value={group.color}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { color: e.target.value }
                                    })}
                                    className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                  Icon
                                </label>
                                <select
                                  value={group.icon}
                                  onChange={(e) => dispatch({
                                    type: 'UPDATE_GROUP',
                                    groupId: group.id,
                                    updates: { icon: e.target.value }
                                  })}
                                  className="input-primary"
                                >
                                  {getAvailableIcons().map(({ name }) => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={group.enableDueDates}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { enableDueDates: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Enable due dates
                                  </span>
                                </label>

                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={group.defaultNotifications || false}
                                    onChange={(e) => dispatch({
                                      type: 'UPDATE_GROUP',
                                      groupId: group.id,
                                      updates: { defaultNotifications: e.target.checked }
                                    })}
                                    className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Default notifications for new tasks
                                  </span>
                                </label>
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingGroup(null)}
                                  className="btn-secondary"
                                >
                                  Done
                                </button>
                                {state.groups.length > 1 && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${group.name}? This will also delete all tasks in this group.`)) {
                                        dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                                        setEditingGroup(null);
                                      }
                                    }}
                                    className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors duration-200"
                                  >
                                    Delete
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
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Security Settings
                    </h3>
                    
                    {/* Settings Password Protection */}
                    <div className="card p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            Settings Password Protection
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {isSettingsPasswordSet 
                              ? 'Settings are protected with a password'
                              : 'Settings are not password protected'
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isSettingsPasswordSet ? 'bg-success-500' : 'bg-neutral-400'
                          }`} />
                          {isSettingsPasswordSet ? (
                            <button
                              onClick={handleRemovePassword}
                              className="flex items-center space-x-2 px-3 py-2 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg hover:bg-error-200 dark:hover:bg-error-900/30 transition-colors duration-200"
                            >
                              <Unlock className="w-4 h-4" />
                              <span className="text-sm font-medium">Remove Password</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleSetPassword}
                              className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200"
                            >
                              <Lock className="w-4 h-4" />
                              <span className="text-sm font-medium">Set Password</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Profile PIN Protection Summary */}
                    <div className="card p-4 mb-6">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Profile PIN Protection
                      </h4>
                      <div className="space-y-3">
                        {state.profiles.map(profile => (
                          <div key={profile.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{profile.avatar}</span>
                              <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {profile.name}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {profile.pin ? 'PIN Protected' : 'No PIN set'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                profile.pin ? 'bg-warning-500' : 'bg-neutral-400'
                              }`} />
                              {profile.pin && (
                                <button
                                  onClick={() => handleProfilePinBypass(profile.id)}
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200"
                                >
                                  Copy PIN Bypass Link
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Security Best Practices */}
                    <div className="card p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                        Security Best Practices
                      </h4>
                      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <p>• Use the settings password to prevent unauthorized changes to your configuration</p>
                        <p>• Set PINs on profiles to prevent unauthorized access to personal tasks</p>
                        <p>• Use View Only mode for shared devices or when you want to prevent accidental changes</p>
                        <p>• PIN bypass links allow temporary access without entering the PIN</p>
                        <p>• Profile permissions control what actions each user can perform</p>
                      </div>
                    </div>

                    {/* Security Warning */}
                    <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                      <h4 className="font-medium text-warning-800 dark:text-warning-200 mb-2">
                        Security Notice
                      </h4>
                      <p className="text-sm text-warning-700 dark:text-warning-300">
                        Passwords and PINs are stored in plain text for simplicity. This application is designed for personal/family use. 
                        Do not use passwords that you use for other important accounts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Assistant Tab */}
              {activeTab === 'ai' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAISettings(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">AI Settings</span>
                      </button>
                      <button
                        onClick={() => setShowAIQueryModal(true)}
                        className="btn-primary"
                        disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open AI Assistant
                      </button>
                    </div>
                  </div>

                  {/* AI Status */}
                  <div className="card p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          AI Assistant Status
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {state.settings.ai.enabled && state.settings.ai.apiKey
                            ? `Active with ${state.settings.ai.provider} (${state.settings.ai.model})`
                            : 'Not configured'
                          }
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        state.settings.ai.enabled && state.settings.ai.apiKey ? 'bg-success-500' : 'bg-neutral-400'
                      }`} />
                    </div>
                  </div>

                  {/* AI Features */}
                  <div className="card p-4">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      AI Features
                    </h4>
                    <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <p>• Analyze your task completion patterns and productivity trends</p>
                      <p>• Get insights about which tasks you complete most consistently</p>
                      <p>• Identify areas for improvement in your task management</p>
                      <p>• Ask questions about your task history and get detailed answers</p>
                      <p>• Receive personalized recommendations for better productivity</p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    Task History & Analytics
                  </h3>
                  
                  <div className="card p-4">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      History and analytics features will be displayed here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={
          passwordModalType === 'set'
            ? 'Set a password to protect your settings from unauthorized changes.'
            : 'Enter your current password to remove settings protection.'
        }
        placeholder={passwordModalType === 'set' ? 'Enter new password...' : 'Enter current password...'}
        expectedPassword={passwordModalType === 'remove' ? state.settings.settingsPassword : undefined}
        onPasswordSet={passwordModalType === 'set' ? handlePasswordSuccess : undefined}
        isSettingPassword={passwordModalType === 'set'}
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
                    onClick={handleTestAIConnection}
                    disabled={testLoading}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                  >
                    {testLoading ? (
                      <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {testLoading ? 'Testing...' : 'Test Configuration'}
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
        isOpen={showAIQueryModal}
        onClose={() => setShowAIQueryModal(false)}
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
    </>
  );
}