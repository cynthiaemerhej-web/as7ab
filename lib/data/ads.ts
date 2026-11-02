import type { AdBannerData } from '@/components/AdBanner'
import type { AdSlot } from '@/lib/constants'
import { pickAd } from '@/lib/ads/pick'
import { AD_BANNERS_BUCKET, photoUrlFor, type Sb } from './photos'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** One active ad for the slot (random when several), recording an impression. */
export async function getAdForSlot(sb: Sb, slot: AdSlot): Promise<AdBannerData | null> {
  const d = today()
  const { data, error } = await sb
    .from('ads')
    .select('id, advertiser_name, link_url, image_path')
    .eq('slot', slot)
    .eq('is_active', true)
    .lte('starts_at', d)
    .gte('ends_at', d)
  if (error || !data) return null
  const ad = pickAd(data)
  if (!ad) return null
  void sb.rpc('record_ad_impression', { p_ad: ad.id }).then(() => undefined, () => undefined)
  const urlFor = photoUrlFor(sb, AD_BANNERS_BUCKET)
  return { id: ad.id, imageUrl: urlFor(ad.image_path), linkUrl: ad.link_url, advertiserName: ad.advertiser_name }
}

export async function getLiveAdById(sb: Sb, id: string): Promise<{ id: string; link_url: string } | null> {
  const { data } = await sb.from('ads').select('id, link_url, is_active').eq('id', id).maybeSingle()
  if (!data || !data.is_active) return null
  return { id: data.id, link_url: data.link_url }
}

export async function recordAdClick(sb: Sb, id: string): Promise<void> {
  await sb.rpc('record_ad_click', { p_ad: id })
}
