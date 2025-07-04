import React from 'react';
import { TrendingUp, Users, Calendar, Target, Award, Clock, Crown, RefreshCw, CheckCircle, Eye, Trophy, Medal, Star } from 'lucide-react';
import { HistoryEntry, Task } from '../types';

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
  const autoResetActions = recentHistory.filter(entry => entry.action === 'auto-reset');

  // Calculate reset tasks in last 2 months (manual resets before due date)
  // Include both 'reset' and 'auto-reset' actions
  const resetTasksCount = twoMonthHistory.filter(entry => 
    entry.action === 'reset' || entry.action === 'auto-reset'
  ).length;

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

  // Get collaborative tasks (tasks with more than 1 profile assigned)
  const collaborativeTasks = tasks.filter(task => task.profiles.length > 1);
  const collaborativeTaskIds = new Set(collaborativeTasks.map(task => task.id));

  // Filter completed actions to only include collaborative tasks
  const collaborativeCompletedActions = completedActions.filter(entry => 
    collaborativeTaskIds.has(entry.taskId)
  );

  // Calculate profile stats for collaborative tasks only
  const collaborativeProfileStats = profiles.map(profile => {
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

  // Calculate Task Competitor stats (all tasks for competitors)
  const taskCompetitors = profiles.filter(profile => profile.isTaskCompetitor);
  
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
    // Sort by completions first, then by accuracy
    if (b.completions !== a.completions) {
      return b.completions - a.completions;
    }
    return b.accuracy - a.accuracy;
  });

  const topCompetitor = competitorStats.find(stat => stat.completions > 0);

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

  // Recent Activity - Last 2 days, completed items only
  const recentCompletedActions = lastTwoDaysHistory.filter(entry => entry.action === 'completed');

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

      {/* Top Collaborator - Only show if there are collaborative tasks AND activity */}
      {collaborativeTasks.length > 0 && topCollaborator && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Top Collaborator (Last 14 Days)
          </h4>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Based on completion of collaborative tasks only (tasks assigned to multiple people)
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {collaborativeTasks.length} collaborative task{collaborativeTasks.length !== 1 ? 's' : ''} • 
              {collaborativeCompletedActions.length} collaborative completion{collaborativeCompletedActions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
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
                      {topCollaborator.completions} collaborative tasks
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
          
          {/* Other top collaborative performers */}
          {collaborativeProfileStats.length > 1 && collaborativeProfileStats.filter(stat => stat.completions > 0).length > 1 && (
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Other Collaborative Contributors
              </p>
              <div className="space-y-2">
                {collaborativeProfileStats.filter(stat => stat.completions > 0).slice(1, 3).map((stat, index) => (
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
                          {stat.completions} collaborative tasks • {Math.round(stat.accuracy)}% accuracy
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

      {/* No Collaborative Tasks Message */}
      {collaborativeTasks.length === 0 && profiles.length > 1 && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-neutral-400" />
            Top Collaborator (Last 14 Days)
          </h4>
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
            <h5 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No Collaborative Tasks Yet
            </h5>
            <p className="text-neutral-600 dark:text-neutral-400">
              Create tasks assigned to multiple people to see collaboration statistics. 
              Tasks assigned to only one person don't count toward collaboration metrics.
            </p>
          </div>
        </div>
      )}

      {/* Top Competitor - Only show if there are competitors AND activity */}
      {taskCompetitors.length > 0 && topCompetitor && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-orange-500" />
            Top Competitor (Last 14 Days)
          </h4>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Based on all task completions by profiles marked as "Task Competitors"
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {taskCompetitors.length} competitor{taskCompetitors.length !== 1 ? 's' : ''} • 
              {completedActions.filter(action => taskCompetitors.some(c => c.id === action.profileId)).length} total completion{completedActions.filter(action => taskCompetitors.some(c => c.id === action.profileId)).length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shadow-lg">
                  {topCompetitor.profile.avatar}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {topCompetitor.profile.name}
                </h5>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  🥇 Task Champion
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-medium text-success-600 dark:text-success-400">
                      {topCompetitor.completions} tasks completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-accent-500" />
                    <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
                      {Math.round(topCompetitor.accuracy)}% accuracy
                    </span>
                  </div>
                </div>
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
          
          {/* Competition Leaderboard */}
          {competitorStats.length > 1 && competitorStats.filter(stat => stat.completions > 0).length > 1 && (
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Competition Leaderboard
              </p>
              <div className="space-y-2">
                {competitorStats.filter(stat => stat.completions > 0).slice(1, 4).map((stat, index) => {
                  const rank = index + 2;
                  const medalIcon = rank === 2 ? Medal : rank === 3 ? Star : Trophy;
                  const medalColor = rank === 2 ? 'text-gray-500' : rank === 3 ? 'text-amber-600' : 'text-neutral-500';
                  
                  return (
                    <div key={stat.profile.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg">
                          {stat.profile.avatar}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {stat.profile.name}
                            </p>
                            {React.createElement(medalIcon, { className: `w-4 h-4 ${medalColor}` })}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {stat.completions} tasks • {Math.round(stat.accuracy)}% accuracy
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-neutral-600 dark:text-neutral-400">
                          #{rank}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Competitors Message */}
      {taskCompetitors.length === 0 && profiles.length > 1 && (
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-neutral-400" />
            Top Competitor (Last 14 Days)
          </h4>
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
            <h5 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No Task Competitors Yet
            </h5>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Enable "Task Competitor" in profile settings to participate in task completion rankings. 
              Only profiles marked as competitors will appear in the leaderboard.
            </p>
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
                      {stat.task.profiles.length > 1 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Collaborative
                        </span>
                      )}
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

      {/* Recent Activity (Last 2 Days) - Simple List */}
      <RecentActivitySection 
        recentCompletedActions={recentCompletedActions}
        profiles={profiles}
        resetTasksCount={resetTasksCount}
        allHistory={history}
      />
    </div>
  );
}

// Separate component for Recent Activity with detailed log toggle
function RecentActivitySection({ 
  recentCompletedActions, 
  profiles, 
  resetTasksCount,
  allHistory 
}: {
  recentCompletedActions: HistoryEntry[];
  profiles: UserProfile[];
  resetTasksCount: number;
  allHistory: HistoryEntry[];
}) {
  const [showDetailedLog, setShowDetailedLog] = React.useState(false);

  if (showDetailedLog) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-primary-500" />
            Detailed Activity Log
          </h4>
          <button
            onClick={() => setShowDetailedLog(false)}
            className="btn-secondary text-sm"
          >
            Show Recent Activity
          </button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allHistory.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
              No activity history yet
            </p>
          ) : (
            allHistory.slice(0, 50).map(entry => (
              <div key={entry.id} className="card p-3 bg-neutral-50 dark:bg-neutral-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {entry.taskTitle}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {entry.action} by {entry.profileName}
                    </p>
                    {entry.details && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-success-500" />
          Recent Activity (Last 2 Days)
        </h4>
        <button
          onClick={() => setShowDetailedLog(true)}
          className="btn-secondary text-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Show Detailed Log
        </button>
      </div>
      
      {recentCompletedActions.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No tasks completed in the last 2 days
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentCompletedActions.slice(0, 10).map(entry => {
            const profile = profiles.find(p => p.id === entry.profileId);
            const entryDate = new Date(entry.timestamp);
            const isToday = entryDate.toDateString() === new Date().toDateString();
            
            return (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`w-4 h-4 ${isToday ? 'text-success-500' : 'text-neutral-400'}`} />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {entry.taskTitle}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Completed by {profile?.name || 'Unknown'} • {isToday ? 'Today' : 'Yesterday'}
                      </p>
                      {profile?.isTaskCompetitor && (
                        <div className="flex items-center space-x-1 px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                          <Trophy className="w-2 h-2" />
                          <span>Competitor</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {entryDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
            );
          })}
          
          {recentCompletedActions.length > 10 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center pt-2">
              +{recentCompletedActions.length - 10} more completed tasks
            </p>
          )}
        </div>
      )}
      
      {/* Reset Tasks Warning */}
      {resetTasksCount > 0 && (
        <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-warning-600 dark:text-warning-400" />
            <p className="text-sm text-warning-700 dark:text-warning-400">
              <strong>{resetTasksCount}</strong> tasks were reset in the last 2 months. 
              This may indicate incorrect recurrence scheduling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}