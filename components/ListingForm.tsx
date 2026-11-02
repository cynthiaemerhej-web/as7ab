'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import PhotoUploader from './PhotoUploader'
import { createListing, updateListing, type PhotoItem } from '@/app/dashboard/actions'
import { AREAS } from '@/lib/areas'
import type { FormState } from '@/lib/form-state'

export type ListingDefaults = {
  title?: string
  description?: string
  categoryId?: number | null
  type?: 'service' | 'goods'
  area?: string
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  instagram?: string | null
  website?: string | null
}

type Props = {
  mode: 'create' | 'edit'
  listingId?: string
  userId: string
  categories: { id: number; name: string }[]
  defaults: ListingDefaults
  initialPhotos?: PhotoItem[]
}

const field = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'
const label = 'block text-sm font-medium'

function Err({ msg }: { msg?: string }) {
  return msg ? (
    <p role="alert" className="mt-1 text-sm text-primary-dark">
      {msg}
    </p>
  ) : null
}

export default function ListingForm({ mode, listingId, userId, categories, defaults, initialPhotos = [] }: Props) {
  const action = mode === 'edit' && listingId ? updateListing.bind(null, listingId) : createListing
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {})
  const [description, setDescription] = useState(defaults.description ?? '')
  const [sameAsPhone, setSameAsPhone] = useState(!defaults.whatsapp || defaults.whatsapp === defaults.phone)
  const fe = state.fieldErrors ?? {}

  if (mode === 'create' && state.ok && state.listingId) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-4" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="font-semibold text-emerald-900">Your listing is saved and waiting for review</p>
            <p className="text-sm text-emerald-900/80">An admin will check it soon. Meanwhile, add photos so it stands out.</p>
          </div>
        </div>
        <section>
          <h2 className="text-lg font-bold">Now add up to 6 photos</h2>
          <div className="mt-3">
            <PhotoUploader listingId={state.listingId} userId={userId} initial={[]} />
          </div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white hover:bg-primary-dark">
            Done
          </Link>
          <Link href={`/l/${state.slug}`} className="inline-flex min-h-11 items-center rounded-card border border-line bg-white px-5 font-semibold hover:bg-surface">
            Preview listing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5" noValidate>
        {state.error && (
          <p role="alert" className="rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {state.message}
          </p>
        )}

        <div>
          <label htmlFor="title" className={label}>Title</label>
          <input id="title" name="title" defaultValue={defaults.title} maxLength={80} required placeholder="e.g. Birthday party supplies & balloons" className={field} />
          <Err msg={fe.title} />
        </div>

        <fieldset>
          <legend className={label}>What are you offering?</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(['service', 'goods'] as const).map((t) => (
              <label key={t} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-line bg-white px-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent/30">
                <input type="radio" name="type" value={t} defaultChecked={(defaults.type ?? 'service') === t} className="accent-accent" />
                <span className="font-medium">{t === 'service' ? 'A service' : 'Goods'}</span>
                <span className="text-xs text-muted">{t === 'service' ? 'tutoring, repairs…' : 'cakes, supplies…'}</span>
              </label>
            ))}
          </div>
          <Err msg={fe.type} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className={label}>Category</label>
            <select id="categoryId" name="categoryId" defaultValue={defaults.categoryId ?? ''} required className={field}>
              <option value="" disabled>Pick a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Err msg={fe.categoryId} />
          </div>
          <div>
            <label htmlFor="area" className={label}>Area</label>
            <select id="area" name="area" defaultValue={defaults.area ?? ''} required className={field}>
              <option value="" disabled>Where are you based?</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <Err msg={fe.area} />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={label}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={6}
            maxLength={2000}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you offer, prices if you like, delivery areas, how to order…"
            className={`${field} min-h-36 py-2`}
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <Err msg={fe.description} />
            <span className="ml-auto">{description.length}/2000</span>
          </div>
        </div>

        <fieldset className="space-y-4 rounded-card border border-line bg-card p-4">
          <legend className="px-1 text-sm font-semibold">How people can reach you</legend>
          <p className="text-xs text-muted">Add at least one. Only what you fill in is shown publicly.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={label}>Phone</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaults.phone ?? ''} placeholder="03 123 456" className={field} />
              <Err msg={fe.phone} />
            </div>
            <div>
              <label htmlFor="whatsapp" className={label}>WhatsApp</label>
              <label className="mt-1 flex items-center gap-2 text-sm">
                <input type="checkbox" name="whatsappSame" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} className="accent-accent" />
                Same as phone
              </label>
              {!sameAsPhone && (
                <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={defaults.whatsapp ?? ''} placeholder="71 123 456" className={`${field} mt-2`} />
              )}
              <Err msg={fe.whatsapp} />
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" name="email" type="email" defaultValue={defaults.email ?? ''} placeholder="you@example.com" className={field} />
              <Err msg={fe.email} />
            </div>
            <div>
              <label htmlFor="instagram" className={label}>Instagram</label>
              <input id="instagram" name="instagram" defaultValue={defaults.instagram ?? ''} placeholder="@yourpage or link" className={field} />
              <Err msg={fe.instagram} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="website" className={label}>Website (optional)</label>
              <input id="website" name="website" type="url" defaultValue={defaults.website ?? ''} placeholder="https://" className={field} />
              <Err msg={fe.website} />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-card bg-primary px-6 font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60">
            {pending ? 'Saving…' : mode === 'create' ? 'Save and add photos' : 'Save changes'}
          </button>
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-ink">Cancel</Link>
        </div>
      </form>

      {mode === 'edit' && listingId && (
        <section>
          <h2 className="text-lg font-bold">Photos</h2>
          <div className="mt-3">
            <PhotoUploader listingId={listingId} userId={userId} initial={initialPhotos} />
          </div>
        </section>
      )}
    </div>
  )
}
