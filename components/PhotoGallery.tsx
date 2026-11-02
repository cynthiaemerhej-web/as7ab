'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Image as ImageGlyph } from 'lucide-react'

export type GalleryPhoto = { url: string; alt: string }

export default function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState(0)
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-card bg-card text-line ring-1 ring-line/60" aria-label="No photos">
        <ImageGlyph className="h-14 w-14" strokeWidth={1.25} aria-hidden="true" />
      </div>
    )
  }
  const current = photos[Math.min(index, photos.length - 1)]
  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-card ring-1 ring-line/60">
        <Image src={current.url} alt={current.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" priority />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photos">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${i === index ? 'ring-primary' : 'ring-transparent'}`}
            >
              <Image src={p.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
