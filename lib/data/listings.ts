import { RESULTS_PER_PAGE } from '@/lib/constants'
import type { ParsedSearch } from '@/lib/search-params'
import { firstPhotoPath, toCardData, toDetail, type ListingCardData, type ListingDetail, type ListingWithRefs } from './mappers'
import { photoUrlFor, type Sb } from './photos'

const WITH_REFS = '*, categories(name, slug), listing_photos(storage_path, sort_order)'

export async function getLatestListings(sb: Sb, limit = 12): Promise<ListingCardData[]> {
  const { data, error } = await sb
    .from('listings')
    .select(WITH_REFS)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const urlFor = photoUrlFor(sb)
  return (data as unknown as ListingWithRefs[]).map((r) => toCardData(r, urlFor))
}

export type SearchResult = { items: ListingCardData[]; total: number; totalPages: number }

export async function searchListings(sb: Sb, params: ParsedSearch, categoryId: number | null): Promise<SearchResult> {
  const args = { q: params.q, p_category: categoryId, p_type: params.type, p_area: params.area }
  const [rows, count] = await Promise.all([
    sb.rpc('search_listings', { ...args, p_limit: RESULTS_PER_PAGE, p_offset: (params.page - 1) * RESULTS_PER_PAGE }),
    sb.rpc('count_search_listings', args),
  ])
  if (rows.error) throw rows.error
  if (count.error) throw count.error
  const ids = rows.data.map((r) => r.id)
  let refs: ListingWithRefs[] = []
  if (ids.length > 0) {
    const { data, error } = await sb.from('listings').select(WITH_REFS).in('id', ids)
    if (error) throw error
    const byId = new Map((data as unknown as ListingWithRefs[]).map((r) => [r.id, r]))
    refs = ids.map((id) => byId.get(id)).filter((r): r is ListingWithRefs => Boolean(r))
  }
  const urlFor = photoUrlFor(sb)
  const total = Number(count.data ?? 0)
  return { items: refs.map((r) => toCardData(r, urlFor)), total, totalPages: Math.max(1, Math.ceil(total / RESULTS_PER_PAGE)) }
}

export async function getListingBySlug(sb: Sb, slug: string): Promise<ListingDetail | null> {
  const { data, error } = await sb.from('listings').select(WITH_REFS).eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as ListingWithRefs
  const { data: owner } = await sb.from('public_profiles').select('display_name').eq('id', row.owner_id).maybeSingle()
  return toDetail(row, owner?.display_name ?? 'A member', photoUrlFor(sb))
}

export async function incrementViews(sb: Sb, listingId: string): Promise<void> {
  await sb.rpc('increment_listing_views', { p_listing: listingId })
}

export type MyListing = {
  id: string
  slug: string
  title: string
  status: ListingWithRefs['status']
  needs_review: boolean
  rejection_reason: string | null
  updated_at: string
  views: number
  firstPhotoUrl: string | null
}

export async function getMyListings(sb: Sb, ownerId: string): Promise<MyListing[]> {
  const { data, error } = await sb
    .from('listings')
    .select('id, slug, title, status, needs_review, rejection_reason, updated_at, views, listing_photos(storage_path, sort_order)')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  const urlFor = photoUrlFor(sb)
  return data.map((r) => {
    const first = firstPhotoPath(r.listing_photos)
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      status: r.status,
      needs_review: r.needs_review,
      rejection_reason: r.rejection_reason,
      updated_at: r.updated_at,
      views: r.views,
      firstPhotoUrl: first ? urlFor(first) : null,
    }
  })
}

export type MyListingFull = ListingWithRefs & { photos: { id: string; url: string; storage_path: string }[] }

export async function getMyListing(sb: Sb, id: string): Promise<MyListingFull | null> {
  const { data, error } = await sb
    .from('listings')
    .select('*, categories(name, slug), listing_photos(id, storage_path, sort_order)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const urlFor = photoUrlFor(sb)
  const photos = [...(data.listing_photos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({ id: p.id, url: urlFor(p.storage_path), storage_path: p.storage_path }))
  return { ...(data as unknown as ListingWithRefs), photos }
}
