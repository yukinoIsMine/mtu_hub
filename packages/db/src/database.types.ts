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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          profile_id: string
          value: number
        }
        Insert: {
          comment_id: string
          created_at?: string
          profile_id: string
          value: number
        }
        Update: {
          comment_id?: string
          created_at?: string
          profile_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          base_score: number
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          score: number
        }
        Insert: {
          author_id?: string | null
          base_score?: number
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          score?: number
        }
        Update: {
          author_id?: string | null
          base_score?: number
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_post_id_fkey"
            columns: ["parent_id", "post_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id", "post_id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          accent: Database["public"]["Enums"]["community_accent"]
          base_member_count: number
          created_at: string
          created_by: string | null
          description: string
          founded_at: string
          id: string
          member_count: number
          name: string
          online_count: number
          slug: string
          tags: string[]
        }
        Insert: {
          accent?: Database["public"]["Enums"]["community_accent"]
          base_member_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          founded_at?: string
          id?: string
          member_count?: number
          name: string
          online_count?: number
          slug: string
          tags?: string[]
        }
        Update: {
          accent?: Database["public"]["Enums"]["community_accent"]
          base_member_count?: number
          created_at?: string
          created_by?: string | null
          description?: string
          founded_at?: string
          id?: string
          member_count?: number
          name?: string
          online_count?: number
          slug?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_admin_invites: {
        Row: {
          community_id: string
          created_at: string
          id: string
          invited_by: string
          invitee_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["forum_admin_invite_status"]
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          invited_by: string
          invitee_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["forum_admin_invite_status"]
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          invitee_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["forum_admin_invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "forum_admin_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_admin_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_admin_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          community_id: string | null
          created_at: string
          id: string
          invite_id: string | null
          post_id: string | null
          read_at: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          invite_id?: string | null
          post_id?: string | null
          read_at?: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          invite_id?: string | null
          post_id?: string | null
          read_at?: string | null
          recipient_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "forum_admin_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderators: {
        Row: {
          added_at: string
          community_id: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          community_id: string
          profile_id: string
        }
        Update: {
          added_at?: string
          community_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_moderators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rules: {
        Row: {
          body: string
          community_id: string
          id: string
          position: number
        }
        Insert: {
          body: string
          community_id: string
          id?: string
          position: number
        }
        Update: {
          body?: string
          community_id?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      post_summaries: {
        Row: {
          comment_count: number
          consensus: string
          created_at: string
          key_points: string[]
          model: string
          post_id: string
          sentiment: string
          tldr: string
        }
        Insert: {
          comment_count: number
          consensus: string
          created_at?: string
          key_points: string[]
          model: string
          post_id: string
          sentiment: string
          tldr: string
        }
        Update: {
          comment_count?: number
          consensus?: string
          created_at?: string
          key_points?: string[]
          model?: string
          post_id?: string
          sentiment?: string
          tldr?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_summaries_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string
          post_id: string
          profile_id: string
          value: number
        }
        Insert: {
          created_at?: string
          post_id: string
          profile_id: string
          value: number
        }
        Update: {
          created_at?: string
          post_id?: string
          profile_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          base_score: number
          body: string
          comment_count: number
          community_id: string
          created_at: string
          deleted_at: string | null
          flair: string | null
          hot_rank: number
          id: string
          image_url: string | null
          score: number
          search_vector: unknown
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          base_score?: number
          body?: string
          comment_count?: number
          community_id: string
          created_at?: string
          deleted_at?: string | null
          flair?: string | null
          hot_rank?: number
          id?: string
          image_url?: string | null
          score?: number
          search_vector?: unknown
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          base_score?: number
          body?: string
          comment_count?: number
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          flair?: string | null
          hot_rank?: number
          id?: string
          image_url?: string | null
          score?: number
          search_vector?: unknown
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          disabled_at: string | null
          display_name: string | null
          id: string
          role: "user" | "admin"
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          disabled_at?: string | null
          display_name?: string | null
          id?: string
          role?: "user" | "admin"
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          disabled_at?: string | null
          display_name?: string | null
          id?: string
          role?: "user" | "admin"
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          community_id: string
          created_at: string
          profile_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          profile_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_forum_admin_invite: { Args: { invite_id: string }; Returns: undefined }
      current_profile_id: { Args: never; Returns: string }
      decline_forum_admin_invite: { Args: { invite_id: string }; Returns: undefined }
      hot_rank: {
        Args: { p_created_at: string; p_score: number }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_forum_admin: { Args: { cid: string }; Returns: boolean }
      soft_delete_comment: { Args: { p_comment_id: string }; Returns: undefined }
      soft_delete_post: { Args: { p_post_id: string }; Returns: undefined }
    }
    Enums: {
      community_accent:
        | "teal"
        | "teal_deep"
        | "orange"
        | "blue"
        | "green"
        | "navy"
        | "emerald"
        | "indigo"
      forum_admin_invite_status: "pending" | "accepted" | "declined" | "cancelled"
      notification_type:
        | "post_comment"
        | "comment_reply"
        | "post_upvote"
        | "comment_upvote"
        | "community_post"
        | "forum_admin_invite"
        | "forum_admin_invite_accepted"
        | "forum_admin_invite_declined"
        | "forum_admin_removed"
        | "post_removed"
        | "comment_removed"
        | "community_kicked"
      profile_role: "user" | "admin"
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
      community_accent: [
        "teal",
        "teal_deep",
        "orange",
        "blue",
        "green",
        "navy",
        "emerald",
        "indigo",
      ],
      forum_admin_invite_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
      ],
      notification_type: [
        "post_comment",
        "comment_reply",
        "post_upvote",
        "comment_upvote",
        "community_post",
        "forum_admin_invite",
        "forum_admin_invite_accepted",
        "forum_admin_invite_declined",
        "forum_admin_removed",
        "post_removed",
        "comment_removed",
        "community_kicked",
      ],
      profile_role: ["user", "admin"],
    },
  },
} as const
