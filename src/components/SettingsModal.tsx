import React, { useState, useRef } from 'react';
import { X, Save, Palette, Users, Settings as SettingsIcon, Brain, Eye, EyeOff, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getAvailableIcons } from '../utils/icons';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';
import { HistoryAnalytics } from './HistoryAnalytics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'ai' | 'analytics';

interface DragItem {
  id: string;
  index: number;
  type: 'group' | 'profile';
}

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'remove'>('set');

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Sort groups and profiles by order
  const sortedGroups = [...state.groups].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Drag handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, group: TaskGroup, index: number) => {
    setDraggedItem({ id: group.id, index, type: 'group' });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleGroupDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleGroupDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleGroupDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.type !== 'group') return;
    
    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) return;

    const newGroups = [...sortedGroups];
    const [draggedGroup] = newGroups.splice(dragIndex, 1);
    newGroups.splice(dropIndex, 0, draggedGroup);

    const reorderedGroupIds = newGroups.map(group => group.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedGroupIds });

    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // Drag handlers for profiles
  const handleProfileDragStart = (e: React.DragEvent, profile: UserProfile, index: number) => {
    setDraggedItem({ id: profile.id, index, type: 'profile' });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleProfileDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleProfileDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleProfileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleProfileDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleProfileDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.type !== 'profile') return;
    
    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) return;

    const newProfiles = [...sortedProfiles];
    const [draggedProfile] = newProfiles.splice(dragIndex, 1);
    newProfiles.splice(dropIndex, 0, draggedProfile);

    const reorderedProfileIds = newProfiles.map(profile => profile.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedProfileIds });

    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // Arrow button handlers for groups
  const moveGroupUp = (index: number) => {
    if (index === 0) return;
    const newGroups = [...sortedGroups];
    [newGroups[index - 1], newGroups[index]] = [newGroups[index], newGroups[index - 1]];
    const reorderedGroupIds = newGroups.map(group => group.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedGroupIds });
  };

  const moveGroupDown = (index: number) => {
    if (index === sortedGroups.length - 1) return;
    const newGroups = [...sortedGroups];
    [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
    const reorderedGroupIds = newGroups.map(group => group.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedGroupIds });
  };

  // Arrow button handlers for profiles
  const moveProfileUp = (index: number) => {
    if (index === 0) return;
    const newProfiles = [...sortedProfiles];
    [newProfiles[index - 1], newProfiles[index]] = [newProfiles[index], newProfiles[index - 1]];
    const reorderedProfileIds = newProfiles.map(profile => profile.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedProfileIds });
  };

  const moveProfileDown = (index: number) => {
    if (index === sortedProfiles.length - 1) return;
    const newProfiles = [...sortedProfiles];
    [newProfiles[index], newProfiles[index + 1]] = [newProfiles[index + 1], newProfiles[index]];
    const reorderedProfileIds = newProfiles.map(profile => profile.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedProfileIds });
  };

  const handleUpdateSettings = (updates: Partial<typeof state.settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', updates });
  };

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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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

          <div className="flex h-[calc(90vh-80px)]">
            {/* Sidebar */}
            <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 p-4">
              <nav className="space-y-1">
                {[
                  { id: 'general', label: 'General', icon: SettingsIcon },
                  { id: 'groups', label: 'Task Groups', icon: Palette },
                  { id: 'profiles', label: 'Profiles', icon: Users },
                  { id: 'ai', label: 'AI Assistant', icon: Brain },
                  { id: 'analytics', label: 'Analytics', icon: Eye },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      General Settings
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Theme Setting */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={state.settings.theme}
                          onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
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
                            onChange={(e) => handleUpdateSettings({ showCompletedCount: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show completed task count in header
                          </span>
                        </label>
                      </div>

                      {/* Enable Notifications */}
                      <div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={state.settings.enableNotifications}
                            onChange={(e) => handleUpdateSettings({ enableNotifications: e.target.checked })}
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
                            onChange={(e) => handleUpdateSettings({ showTopCollaborator: e.target.checked })}
                            className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Show top collaborator in trophy modal
                          </span>
                        </label>
                      </div>

                      {/* Settings Password */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Settings Password Protection
                        </label>
                        <div className="flex items-center space-x-3">
                          {isSettingsPasswordSet ? (
                            <>
                              <div className="flex items-center space-x-2 px-3 py-2 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                                <span className="text-sm text-success-700 dark:text-success-400">
                                  Password protection enabled
                                </span>
                              </div>
                              <button
                                onClick={handleRemovePassword}
                                className="btn-secondary text-sm"
                              >
                                Remove Password
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg">
                                <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                  No password protection
                                </span>
                              </div>
                              <button
                                onClick={handleSetPassword}
                                className="btn-primary text-sm"
                              >
                                Set Password
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      Task Groups
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Drag to reorder • {sortedGroups.length} groups
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {sortedGroups.map((group, index) => (
                      <div
                        key={group.id}
                        draggable
                        onDragStart={(e) => handleGroupDragStart(e, group, index)}
                        onDragEnd={handleGroupDragEnd}
                        onDragOver={(e) => handleGroupDragOver(e, index)}
                        onDragEnter={handleGroupDragEnter}
                        onDragLeave={handleGroupDragLeave}
                        onDrop={(e) => handleGroupDrop(e, index)}
                        className={`group flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-move ${
                          draggedItem?.id === group.id
                            ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : dragOverIndex === index && draggedItem?.type === 'group'
                              ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/10 border-dashed'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 min-w-[20px]">
                            {index + 1}
                          </span>
                        </div>

                        {/* Group Info */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                              {group.name}
                            </h4>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {state.tasks.filter(t => t.groupId === group.id).length} tasks
                              {group.enableDueDates && ' • Due dates enabled'}
                            </p>
                          </div>
                        </div>

                        {/* Arrow Controls */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveGroupUp(index);
                            }}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4 text-neutral-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveGroupDown(index);
                            }}
                            disabled={index === sortedGroups.length - 1}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Reordering Groups
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Drag & Drop:</strong> Click and drag any group to reorder</li>
                      <li>• <strong>Arrow Buttons:</strong> Use up/down arrows on hover</li>
                      <li>• <strong>Order Numbers:</strong> Show current position in the list</li>
                      <li>• Groups appear in this order throughout the application</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      User Profiles
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Drag to reorder • {sortedProfiles.length} profiles
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {sortedProfiles.map((profile, index) => (
                      <div
                        key={profile.id}
                        draggable
                        onDragStart={(e) => handleProfileDragStart(e, profile, index)}
                        onDragEnd={handleProfileDragEnd}
                        onDragOver={(e) => handleProfileDragOver(e, index)}
                        onDragEnter={handleProfileDragEnter}
                        onDragLeave={handleProfileDragLeave}
                        onDrop={(e) => handleProfileDrop(e, index)}
                        className={`group flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-move ${
                          draggedItem?.id === profile.id
                            ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : dragOverIndex === index && draggedItem?.type === 'profile'
                              ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/10 border-dashed'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
                          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 min-w-[20px]">
                            {index + 1}
                          </span>
                        </div>

                        {/* Profile Info */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                            {profile.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                                {profile.name}
                              </h4>
                              {profile.id === state.activeProfileId && (
                                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full font-medium">
                                  Active
                                </span>
                              )}
                              {profile.isTaskCompetitor && (
                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium">
                                  Competitor
                                </span>
                              )}
                              {profile.pin && profile.pin.trim().length > 0 && (
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">
                                  PIN Protected
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {state.tasks.filter(t => t.profiles.includes(profile.id)).length} tasks assigned
                            </p>
                          </div>
                        </div>

                        {/* Arrow Controls */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveProfileUp(index);
                            }}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4 text-neutral-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveProfileDown(index);
                            }}
                            disabled={index === sortedProfiles.length - 1}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Reordering Profiles
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Drag & Drop:</strong> Click and drag any profile to reorder</li>
                      <li>• <strong>Arrow Buttons:</strong> Use up/down arrows on hover</li>
                      <li>• <strong>Order Numbers:</strong> Show current position in the list</li>
                      <li>• Profiles appear in this order in selection screens</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Assistant
                    </h3>
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="btn-primary"
                      disabled={!state.settings.ai.enabled || !state.settings.ai.apiKey}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Open AI Assistant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Enable AI */}
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={state.settings.ai.enabled}
                          onChange={(e) => handleUpdateSettings({ 
                            ai: { ...state.settings.ai, enabled: e.target.checked }
                          })}
                          className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Enable AI Assistant
                        </span>
                      </label>
                    </div>

                    {/* AI Provider */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        AI Provider
                      </label>
                      <select
                        value={state.settings.ai.provider}
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, provider: e.target.value as any }
                        })}
                        className="input-primary"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                    </div>

                    {/* AI Model */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Model
                      </label>
                      <select
                        value={state.settings.ai.model}
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, model: e.target.value }
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
                        onChange={(e) => handleUpdateSettings({ 
                          ai: { ...state.settings.ai, apiKey: e.target.value }
                        })}
                        placeholder="Enter your API key..."
                        className="input-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Task Analytics
                  </h3>
                  
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
        onUpdateSettings={(updates) => handleUpdateSettings({ ai: { ...state.settings.ai, ...updates } })}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Remove Settings Password'}
        description={
          passwordModalType === 'set' 
            ? 'Set a password to protect access to settings. This password will be required to open settings in the future.'
            : 'Enter your current settings password to remove password protection.'
        }
        placeholder={passwordModalType === 'set' ? 'Enter new password...' : 'Enter current password...'}
        expectedPassword={passwordModalType === 'remove' ? state.settings.settingsPassword : undefined}
        onPasswordSet={passwordModalType === 'set' ? handlePasswordSuccess : undefined}
        isSettingPassword={passwordModalType === 'set'}
      />
    </>
  );
}