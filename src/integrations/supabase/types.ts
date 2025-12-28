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
          parent_id: string | null
          requires_serial: boolean | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          requires_serial?: boolean | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          requires_serial?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      data_permissions: {
        Row: {
          can_delete_accounts: boolean
          can_delete_bank_accounts: boolean
          can_delete_categories: boolean
          can_delete_products: boolean
          can_delete_transactions: boolean
          can_edit_accounts: boolean
          can_edit_bank_accounts: boolean
          can_edit_categories: boolean
          can_edit_products: boolean
          can_edit_transactions: boolean
          can_view_accounts: boolean
          can_view_bank_accounts: boolean
          can_view_categories: boolean
          can_view_products: boolean
          can_view_stock_movements: boolean
          can_view_transactions: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete_accounts?: boolean
          can_delete_bank_accounts?: boolean
          can_delete_categories?: boolean
          can_delete_products?: boolean
          can_delete_transactions?: boolean
          can_edit_accounts?: boolean
          can_edit_bank_accounts?: boolean
          can_edit_categories?: boolean
          can_edit_products?: boolean
          can_edit_transactions?: boolean
          can_view_accounts?: boolean
          can_view_bank_accounts?: boolean
          can_view_categories?: boolean
          can_view_products?: boolean
          can_view_stock_movements?: boolean
          can_view_transactions?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete_accounts?: boolean
          can_delete_bank_accounts?: boolean
          can_delete_categories?: boolean
          can_delete_products?: boolean
          can_delete_transactions?: boolean
          can_edit_accounts?: boolean
          can_edit_bank_accounts?: boolean
          can_edit_categories?: boolean
          can_edit_products?: boolean
          can_edit_transactions?: boolean
          can_view_accounts?: boolean
          can_view_bank_accounts?: boolean
          can_view_categories?: boolean
          can_view_products?: boolean
          can_view_stock_movements?: boolean
          can_view_transactions?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_serials: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          purchase_price: number | null
          sale_price: number | null
          serial_number: string
          sold_at: string | null
          sold_to_account_id: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          purchase_price?: number | null
          sale_price?: number | null
          serial_number: string
          sold_at?: string | null
          sold_to_account_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          purchase_price?: number | null
          sale_price?: number | null
          serial_number?: string
          sold_at?: string | null
          sold_to_account_id?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_serials_sold_to_account_id_fkey"
            columns: ["sold_to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_serials_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      service_attachments: {
        Row: {
          attachment_stage: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          service_record_id: string
          user_id: string
        }
        Insert: {
          attachment_stage?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          service_record_id: string
          user_id: string
        }
        Update: {
          attachment_stage?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          service_record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_attachments_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["service_status"]
          notes: string | null
          previous_status: Database["public"]["Enums"]["service_status"] | null
          service_record_id: string
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["service_status"]
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["service_status"] | null
          service_record_id: string
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["service_status"]
          notes?: string | null
          previous_status?: Database["public"]["Enums"]["service_status"] | null
          service_record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_history_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          accessories_received: string | null
          assigned_technician_id: string | null
          assigned_technician_name: string | null
          completed_at: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          device_brand: string
          device_color: string | null
          device_imei: string | null
          device_model: string
          device_serial: string | null
          diagnosis: string | null
          entry_notes: string | null
          estimated_cost: number | null
          final_cost: number | null
          has_scratches: boolean | null
          has_warranty: boolean | null
          id: string
          parts_used: string | null
          physical_condition: string | null
          price_approved: boolean | null
          price_approved_at: string | null
          qc_entry_at: string | null
          qc_entry_by: string | null
          qc_entry_notes: string | null
          qc_exit_at: string | null
          qc_exit_by: string | null
          qc_exit_notes: string | null
          received_at: string | null
          repair_description: string | null
          reported_issue: string
          scratch_locations: string | null
          screen_password: string | null
          status: Database["public"]["Enums"]["service_status"] | null
          updated_at: string
          user_id: string
          warranty_duration_days: number | null
          warranty_end_date: string | null
          warranty_parts: string | null
          warranty_start_date: string | null
          warranty_terms: string | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
        }
        Insert: {
          accessories_received?: string | null
          assigned_technician_id?: string | null
          assigned_technician_name?: string | null
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          device_brand: string
          device_color?: string | null
          device_imei?: string | null
          device_model: string
          device_serial?: string | null
          diagnosis?: string | null
          entry_notes?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          has_scratches?: boolean | null
          has_warranty?: boolean | null
          id?: string
          parts_used?: string | null
          physical_condition?: string | null
          price_approved?: boolean | null
          price_approved_at?: string | null
          qc_entry_at?: string | null
          qc_entry_by?: string | null
          qc_entry_notes?: string | null
          qc_exit_at?: string | null
          qc_exit_by?: string | null
          qc_exit_notes?: string | null
          received_at?: string | null
          repair_description?: string | null
          reported_issue: string
          scratch_locations?: string | null
          screen_password?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
          user_id: string
          warranty_duration_days?: number | null
          warranty_end_date?: string | null
          warranty_parts?: string | null
          warranty_start_date?: string | null
          warranty_terms?: string | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
        }
        Update: {
          accessories_received?: string | null
          assigned_technician_id?: string | null
          assigned_technician_name?: string | null
          completed_at?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          device_brand?: string
          device_color?: string | null
          device_imei?: string | null
          device_model?: string
          device_serial?: string | null
          diagnosis?: string | null
          entry_notes?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          has_scratches?: boolean | null
          has_warranty?: boolean | null
          id?: string
          parts_used?: string | null
          physical_condition?: string | null
          price_approved?: boolean | null
          price_approved_at?: string | null
          qc_entry_at?: string | null
          qc_entry_by?: string | null
          qc_entry_notes?: string | null
          qc_exit_at?: string | null
          qc_exit_by?: string | null
          qc_exit_notes?: string | null
          received_at?: string | null
          repair_description?: string | null
          reported_issue?: string
          scratch_locations?: string | null
          screen_password?: string | null
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
          user_id?: string
          warranty_duration_days?: number | null
          warranty_end_date?: string | null
          warranty_parts?: string | null
          warranty_start_date?: string | null
          warranty_terms?: string | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
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
      has_data_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
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
      service_status:
        | "pending_qc_entry"
        | "qc_entry_approved"
        | "assigned_technician"
        | "waiting_price_approval"
        | "repair_in_progress"
        | "pending_qc_exit"
        | "qc_exit_approved"
        | "completed"
        | "delivered"
        | "cancelled"
      warranty_type: "none" | "labor" | "parts" | "full"
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
      service_status: [
        "pending_qc_entry",
        "qc_entry_approved",
        "assigned_technician",
        "waiting_price_approval",
        "repair_in_progress",
        "pending_qc_exit",
        "qc_exit_approved",
        "completed",
        "delivered",
        "cancelled",
      ],
      warranty_type: ["none", "labor", "parts", "full"],
    },
  },
} as const
