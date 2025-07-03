import React from 'react';
import { TrendingUp, Users, Calendar, Target, Award, Clock } from 'lucide-react';
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

  // Calculate completion stats
  const completedActions = recentHistory.filter(entry => entry.action === 'completed');
  const uncheckedActions = recentHistory.filter(entry => entry.action === 'unchecked');
  const resetActions = recentHistory.filter(entry => entry.action === 'reset');
  const restoredActions = recentHistory.filter(entry => entry.action === 'restored');

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
        ((profileCompletions - profileUnchecked) / profileCompletions * 100) : 0
    };
  }).sort((a, b) => b.completions - a.completions);

  const mostActiveProfile = profileStats[0];

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
        ((taskCompletions - taskUnchecked) / taskCompletions * 100) : 0
    };
  }).sort((a, b) => b.completions - a.completions);

  const mostConsistentTasks = taskCompletionStats
    .filter(stat => stat.completions >= 3)
    .sort((a, b) => b.consistency - a.consistency)
    .slice(0, 3);

  // Calculate weekly trends
  const weeklyData = Array.from({ length: 2 }, (_, weekIndex) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (weekIndex + 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekCompletions = completedActions.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= weekStart && entryDate < weekEnd;
    }).length;
    
    return {
      week: weekIndex === 0 ? 'This Week' : 'Last Week',
      completions: weekCompletions
    };
  });

  const weeklyTrend = weeklyData[0].completions - weeklyData[1].completions;

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
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {weeklyTrend >= 0 ? '+' : ''}{weeklyTrend}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Weekly Change
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

      {/* Profile Performance (only show if more than 1 profile) */}
      {profiles.length > 1 && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-500" />
            Profile Performance (Last 14 Days)
          </h4>
          <div className="space-y-4">
            {profileStats.slice(0, 3).map((stat, index) => (
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

      {/* Weekly Comparison */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
          Weekly Comparison
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {weeklyData.map((week, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {week.completions}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {week.week}
              </p>
            </div>
          ))}
        </div>
        {weeklyTrend !== 0 && (
          <div className="mt-4 text-center">
            <p className={`text-sm font-medium ${
              weeklyTrend > 0 
                ? 'text-success-600 dark:text-success-400' 
                : 'text-error-600 dark:text-error-400'
            }`}>
              {weeklyTrend > 0 ? '↗' : '↘'} {Math.abs(weeklyTrend)} tasks {weeklyTrend > 0 ? 'more' : 'fewer'} than last week
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity Summary */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Recent Activity Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-success-600 dark:text-success-400">
              {completedActions.length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Completed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
              {uncheckedActions.length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Unchecked</p>
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-600 dark:text-neutral-400">
              {resetActions.length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Reset</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {restoredActions.length}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Restored</p>
          </div>
        </div>
      </div>
    </div>
  );
}