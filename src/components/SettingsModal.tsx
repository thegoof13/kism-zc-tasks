import React, { useState, useRef } from 'react';
import { X, Download, Upload, Trash2, Plus, Edit, GripVertical, Settings, Users, BarChart3, Shield, Database, Brain, AlertTriangle, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, AISettings } from '../types';
import { getIconComponent, getAvailableIcons } from '../utils/icons';
import { HistoryAnalytics } from './HistoryAnalytics';
import { AIQueryModal } from './AIQueryModal';
import { PasswordModal } from './PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSettingsPassword: (password: string) => void;
  isSettingsPasswordSet: boolean;
}

type SettingsTab = 'general' | 'groups' | 'profiles' | 'data' | 'history' | 'ai' | 'security';

export function SettingsModal({ isOpen, onClose, onSetSettingsPassword, isSettingsPasswordSet }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'change'>('set');
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [draggedProfileIndex, setDraggedProfileIndex] = useState<number | null>(null);
  const [importData, setImportData] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [taskIcons, setTaskIcons] = useState<any>({});
  const [generatingIcons, setGeneratingIcons] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load task icons on mount
  React.useEffect(() => {
    if (isOpen) {
      loadTaskIcons();
    }
  }, [isOpen]);

  const loadTaskIcons = async () => {
    try {
      const response = await fetch('/api/task-icons');
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Task icons API not available - endpoint returned HTML instead of JSON');
        setTaskIcons({});
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const icons = await response.json();
      setTaskIcons(icons);
    } catch (error) {
      console.warn('Task icons API not available:', error.message);
      setTaskIcons({});
    }
  };

  const generateTaskIcons = async () => {
    if (!state.settings.ai.enabled || !state.settings.ai.apiKey) {
      alert('AI is not configured. Please set up AI in the AI Assistant tab first.');
      return;
    }

    setGeneratingIcons(true);
    try {
      const response = await fetch('/api/generate-task-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: state.tasks,
          groups: state.groups,
          aiSettings: state.settings.ai,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate task icons');
      }

      const icons = await response.json();
      setTaskIcons(icons);
      alert('Task icons generated successfully!');
    } catch (error) {
      console.error('Failed to generate task icons:', error);
      alert('Failed to generate task icons. Please try again.');
    } finally {
      setGeneratingIcons(false);
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      tasks: state.tasks,
      groups: state.groups,
      profiles: state.profiles,
      history: state.history,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    try {
      const data = JSON.parse(importData);
      
      // Validate the data structure
      if (!data.tasks || !data.groups || !data.profiles) {
        throw new Error('Invalid data format');
      }

      // Convert date strings back to Date objects
      if (data.tasks) {
        data.tasks = data.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          recurrenceFromDate: task.recurrenceFromDate ? new Date(task.recurrenceFromDate) : undefined,
        }));
      }
      
      if (data.groups) {
        data.groups = data.groups.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
        }));
      }
      
      if (data.profiles) {
        data.profiles = data.profiles.map((profile: any) => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
        }));
      }
      
      if (data.history) {
        data.history = data.history.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }

      dispatch({ type: 'LOAD_STATE', state: data });
      setImportData('');
      setImportError('');
      alert('Data imported successfully!');
    } catch (error) {
      setImportError('Invalid JSON data. Please check the format and try again.');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        setImportError('');
      };
      reader.readAsText(file);
    }
  };

  // Group management functions
  const handleAddGroup = (groupData: Omit<TaskGroup, 'id' | 'createdAt' | 'order'>) => {
    dispatch({ type: 'ADD_GROUP', group: groupData });
    setShowAddGroup(false);
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

  // Profile management functions
  const handleAddProfile = (profileData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_PROFILE', profile: profileData });
    setShowAddProfile(false);
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

  // Drag and drop for groups
  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedGroupIndex === null || draggedGroupIndex === dropIndex) {
      setDraggedGroupIndex(null);
      return;
    }

    const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);
    const draggedGroup = sortedGroups[draggedGroupIndex];
    const newGroups = [...sortedGroups];
    
    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(dropIndex, 0, draggedGroup);
    
    const reorderedGroupIds = newGroups.map(group => group.id);
    dispatch({ type: 'REORDER_GROUPS', groupIds: reorderedGroupIds });
    
    setDraggedGroupIndex(null);
  };

  // Drag and drop for profiles
  const handleProfileDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProfileIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProfileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleProfileDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedProfileIndex === null || draggedProfileIndex === dropIndex) {
      setDraggedProfileIndex(null);
      return;
    }

    const sortedProfiles = [...state.profiles].sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedProfile = sortedProfiles[draggedProfileIndex];
    const newProfiles = [...sortedProfiles];
    
    newProfiles.splice(draggedProfileIndex, 1);
    newProfiles.splice(dropIndex, 0, draggedProfile);
    
    const reorderedProfileIds = newProfiles.map(profile => profile.id);
    dispatch({ type: 'REORDER_PROFILES', profileIds: reorderedProfileIds });
    
    setDraggedProfileIndex(null);
  };

  const handlePasswordSet = (password: string) => {
    onSetSettingsPassword(password);
    setShowPasswordModal(false);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'history', label: 'History', icon: BarChart3 },
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden settings-modal">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Settings
                </h2>
              </div>
              
              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {/* Theme Setting */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Theme</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Choose your preferred theme</p>
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

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Notifications</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Enable browser notifications</p>
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
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Completed Count</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Display task completion progress in header</p>
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
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Show Top Collaborator</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Display collaboration leaderboard</p>
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
                  </div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Task Groups</h4>
                      <button
                        onClick={() => setShowAddGroup(true)}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Group
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[...state.groups]
                        .sort((a, b) => a.order - b.order)
                        .map((group, index) => {
                          const IconComponent = getIconComponent(group.icon);
                          return (
                            <div
                              key={group.id}
                              draggable
                              onDragStart={(e) => handleGroupDragStart(e, index)}
                              onDragOver={handleGroupDragOver}
                              onDrop={(e) => handleGroupDrop(e, index)}
                              className="flex items-center space-x-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-move hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                            >
                              <GripVertical className="w-5 h-5 text-neutral-400" />
                              <div 
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color }}
                              />
                              <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                              <div className="flex-1">
                                <h5 className="font-medium text-neutral-900 dark:text-neutral-100">{group.name}</h5>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {group.completedDisplayMode.replace('-', ' ')}
                                  {group.enableDueDates && ' • Due dates enabled'}
                                  {group.sortByDueDate && ' • Sorted by due date'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingGroup(group)}
                                  className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-error-600 dark:text-error-400" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">User Profiles</h4>
                      <button
                        onClick={() => setShowAddProfile(true)}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Profile
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[...state.profiles]
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((profile, index) => (
                          <div
                            key={profile.id}
                            draggable
                            onDragStart={(e) => handleProfileDragStart(e, index)}
                            onDragOver={handleProfileDragOver}
                            onDrop={(e) => handleProfileDrop(e, index)}
                            className="flex items-center space-x-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-move hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                          >
                            <GripVertical className="w-5 h-5 text-neutral-400" />
                            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-lg">
                              {profile.avatar}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-neutral-900 dark:text-neutral-100">{profile.name}</h5>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {profile.isTaskCompetitor ? 'Task Competitor' : 'Regular User'}
                                {profile.pin && ' • PIN Protected'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingProfile(profile)}
                                className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                              </button>
                              {state.profiles.length > 1 && (
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/20 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4 text-error-600 dark:text-error-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-8">
                    {/* Data Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {state.tasks.length}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Tasks</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                          {state.groups.length}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Groups</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                          {state.profiles.length}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Profiles</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                          {state.history.length}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">History Entries</div>
                      </div>
                    </div>

                    {/* Task Icons for Kiosk */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Task Icons for Kiosk
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            AI-generated icons to help children understand tasks
                          </p>
                        </div>
                        <button
                          onClick={generateTaskIcons}
                          disabled={generatingIcons || !state.settings.ai.enabled || !state.settings.ai.apiKey}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingIcons ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Icons
                            </>
                          )}
                        </button>
                      </div>

                      {!state.settings.ai.enabled || !state.settings.ai.apiKey ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-medium text-amber-800 dark:text-amber-200">
                                AI Not Configured
                              </h5>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Please configure AI in the AI Assistant tab to generate task icons for the kiosk.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : Object.keys(taskIcons).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(taskIcons).map(([taskId, iconData]: [string, any]) => {
                            const task = state.tasks.find(t => t.id === taskId);
                            if (!task) return null;
                            
                            return (
                              <div key={taskId} className="flex items-center space-x-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">{iconData.icons[0]}</span>
                                  <span className="text-2xl">{iconData.icons[1]}</span>
                                </div>
                                <div className="flex-1">
                                  <h6 className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {task.title}
                                  </h6>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {iconData.groupName}
                                  </p>
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  Generated {new Date(iconData.generatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No task icons generated yet</p>
                          <p className="text-sm">Click "Generate Icons" to create child-friendly task icons</p>
                        </div>
                      )}
                    </div>

                    {/* Export Data */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Export Data</h4>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Download your data for backup or migration purposes.
                      </p>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleExportData}
                          className="btn-primary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download JSON Data
                        </button>
                        <button
                          onClick={() => window.open('/api/activity/download')}
                          className="btn-secondary"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Activity Log
                        </button>
                      </div>
                    </div>

                    {/* Import Data */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Import Data</h4>
                      
                      {/* FIXED: Import Data Warning Box with proper dark mode styling */}
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-amber-800 dark:text-amber-200">
                              Warning: Data Import
                            </h5>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              Importing data will replace all current data. Make sure to export your current data first as a backup.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileImport}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </button>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                            Select a JSON file exported from FocusFlow to import your data.
                          </p>
                        </div>

                        {importData && (
                          <div className="space-y-4">
                            <textarea
                              value={importData}
                              onChange={(e) => setImportData(e.target.value)}
                              placeholder="Paste JSON data here..."
                              className="w-full h-32 input-primary font-mono text-sm"
                            />
                            {importError && (
                              <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                                <p className="text-error-700 dark:text-error-400 text-sm">{importError}</p>
                              </div>
                            )}
                            <button
                              onClick={handleImportData}
                              className="btn-primary"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import Data
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Data Storage Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Data Storage Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">JSON Data</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              All application data (tasks, groups, profiles, settings) is stored in a JSON file on the server
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">Activity Log</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              All user actions and history are logged to a separate activity log file for data integrity
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <HistoryAnalytics 
                    history={state.history} 
                    tasks={state.tasks}
                    profiles={state.profiles}
                  />
                )}

                {/* AI Assistant Tab */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">AI Assistant</h4>
                        <p className="text-neutral-600 dark:text-neutral-400">Configure AI for task insights and analysis</p>
                      </div>
                      {state.settings.ai.enabled && state.settings.ai.apiKey && (
                        <button
                          onClick={() => setShowAIModal(true)}
                          className="btn-primary"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Open AI Assistant
                        </button>
                      )}
                    </div>

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

                      {/* AI Model */}
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
                            updates: {
                              ai: { ...state.settings.ai, apiKey: e.target.value }
                            }
                          })}
                          placeholder="Enter your API key..."
                          className="input-primary"
                        />
                      </div>

                      {/* Enable AI */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Assistant</h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Allow AI analysis of your task data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.settings.ai.enabled}
                            onChange={(e) => dispatch({
                              type: 'UPDATE_SETTINGS',
                              updates: {
                                ai: { ...state.settings.ai, enabled: e.target.checked }
                              }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* Settings Password */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Settings Password</h4>
                      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div>
                          <h5 className="font-medium text-neutral-900 dark:text-neutral-100">Settings Password</h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {isSettingsPasswordSet ? 'Password is set' : 'No password set'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPasswordModalType(isSettingsPasswordSet ? 'change' : 'set');
                            setShowPasswordModal(true);
                          }}
                          className="btn-primary"
                        >
                          {isSettingsPasswordSet ? 'Change Password' : 'Set Password'}
                        </button>
                      </div>
                    </div>

                    {/* Profile Security */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profile Security</h4>
                      <div className="space-y-3">
                        {state.profiles.map(profile => (
                          <div key={profile.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center">
                                {profile.avatar}
                              </div>
                              <div>
                                <h5 className="font-medium text-neutral-900 dark:text-neutral-100">{profile.name}</h5>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {profile.pin ? 'PIN Protected' : 'No PIN'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingProfile(profile)}
                              className="btn-secondary text-sm"
                            >
                              {profile.pin ? 'Change PIN' : 'Set PIN'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Group Modal */}
      {(showAddGroup || editingGroup) && (
        <GroupModal
          isOpen={true}
          onClose={() => {
            setShowAddGroup(false);
            setEditingGroup(null);
          }}
          group={editingGroup}
          onSave={editingGroup ? 
            (updates) => handleUpdateGroup(editingGroup.id, updates) :
            handleAddGroup
          }
        />
      )}

      {/* Add/Edit Profile Modal */}
      {(showAddProfile || editingProfile) && (
        <ProfileModal
          isOpen={true}
          onClose={() => {
            setShowAddProfile(false);
            setEditingProfile(null);
          }}
          profile={editingProfile}
          onSave={editingProfile ?
            (updates) => handleUpdateProfile(editingProfile.id, updates) :
            handleAddProfile
          }
        />
      )}

      {/* AI Query Modal */}
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
        onSuccess={handlePasswordSet}
        title={passwordModalType === 'set' ? 'Set Settings Password' : 'Change Settings Password'}
        description={passwordModalType === 'set' ? 
          'Set a password to protect access to settings.' :
          'Enter a new password to change the settings password.'
        }
        placeholder="Enter new password..."
        isSettingPassword={true}
        onPasswordSet={handlePasswordSet}
      />
    </>
  );
}

// Group Modal Component
function GroupModal({ 
  isOpen, 
  onClose, 
  group, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  group?: TaskGroup | null;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState(group?.name || '');
  const [color, setColor] = useState(group?.color || '#6366F1');
  const [icon, setIcon] = useState(group?.icon || 'User');
  const [completedDisplayMode, setCompletedDisplayMode] = useState(group?.completedDisplayMode || 'grey-out');
  const [enableDueDates, setEnableDueDates] = useState(group?.enableDueDates || false);
  const [sortByDueDate, setSortByDueDate] = useState(group?.sortByDueDate || false);
  const [defaultNotifications, setDefaultNotifications] = useState(group?.defaultNotifications || false);

  const availableIcons = getAvailableIcons();

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {group ? 'Edit Group' : 'Add Group'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Group Name
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableIcons.map(({ name: iconName, component: IconComponent }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-3 rounded-lg border transition-colors duration-200 ${
                    icon === iconName
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
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
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Sort by Due Date
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
                Default Notifications for New Tasks
              </span>
            </label>
          </div>

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
              {group ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Profile Modal Component
function ProfileModal({ 
  isOpen, 
  onClose, 
  profile, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '👤');
  const [color, setColor] = useState(profile?.color || '#6366F1');
  const [isTaskCompetitor, setIsTaskCompetitor] = useState(profile?.isTaskCompetitor || false);
  const [pin, setPin] = useState(profile?.pin || '');
  const [canCreateTasks, setCanCreateTasks] = useState(profile?.permissions?.canCreateTasks ?? true);
  const [canEditTasks, setCanEditTasks] = useState(profile?.permissions?.canEditTasks ?? true);
  const [canDeleteTasks, setCanDeleteTasks] = useState(profile?.permissions?.canDeleteTasks ?? true);
  const [mealTimes, setMealTimes] = useState({
    breakfast: profile?.mealTimes?.breakfast || '07:00',
    lunch: profile?.mealTimes?.lunch || '12:00',
    dinner: profile?.mealTimes?.dinner || '18:00',
    nightcap: profile?.mealTimes?.nightcap || '21:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      avatar,
      color,
      isTaskCompetitor,
      pin: pin.trim() || undefined,
      permissions: {
        canCreateTasks,
        canEditTasks,
        canDeleteTasks,
      },
      mealTimes,
      isActive: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {profile ? 'Edit Profile' : 'Add Profile'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Profile Name
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
              Avatar (Emoji)
            </label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="input-primary"
              placeholder="👤"
              maxLength={2}
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              PIN (Optional)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input-primary"
              placeholder="Leave empty for no PIN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Meal Times
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Breakfast
                </label>
                <input
                  type="time"
                  value={mealTimes.breakfast}
                  onChange={(e) => setMealTimes(prev => ({ ...prev, breakfast: e.target.value }))}
                  className="input-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Lunch
                </label>
                <input
                  type="time"
                  value={mealTimes.lunch}
                  onChange={(e) => setMealTimes(prev => ({ ...prev, lunch: e.target.value }))}
                  className="input-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Dinner
                </label>
                <input
                  type="time"
                  value={mealTimes.dinner}
                  onChange={(e) => setMealTimes(prev => ({ ...prev, dinner: e.target.value }))}
                  className="input-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  Night Cap
                </label>
                <input
                  type="time"
                  value={mealTimes.nightcap}
                  onChange={(e) => setMealTimes(prev => ({ ...prev, nightcap: e.target.value }))}
                  className="input-primary text-sm"
                />
              </div>
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Permissions</p>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={canCreateTasks}
                  onChange={(e) => setCanCreateTasks(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Can Create Tasks
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={canEditTasks}
                  onChange={(e) => setCanEditTasks(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Can Edit Tasks
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={canDeleteTasks}
                  onChange={(e) => setCanDeleteTasks(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Can Delete Tasks
                </span>
              </label>
            </div>
          </div>

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
              {profile ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}