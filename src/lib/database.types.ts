export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          avatar: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          avatar?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          avatar?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_groups: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          completed_display_mode: string
          is_collapsed: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          completed_display_mode?: string
          is_collapsed?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          completed_display_mode?: string
          is_collapsed?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          group_id: string
          title: string
          recurrence: string
          is_completed: boolean
          completed_by: string | null
          completed_at: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          title: string
          recurrence?: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          title?: string
          recurrence?: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_profiles: {
        Row: {
          task_id: string
          profile_id: string
        }
        Insert: {
          task_id: string
          profile_id: string
        }
        Update: {
          task_id?: string
          profile_id?: string
        }
      }
      history_entries: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          profile_id: string | null
          action: string
          task_title: string
          profile_name: string
          details: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          profile_id?: string | null
          action: string
          task_title: string
          profile_name: string
          details?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          profile_id?: string | null
          action?: string
          task_title?: string
          profile_name?: string
          details?: string | null
          timestamp?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: string
          show_completed_count: boolean
          enable_notifications: boolean
          auto_archive_completed: boolean
          archive_days: number
          active_profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: string
          show_completed_count?: boolean
          enable_notifications?: boolean
          auto_archive_completed?: boolean
          archive_days?: number
          active_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: string
          show_completed_count?: boolean
          enable_notifications?: boolean
          auto_archive_completed?: boolean
          archive_days?: number
          active_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}