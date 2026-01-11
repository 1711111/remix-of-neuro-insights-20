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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_quest_generations: {
        Row: {
          count: number
          created_at: string
          generation_date: string
          id: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          generation_date?: string
          id?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          generation_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_rare: boolean
          name: string
          points_reward: number
          requirement_type: string
          requirement_value: number
          tier: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_rare?: boolean
          name: string
          points_reward?: number
          requirement_type: string
          requirement_value?: number
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_rare?: boolean
          name?: string
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
          tier?: string
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          points_earned: number
          team_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          points_earned: number
          team_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          points_earned?: number
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          bonus_multiplier: number
          category: string
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          ends_at: string
          id: string
          is_active: boolean
          points: number
          starts_at: string
          title: string
          verification_hint: string | null
        }
        Insert: {
          bonus_multiplier?: number
          category: string
          challenge_type: string
          created_at?: string
          description: string
          difficulty?: string
          ends_at: string
          id?: string
          is_active?: boolean
          points: number
          starts_at: string
          title: string
          verification_hint?: string | null
        }
        Update: {
          bonus_multiplier?: number
          category?: string
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          points?: number
          starts_at?: string
          title?: string
          verification_hint?: string | null
        }
        Relationships: []
      }
      completed_quests: {
        Row: {
          completed_at: string
          id: string
          points_earned: number
          quest_category: string
          quest_title: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_earned: number
          quest_category: string
          quest_title: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_earned?: number
          quest_category?: string
          quest_title?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activity_date: string
          challenges_completed: number
          created_at: string
          id: string
          points_earned: number
          quests_completed: number
          user_id: string
        }
        Insert: {
          activity_date: string
          challenges_completed?: number
          created_at?: string
          id?: string
          points_earned?: number
          quests_completed?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          challenges_completed?: number
          created_at?: string
          id?: string
          points_earned?: number
          quests_completed?: number
          user_id?: string
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          likes: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string
          category?: string
          content: string
          created_at?: string
          id?: string
          likes?: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          likes?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      impact_stats: {
        Row: {
          co2_saved_kg: number
          energy_saved_kwh: number
          id: string
          plastic_avoided_kg: number
          trees_equivalent: number
          updated_at: string
          user_id: string
          water_saved_liters: number
        }
        Insert: {
          co2_saved_kg?: number
          energy_saved_kwh?: number
          id?: string
          plastic_avoided_kg?: number
          trees_equivalent?: number
          updated_at?: string
          user_id: string
          water_saved_liters?: number
        }
        Update: {
          co2_saved_kg?: number
          energy_saved_kwh?: number
          id?: string
          plastic_avoided_kg?: number
          trees_equivalent?: number
          updated_at?: string
          user_id?: string
          water_saved_liters?: number
        }
        Relationships: []
      }
      leaderboard_awards: {
        Row: {
          awarded_at: string
          id: string
          period_start: string
          timeframe: string
          winners: Json
        }
        Insert: {
          awarded_at?: string
          id?: string
          period_start: string
          timeframe: string
          winners?: Json
        }
        Update: {
          awarded_at?: string
          id?: string
          period_start?: string
          timeframe?: string
          winners?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          partner_name: string | null
          points_cost: number
          stock: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          partner_name?: string | null
          points_cost: number
          stock?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          partner_name?: string | null
          points_cost?: number
          stock?: number | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      team_memberships: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          team_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_shop_vote_entries: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vote_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vote_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vote_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_shop_vote_entries_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "team_shop_votes"
            referencedColumns: ["id"]
          },
        ]
      }
      team_shop_votes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          initiated_by: string
          item_cost: number
          item_id: string
          item_name: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          initiated_by: string
          item_cost: number
          item_id: string
          item_name: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          initiated_by?: string
          item_cost?: number
          item_id?: string
          item_name?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_shop_votes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          member_count: number
          name: string
          total_points: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_active_quests: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string
          id: string
          is_ai_generated: boolean
          is_team_quest: boolean
          points: number
          team_id: string | null
          title: string
          user_id: string
          verification_hint: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          difficulty: string
          id?: string
          is_ai_generated?: boolean
          is_team_quest?: boolean
          points: number
          team_id?: string | null
          title: string
          user_id: string
          verification_hint?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          is_ai_generated?: boolean
          is_team_quest?: boolean
          points?: number
          team_id?: string | null
          title?: string
          user_id?: string
          verification_hint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_active_quests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string
          current_xp: number
          id: string
          level: number
          title: string
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          title?: string
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          title?: string
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          id: string
          redeemed_at: string
          redemption_code: string | null
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string
          redemption_code?: string | null
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string
          redemption_code?: string | null
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_quest_date: string | null
          longest_streak: number
          quests_completed: number
          quests_since_last_survey: number | null
          team_id: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_quest_date?: string | null
          longest_streak?: number
          quests_completed?: number
          quests_since_last_survey?: number | null
          team_id?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_quest_date?: string | null
          longest_streak?: number
          quests_completed?: number
          quests_since_last_survey?: number | null
          team_id?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_leaderboard_prizes: { Args: { _timeframe: string }; Returns: Json }
      get_leaderboard: {
        Args: { _timeframe: string }
        Returns: {
          current_streak: number
          display_name: string
          points: number
          quests_completed: number
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_moderator: { Args: { _user_id: string }; Returns: boolean }
      is_team_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "teacher" | "student" | "admin"
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
      app_role: ["teacher", "student", "admin"],
    },
  },
} as const
