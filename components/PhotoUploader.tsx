'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { attachPhotos, removePhoto, type PhotoItem } from '@/app/dashboard/actions'
import { MAX_PHOTOS } from '@/lib/constants'
import { LISTING_PHOTOS_BUCKET } from '@/lib/data/photos'
import { photoStoragePath, prepareImage, validatePhotoFile } from '@/lib/photos/prepare'
import { createBrowserClient } from '@/lib/supabase/client'

type Props = { listingId: string; userId: string; initial: PhotoItem[] }

export default function PhotoUploader({ listingId, userId, initial }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const remaining = MAX_PHOTOS - photos.length

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    const chosen = Array.from(files).slice(0, remaining)
    if (files.length > remaining) setError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.`)
    for (const f of chosen) {
      const problem = validatePhotoFile(f)
      if (problem) {
        setError(`${f.name}: ${problem}`)
        return
      }
    }
    setBusy(true)
    try {
      const sb = createBrowserClient()
      const paths: string[] = []
      for (const f of chosen) {
        const prepared = await prepareImage(f)
        const path = photoStoragePath(userId, listingId)
        const { error: upErr } = await sb.storage.from(LISTING_PHOTOS_BUCKET).upload(path, prepared, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw new Error(`Upload failed for ${f.name}. Please try again.`)
        paths.push(path)
      }
      const res = await attachPhotos(listingId, paths)
      if (res.error) {
        await sb.storage.from(LISTING_PHOTOS_BUCKET).remove(paths) // don't leave orphan files behind
        throw new Error(res.error)
      }
      if (res.photos) setPhotos(res.photos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while uploading.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  async function onRemove(id: string) {
    setBusy(true)
    setError(null)
    const res = await removePhoto(listingId, id)
    if (res.error) setError(res.error)
    if (res.photos) setPhotos(res.photos)
    setBusy(false)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-surface ring-1 ring-line">
            <Image src={p.url} alt={`Photo ${i + 1}`} fill sizes="120px" className="object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              disabled={busy}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink shadow hover:bg-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-muted hover:border-accent hover:text-accent-dark disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
            <span className="text-xs font-medium">{busy ? 'Uploading…' : 'Add photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-label="Choose photos"
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted">
        {photos.length} of {MAX_PHOTOS} photos · JPG, PNG or WebP, up to 5 MB each. The first photo is the cover.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-primary-dark">
          {error}
        </p>
      )}
    </div>
  )
}
