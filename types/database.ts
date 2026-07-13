export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'partner' | 'admin';

export type PartnerCategory =
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'mart'
  | 'hotel';

export type RescueBagStatus = 'active' | 'sold_out' | 'expired' | 'cancelled';

export type BagServiceType = 'takeaway' | 'dinein' | 'both';

export type OrderServiceType = 'takeaway' | 'dinein';

export type OrderStatus = 'pending' | 'confirmed' | 'picked_up' | 'cancelled' | 'missed';

export type PaymentMethod = 'esewa' | 'khalti' | 'cash';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          push_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          push_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          name_np: string | null;
          description: string | null;
          address: string | null;
          latitude: number;
          longitude: number;
          category: PartnerCategory;
          cover_image_url: string | null;
          phone: string | null;
          is_active: boolean;
          rating: number;
          total_reviews: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          name_np?: string | null;
          description?: string | null;
          address?: string | null;
          latitude: number;
          longitude: number;
          category: PartnerCategory;
          cover_image_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          rating?: number;
          total_reviews?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          name_np?: string | null;
          description?: string | null;
          address?: string | null;
          latitude?: number;
          longitude?: number;
          category?: PartnerCategory;
          cover_image_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          rating?: number;
          total_reviews?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'partners_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      rescue_bags: {
        Row: {
          id: string;
          partner_id: string;
          title: string;
          title_np: string | null;
          description: string | null;
          original_price: number;
          rescue_price: number;
          quantity_available: number;
          quantity_reserved: number;
          pickup_start: string;
          pickup_end: string;
          available_date: string;
          status: RescueBagStatus;
          image_url: string | null;
          service_type: BagServiceType;
          dinein_extra_charge: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          title: string;
          title_np?: string | null;
          description?: string | null;
          original_price: number;
          rescue_price: number;
          quantity_available: number;
          quantity_reserved?: number;
          pickup_start: string;
          pickup_end: string;
          available_date: string;
          status?: RescueBagStatus;
          image_url?: string | null;
          service_type?: BagServiceType;
          dinein_extra_charge?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          title?: string;
          title_np?: string | null;
          description?: string | null;
          original_price?: number;
          rescue_price?: number;
          quantity_available?: number;
          quantity_reserved?: number;
          pickup_start?: string;
          pickup_end?: string;
          available_date?: string;
          status?: RescueBagStatus;
          image_url?: string | null;
          service_type?: BagServiceType;
          dinein_extra_charge?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rescue_bags_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          bag_id: string;
          partner_id: string;
          quantity: number;
          total_price: number;
          status: OrderStatus;
          qr_code: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_note: string | null;
          service_type: OrderServiceType;
          picked_up_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          bag_id: string;
          partner_id: string;
          quantity?: number;
          total_price: number;
          status?: OrderStatus;
          qr_code?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_note?: string | null;
          service_type?: OrderServiceType;
          picked_up_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          bag_id?: string;
          partner_id?: string;
          quantity?: number;
          total_price?: number;
          status?: OrderStatus;
          qr_code?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_note?: string | null;
          service_type?: OrderServiceType;
          picked_up_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_bag_id_fkey';
            columns: ['bag_id'];
            isOneToOne: false;
            referencedRelation: 'rescue_bags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          partner_id: string;
          rating: number;
          comment: string | null;
          quantity_feedback: string | null;
          value_feedback: string | null;
          would_return: string | null;
          photo_url: string | null;
          partner_reply: string | null;
          partner_replied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id: string;
          partner_id: string;
          rating: number;
          comment?: string | null;
          quantity_feedback?: string | null;
          value_feedback?: string | null;
          would_return?: string | null;
          photo_url?: string | null;
          partner_reply?: string | null;
          partner_replied_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_id?: string;
          partner_id?: string;
          rating?: number;
          comment?: string | null;
          quantity_feedback?: string | null;
          value_feedback?: string | null;
          would_return?: string | null;
          photo_url?: string | null;
          partner_reply?: string | null;
          partner_replied_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          data: Json | null;
          send_at: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          data?: Json | null;
          send_at: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          data?: Json | null;
          send_at?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      partner_category: PartnerCategory;
      rescue_bag_status: RescueBagStatus;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Partner = Database['public']['Tables']['partners']['Row'];
export type PartnerInsert = Database['public']['Tables']['partners']['Insert'];
export type PartnerUpdate = Database['public']['Tables']['partners']['Update'];

export type RescueBag = Database['public']['Tables']['rescue_bags']['Row'];
export type RescueBagInsert = Database['public']['Tables']['rescue_bags']['Insert'];
export type RescueBagUpdate = Database['public']['Tables']['rescue_bags']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];
