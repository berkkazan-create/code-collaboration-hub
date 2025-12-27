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
      accounts: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          currency: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tax_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          balance: number
          bank_name: string | null
          created_at: string
          currency: string | null
          iban: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          min_stock_level: number | null
          name: string
          purchase_price: number
          quantity: number
          sale_price: number
          sku: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          name: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          sku?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          name?: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          sku?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          account_id: string | null
          affects_cost: boolean | null
          cost_amount: number | null
          created_at: string
          currency: string | null
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          affects_cost?: boolean | null
          cost_amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          affects_cost?: boolean | null
          cost_amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          bank_account_id: string | null
          created_at: string
          currency: string | null
          date: string
          description: string | null
          id: string
          payment_method: string | null
          product_id: string | null
          quantity: number | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          bank_account_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string | null
          quantity?: number | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string | null
          quantity?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
