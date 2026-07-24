import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'super_admin' | 'member'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'super_admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'super_admin' | 'member'
          created_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          board_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          column_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          column_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          column_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      channel_messages: {
        Row: {
          id: string
          channel_id: string
          text: string
          sender_id: string
          attachment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          text: string
          sender_id: string
          attachment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          text?: string
          sender_id?: string
          attachment?: string | null
          created_at?: string
        }
      }
      private_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          text: string
          attachment: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          text: string
          attachment?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          text?: string
          attachment?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
