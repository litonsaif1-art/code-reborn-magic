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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      advisor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_memory: {
        Row: {
          context: string | null
          created_at: string
          id: string
          key: string
          memory_type: string
          updated_at: string
          user_id: string | null
          value: string
          weight: number
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          key: string
          memory_type: string
          updated_at?: string
          user_id?: string | null
          value: string
          weight?: number
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          key?: string
          memory_type?: string
          updated_at?: string
          user_id?: string | null
          value?: string
          weight?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      blueprint_history: {
        Row: {
          blueprint_content: string
          blueprint_params: Json
          concept_count: number | null
          created_at: string
          id: string
          pinned: boolean
          session_id: string
          snapshot_label: string | null
          user_id: string
        }
        Insert: {
          blueprint_content?: string
          blueprint_params?: Json
          concept_count?: number | null
          created_at?: string
          id?: string
          pinned?: boolean
          session_id: string
          snapshot_label?: string | null
          user_id: string
        }
        Update: {
          blueprint_content?: string
          blueprint_params?: Json
          concept_count?: number | null
          created_at?: string
          id?: string
          pinned?: boolean
          session_id?: string
          snapshot_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookmarked_concepts: {
        Row: {
          concept_content: string
          created_at: string
          id: string
          label: string | null
          message_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          concept_content: string
          created_at?: string
          id?: string
          label?: string | null
          message_id: string
          session_id: string
          user_id: string
        }
        Update: {
          concept_content?: string
          created_at?: string
          id?: string
          label?: string | null
          message_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "session_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          active_variant_id: string | null
          blueprint_content: string | null
          blueprint_locked: boolean | null
          blueprint_params: Json | null
          created_at: string
          id: string
          model: string | null
          pinned: boolean | null
          provider: string | null
          serial_label: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_variant_id?: string | null
          blueprint_content?: string | null
          blueprint_locked?: boolean | null
          blueprint_params?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          pinned?: boolean | null
          provider?: string | null
          serial_label?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_variant_id?: string | null
          blueprint_content?: string | null
          blueprint_locked?: boolean | null
          blueprint_params?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          pinned?: boolean | null
          provider?: string | null
          serial_label?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      concept_runs: {
        Row: {
          created_at: string
          draft_concept: string | null
          final_concept: string | null
          id: string
          input_theme: string | null
          passes_used: number | null
          qc_json: Json
          realism_score: number | null
          session_id: string
          status: string | null
          strategy_mode: string | null
          strictness: number
          user_id: string | null
          visual_lock_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          draft_concept?: string | null
          final_concept?: string | null
          id?: string
          input_theme?: string | null
          passes_used?: number | null
          qc_json?: Json
          realism_score?: number | null
          session_id: string
          status?: string | null
          strategy_mode?: string | null
          strictness?: number
          user_id?: string | null
          visual_lock_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          draft_concept?: string | null
          final_concept?: string | null
          id?: string
          input_theme?: string | null
          passes_used?: number | null
          qc_json?: Json
          realism_score?: number | null
          session_id?: string
          status?: string | null
          strategy_mode?: string | null
          strictness?: number
          user_id?: string | null
          visual_lock_enabled?: boolean | null
        }
        Relationships: []
      }
      concept_scores: {
        Row: {
          ai_feedback: string | null
          coherence_score: number
          concept_text: string
          created_at: string
          creativity_score: number
          emotional_depth: number | null
          hook_power: number | null
          id: string
          overall_score: number
          rewatch_value: number | null
          session_id: string
          uniqueness_index: number | null
          user_id: string | null
          virality_score: number
        }
        Insert: {
          ai_feedback?: string | null
          coherence_score: number
          concept_text: string
          created_at?: string
          creativity_score: number
          emotional_depth?: number | null
          hook_power?: number | null
          id?: string
          overall_score: number
          rewatch_value?: number | null
          session_id: string
          uniqueness_index?: number | null
          user_id?: string | null
          virality_score: number
        }
        Update: {
          ai_feedback?: string | null
          coherence_score?: number
          concept_text?: string
          created_at?: string
          creativity_score?: number
          emotional_depth?: number | null
          hook_power?: number | null
          id?: string
          overall_score?: number
          rewatch_value?: number | null
          session_id?: string
          uniqueness_index?: number | null
          user_id?: string | null
          virality_score?: number
        }
        Relationships: []
      }
      creative_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          effectiveness_score: number | null
          id: string
          knowledge_type: string
          metadata: Json | null
          session_id: string
          source_chain_id: string | null
          source_score: number | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          knowledge_type?: string
          metadata?: Json | null
          session_id: string
          source_chain_id?: string | null
          source_score?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          knowledge_type?: string
          metadata?: Json | null
          session_id?: string
          source_chain_id?: string | null
          source_score?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_knowledge_base_source_chain_id_fkey"
            columns: ["source_chain_id"]
            isOneToOne: false
            referencedRelation: "evolution_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_chains: {
        Row: {
          audience_persona: string | null
          best_variant_index: number | null
          created_at: string
          evolved_concepts: Json
          generation: number
          id: string
          knowledge_extracted: boolean | null
          min_quality_floor: number | null
          parent_chain_id: string | null
          parent_concept: string
          parent_variant: number | null
          quality_trajectory: Json | null
          scores: Json
          session_id: string
          user_id: string | null
        }
        Insert: {
          audience_persona?: string | null
          best_variant_index?: number | null
          created_at?: string
          evolved_concepts?: Json
          generation?: number
          id?: string
          knowledge_extracted?: boolean | null
          min_quality_floor?: number | null
          parent_chain_id?: string | null
          parent_concept: string
          parent_variant?: number | null
          quality_trajectory?: Json | null
          scores?: Json
          session_id: string
          user_id?: string | null
        }
        Update: {
          audience_persona?: string | null
          best_variant_index?: number | null
          created_at?: string
          evolved_concepts?: Json
          generation?: number
          id?: string
          knowledge_extracted?: boolean | null
          min_quality_floor?: number | null
          parent_chain_id?: string | null
          parent_concept?: string
          parent_variant?: number | null
          quality_trajectory?: Json | null
          scores?: Json
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_chains_parent_chain_id_fkey"
            columns: ["parent_chain_id"]
            isOneToOne: false
            referencedRelation: "evolution_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_blueprints: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          serial_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          serial_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          serial_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_suggestions: {
        Row: {
          created_at: string
          field_label: string
          id: string
          section_key: string
          suggestions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_label: string
          id?: string
          section_key: string
          suggestions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_label?: string
          id?: string
          section_key?: string
          suggestions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scene_params_defaults: {
        Row: {
          id: string
          params: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          params?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          params?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_variants: {
        Row: {
          blueprint_content: string | null
          blueprint_locked: boolean | null
          blueprint_params: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          parent_session_id: string
          pinned: boolean | null
          updated_at: string
          user_id: string
          variant_label: string
        }
        Insert: {
          blueprint_content?: string | null
          blueprint_locked?: boolean | null
          blueprint_params?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_session_id: string
          pinned?: boolean | null
          updated_at?: string
          user_id: string
          variant_label?: string
        }
        Update: {
          blueprint_content?: string | null
          blueprint_locked?: boolean | null
          blueprint_params?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_session_id?: string
          pinned?: boolean | null
          updated_at?: string
          user_id?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_variants_parent_session_id_fkey"
            columns: ["parent_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_frames: {
        Row: {
          concept_id: string
          created_at: string
          frame_number: number
          generation_status: string
          id: string
          image_url: string | null
          prompt_used: string | null
          scene_description: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          concept_id: string
          created_at?: string
          frame_number: number
          generation_status?: string
          id?: string
          image_url?: string | null
          prompt_used?: string | null
          scene_description: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          concept_id?: string
          created_at?: string
          frame_number?: number
          generation_status?: string
          id?: string
          image_url?: string | null
          prompt_used?: string | null
          scene_description?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      theme_dna: {
        Row: {
          created_at: string
          dna_string: string
          id: string
          selections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dna_string?: string
          id?: string
          selections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dna_string?: string
          id?: string
          selections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      used_elements: {
        Row: {
          created_at: string
          element_family: string | null
          element_type: string
          element_value: string
          id: string
          session_id: string
          source_concept_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          element_family?: string | null
          element_type: string
          element_value: string
          id?: string
          session_id: string
          source_concept_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          element_family?: string | null
          element_type?: string
          element_value?: string
          id?: string
          session_id?: string
          source_concept_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      export_all_data: { Args: never; Returns: Json }
      import_all_data: { Args: { payload: Json }; Returns: Json }
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
