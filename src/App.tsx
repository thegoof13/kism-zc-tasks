import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { TaskGroup } from './components/TaskGroup';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileSelectionModal } from './components/ProfileSelectionModal';
import { PasswordModal } from './components/PasswordModal';
import { ApiStatusBanner, useApiStatus } from './components/ApiStatusBanner';
import { Task } from './types';
import { useNotifications } from './hooks/useNotifications';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400">Loading FocusFlow...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { state, dispatch } = useApp();
  const { showBanner, dismissBanner } = useApiStatus();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsPasswordSet, setIsSettingsPasswordSet] = useState(false);

  const isViewOnlyMode = state.settings.viewOnlyMode;

  // Initialize notifications
  useNotifications({
    tasks: state.tasks,
    groups: state.groups,
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
    enableNotifications: state.settings.enableNotifications,
  });

  // Check URL parameters for profile bypass
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('profile');
    const bypassPin = urlParams.get('bypass_pin') === 'true';
    
    if (profileParam && bypassPin && !state.loading) {
      // Check if the profile exists
      const profile = state.profiles.find(p => p.id === profileParam);
      if (profile) {
        // Set the profile directly, bypassing PIN requirements
        dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profileParam });
        
        // Clean up URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('profile');
        newUrl.searchParams.delete('bypass_pin');
        window.history.replaceState({}, '', newUrl.toString());
        
        return; // Don't show profile selection
      }
    }
    
    // Normal profile selection logic
    if (!state.loading && state.profiles.length > 0) {
      const savedProfileId = localStorage.getItem('focusflow_active_profile');
      const hasValidSavedProfile = savedProfileId && state.profiles.some(p => p.id === savedProfileId);
      
      // If no valid saved profile or no active profile set, show profile selection
      if (!hasValidSavedProfile || !state.activeProfileId) {
        setShowProfileSelection(true);
      }
    }
  }, [state.loading, state.profiles, state.activeProfileId, dispatch]);

  // Check if settings password is set
  useEffect(() => {
    setIsSettingsPasswordSet(!!state.settings.settingsPassword);
  }, [state.settings.settingsPassword]);

  if (state.loading) {
    return <LoadingSpinner />;
  }

  // Show profile selection if no active profile
  if (!state.activeProfileId && state.profiles.length > 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Welcome to FocusFlow
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            Please select a profile to continue
          </p>
        </div>
        
        <ProfileSelectionModal
          isOpen={true}
          onClose={() => {}} // Don't allow closing without selection
          profiles={state.profiles}
          onSelectProfile={(profileId) => {
            dispatch({ type: 'SET_ACTIVE_PROFILE', profileId });
            setShowProfileSelection(false);
          }}
        />
      </div>
    );
  }

  // Sort groups by order
  const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);

  // Filter tasks based on active profile
  const activeProfileTasks = state.tasks.filter(task => 
    task.profiles.includes(state.activeProfileId)
  );

  // Check if active profile can create tasks (disabled in view only mode)
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const canCreateTasks = !isViewOnlyMode && (activeProfile?.permissions?.canCreateTasks ?? true);

  const handleAddTask = (groupId?: string) => {
    if (!canCreateTasks) return;
    
    setSelectedGroupId(groupId || '');
    setShowAddTask(true);
  };

  const handleEditGroup = (group: any) => {
    // This would open group edit modal - simplified for now
    console.log('Edit group:', group);
  };

  const handleEditTask = (task: Task) => {
    if (isViewOnlyMode) return; // Prevent editing in view only mode
    
    setEditingTask(task);
    setShowEditTask(true);
  };

  const handleOpenSettings = () => {
    if (isSettingsPasswordSet) {
      setShowSettingsPassword(true);
    } else {
      setShowSettings(true);
    }
  };

  const handleSettingsPasswordSuccess = () => {
    setShowSettingsPassword(false);
    setShowSettings(true);
  };

  const handleSetSettingsPassword = (password: string) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { settingsPassword: password }
    });
  };

  const handleProfileSelect = (profileId: string) => {
    dispatch({ type: 'SET_ACTIVE_PROFILE', profileId });
    setShowProfileSelection(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* API Status Banner */}
      <ApiStatusBanner 
        isVisible={showBanner} 
        onDismiss={dismissBanner} 
      />
      
      {/* Adjust header position when banner is visible */}
      <div className={showBanner ? 'pt-16' : ''}>
        <Header 
          onOpenSettings={handleOpenSettings}
          onOpenProfileSelection={() => setShowProfileSelection(true)}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-4">
          {/* Welcome Message */}
          {activeProfileTasks.length === 0 && (
            <div className="text-center py-12 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Welcome to ZenTasks
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                {isViewOnlyMode 
                  ? 'You are in view-only mode. You can see tasks but cannot modify them.'
                  : 'Bring zen to your task management. Create your first task to get started.'
                }
              </p>
              {canCreateTasks && (
                <button
                  onClick={() => handleAddTask()}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Task
                </button>
              )}
            </div>
          )}

          {/* Task Groups - Reduced spacing */}
          <div className="space-y-3">
            {sortedGroups.map(group => {
              const groupTasks = state.tasks.filter(task => task.groupId === group.id);
              
              return (
                <TaskGroup
                  key={group.id}
                  group={group}
                  tasks={groupTasks}
                  onAddTask={handleAddTask}
                  onEditGroup={handleEditGroup}
                  onEditTask={handleEditTask}
                />
              );
            })}
          </div>

          {/* Empty State for Groups */}
          {activeProfileTasks.length > 0 && sortedGroups.every(group => {
            const groupTasks = state.tasks.filter(task => 
              task.groupId === group.id && task.profiles.includes(state.activeProfileId)
            );
            return groupTasks.length === 0;
          }) && (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                No tasks assigned to your profile
              </p>
              {canCreateTasks && (
                <button
                  onClick={() => handleAddTask()}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Task
                </button>
              )}
            </div>
          )}
        </main>

        {/* Floating Action Button - Only show if not in view only mode */}
        {activeProfileTasks.length > 0 && canCreateTasks && (
          <button
            onClick={() => handleAddTask()}
            className="floating-action-btn"
            aria-label="Add new task"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Modals */}
      {canCreateTasks && (
        <AddTaskModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          initialGroupId={selectedGroupId}
        />
      )}
      
      {editingTask && !isViewOnlyMode && (
        <EditTaskModal
          isOpen={showEditTask}
          onClose={() => {
            setShowEditTask(false);
            setEditingTask(null);
          }}
          task={editingTask}
        />
      )}
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSetSettingsPassword={handleSetSettingsPassword}
        isSettingsPasswordSet={isSettingsPasswordSet}
      />

      <ProfileSelectionModal
        isOpen={showProfileSelection}
        onClose={() => setShowProfileSelection(false)}
        profiles={state.profiles}
        onSelectProfile={handleProfileSelect}
      />

      {/* Settings Password Modal */}
      <PasswordModal
        isOpen={showSettingsPassword}
        onClose={() => setShowSettingsPassword(false)}
        onSuccess={handleSettingsPasswordSuccess}
        title="Settings Access"
        description="Enter the settings password to access configuration options."
        placeholder="Enter settings password..."
        expectedPassword={state.settings.settingsPassword}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;