import React, { useState } from 'react';
import { Moon, Sun, Settings, User, ChevronDown, Users, Trophy, X, Crown, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';
import { PasswordModal } from './PasswordModal';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfileSelection: () => void;
}

export function Header({ onOpenSettings, onOpenProfileSelection }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTrophyModal, setShowTrophyModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedTasksCount = state.tasks.filter(t => t.isCompleted).length;
  const totalTasksCount = state.tasks.length;
  const isViewOnlyMode = state.settings.viewOnlyMode;

  // Calculate Top Competitor (same logic as in HistoryAnalytics)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentHistory = state.history.filter(entry => 
    new Date(entry.timestamp) >= fourteenDaysAgo
  );

  const completedActions = recentHistory.filter(entry => entry.action === 'completed');
  const uncheckedActions = recentHistory.filter(entry => entry.action === 'unchecked');

  const taskCompetitors = state.profiles.filter(profile => profile.isTaskCompetitor);
  
  const competitorStats = taskCompetitors.map(profile => {
    const profileCompletions = completedActions.filter(entry => 
      entry.profileId === profile.id
    ).length;
    
    const profileUnchecked = uncheckedActions.filter(entry => 
      entry.profileId === profile.id
    ).length;
    
    return {
      profile,
      completions: profileCompletions,
      unchecked: profileUnchecked,
      accuracy: profileCompletions > 0 ? 
        Math.max(0, ((profileCompletions - profileUnchecked) / profileCompletions * 100)) : 0
    };
  }).sort((a, b) => {
    if (b.completions !== a.completions) {
      return b.completions - a.completions;
    }
    return b.accuracy - a.accuracy;
  });

  const topCompetitor = competitorStats.find(stat => stat.completions > 0);

  // Calculate Top Collaborator (if enabled in settings)
  const collaborativeTasks = state.tasks.filter(task => task.profiles.length > 1);
  const collaborativeTaskIds = new Set(collaborativeTasks.map(task => task.id));
  const collaborativeCompletedActions = completedActions.filter(entry => 
    collaborativeTaskIds.has(entry.taskId)
  );

  const collaborativeProfileStats = state.profiles.map(profile => {
    const profileCollaborativeCompletions = collaborativeCompletedActions.filter(entry => 
      entry.profileId === profile.id
    ).length;
    
    const profileCollaborativeUnchecked = uncheckedActions.filter(entry => 
      entry.profileId === profile.id && collaborativeTaskIds.has(entry.taskId)
    ).length;
    
    return {
      profile,
      completions: profileCollaborativeCompletions,
      unchecked: profileCollaborativeUnchecked,
      accuracy: profileCollaborativeCompletions > 0 ? 
        Math.max(0, ((profileCollaborativeCompletions - profileCollaborativeUnchecked) / profileCollaborativeCompletions * 100)) : 0
    };
  }).sort((a, b) => b.completions - a.completions);

  const topCollaborator = collaborativeProfileStats.find(stat => stat.completions > 0);

  // Show trophy if:
  // 1. There are task competitors (Top Competitor is functional), OR
  // 2. Top Collaborator is enabled in settings AND there are collaborative tasks
  const hasCompetitors = taskCompetitors.length > 0;
  const hasCollaborativeFeature = state.settings.showTopCollaborator && collaborativeTasks.length > 0;
  const showTrophy = hasCompetitors || hasCollaborativeFeature;

  const handleDisableViewOnlyMode = () => {
    // Check if current profile has a PIN
    if (activeProfile?.pin) {
      // Show PIN modal for authentication
      setShowPinModal(true);
      setShowProfileMenu(false);
    } else {
      // No PIN required, disable view only mode directly
      dispatch({
        type: 'UPDATE_SETTINGS',
        updates: { viewOnlyMode: false }
      });
      setShowProfileMenu(false);
    }
  };

  const handlePinSuccess = () => {
    // PIN verified, disable view only mode
    dispatch({
      type: 'UPDATE_SETTINGS',
      updates: { viewOnlyMode: false }
    });
    setShowPinModal(false);
  };

  const handlePinClose = () => {
    setShowPinModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              {/* Logo - Only shown on larger screens (sm and up) */}
              <div className="w-8 h-8 hidden sm:block">
                <img 
                  src="/image.png" 
                  alt="ZenTasks Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Title and Progress - Always visible */}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    ZenTasks
                  </h1>
                  {/* View Only Mode Indicator */}
                  {isViewOnlyMode && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">View Only</span>
                    </div>
                  )}
                </div>
                {/* Progress text - Always visible, responsive sizing */}
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {completedTasksCount} of {totalTasksCount} completed
                </p>
              </div>
            </div>

            {/* Profile and Actions */}
            <div className="flex items-center space-x-2">
              {/* Trophy Button - Show if there are competitors OR collaborative features enabled */}
              {showTrophy && (
                <button
                  onClick={() => setShowTrophyModal(true)}
                  className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  title={
                    hasCompetitors && hasCollaborativeFeature 
                      ? 'View Competition & Collaboration Status'
                      : hasCompetitors 
                        ? (topCompetitor ? `View Top Competitor: ${topCompetitor.profile.name}` : 'View Competition Status')
                        : 'View Collaboration Status'
                  }
                >
                  <Trophy className="w-5 h-5" />
                </button>
              )}

              {/* Profile Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
                >
                  <span className="text-lg">{activeProfile?.avatar}</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden sm:block">
                    {activeProfile?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 animate-slide-down">
                    {/* Current Profile Section */}
                    <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Current Profile</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{activeProfile?.avatar}</span>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {activeProfile?.name}
                        </span>
                        {activeProfile?.pin && (
                          <div className="w-2 h-2 bg-warning-500 rounded-full" title="PIN Protected" />
                        )}
                        {isViewOnlyMode && (
                          <div className="flex items-center space-x-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded">
                            <Eye className="w-2 h-2" />
                            <span>View Only</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Only Mode Toggle - Only show if current profile has view only mode enabled */}
                    {isViewOnlyMode && (
                      <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={handleDisableViewOnlyMode}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                        >
                          <EyeOff className="w-4 h-4 text-blue-500" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Disable View Only Mode
                            </span>
                            {activeProfile?.pin && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                PIN required
                              </p>
                            )}
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Quick Switch Profiles (non-PIN protected) */}
                    {state.profiles.filter(p => p.id !== state.activeProfileId && !p.pin).map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profile.id });
                          dispatch({ type: 'UPDATE_SETTINGS', updates: { viewOnlyMode: false } });
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <span className="text-lg">{profile.avatar}</span>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {profile.name}
                        </span>
                      </button>
                    ))}

                    {/* Switch Profile Button */}
                    <div className="border-t border-neutral-200 dark:border-neutral-700 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onOpenProfileSelection();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
                      >
                        <Users className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          Switch Profile
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                )}
              </button>

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-200"
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Close profile menu when clicking outside */}
        {showProfileMenu && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowProfileMenu(false)}
          />
        )}
      </header>

      {/* PIN Modal for Disabling View Only Mode */}
      <PasswordModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={`Disable View Only Mode`}
        description={`Enter your PIN to disable view only mode and gain full access to ${activeProfile?.name}'s tasks.`}
        placeholder="Enter PIN..."
        expectedPassword={activeProfile?.pin}
      />

      {/* Trophy Modal */}
      {showTrophyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowTrophyModal(false)} 
          />
          
          <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {hasCompetitors && hasCollaborativeFeature 
                    ? 'Competition & Collaboration Status'
                    : hasCompetitors 
                      ? 'Competition Status'
                      : 'Collaboration Status'
                  }
                </h2>
              </div>
              <button
                onClick={() => setShowTrophyModal(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Competitor Section - Only show if there are competitors */}
              {hasCompetitors && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-orange-500" />
                    Top Competitor (Last 14 Days)
                  </h3>
                  
                  {topCompetitor ? (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
                              {topCompetitor.profile.avatar}
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                              <Trophy className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                              {topCompetitor.profile.name}
                            </h4>
                            <p className="text-orange-600 dark:text-orange-400 font-medium">
                              🏆 Current Champion
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-orange-500 mb-1">
                            #1
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Rank
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {topCompetitor.completions}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Tasks Completed
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {Math.round(topCompetitor.accuracy)}%
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Accuracy Rate
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <Trophy className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        No Champion Yet
                      </h4>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Complete some tasks to compete for the top spot!
                      </p>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>{taskCompetitors.length}</strong> competitor{taskCompetitors.length !== 1 ? 's' : ''} registered:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {taskCompetitors.map(competitor => (
                            <div key={competitor.id} className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                              <span className="text-sm">{competitor.avatar}</span>
                              <span className="text-xs text-blue-700 dark:text-blue-300">{competitor.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Collaborator Section - Only show if enabled in settings */}
              {state.settings.showTopCollaborator && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-blue-500" />
                    Top Collaborator (Last 14 Days)
                  </h3>
                  
                  {collaborativeTasks.length > 0 && topCollaborator ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                              {topCollaborator.profile.avatar}
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                              {topCollaborator.profile.name}
                            </h4>
                            <p className="text-blue-600 dark:text-blue-400 font-medium">
                              👑 Champion Collaborator
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-blue-500 mb-1">
                            #1
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Rank
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {topCollaborator.completions}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Collaborative Tasks
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(topCollaborator.accuracy)}%
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Accuracy Rate
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Based on completion of {collaborativeTasks.length} collaborative task{collaborativeTasks.length !== 1 ? 's' : ''} 
                          (tasks assigned to multiple people)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <Crown className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        No Collaborative Tasks Yet
                      </h4>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Create tasks assigned to multiple people to see collaboration statistics.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Show message if neither feature is available */}
              {!hasCompetitors && !hasCollaborativeFeature && (
                <div className="text-center py-12">
                  <Trophy className="w-20 h-20 mx-auto mb-6 text-neutral-300 dark:text-neutral-600" />
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    No Competition or Collaboration Features Active
                  </h3>
                  <div className="space-y-3 text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    <p className="text-sm">
                      To enable competition features, mark profiles as "Task Competitors" in Settings → Profiles.
                    </p>
                    <p className="text-sm">
                      To enable collaboration tracking, create tasks assigned to multiple profiles and enable "Show Top Collaborator" in Settings → General.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}