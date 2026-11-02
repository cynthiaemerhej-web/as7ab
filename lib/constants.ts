export const SITE_NAME = 'As7ab'
export const SITE_TAGLINE = 'Find services and goods from people you know, across Lebanon.'

export const LISTING_TYPES = ['service', 'goods'] as const
export type ListingType = (typeof LISTING_TYPES)[number]

export const AD_SLOTS = ['home_banner', 'sidebar', 'search_inline', 'listing_bottom'] as const
export type AdSlot = (typeof AD_SLOTS)[number]

export const LISTING_STATUSES = ['pending', 'approved', 'rejected', 'hidden'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const MAX_PHOTOS = 6
export const MAX_LISTINGS_PER_MEMBER = 10
export const RESULTS_PER_PAGE = 24
export const INLINE_AD_EVERY = 8
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
