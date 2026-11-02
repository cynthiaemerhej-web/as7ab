import AdBanner from './AdBanner'
import type { AdSlot as Slot } from '@/lib/constants'
import { getAdForSlot } from '@/lib/data/ads'
import { createClient } from '@/lib/supabase/server'

/** Server component: fetches one live ad for the slot (or the placeholder). */
export default async function AdSlot({ slot, className = '' }: { slot: Slot; className?: string }) {
  const sb = await createClient()
  const ad = await getAdForSlot(sb, slot)
  return <AdBanner ad={ad} slot={slot} className={className} />
}
