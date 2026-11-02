import type { AdRequestRow, AdRow, CategoryRow, ListingRow } from '@/lib/supabase/types'
import { firstPhotoPath, type PhotoRef } from './mappers'
import { photoUrlFor, type Sb } from './photos'

export type AdminListingRow = Pick<ListingRow, 'id' | 'slug' | 'title' | 'status' | 'needs_review' | 'rejection_reason' | 'area' | 'type' | 'created_at' | 'updated_at' | 'views' | 'description'> & {
  categoryName: string
  ownerName: string
  photoUrl: string | null
  contact: { phone: string | null; whatsapp: string | null; email: string | null; instagram: string | null; website: string | null }
}

type RawAdminRow = ListingRow & { categories: { name: string } | null; listing_photos: PhotoRef[] | null }

const SELECT = '*, categories(name), listing_photos(storage_path, sort_order)'

async function withOwners(sb: Sb, rows: RawAdminRow[]): Promise<AdminListingRow[]> {
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))]
  const names = new Map<string, string>()
  if (ownerIds.length > 0) {
    const { data } = await sb.from('public_profiles').select('id, display_name').in('id', ownerIds)
    for (const p of data ?? []) names.set(p.id, p.display_name)
  }
  const urlFor = photoUrlFor(sb)
  return rows.map((r) => {
    const first = firstPhotoPath(r.listing_photos)
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      status: r.status,
      needs_review: r.needs_review,
      rejection_reason: r.rejection_reason,
      area: r.area,
      type: r.type,
      created_at: r.created_at,
      updated_at: r.updated_at,
      views: r.views,
      categoryName: r.categories?.name ?? 'Other',
      ownerName: names.get(r.owner_id) ?? 'Unknown member',
      photoUrl: first ? urlFor(first) : null,
      contact: { phone: r.phone, whatsapp: r.whatsapp, email: r.email, instagram: r.instagram, website: r.website },
    }
  })
}

export async function getQueue(sb: Sb): Promise<{ pending: AdminListingRow[]; flagged: AdminListingRow[] }> {
  const [p, f] = await Promise.all([
    sb.from('listings').select(SELECT).eq('status', 'pending').order('created_at', { ascending: true }),
    sb.from('listings').select(SELECT).eq('needs_review', true).neq('status', 'pending').order('updated_at', { ascending: true }),
  ])
  if (p.error) throw p.error
  if (f.error) throw f.error
  const [pending, flagged] = await Promise.all([
    withOwners(sb, p.data as unknown as RawAdminRow[]),
    withOwners(sb, f.data as unknown as RawAdminRow[]),
  ])
  return { pending, flagged }
}

export async function getAllListings(sb: Sb, opts: { status?: string | null; q?: string | null; page: number; perPage?: number }) {
  const perPage = opts.perPage ?? 30
  let query = sb.from('listings').select(SELECT, { count: 'exact' }).order('updated_at', { ascending: false })
  if (opts.status) query = query.eq('status', opts.status as ListingRow['status'])
  if (opts.q) query = query.ilike('title', `%${opts.q}%`)
  const from = (opts.page - 1) * perPage
  const { data, error, count } = await query.range(from, from + perPage - 1)
  if (error) throw error
  const items = await withOwners(sb, data as unknown as RawAdminRow[])
  return { items, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)) }
}

export async function getAds(sb: Sb): Promise<AdRow[]> {
  const { data, error } = await sb.from('ads').select('*').order('slot').order('starts_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAdRequests(sb: Sb): Promise<AdRequestRow[]> {
  const { data, error } = await sb.from('ad_requests').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return data
}

export async function getAllCategories(sb: Sb): Promise<CategoryRow[]> {
  const { data, error } = await sb.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function getAdmins(sb: Sb): Promise<{ id: string; display_name: string; email: string }[]> {
  const { data, error } = await sb.rpc('list_admins')
  if (error) throw error
  return data ?? []
}
