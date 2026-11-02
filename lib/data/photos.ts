import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { UrlFor } from './mappers'

export type Sb = SupabaseClient<Database>

export const LISTING_PHOTOS_BUCKET = 'listing-photos'
export const AD_BANNERS_BUCKET = 'ad-banners'

export function photoUrlFor(sb: Sb, bucket: string = LISTING_PHOTOS_BUCKET): UrlFor {
  return (path) => sb.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
