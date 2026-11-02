'use client'

import { startTransition, useActionState, useRef, useState } from 'react'
import { saveAd } from '@/app/admin/actions'
import { AD_SLOT_INFO } from '@/lib/ad-slots'
import { AD_BANNERS_BUCKET } from '@/lib/data/photos'
import type { FormState } from '@/lib/form-state'
import { validatePhotoFile } from '@/lib/photos/prepare'
import { createBrowserClient } from '@/lib/supabase/client'
import type { AdRow } from '@/lib/supabase/types'

const field = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'
const label = 'block text-sm font-medium'

export default function AdForm({ ad }: { ad?: AdRow | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAd, {})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const fe = state.fieldErrors ?? {}

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploadError(null)
    const fd = new FormData(e.currentTarget)
    const file = fd.get('banner')
    fd.delete('banner')
    if (file instanceof File && file.size > 0) {
      const problem = validatePhotoFile({ type: file.type === 'image/gif' ? 'image/png' : file.type, size: file.size })
      if (problem) {
        setUploadError(problem)
        return
      }
      setUploading(true)
      const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type] ?? 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await createBrowserClient().storage.from(AD_BANNERS_BUCKET).upload(path, file, { contentType: file.type })
      setUploading(false)
      if (error) {
        setUploadError('Upload failed. Check the ad-banners bucket exists and try again.')
        return
      }
      fd.set('imagePath', path)
    }
    startTransition(() => action(fd))
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-4" noValidate>
      {ad?.id && <input type="hidden" name="id" value={ad.id} />}
      {state.error && <p role="alert" className="rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="advertiserName" className={label}>Advertiser</label>
          <input id="advertiserName" name="advertiserName" defaultValue={ad?.advertiser_name ?? ''} required className={field} />
          {fe.advertiserName && <p className="mt-1 text-sm text-primary-dark">{fe.advertiserName}</p>}
        </div>
        <div>
          <label htmlFor="linkUrl" className={label}>Link (where a click goes)</label>
          <input id="linkUrl" name="linkUrl" type="url" defaultValue={ad?.link_url ?? ''} placeholder="https://" required className={field} />
          {fe.linkUrl && <p className="mt-1 text-sm text-primary-dark">{fe.linkUrl}</p>}
        </div>
        <div>
          <label htmlFor="slot" className={label}>Slot</label>
          <select id="slot" name="slot" defaultValue={ad?.slot ?? 'sidebar'} className={field}>
            {AD_SLOT_INFO.map((s) => (
              <option key={s.slot} value={s.slot}>{s.name} · {s.size}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="banner" className={label}>Banner image {ad ? '(leave empty to keep current)' : ''}</label>
          <input id="banner" name="banner" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={`${field} py-2`} />
          {(uploadError || fe.imagePath) && <p className="mt-1 text-sm text-primary-dark">{uploadError ?? fe.imagePath}</p>}
        </div>
        <div>
          <label htmlFor="startsAt" className={label}>Starts</label>
          <input id="startsAt" name="startsAt" type="date" defaultValue={ad?.starts_at ?? new Date().toISOString().slice(0, 10)} required className={field} />
          {fe.startsAt && <p className="mt-1 text-sm text-primary-dark">{fe.startsAt}</p>}
        </div>
        <div>
          <label htmlFor="endsAt" className={label}>Ends (inclusive)</label>
          <input id="endsAt" name="endsAt" type="date" defaultValue={ad?.ends_at ?? ''} required className={field} />
          {fe.endsAt && <p className="mt-1 text-sm text-primary-dark">{fe.endsAt}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" value="true" defaultChecked={ad ? ad.is_active : true} className="accent-accent" /> Active (switch off to pause without deleting)
      </label>
      <button type="submit" disabled={pending || uploading} className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {uploading ? 'Uploading banner…' : pending ? 'Saving…' : ad ? 'Save ad' : 'Create ad'}
      </button>
    </form>
  )
}
