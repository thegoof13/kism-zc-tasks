import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TaskGroup, UserProfile, CompletedDisplayMode } from '../types';
import { getAvailableIcons } from '../utils/icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'groups' | 'profiles' | 'data' | 'preferences';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('groups');
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zentasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        // Basic validation
        if (importedData.tasks && importedData.groups && importedData.profiles) {
          dispatch({ type: 'LOAD_STATE', state: importedData });
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-hidden">
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

        <div className="flex">
          {/* Tabs */}
          <div className="w-48 border-r border-neutral-200 dark:border-neutral-700 p-4">
            <nav className="space-y-1">
              {[
                { id: 'groups', label: 'Groups', icon: '📁' },
                { id: 'profiles', label: 'Profiles', icon: '👥' },
                { id: 'data', label: 'Data', icon: '💾' },
                { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'groups' && (
              <GroupsSettings
                groups={state.groups}
                editingGroup={editingGroup}
                setEditingGroup={setEditingGroup}
                dispatch={dispatch}
              />
            )}
            
            {activeTab === 'profiles' && (
              <ProfilesSettings
                profiles={state.profiles}
                editingProfile={editingProfile}
                setEditingProfile={setEditingProfile}
                dispatch={dispatch}
              />
            )}
            
            {activeTab === 'data' && (
              <DataSettings
                onExport={handleExportData}
                onImport={handleImportData}
                historyCount={state.history.length}
              />
            )}
            
            {activeTab === 'preferences' && (
              <PreferencesSettings
                settings={state.settings}
                dispatch={dispatch}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Groups Settings Component
function GroupsSettings({ groups, editingGroup, setEditingGroup, dispatch }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    color: '#6366F1',
    icon: 'User',
    completedDisplayMode: 'grey-out' as CompletedDisplayMode,
  });

  const availableIcons = getAvailableIcons();

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    dispatch({
      type: 'ADD_GROUP',
      group: {
        ...newGroup,
        isCollapsed: false,
      },
    });

    setNewGroup({
      name: '',
      color: '#6366F1',
      icon: 'User',
      completedDisplayMode: 'grey-out',
    });
    setShowAddForm(false);
  };

  const handleUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    dispatch({
      type: 'UPDATE_GROUP',
      groupId: editingGroup.id,
      updates: editingGroup,
    });
    setEditingGroup(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Task Groups
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </button>
      </div>

      {/* Add Group Form */}
      {showAddForm && (
        <form onSubmit={handleAddGroup} className="card p-4 space-y-3">
          <input
            type="text"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            placeholder="Group name"
            className="input-primary"
            autoFocus
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newGroup.color}
                onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Icon
              </label>
              <select
                value={newGroup.icon}
                onChange={(e) => setNewGroup({ ...newGroup, icon: e.target.value })}
                className="input-primary"
              >
                {availableIcons.map(({ name, component: Icon }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Completed Tasks Display
            </label>
            <select
              value={newGroup.completedDisplayMode}
              onChange={(e) => setNewGroup({ ...newGroup, completedDisplayMode: e.target.value as CompletedDisplayMode })}
              className="input-primary"
            >
              <option value="grey-out">Grey out only</option>
              <option value="grey-drop">Grey out + drop to bottom</option>
              <option value="separate-completed">Move to completed section</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button type="submit" className="btn-primary text-sm">
              Add Group
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit Group Form */}
      {editingGroup && (
        <form onSubmit={handleUpdateGroup} className="card p-4 space-y-3">
          <input
            type="text"
            value={editingGroup.name}
            onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
            className="input-primary"
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={editingGroup.color}
                onChange={(e) => setEditingGroup({ ...editingGroup, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Icon
              </label>
              <select
                value={editingGroup.icon}
                onChange={(e) => setEditingGroup({ ...editingGroup, icon: e.target.value })}
                className="input-primary"
              >
                {availableIcons.map(({ name, component: Icon }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Completed Tasks Display
            </label>
            <select
              value={editingGroup.completedDisplayMode}
              onChange={(e) => setEditingGroup({ ...editingGroup, completedDisplayMode: e.target.value as CompletedDisplayMode })}
              className="input-primary"
            >
              <option value="grey-out">Grey out only</option>
              <option value="grey-drop">Grey out + drop to bottom</option>
              <option value="separate-completed">Move to completed section</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button type="submit" className="btn-primary text-sm">
              Update Group
            </button>
            <button
              type="button"
              onClick={() => setEditingGroup(null)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      <div className="space-y-2">
        {groups.map((group: TaskGroup) => (
          <div key={group.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {group.name}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                ({group.completedDisplayMode})
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingGroup(group)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <Edit className="w-4 h-4 text-neutral-500" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${group.name}" and all its tasks?`)) {
                    dispatch({ type: 'DELETE_GROUP', groupId: group.id });
                  }
                }}
                className="p-2 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 text-error-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Profiles Settings Component
function ProfilesSettings({ profiles, editingProfile, setEditingProfile, dispatch }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    color: '#6366F1',
    avatar: '👤',
    isActive: true,
  });

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name.trim()) return;

    dispatch({
      type: 'ADD_PROFILE',
      profile: newProfile,
    });

    setNewProfile({
      name: '',
      color: '#6366F1',
      avatar: '👤',
      isActive: true,
    });
    setShowAddForm(false);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    dispatch({
      type: 'UPDATE_PROFILE',
      profileId: editingProfile.id,
      updates: editingProfile,
    });
    setEditingProfile(null);
  };

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🕴️', '🤵', '👩‍💼', '👨‍💼'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          User Profiles
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      {/* Add Profile Form */}
      {showAddForm && (
        <form onSubmit={handleAddProfile} className="card p-4 space-y-3">
          <input
            type="text"
            value={newProfile.name}
            onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
            placeholder="Profile name"
            className="input-primary"
            autoFocus
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newProfile.color}
                onChange={(e) => setNewProfile({ ...newProfile, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setNewProfile({ ...newProfile, avatar })}
                    className={`text-lg p-2 rounded border-2 transition-colors duration-200 ${
                      newProfile.avatar === avatar
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button type="submit" className="btn-primary text-sm">
              Add Profile
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit Profile Form */}
      {editingProfile && (
        <form onSubmit={handleUpdateProfile} className="card p-4 space-y-3">
          <input
            type="text"
            value={editingProfile.name}
            onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
            className="input-primary"
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={editingProfile.color}
                onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setEditingProfile({ ...editingProfile, avatar })}
                    className={`text-lg p-2 rounded border-2 transition-colors duration-200 ${
                      editingProfile.avatar === avatar
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button type="submit" className="btn-primary text-sm">
              Update Profile
            </button>
            <button
              type="button"
              onClick={() => setEditingProfile(null)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Profiles List */}
      <div className="space-y-2">
        {profiles.map((profile: UserProfile) => (
          <div key={profile.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{profile.avatar}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {profile.name}
              </span>
              {profile.isActive && (
                <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingProfile(profile)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <Edit className="w-4 h-4 text-neutral-500" />
              </button>
              {profiles.length > 1 && (
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
        ))}
      </div>
    </div>
  );
}

// Data Settings Component
function DataSettings({ onExport, onImport, historyCount }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
        Data Management
      </h3>

      <div className="space-y-4">
        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Export Data
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Download a backup of all your tasks, groups, profiles, and history.
          </p>
          <button onClick={onExport} className="btn-primary text-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Backup
          </button>
        </div>

        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Import Data
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Restore from a previously exported backup file.
          </p>
          <label className="btn-secondary text-sm cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import Backup
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
        </div>

        <div className="card p-4">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Statistics
          </h4>
          <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <p>History entries: {historyCount}</p>
            <p>Data stored locally in your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preferences Settings Component
function PreferencesSettings({ settings, dispatch }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
        Preferences
      </h3>

      <div className="space-y-4">
        <div className="card p-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Show Completed Count
              </span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Display completed task count in group headers
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showCompletedCount}
              onChange={(e) => dispatch({
                type: 'UPDATE_SETTINGS',
                updates: { showCompletedCount: e.target.checked }
              })}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="card p-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Enable Notifications
              </span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Get notified about recurring tasks
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => dispatch({
                type: 'UPDATE_SETTINGS',
                updates: { enableNotifications: e.target.checked }
              })}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="card p-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Auto-archive Completed
              </span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Automatically archive old completed tasks
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoArchiveCompleted}
              onChange={(e) => dispatch({
                type: 'UPDATE_SETTINGS',
                updates: { autoArchiveCompleted: e.target.checked }
              })}
              className="w-4 h-4 text-primary-500 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </label>
        </div>

        {settings.autoArchiveCompleted && (
          <div className="card p-4">
            <label>
              <span className="block font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Archive after (days)
              </span>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.archiveDays}
                onChange={(e) => dispatch({
                  type: 'UPDATE_SETTINGS',
                  updates: { archiveDays: parseInt(e.target.value) || 30 }
                })}
                className="input-primary w-24"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}