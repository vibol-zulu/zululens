export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      channel_profile_suggestions: {
        Row: {
          channel_id: string
          created_at: string
          current_value: string | null
          field_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_by: string | null
          suggested_value: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          current_value?: string | null
          field_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by?: string | null
          suggested_value: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          current_value?: string | null
          field_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_by?: string | null
          suggested_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_profile_suggestions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "user_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_profiles: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          founding_year: number | null
          headquarters: string | null
          id: string
          key_people: string[] | null
          logo_url: string | null
          notable_events: string[] | null
          parent_company: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          founding_year?: number | null
          headquarters?: string | null
          id?: string
          key_people?: string[] | null
          logo_url?: string | null
          notable_events?: string[] | null
          parent_company?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          founding_year?: number | null
          headquarters?: string | null
          id?: string
          key_people?: string[] | null
          logo_url?: string | null
          notable_events?: string[] | null
          parent_company?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_profiles_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "user_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          country: string
          created_at: string
          id: string
          is_edited: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          country: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          country?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contributor_metrics: {
        Row: {
          approved_suggestions: number
          created_at: string
          current_streak: number
          engagement_score: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_comments: number
          total_interactions: number
          total_suggestions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_suggestions?: number
          created_at?: string
          current_streak?: number
          engagement_score?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_comments?: number
          total_interactions?: number
          total_suggestions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_suggestions?: number
          created_at?: string
          current_streak?: number
          engagement_score?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_comments?: number
          total_interactions?: number
          total_suggestions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contributor_requests: {
        Row: {
          country: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      news_updates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel_id: string | null
          created_at: string
          created_by: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          read_by: string | null
          target_role: string
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          read_by?: string | null
          target_role?: string
          target_user_id?: string | null
          title: string
          type?: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          read_by?: string | null
          target_role?: string
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "user_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          answers: Json
          confidence: string
          country: string
          created_at: string
          id: string
          original_score: number
          position_label: string
          questions: Json
          refined_score: number
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          answers?: Json
          confidence?: string
          country?: string
          created_at?: string
          id?: string
          original_score: number
          position_label: string
          questions?: Json
          refined_score: number
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          answers?: Json
          confidence?: string
          country?: string
          created_at?: string
          id?: string
          original_score?: number
          position_label?: string
          questions?: Json
          refined_score?: number
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      tier1_visitors: {
        Row: {
          country: string
          created_at: string
          email: string
          id: string
          last_visit_at: string
          name: string
          total_time_seconds: number
          total_visits: number
        }
        Insert: {
          country?: string
          created_at?: string
          email: string
          id?: string
          last_visit_at?: string
          name: string
          total_time_seconds?: number
          total_visits?: number
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          id?: string
          last_visit_at?: string
          name?: string
          total_time_seconds?: number
          total_visits?: number
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "tier1_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_channels: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          category: string
          content_type: string
          country: string
          created_at: string
          id: string
          name: string
          platform: string
          political_lean: string
          start_date: string
          status: string
          updated_at: string
          value_millions: number
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          category: string
          content_type: string
          country?: string
          created_at?: string
          id?: string
          name: string
          platform: string
          political_lean: string
          start_date: string
          status?: string
          updated_at?: string
          value_millions: number
          year?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          category?: string
          content_type?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          platform?: string
          political_lean?: string
          start_date?: string
          status?: string
          updated_at?: string
          value_millions?: number
          year?: number
        }
        Relationships: []
      }
      user_position_analyses: {
        Row: {
          country: string
          created_at: string
          diversity_note: string | null
          diversity_score: string
          id: string
          numeric_value: number
          position_label: string
          selected_channels: Json
          suggested_channels: Json | null
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          country?: string
          created_at?: string
          diversity_note?: string | null
          diversity_score: string
          id?: string
          numeric_value: number
          position_label: string
          selected_channels?: Json
          suggested_channels?: Json | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          diversity_note?: string | null
          diversity_score?: string
          id?: string
          numeric_value?: number
          position_label?: string
          selected_channels?: Json
          suggested_channels?: Json | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          country: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          interactions: number | null
          page_views: number | null
          session_id: string
          started_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          country?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          interactions?: number | null
          page_views?: number | null
          session_id: string
          started_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          country?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          interactions?: number | null
          page_views?: number | null
          session_id?: string
          started_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "tier1_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _action: string
          _identifier: string
          _max_requests: number
          _window_minutes: number
        }
        Returns: boolean
      }
      get_profile_display_name: { Args: { _user_id: string }; Returns: string }
      get_profiles_by_ids: {
        Args: { _user_ids: string[] }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_tier1_visitor: {
        Args: { _country?: string; _email: string; _name: string }
        Returns: string
      }
      update_tier1_visitor_time: {
        Args: { _additional_seconds: number; _visitor_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "contributor" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contributor", "moderator"],
    },
  },
} as const
