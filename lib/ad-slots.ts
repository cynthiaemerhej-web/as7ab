import type { AdSlot } from './constants'

export const AD_SLOT_INFO: { slot: AdSlot; name: string; where: string; size: string }[] = [
  { slot: 'home_banner', name: 'Home banner', where: 'Top of the home page, under the search box', size: '970 × 250 px (desktop) · 360 × 120 px (mobile)' },
  { slot: 'sidebar', name: 'Sidebar', where: 'Right column on home and search pages; between sections on phones', size: '300 × 250 px' },
  { slot: 'search_inline', name: 'In search results', where: 'A card inside the results grid, after every 8th listing', size: '600 × 600 px (square)' },
  { slot: 'listing_bottom', name: 'Under a listing', where: 'Below the contact buttons on every listing page', size: '728 × 90 px (desktop) · 360 × 120 px (mobile)' },
]

export function adSlotName(slot: string): string {
  return AD_SLOT_INFO.find((s) => s.slot === slot)?.name ?? slot
}
