import type { ListingCardProps } from '@/components/ListingCard'
import type { GalleryPhoto } from '@/components/PhotoGallery'
import type { ListingRow } from '@/lib/supabase/types'

export type UrlFor = (storagePath: string) => string

export type PhotoRef = { storage_path: string; sort_order: number }
export type CategoryRef = { name: string; slug: string } | null

/** Shape returned by `select('*, categories(name, slug), listing_photos(storage_path, sort_order)')`. */
export type ListingWithRefs = Omit<ListingRow, 'search_vector'> & {
  categories: CategoryRef
  listing_photos: PhotoRef[] | null
}

export type ListingCardData = ListingCardProps & { id: string }

export type ListingDetail = {
  id: string
  slug: string
  title: string
  description: string
  area: string
  type: ListingRow['type']
  status: ListingRow['status']
  views: number
  createdAt: string
  ownerId: string
  ownerName: string
  category: { name: string; slug: string }
  photos: GalleryPhoto[]
  contact: {
    phone: string | null
    whatsapp: string | null
    email: string | null
    instagram: string | null
    website: string | null
  }
}

export function sortPhotos(photos: PhotoRef[] | null | undefined): PhotoRef[] {
  return [...(photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
}

export function firstPhotoPath(photos: PhotoRef[] | null | undefined): string | null {
  return sortPhotos(photos)[0]?.storage_path ?? null
}

export function toCardData(row: ListingWithRefs, urlFor: UrlFor): ListingCardData {
  const first = firstPhotoPath(row.listing_photos)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    area: row.area,
    type: row.type,
    categoryName: row.categories?.name ?? 'Other',
    photoUrl: first ? urlFor(first) : null,
  }
}

export function toDetail(row: ListingWithRefs, ownerName: string, urlFor: UrlFor): ListingDetail {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    area: row.area,
    type: row.type,
    status: row.status,
    views: row.views,
    createdAt: row.created_at,
    ownerId: row.owner_id,
    ownerName,
    category: { name: row.categories?.name ?? 'Other', slug: row.categories?.slug ?? 'other' },
    photos: sortPhotos(row.listing_photos).map((p) => ({ url: urlFor(p.storage_path), alt: row.title })),
    contact: {
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      instagram: row.instagram,
      website: row.website,
    },
  }
}
