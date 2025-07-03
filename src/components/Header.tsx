import React, { useState } from 'react';
import { Menu, Moon, Sun, Settings, User, ChevronDown, Users } from 'lucide-react';
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
  
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const completedTasksCount = state.tasks.filter(t => t.isCompleted).length;
  const totalTasksCount = state.tasks.length;

  return (
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
  );
}