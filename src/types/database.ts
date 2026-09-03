/**
 * Supabase Database type definitions.
 *
 * This file is normally (re)generated from the SQL migrations in
 * `supabase/migrations/` using the Supabase CLI:
 *
 *   supabase gen types typescript --local > src/types/database.ts
 *
 * Because the local Supabase stack is not running in this environment, this
 * file is maintained by hand in lockstep with the migrations. Regenerate it
 * with the CLI command above once a database is available and re-verify that
 * queries still type-check.
 */
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
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'
          preferred_locale: 'id' | 'en'
          theme_preference: 'light' | 'dark' | 'system'
          email_verified: boolean | null
          notification_prefs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'
          preferred_locale?: 'id' | 'en'
          theme_preference?: 'light' | 'dark' | 'system'
          email_verified?: boolean | null
          notification_prefs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'
          preferred_locale?: 'id' | 'en'
          theme_preference?: 'light' | 'dark' | 'system'
          email_verified?: boolean | null
          notification_prefs?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          recipient_name: string
          phone: string
          street: string
          district: string | null
          city: string
          province: string
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          recipient_name: string
          phone: string
          street: string
          district?: string | null
          city: string
          province: string
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          recipient_name?: string
          phone?: string
          street?: string
          district?: string | null
          city?: string
          province?: string
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          slug: string
          name: string
          tagline: string | null
          description: string | null
          logo_url: string | null
          banner_url: string | null
          contact_email: string
          phone: string | null
          province: string | null
          city: string | null
          status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'
          rejection_reason: string | null
          approved_at: string | null
          rating_avg: number
          rating_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          slug: string
          name: string
          tagline?: string | null
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          contact_email?: string
          phone?: string | null
          province?: string | null
          city?: string | null
          status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'
          rejection_reason?: string | null
          approved_at?: string | null
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          slug?: string
          name?: string
          tagline?: string | null
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          contact_email?: string
          phone?: string | null
          province?: string | null
          city?: string | null
          status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'
          rejection_reason?: string | null
          approved_at?: string | null
          rating_avg?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stores_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          slug: string
          name: string
          description: string | null
          brand: string | null
          condition: 'new' | 'used'
          price: number
          compare_at_price: number | null
          image_urls: string[]
          stock: number
          low_stock_threshold: number
          weight_grams: number | null
          status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
          is_featured: boolean
          reviews_count: number
          rating_avg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          category_id?: string | null
          slug: string
          name: string
          description?: string | null
          brand?: string | null
          condition?: 'new' | 'used'
          price: number
          compare_at_price?: number | null
          image_urls?: string[]
          stock?: number
          low_stock_threshold?: number
          weight_grams?: number | null
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
          is_featured?: boolean
          reviews_count?: number
          rating_avg?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          category_id?: string | null
          slug?: string
          name?: string
          description?: string | null
          brand?: string | null
          condition?: 'new' | 'used'
          price?: number
          compare_at_price?: number | null
          image_urls?: string[]
          stock?: number
          low_stock_threshold?: number
          weight_grams?: number | null
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
          is_featured?: boolean
          reviews_count?: number
          rating_avg?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      carts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'carts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey'
            columns: ['cart_id']
            isOneToOne: false
            referencedRelation: 'carts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          subtotal: number
          shipping_fee: number
          total: number
          discount: number
          voucher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          subtotal?: number
          shipping_fee?: number
          total?: number
          discount?: number
          voucher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          subtotal?: number
          shipping_fee?: number
          total?: number
          discount?: number
          voucher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          store_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          weight_grams: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          store_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          weight_grams?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          store_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          weight_grams?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wallets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ledger_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          balance_after: number
          type: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
          reference_type: string | null
          reference_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          balance_after: number
          type: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          balance_after?: number
          type?: 'SALE' | 'COMMISSION' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ledger_entries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          user_id: string
          method: 'WALLET' | 'BANK_TRANSFER' | 'COD'
          amount: number
          status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
          reference: string | null
          failure_reason: string | null
          metadata: Json | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: string
          method: 'WALLET' | 'BANK_TRANSFER' | 'COD'
          amount: number
          status?: 'PENDING' | 'SUCCEEDED' | 'FAILED'
          reference?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          user_id?: string
          method?: 'WALLET' | 'BANK_TRANSFER' | 'COD'
          amount?: number
          status?: 'PENDING' | 'SUCCEEDED' | 'FAILED'
          reference?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      seller_earnings: {
        Row: {
          id: string
          order_id: string
          store_id: string
          user_id: string
          order_item_id: string | null
          gross: number
          commission: number
          net: number
          status: 'AVAILABLE' | 'PAID_OUT' | 'REFUNDED'
          created_at: string
          paid_out_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          store_id: string
          user_id: string
          order_item_id?: string | null
          gross: number
          commission: number
          net: number
          status?: 'AVAILABLE' | 'PAID_OUT'
          created_at?: string
          paid_out_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          store_id?: string
          user_id?: string
          order_item_id?: string | null
          gross?: number
          commission?: number
          net?: number
          status?: 'AVAILABLE' | 'PAID_OUT'
          created_at?: string
          paid_out_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'seller_earnings_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seller_earnings_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seller_earnings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seller_earnings_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          },
        ]
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED'
          bank_name: string
          bank_account_number: string
          bank_account_name: string
          rejection_reason: string | null
          created_at: string
          processed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED'
          bank_name: string
          bank_account_number: string
          bank_account_name: string
          rejection_reason?: string | null
          created_at?: string
          processed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED'
          bank_name?: string
          bank_account_number?: string
          bank_account_name?: string
          rejection_reason?: string | null
          created_at?: string
          processed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'withdrawals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      return_reasons: {
        Row: {
          id: string
          code: string
          label: string
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          label: string
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          label?: string
          sort_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          carrier: string
          tracking_number: string
          shipped_at: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          carrier: string
          tracking_number: string
          shipped_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          carrier?: string
          tracking_number?: string
          shipped_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shipments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      returns: {
        Row: {
          id: string
          order_id: string
          order_item_id: string
          user_id: string
          reason_id: string | null
          note: string
          status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED'
          refund_amount: number | null
          seller_note: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          order_item_id: string
          user_id: string
          reason_id?: string | null
          note?: string
          status?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED'
          refund_amount?: number | null
          seller_note?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          order_item_id?: string
          user_id?: string
          reason_id?: string | null
          note?: string
          status?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED'
          refund_amount?: number | null
          seller_note?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'returns_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'returns_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'returns_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'returns_reason_id_fkey'
            columns: ['reason_id']
            isOneToOne: false
            referencedRelation: 'return_reasons'
            referencedColumns: ['id']
          },
        ]
      }
      disputes: {
        Row: {
          id: string
          return_id: string
          order_id: string
          user_id: string
          seller_id: string
          reason: string
          status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'CLOSED'
          resolution: string | null
          decided_by: string | null
          decided_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          return_id: string
          order_id: string
          user_id: string
          seller_id: string
          reason: string
          status?: 'OPEN' | 'APPROVED' | 'REJECTED' | 'CLOSED'
          resolution?: string | null
          decided_by?: string | null
          decided_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          return_id?: string
          order_id?: string
          user_id?: string
          seller_id?: string
          reason?: string
          status?: 'OPEN' | 'APPROVED' | 'REJECTED' | 'CLOSED'
          resolution?: string | null
          decided_by?: string | null
          decided_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'disputes_return_id_fkey'
            columns: ['return_id']
            isOneToOne: false
            referencedRelation: 'returns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_decided_by_fkey'
            columns: ['decided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notification_types: {
        Row: {
          id: string
          code: string
          label: string
        }
        Insert: {
          id?: string
          code: string
          label: string
        }
        Update: {
          id?: string
          code?: string
          label?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          link: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string
          link?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          link?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_type_fkey'
            columns: ['type']
            isOneToOne: false
            referencedRelation: 'notification_types'
            referencedColumns: ['code']
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          order_id: string
          buyer_id: string
          seller_id: string
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          buyer_id: string
          seller_id: string
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          buyer_id?: string
          seller_id?: string
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          store_id: string
          user_id: string
          order_id: string
          author_name: string
          rating: number
          title: string | null
          body: string
          status: 'ACTIVE' | 'HIDDEN'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          user_id: string
          order_id: string
          author_name: string
          rating: number
          title?: string | null
          body: string
          status?: 'ACTIVE' | 'HIDDEN'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          user_id?: string
          order_id?: string
          author_name?: string
          rating?: number
          title?: string | null
          body?: string
          status?: 'ACTIVE' | 'HIDDEN'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_reviews_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      store_follows: {
        Row: {
          user_id: string
          store_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          store_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          store_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'store_follows_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'store_follows_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
        ]
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlists_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      wishlist_items: {
        Row: {
          wishlist_id: string
          product_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          wishlist_id: string
          product_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          wishlist_id?: string
          product_id?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_wishlist_id_fkey'
            columns: ['wishlist_id']
            isOneToOne: false
            referencedRelation: 'wishlists'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_views: {
        Row: {
          id: number
          user_id: string | null
          product_id: string
          viewed_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          product_id: string
          viewed_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          product_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_views_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_views_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      vouchers: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'PERCENT' | 'AMOUNT'
          discount_value: number
          min_spend: number
          max_discount: number | null
          per_user_limit: number
          total_usage_limit: number | null
          uses_count: number
          is_active: boolean
          starts_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: 'PERCENT' | 'AMOUNT'
          discount_value: number
          min_spend?: number
          max_discount?: number | null
          per_user_limit?: number
          total_usage_limit?: number | null
          uses_count?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'PERCENT' | 'AMOUNT'
          discount_value?: number
          min_spend?: number
          max_discount?: number | null
          per_user_limit?: number
          total_usage_limit?: number | null
          uses_count?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_voucher_redemptions: {
        Row: {
          id: string
          voucher_id: string
          user_id: string
          order_id: string
          discount_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          voucher_id: string
          user_id: string
          order_id: string
          discount_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          voucher_id?: string
          user_id?: string
          order_id?: string
          discount_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_voucher_redemptions_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_voucher_redemptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_voucher_redemptions_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      flash_sales: {
        Row: {
          id: string
          product_id: string
          discount_type: 'PERCENT' | 'AMOUNT'
          discount_value: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          discount_type: 'PERCENT' | 'AMOUNT'
          discount_value: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          discount_type?: 'PERCENT' | 'AMOUNT'
          discount_value?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flash_sales_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      __analytics_store_guard: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      add_to_cart: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: string
      }
      add_to_wishlist: {
        Args: {
          p_product_id: string
          p_wishlist_id?: string | null
          p_notes?: string | null
        }
        Returns: string
      }
      active_flash_price: {
        Args: { p_product_id: string }
        Returns: number | null
      }
      admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_buyers: number
          total_sellers: number
          total_admins: number
          total_stores: number
          pending_stores: number
          active_stores: number
          total_products: number
          active_products: number
          total_orders: number
          committed_orders: number
          gmv: number
          pending_withdrawals: number
          pending_withdrawals_value: number
          open_disputes: number
          pending_returns: number
          hidden_reviews: number
        }
      }
      admin_list_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: string
          email_verified: boolean | null
          created_at: string
          updated_at: string
        }
      }
      admin_marketplace_analytics: {
        Args: { p_from: string; p_to: string }
        Returns: {
          gmv: number
          orders_count: number
          units_sold: number
          commission_total: number
          buyers_total: number
          repeat_buyers: number
          new_buyers: number
          avg_order_value: number
        }
      }
      admin_set_user_role: {
        Args: { p_user_id: string; p_role: string }
        Returns: undefined
      }
      app_setting: {
        Args: { setting_key: string }
        Returns: Json
      }
      approve_store: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      approve_withdrawal: {
        Args: { p_withdrawal_id: string }
        Returns: undefined
      }
      commission_rate_bps: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      credit_wallet: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
          p_ref_type: string | null
          p_ref_id: string | null
          p_description: string | null
        }
        Returns: number
      }
      close_store: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      confirm_receipt: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      create_flash_sale: {
        Args: {
          p_product_id: string
          p_discount_type: string
          p_discount_value: number
          p_is_active: boolean
          p_starts_at: string | null
          p_ends_at: string | null
        }
        Returns: string
      }
      create_product: {
        Args: {
          p_store_id: string
          p_category_id: string | null
          p_slug: string
          p_name: string
          p_description: string
          p_brand: string
          p_condition: string
          p_price: number
          p_compare_at_price: number | null
          p_image_urls: string[]
          p_stock: number
          p_low_stock_threshold: number
          p_weight_grams: number | null
          p_status: string
        }
        Returns: string
      }
      create_review: {
        Args: {
          p_order_id: string
          p_product_id: string
          p_rating: number
          p_title: string | null
          p_body: string
        }
        Returns: string
      }
      create_wishlist: {
        Args: { p_name: string }
        Returns: string
      }
      create_store_application: {
        Args: {
          p_banner_url: string
          p_city: string
          p_contact_email: string
          p_description: string
          p_logo_url: string
          p_name: string
          p_phone: string
          p_province: string
          p_slug: string
          p_tagline: string
        }
        Returns: string
      }
      create_voucher: {
        Args: {
          p_code: string
          p_description: string | null
          p_discount_type: string
          p_discount_value: number
          p_min_spend: number
          p_max_discount: number | null
          p_per_user_limit: number
          p_total_usage_limit: number | null
          p_is_active: boolean
          p_starts_at: string | null
          p_expires_at: string | null
        }
        Returns: string
      }
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_product: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      delete_wishlist: {
        Args: { p_wishlist_id: string }
        Returns: undefined
      }
      get_related_products: {
        Args: { p_product_id: string; p_limit?: number }
        Returns: {
          product_id: string
          slug: string
          name: string
          price: number
          image_url: string | null
          reviews_count: number
          rating_avg: number
        }[]
      }
      get_recently_viewed: {
        Args: { p_limit?: number }
        Returns: {
          product_id: string
          viewed_at: string
        }[]
      }
      debit_wallet: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
          p_ref_type: string | null
          p_ref_id: string | null
          p_description: string | null
        }
        Returns: number
      }
      enforce_single_default_address: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      ensure_cart: {
        Args: { p_user_id: string }
        Returns: string
      }
      ensure_wallet: {
        Args: { p_user_id: string }
        Returns: string
      }
      escalate_dispute: {
        Args: { p_return_id: string; p_reason: string }
        Returns: string
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      pay_order: {
        Args: { p_order_id: string; p_method: string }
        Returns: string
      }
      place_order: {
        Args: { p_voucher_code?: string | null }
        Returns: string
      }
      reject_store: {
        Args: { p_store_id: string; p_reason: string }
        Returns: undefined
      }
      reject_withdrawal: {
        Args: { p_withdrawal_id: string; p_reason: string }
        Returns: undefined
      }
      request_withdrawal: {
        Args: {
          p_amount: number
          p_bank_account_name: string
          p_bank_account_number: string
          p_bank_name: string
        }
        Returns: string
      }
      refund_line: {
        Args: { p_return_id: string }
        Returns: undefined
      }
      request_return: {
        Args: {
          p_order_id: string
          p_order_item_id: string
          p_reason_id: string | null
          p_note: string
        }
        Returns: string
      }
      resolve_dispute: {
        Args: { p_dispute_id: string; p_approve: boolean; p_note: string }
        Returns: undefined
      }
      respond_return: {
        Args: { p_return_id: string; p_approve: boolean; p_note: string }
        Returns: undefined
      }
      ship_order: {
        Args: { p_order_id: string; p_carrier: string; p_tracking: string }
        Returns: string
      }
      resubmit_store: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      remove_from_cart: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      record_product_view: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      remove_from_wishlist: {
        Args: { p_wishlist_id: string; p_product_id: string }
        Returns: undefined
      }
      rename_wishlist: {
        Args: { p_wishlist_id: string; p_name: string }
        Returns: undefined
      }
      set_review_status: {
        Args: { p_review_id: string; p_status: string }
        Returns: undefined
      }
      set_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      set_product_status: {
        Args: { p_product_id: string; p_status: string }
        Returns: undefined
      }
      set_product_stock: {
        Args: { p_product_id: string; p_stock: number }
        Returns: undefined
      }
      set_voucher_active: {
        Args: { p_id: string; p_is_active: boolean }
        Returns: undefined
      }
      set_flash_sale_active: {
        Args: { p_id: string; p_is_active: boolean }
        Returns: undefined
      }
      suspend_store: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      sync_email_verified: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      toggle_store_follow: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      update_cart_item: {
        Args: { p_item_id: string; p_quantity: number }
        Returns: undefined
      }
      update_review: {
        Args: {
          p_review_id: string
          p_rating: number
          p_title: string | null
          p_body: string
        }
        Returns: undefined
      }
      update_product: {
        Args: {
          p_product_id: string
          p_category_id: string | null
          p_slug: string
          p_name: string
          p_description: string
          p_brand: string
          p_condition: string
          p_price: number
          p_compare_at_price: number | null
          p_image_urls: string[]
          p_low_stock_threshold: number
          p_weight_grams: number | null
          p_is_featured: boolean
        }
        Returns: undefined
      }
      update_flash_sale: {
        Args: {
          p_id: string
          p_discount_type: string
          p_discount_value: number
          p_is_active: boolean
          p_starts_at: string | null
          p_ends_at: string | null
        }
        Returns: undefined
      }
      update_voucher: {
        Args: {
          p_id: string
          p_description: string | null
          p_discount_type: string
          p_discount_value: number
          p_min_spend: number
          p_max_discount: number | null
          p_per_user_limit: number
          p_total_usage_limit: number | null
          p_is_active: boolean
          p_starts_at: string | null
          p_expires_at: string | null
        }
        Returns: undefined
      }
      update_store: {
        Args: {
          p_banner_url: string
          p_city: string
          p_contact_email: string
          p_description: string
          p_logo_url: string
          p_name: string
          p_phone: string
          p_province: string
          p_store_id: string
          p_tagline: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_body: string
          p_link: string | null
        }
        Returns: string | null
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_or_get_conversation: {
        Args: { p_order_id: string }
        Returns: string
      }
      seller_customer_analytics: {
        Args: { p_store_id: string; p_from: string; p_to: string }
        Returns: {
          total_buyers: number
          repeat_buyers: number
          new_buyers: number
          repeat_rate: number
          avg_orders_per_buyer: number
          avg_spend: number
          avg_order_value: number
        }
      }
      seller_overview: {
        Args: { p_store_id: string; p_from: string; p_to: string }
        Returns: {
          orders: number
          units: number
          revenue: number
          views: number
          avg_order_value: number
          conversion_rate: number
          avg_rating: number
          reviews: number
        }
      }
      seller_product_analytics: {
        Args: { p_store_id: string; p_from: string; p_to: string }
        Returns: {
          product_id: string
          product_name: string
          slug: string
          views: number
          orders_count: number
          units_sold: number
          revenue_net: number
        }
      }
      seller_sales_series: {
        Args: { p_store_id: string; p_from: string; p_to: string }
        Returns: {
          day: string
          revenue: number
          orders: number
        }
      }
      send_message: {
        Args: { p_conversation_id: string; p_body: string }
        Returns: string
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      validate_voucher: {
        Args: {
          p_code: string
          p_user_id: string
          p_subtotal: number
        }
        Returns: {
          voucher_id: string | null
          discount: number
          message: string | null
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
