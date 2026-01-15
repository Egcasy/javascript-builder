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
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          ticket_type_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          ticket_type_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          ticket_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_restriction: number | null
          category: string
          cover_image: string | null
          created_at: string
          date: string
          description: string | null
          dress_code: string | null
          end_time: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_hot: boolean | null
          seller_id: string
          short_description: string | null
          sold_tickets: number | null
          start_time: string
          status: string | null
          tags: string[] | null
          title: string
          total_tickets: number | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          age_restriction?: number | null
          category: string
          cover_image?: string | null
          created_at?: string
          date: string
          description?: string | null
          dress_code?: string | null
          end_time?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          seller_id: string
          short_description?: string | null
          sold_tickets?: number | null
          start_time: string
          status?: string | null
          tags?: string[] | null
          title: string
          total_tickets?: number | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          age_restriction?: number | null
          category?: string
          cover_image?: string | null
          created_at?: string
          date?: string
          description?: string | null
          dress_code?: string | null
          end_time?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          seller_id?: string
          short_description?: string | null
          sold_tickets?: number | null
          start_time?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          total_tickets?: number | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount_amount: number | null
          event_id: string
          id: string
          payment_intent_id: string | null
          payment_reference: string | null
          promo_code_id: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          event_id: string
          id?: string
          payment_intent_id?: string | null
          payment_reference?: string | null
          promo_code_id?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          event_id?: string
          id?: string
          payment_intent_id?: string | null
          payment_reference?: string | null
          promo_code_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          event_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase: number | null
          seller_id: string
          updated_at: string
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          seller_id: string
          updated_at?: string
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          seller_id?: string
          updated_at?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          business_email: string | null
          business_name: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          tier: string | null
          total_revenue: number | null
          total_sales: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          business_email?: string | null
          business_name: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          tier?: string | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          business_email?: string | null
          business_name?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          tier?: string | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          benefits: string[] | null
          created_at: string
          description: string | null
          early_bird_deadline: string | null
          event_id: string
          id: string
          is_early_bird: boolean | null
          max_per_order: number | null
          name: string
          original_price: number | null
          price: number
          quantity: number
          sold: number | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          early_bird_deadline?: string | null
          event_id: string
          id?: string
          is_early_bird?: boolean | null
          max_per_order?: number | null
          name: string
          original_price?: number | null
          price: number
          quantity: number
          sold?: number | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          early_bird_deadline?: string | null
          event_id?: string
          id?: string
          is_early_bird?: boolean | null
          max_per_order?: number | null
          name?: string
          original_price?: number | null
          price?: number
          quantity?: number
          sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          created_at: string
          id: string
          order_id: string
          qr_code: string
          status: string | null
          ticket_type_id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          qr_code: string
          status?: string | null
          ticket_type_id: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          qr_code?: string
          status?: string | null
          ticket_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          favorite_categories: string[] | null
          favorite_cities: string[] | null
          id: string
          price_range_max: number | null
          price_range_min: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_categories?: string[] | null
          favorite_cities?: string[] | null
          id?: string
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_categories?: string[] | null
          favorite_cities?: string[] | null
          id?: string
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          capacity: number | null
          city: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          address: string
          capacity?: number | null
          city: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          address?: string
          capacity?: number | null
          city?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_sellers: {
        Row: {
          business_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          tier: string | null
          verified: boolean | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          tier?: string | null
          verified?: boolean | null
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          tier?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
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
      app_role: "buyer" | "seller" | "admin"
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
      app_role: ["buyer", "seller", "admin"],
    },
  },
} as const
