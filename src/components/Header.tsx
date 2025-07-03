import React, { useState } from 'react';
import { Menu, Moon, Sun, Settings, User, ChevronDown, Users, Trophy, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfileSelection: () => void;
}

export function Header({ onOpenSettings, onOpenProfileSelection }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTrophyModal, setShowTrophyModal] = useState(false);
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedTasksCount = state.tasks.filter(t => t.isCompleted).length;
  const totalTasksCount = state.tasks.length;

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

  // Debug logging
  console.log('Trophy Debug:', {
    taskCompetitors: taskCompetitors.length,
    topCompetitor: topCompetitor ? topCompetitor.profile.name : 'none',
    competitorStats,
    recentHistory: recentHistory.length,
    completedActions: completedActions.length
  });

  // Show trophy if there are any competitors (even without recent activity for testing)
  const showTrophy = taskCompetitors.length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  ZenTasks
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {completedTasksCount} of {totalTasksCount} completed
                </p>
              </div>
            </div>

            {/* Profile and Actions */}
            <div className="flex items-center space-x-2">
              {/* Trophy Button - Show if there are any competitors */}
              {showTrophy && (
                <button
                  onClick={() => setShowTrophyModal(true)}
                  className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  title={topCompetitor ? `View Top Competitor: ${topCompetitor.profile.name}` : 'View Competition Status'}
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
                      </div>
                    </div>

                    {/* Quick Switch Profiles (non-PIN protected) */}
                    {state.profiles.filter(p => p.id !== state.activeProfileId && !p.pin).map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profile.id });
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

      {/* Trophy Modal */}
      {showTrophyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowTrophyModal(false)} 
          />
          
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Top Competitor
                </h2>
              </div>
              <button
                onClick={() => setShowTrophyModal(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6">
              {topCompetitor ? (
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg mx-auto">
                      {topCompetitor.profile.avatar}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {topCompetitor.profile.name}
                  </h3>
                  
                  <p className="text-orange-600 dark:text-orange-400 font-medium mb-4">
                    🏆 Current Champion
                  </p>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {topCompetitor.completions}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Tasks Completed
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round(topCompetitor.accuracy)}%
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Accuracy Rate
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Leading the competition over the last 14 days
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    No Champion Yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Complete some tasks to compete for the top spot!
                  </p>
                  
                  {/* Show competitor info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
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
          </div>
        </div>
      )}
    </>
  );
}