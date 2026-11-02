import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import type { AdSlot } from '@/lib/constants'

export type AdBannerData = { id: string; imageUrl: string; linkUrl: string; advertiserName: string }

const frame: Record<AdSlot, string> = {
  home_banner: 'aspect-[3/1] sm:aspect-[97/25]',
  sidebar: 'aspect-[6/5]',
  search_inline: 'aspect-square',
  listing_bottom: 'aspect-[3/1] sm:aspect-[8/1]',
}

export default function AdBanner({ ad, slot, className = '' }: { ad: AdBannerData | null; slot: AdSlot; className?: string }) {
  if (!ad) {
    return (
      <Link
        href="/advertise"
        className={`flex ${frame[slot]} w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-line bg-card/60 p-3 text-center text-muted transition hover:border-accent hover:text-accent-dark ${className}`}
      >
        <Megaphone className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-semibold">Advertise here</span>
        <span className="text-xs">Reach people across Lebanon</span>
      </Link>
    )
  }
  return (
    <a
      href={`/go/${ad.id}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`relative block ${frame[slot]} w-full overflow-hidden rounded-card bg-card shadow-card ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- advertiser images are not optimised */}
      <img src={ad.imageUrl} alt={ad.advertiserName} className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute right-1.5 top-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Ad</span>
    </a>
  )
}
