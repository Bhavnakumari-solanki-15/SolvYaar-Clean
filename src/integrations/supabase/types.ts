export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      math_scrolls: {
        Row: {
          id: string
          created_at: string
          wallet_address: string
          problem: string
          solution: string
          token_id: string | null
          status: 'pending' | 'minted' | 'failed'
          transaction_hash: string | null
          metadata_uri: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          wallet_address: string
          problem: string
          solution: string
          token_id?: string | null
          status?: 'pending' | 'minted' | 'failed'
          transaction_hash?: string | null
          metadata_uri?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          wallet_address?: string
          problem?: string
          solution?: string
          token_id?: string | null
          status?: 'pending' | 'minted' | 'failed'
          transaction_hash?: string | null
          metadata_uri?: string | null
        }
        Relationships: []
      }
      math_history: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          latex: string | null
          problem: string
          problem_type: string | null
          solution: string
          steps: Json | null
          user_id: string
          visualization: Json | null
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          latex?: string | null
          problem: string
          problem_type?: string | null
          solution: string
          steps?: Json | null
          user_id: string
          visualization?: Json | null
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          latex?: string | null
          problem?: string
          problem_type?: string | null
          solution?: string
          steps?: Json | null
          user_id?: string
          visualization?: Json | null
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          topic: string
          score: number
          questions_count: number
          correct_answers: number
          time_spent: number
          difficulty: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          score: number
          questions_count: number
          correct_answers: number
          time_spent: number
          difficulty: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          score?: number
          questions_count?: number
          correct_answers?: number
          time_spent?: number
          difficulty?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      practice_answers: {
        Row: {
          id: string
          practice_session_id: string
          question_text: string
          selected_option: string | null
          correct_option: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          practice_session_id: string
          question_text: string
          selected_option?: string | null
          correct_option: string
          is_correct: boolean
          created_at?: string
        }
        Update: {
          id?: string
          practice_session_id?: string
          question_text?: string
          selected_option?: string | null
          correct_option?: string
          is_correct?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          role: 'admin' | 'developer' | 'user'
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
          role?: 'admin' | 'developer' | 'user'
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          role?: 'admin' | 'developer' | 'user'
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
