import Image from 'next/image'
import Link from 'next/link'
import { Image as ImageGlyph, MapPin } from 'lucide-react'
import Badge from './Badge'
import type { ListingType } from '@/lib/constants'

export type ListingCardProps = {
  slug: string
  title: string
  categoryName: string
  area: string
  type: ListingType
  photoUrl: string | null
}

export default function ListingCard({ slug, title, categoryName, area, type, photoUrl }: ListingCardProps) {
  return (
    <Link
      href={`/l/${slug}`}
      className="group flex flex-col overflow-hidden rounded-card bg-card shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface">
        {photoUrl ? (
          <Image src={photoUrl} alt={title} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line" aria-hidden="true">
            <ImageGlyph className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
        <Badge variant={type === 'service' ? 'accent' : 'primary'} className="absolute left-2 top-2 bg-white/90 backdrop-blur">
          {type === 'service' ? 'Service' : 'Goods'}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs font-medium text-accent-dark">{categoryName}</span>
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink">{title}</h3>
        <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {area}
        </span>
      </div>
    </Link>
  )
}
