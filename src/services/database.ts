import { supabase } from '../lib/supabase';
import { Task, TaskGroup, UserProfile, HistoryEntry, AppSettings } from '../types';

export class DatabaseService {
  // Profile operations
  static async getProfiles(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    
    if (error) throw error;
    return data.map(this.mapProfileFromDB);
  }

  static async createProfile(userId: string, profile: Omit<UserProfile, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name: profile.name,
        color: profile.color,
        avatar: profile.avatar,
        is_active: profile.isActive,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapProfileFromDB(data);
  }

  static async updateProfile(profileId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        color: updates.color,
        avatar: updates.avatar,
        is_active: updates.isActive,
      })
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapProfileFromDB(data);
  }

  static async deleteProfile(profileId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);
    
    if (error) throw error;
  }

  // Task Group operations
  static async getTaskGroups(userId: string) {
    const { data, error } = await supabase
      .from('task_groups')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    return data.map(this.mapTaskGroupFromDB);
  }

  static async createTaskGroup(userId: string, group: Omit<TaskGroup, 'id' | 'createdAt' | 'order'>) {
    const { data, error } = await supabase
      .from('task_groups')
      .insert({
        user_id: userId,
        name: group.name,
        color: group.color,
        icon: group.icon,
        completed_display_mode: group.completedDisplayMode,
        is_collapsed: group.isCollapsed,
        order_index: 0, // Will be updated based on existing groups
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapTaskGroupFromDB(data);
  }

  static async updateTaskGroup(groupId: string, updates: Partial<TaskGroup>) {
    const { data, error } = await supabase
      .from('task_groups')
      .update({
        name: updates.name,
        color: updates.color,
        icon: updates.icon,
        completed_display_mode: updates.completedDisplayMode,
        is_collapsed: updates.isCollapsed,
        order_index: updates.order,
      })
      .eq('id', groupId)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapTaskGroupFromDB(data);
  }

  static async deleteTaskGroup(groupId: string) {
    const { error } = await supabase
      .from('task_groups')
      .delete()
      .eq('id', groupId);
    
    if (error) throw error;
  }

  // Task operations
  static async getTasks(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_profiles(profile_id)
      `)
      .eq('user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    return data.map(this.mapTaskFromDB);
  }

  static async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt' | 'order'>) {
    // Create the task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        group_id: task.groupId,
        title: task.title,
        recurrence: task.recurrence,
        is_completed: task.isCompleted,
        completed_by: task.completedBy,
        completed_at: task.completedAt?.toISOString(),
        order_index: 0, // Will be updated based on existing tasks
      })
      .select()
      .single();
    
    if (taskError) throw taskError;

    // Create task-profile associations
    if (task.profiles.length > 0) {
      const { error: profileError } = await supabase
        .from('task_profiles')
        .insert(
          task.profiles.map(profileId => ({
            task_id: taskData.id,
            profile_id: profileId,
          }))
        );
      
      if (profileError) throw profileError;
    }

    return this.mapTaskFromDB({ ...taskData, task_profiles: task.profiles.map(id => ({ profile_id: id })) });
  }

  static async updateTask(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        group_id: updates.groupId,
        recurrence: updates.recurrence,
        is_completed: updates.isCompleted,
        completed_by: updates.completedBy,
        completed_at: updates.completedAt?.toISOString(),
        order_index: updates.order,
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;

    // Update task-profile associations if profiles are provided
    if (updates.profiles) {
      // Delete existing associations
      await supabase
        .from('task_profiles')
        .delete()
        .eq('task_id', taskId);

      // Create new associations
      if (updates.profiles.length > 0) {
        await supabase
          .from('task_profiles')
          .insert(
            updates.profiles.map(profileId => ({
              task_id: taskId,
              profile_id: profileId,
            }))
          );
      }
    }

    return this.mapTaskFromDB({ ...data, task_profiles: (updates.profiles || []).map(id => ({ profile_id: id })) });
  }

  static async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
  }

  // History operations
  static async getHistory(userId: string) {
    const { data, error } = await supabase
      .from('history_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapHistoryFromDB);
  }

  static async createHistoryEntry(userId: string, entry: Omit<HistoryEntry, 'id'>) {
    const { data, error } = await supabase
      .from('history_entries')
      .insert({
        user_id: userId,
        task_id: entry.taskId,
        profile_id: entry.profileId,
        action: entry.action,
        task_title: entry.taskTitle,
        profile_name: entry.profileName,
        details: entry.details,
        timestamp: entry.timestamp.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapHistoryFromDB(data);
  }

  static async deleteHistoryForTask(taskId: string) {
    const { error } = await supabase
      .from('history_entries')
      .delete()
      .eq('task_id', taskId);
    
    if (error) throw error;
  }

  // Settings operations
  static async getSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data ? this.mapSettingsFromDB(data) : null;
  }

  static async updateSettings(userId: string, settings: AppSettings & { activeProfileId: string }) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        theme: settings.theme,
        show_completed_count: settings.showCompletedCount,
        enable_notifications: settings.enableNotifications,
        auto_archive_completed: settings.autoArchiveCompleted,
        archive_days: settings.archiveDays,
        active_profile_id: settings.activeProfileId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapSettingsFromDB(data);
  }

  // Mapping functions
  private static mapProfileFromDB(data: any): UserProfile {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      avatar: data.avatar,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  }

  private static mapTaskGroupFromDB(data: any): TaskGroup {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      completedDisplayMode: data.completed_display_mode,
      isCollapsed: data.is_collapsed,
      order: data.order_index,
      createdAt: new Date(data.created_at),
    };
  }

  private static mapTaskFromDB(data: any): Task {
    return {
      id: data.id,
      title: data.title,
      groupId: data.group_id,
      recurrence: data.recurrence,
      isCompleted: data.is_completed,
      completedBy: data.completed_by,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdAt: new Date(data.created_at),
      profiles: data.task_profiles?.map((tp: any) => tp.profile_id) || [],
      order: data.order_index,
    };
  }

  private static mapHistoryFromDB(data: any): HistoryEntry {
    return {
      id: data.id,
      taskId: data.task_id,
      profileId: data.profile_id,
      action: data.action,
      timestamp: new Date(data.timestamp),
      taskTitle: data.task_title,
      profileName: data.profile_name,
      details: data.details,
    };
  }

  private static mapSettingsFromDB(data: any): AppSettings & { activeProfileId: string } {
    return {
      theme: data.theme,
      showCompletedCount: data.show_completed_count,
      enableNotifications: data.enable_notifications,
      autoArchiveCompleted: data.auto_archive_completed,
      archiveDays: data.archive_days,
      activeProfileId: data.active_profile_id,
    };
  }
}