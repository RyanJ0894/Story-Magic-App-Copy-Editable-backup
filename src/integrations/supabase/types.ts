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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agent_logs: {
        Row: {
          agent_name: string | null
          agent_text: string | null
          conversation_id: string | null
          created_at: string | null
          id: number
          raw: Json | null
          structured_json: Json | null
        }
        Insert: {
          agent_name?: string | null
          agent_text?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: never
          raw?: Json | null
          structured_json?: Json | null
        }
        Update: {
          agent_name?: string | null
          agent_text?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: never
          raw?: Json | null
          structured_json?: Json | null
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          input: Json | null
          metadata: Json | null
          output: Json | null
          run_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          metadata?: Json | null
          output?: Json | null
          run_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          metadata?: Json | null
          output?: Json | null
          run_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          available_packages: Json | null
          created_at: string
          invited_by: string | null
          package_history: Json | null
          plan_type: string
          role: string
          updated_at: string
          upgrade_date: string | null
          user_id: string
        }
        Insert: {
          account_status?: string
          available_packages?: Json | null
          created_at?: string
          invited_by?: string | null
          package_history?: Json | null
          plan_type?: string
          role?: string
          updated_at?: string
          upgrade_date?: string | null
          user_id: string
        }
        Update: {
          account_status?: string
          available_packages?: Json | null
          created_at?: string
          invited_by?: string | null
          package_history?: Json | null
          plan_type?: string
          role?: string
          updated_at?: string
          upgrade_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      raw_webhooks: {
        Row: {
          content_type: string | null
          created_at: string | null
          headers: Json | null
          id: number
          method: string | null
          raw_body: Json
          raw_preview: string | null
          timestamp: string | null
          url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: number
          method?: string | null
          raw_body: Json
          raw_preview?: string | null
          timestamp?: string | null
          url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          headers?: Json | null
          id?: number
          method?: string | null
          raw_body?: Json
          raw_preview?: string | null
          timestamp?: string | null
          url?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_projects: {
        Row: {
          ai_director_json: Json | null
          audio_url: string | null
          created_at: string
          id: string
          script: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          ai_director_json?: Json | null
          audio_url?: string | null
          created_at?: string
          id?: string
          script?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          ai_director_json?: Json | null
          audio_url?: string | null
          created_at?: string
          id?: string
          script?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_voice_selections: {
        Row: {
          category: string | null
          created_at: string
          id: string
          user_id: string
          voice_id: string
          voice_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          user_id: string
          voice_id: string
          voice_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          user_id?: string
          voice_id?: string
          voice_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id_param?: string }
        Returns: string
      }
      validate_invitation_token: {
        Args: { token_to_validate: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invited_by: string
          invited_email: string
          role: string
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
