import React from 'react';
import { TrendingUp, Users, Calendar, Target, Award, Clock, Crown, RefreshCw, CheckCircle } from 'lucide-react';
import { HistoryEntry, Task, UserProfile } from '../types';

interface HistoryAnalyticsProps {
  history: HistoryEntry[];
  tasks: Task[];
  profiles: UserProfile[];
}

export function HistoryAnalytics({ history, tasks, profiles }: HistoryAnalyticsProps) {
  // Filter history for last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const recentHistory = history.filter(entry => 
    new Date(entry.timestamp) >= fourteenDaysAgo
  );

  // Filter history for last 2 days for Recent Activity Summary
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const lastTwoDaysHistory = history.filter(entry => 
    new Date(entry.timestamp) >= twoDaysAgo
  );

  // Filter history for last 2 months for reset tasks
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const twoMonthHistory = history.filter(entry => 
    new Date(entry.timestamp) >= twoMonthsAgo
  );

  // Calculate completion stats
  const completedActions = recentHistory.filter(entry => entry.action === 'completed');
  const uncheckedActions = recentHistory.filter(entry => entry.action === 'unchecked');
  const resetActions = recentHistory.filter(entry => entry.action === 'reset');
  const restoredActions = recentHistory.filter(entry => entry.action === 'restored');

  // Calculate reset tasks in last 2 months (manual resets before due date)
  const resetTasksCount = twoMonthHistory.filter(entry => {
    if (entry.action !== 'reset') return false;
    
    // Find the task to check if it had a due date
    const task = tasks.find(t => t.id === entry.taskId);
    if (!task || !task.dueDate) return false;
    
    // Check if reset was done before the due date
    const resetDate = new Date(entry.timestamp);
    const dueDate = new Date(task.dueDate);
    
    return resetDate < dueDate;
  }).length;

  // Calculate productivity by day of week
  const dayStats = Array.from({ length: 7 }, (_, i) => {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
    const dayCompletions = completedActions.filter(entry => 
      new Date(entry.timestamp).getDay() === i
    ).length;
    return { day: dayName, completions: dayCompletions };
  });

  const mostProductiveDay = dayStats.reduce((max, day) => 
    day.completions > max.completions ? day : max
  );

  // Calculate profile stats (only if more than 1 profile)
  const profileStats = profiles.map(profile => {
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
  }).sort((a, b) => b.completions - a.completions);

  const topCollaborator = profileStats.find(stat => stat.completions > 0);

  // Calculate task completion patterns
  const taskCompletionStats = tasks.map(task => {
    const taskCompletions = completedActions.filter(entry => 
      entry.taskId === task.id
    ).length;
    const taskUnchecked = uncheckedActions.filter(entry => 
      entry.taskId === task.id
    ).length;
    
    return {
      task,
      completions: taskCompletions,
      unchecked: taskUnchecked,
      consistency: taskCompletions > 0 ? 
        Math.max(0, ((taskCompletions - taskUnchecked) / taskCompletions * 100)) : 0
    };
  }).sort((a, b) => b.completions - a.completions);

  const mostConsistentTasks = taskCompletionStats
    .filter(stat => stat.completions >= 3)
    .sort((a, b) => b.consistency - a.consistency)
    .slice(0, 3);

  // Recent Activity Summary - Last 2 days, completed items only
  const recentCompletedActions = lastTwoDaysHistory.filter(entry => entry.action === 'completed');
  
  // Group by day
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayCompletions = recentCompletedActions.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });
  
  const yesterdayCompletions = recentCompletedActions.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === yesterday.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="w-6 h-6 text-success-600 dark:text-success-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {completedActions.length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tasks Completed
          </p>
        </div>

        <div className="card p-4 text-center">
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {uncheckedActions.length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tasks Unchecked
          </p>
        </div>

        <div className="card p-4 text-center">
          <div className="w-12 h-12 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <RefreshCw className="w-6 h-6 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {resetTasksCount}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Reset Tasks
          </p>
        </div>

        <div className="card p-4 text-center">
          <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Award className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {Math.round(((completedActions.length - uncheckedActions.length) / Math.max(completedActions.length, 1)) * 100)}%
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Accuracy Rate
          </p>
        </div>
      </div>

      {/* Most Productive Day */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-500" />
          Most Productive Day
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {mostProductiveDay.day}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {mostProductiveDay.completions} tasks completed on average
            </p>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayStats.map((day, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: day.completions === mostProductiveDay.completions 
                      ? 'rgb(99 102 241)' 
                      : 'rgb(229 231 235)',
                    color: day.completions === mostProductiveDay.completions 
                      ? 'white' 
                      : 'rgb(107 114 128)'
                  }}
                >
                  {day.completions}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {day.day.slice(0, 3)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Collaborator (show if more than 1 profile AND there's activity) */}
      {profiles.length > 1 && topCollaborator && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Top Collaborator (Last 14 Days)
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-2xl shadow-lg">
                  {topCollaborator.profile.avatar}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {topCollaborator.profile.name}
                </h5>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  🏆 Champion Collaborator
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-medium text-success-600 dark:text-success-400">
                      {topCollaborator.completions} completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-accent-500" />
                    <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
                      {Math.round(topCollaborator.accuracy)}% accuracy
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-500 mb-1">
                #1
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Rank
              </p>
            </div>
          </div>
          
          {/* Other top performers */}
          {profileStats.length > 1 && profileStats.filter(stat => stat.completions > 0).length > 1 && (
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Other Contributors
              </p>
              <div className="space-y-2">
                {profileStats.filter(stat => stat.completions > 0).slice(1, 3).map((stat, index) => (
                  <div key={stat.profile.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                        {stat.profile.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {stat.profile.name}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {stat.completions} completed • {Math.round(stat.accuracy)}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-neutral-600 dark:text-neutral-400">
                        #{index + 2}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Performance (only show if more than 1 profile) */}
      {profiles.length > 1 && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-500" />
            Profile Performance (Last 14 Days)
          </h4>
          <div className="space-y-4">
            {profileStats.filter(stat => stat.completions > 0).slice(0, 3).map((stat, index) => (
              <div key={stat.profile.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{stat.profile.avatar}</span>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {stat.profile.name}
                        {index === 0 && (
                          <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                            Most Active
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {stat.completions} completed • {stat.unchecked} unchecked
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {Math.round(stat.accuracy)}%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Accuracy
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Consistent Tasks */}
      {mostConsistentTasks.length > 0 && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-primary-500" />
            Most Consistent Tasks
          </h4>
          <div className="space-y-3">
            {mostConsistentTasks.map((stat, index) => (
              <div key={stat.task.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {stat.task.title}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {stat.completions} completions • {stat.unchecked} unchecked
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-success-600 dark:text-success-400">
                    {Math.round(stat.consistency)}%
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Consistency
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Summary - Last 2 Days, Completed Items Only */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-success-500" />
          Recent Activity Summary (Last 2 Days)
        </h4>
        
        {recentCompletedActions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-500 dark:text-neutral-400">
              No tasks completed in the last 2 days
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Completions */}
            {todayCompletions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Today ({todayCompletions.length} completed)
                  </h5>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="space-y-2">
                  {todayCompletions.slice(0, 5).map(entry => {
                    const profile = profiles.find(p => p.id === entry.profileId);
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/10 rounded-lg border border-success-200 dark:border-success-800">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-success-500" />
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {entry.taskTitle}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              Completed by {profile?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    );
                  })}
                  {todayCompletions.length > 5 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                      +{todayCompletions.length - 5} more completed today
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Yesterday's Completions */}
            {yesterdayCompletions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Yesterday ({yesterdayCompletions.length} completed)
                  </h5>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="space-y-2">
                  {yesterdayCompletions.slice(0, 5).map(entry => {
                    const profile = profiles.find(p => p.id === entry.profileId);
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-neutral-400" />
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {entry.taskTitle}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              Completed by {profile?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    );
                  })}
                  {yesterdayCompletions.length > 5 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                      +{yesterdayCompletions.length - 5} more completed yesterday
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {todayCompletions.length}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
                    {yesterdayCompletions.length}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Tasks Warning */}
        {resetTasksCount > 0 && (
          <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-warning-600 dark:text-warning-400" />
              <p className="text-sm text-warning-700 dark:text-warning-400">
                <strong>{resetTasksCount}</strong> tasks were reset before their due date in the last 2 months. 
                This may indicate incorrect recurrence scheduling.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}