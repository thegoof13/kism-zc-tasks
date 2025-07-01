import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { TaskGroup } from './components/TaskGroup';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { RestoreResetModal } from './components/RestoreResetModal';
import { SettingsModal } from './components/SettingsModal';
import { Task } from './types';

function AppContent() {
  const { state } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showRestoreTask, setShowRestoreTask] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [restoringTask, setRestoringTask] = useState<Task | null>(null);

  // Sort groups by order
  const sortedGroups = [...state.groups].sort((a, b) => a.order - b.order);

  // Filter tasks based on active profile
  const activeProfileTasks = state.tasks.filter(task => 
    task.profiles.includes(state.activeProfileId)
  );

  const handleAddTask = (groupId?: string) => {
    setSelectedGroupId(groupId || '');
    setShowAddTask(true);
  };

  const handleEditGroup = (group: any) => {
    // This would open group edit modal - simplified for now
    console.log('Edit group:', group);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditTask(true);
  };

  const handleRestoreTask = (task: Task) => {
    setRestoringTask(task);
    setShowRestoreTask(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header onOpenSettings={() => setShowSettings(true)} />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Message */}
        {activeProfileTasks.length === 0 && (
          <div className="text-center py-12 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Welcome to ZenTasks
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              Start organizing your life with smart recurring tasks. Create your first task to get started.
            </p>
            <button
              onClick={() => handleAddTask()}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Task
            </button>
          </div>
        )}

        {/* Task Groups */}
        <div className="space-y-6">
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
                onRestoreTask={handleRestoreTask}
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
            <button
              onClick={() => handleAddTask()}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Task
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {activeProfileTasks.length > 0 && (
        <button
          onClick={() => handleAddTask()}
          className="floating-action-btn"
          aria-label="Add new task"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        initialGroupId={selectedGroupId}
      />
      
      {editingTask && (
        <EditTaskModal
          isOpen={showEditTask}
          onClose={() => {
            setShowEditTask(false);
            setEditingTask(null);
          }}
          task={editingTask}
        />
      )}

      {restoringTask && (
        <RestoreResetModal
          isOpen={showRestoreTask}
          onClose={() => {
            setShowRestoreTask(false);
            setRestoringTask(null);
          }}
          task={restoringTask}
        />
      )}
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
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