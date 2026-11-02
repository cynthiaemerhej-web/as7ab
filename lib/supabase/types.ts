/**
 * Hand-written database types matching supabase/migrations. Keep in sync when
 * the schema changes (or regenerate with `npx supabase gen types typescript`).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ListingStatusDb = 'pending' | 'approved' | 'rejected' | 'hidden'
export type ListingTypeDb = 'service' | 'goods'
export type AdSlotDb = 'home_banner' | 'sidebar' | 'search_inline' | 'listing_bottom'

export type ProfileRow = {
  id: string
  display_name: string
  phone: string | null
  whatsapp: string | null
  contact_email: string | null
  role: 'member' | 'admin'
  created_at: string
}

export type CategoryRow = {
  id: number
  slug: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}

export type ListingRow = {
  id: string
  owner_id: string
  slug: string
  title: string
  description: string
  category_id: number
  type: ListingTypeDb
  area: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  website: string | null
  status: ListingStatusDb
  needs_review: boolean
  rejection_reason: string | null
  views: number
  created_at: string
  updated_at: string
  search_vector: unknown
}

export type ListingPhotoRow = {
  id: string
  listing_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export type AdRow = {
  id: string
  advertiser_name: string
  link_url: string
  image_path: string
  slot: AdSlotDb
  starts_at: string
  ends_at: string
  is_active: boolean
  impressions: number
  clicks: number
  created_by: string | null
  created_at: string
}

export type AdRequestRow = {
  id: string
  name: string
  business: string | null
  email: string
  phone: string | null
  slot: string
  message: string
  status: 'new' | 'contacted' | 'closed'
  created_at: string
}

export type SiteSettingRow = { key: string; value: string; updated_at: string }

type Table<Row, Insert, Update, Relationships = []> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationships
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Optional<ProfileRow, 'phone' | 'whatsapp' | 'contact_email' | 'role' | 'created_at'>,
        Partial<ProfileRow>
      >
      categories: Table<
        CategoryRow,
        Optional<CategoryRow, 'id' | 'icon' | 'sort_order' | 'is_active'>,
        Partial<CategoryRow>
      >
      listings: Table<
        ListingRow,
        Optional<
          ListingRow,
          | 'id'
          | 'phone'
          | 'whatsapp'
          | 'email'
          | 'instagram'
          | 'website'
          | 'status'
          | 'needs_review'
          | 'rejection_reason'
          | 'views'
          | 'created_at'
          | 'updated_at'
          | 'search_vector'
        >,
        Partial<Omit<ListingRow, 'search_vector'>>,
        [
          {
            foreignKeyName: 'listings_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'listings_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'public_profiles'
            referencedColumns: ['id']
          },
        ]
      >
      listing_photos: Table<
        ListingPhotoRow,
        Optional<ListingPhotoRow, 'id' | 'sort_order' | 'created_at'>,
        Partial<ListingPhotoRow>,
        [
          {
            foreignKeyName: 'listing_photos_listing_id_fkey'
            columns: ['listing_id']
            isOneToOne: false
            referencedRelation: 'listings'
            referencedColumns: ['id']
          },
        ]
      >
      ads: Table<
        AdRow,
        Optional<AdRow, 'id' | 'starts_at' | 'ends_at' | 'is_active' | 'impressions' | 'clicks' | 'created_by' | 'created_at'>,
        Partial<AdRow>
      >
      ad_requests: Table<
        AdRequestRow,
        Optional<AdRequestRow, 'id' | 'business' | 'phone' | 'message' | 'status' | 'created_at'>,
        Partial<AdRequestRow>
      >
      site_settings: Table<SiteSettingRow, Optional<SiteSettingRow, 'updated_at'>, Partial<SiteSettingRow>>
    }
    Views: {
      public_profiles: { Row: { id: string; display_name: string }; Relationships: [] }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      increment_listing_views: { Args: { p_listing: string }; Returns: undefined }
      record_ad_impression: { Args: { p_ad: string }; Returns: undefined }
      record_ad_click: { Args: { p_ad: string }; Returns: undefined }
      search_listings: {
        Args: {
          q: string
          p_category: number | null
          p_type: string | null
          p_area: string | null
          p_limit: number
          p_offset: number
        }
        Returns: ListingRow[]
      }
      count_search_listings: {
        Args: { q: string; p_category: number | null; p_type: string | null; p_area: string | null }
        Returns: number
      }
      set_admin_by_email: { Args: { target_email: string; make_admin: boolean }; Returns: boolean }
      list_admins: { Args: Record<string, never>; Returns: { id: string; display_name: string; email: string }[] }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
