'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { approveListing, clearReviewFlag, hideListing, rejectListing } from '@/app/admin/actions'
import Badge from '@/components/Badge'
import ContactButtons from '@/components/ContactButtons'
import StatusBadge from '@/components/StatusBadge'
import type { AdminListingRow } from '@/lib/data/admin'
import type { FormState } from '@/lib/form-state'

const btn = 'inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold'

export default function ModerationCard({ row }: { row: AdminListingRow }) {
  const [rejecting, setRejecting] = useState(false)
  const [state, reject, pending] = useActionState<FormState, FormData>(rejectListing, {})
  return (
    <article className="rounded-card bg-card p-4 shadow-card ring-1 ring-line/60">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-surface">
          {row.photoUrl ? <Image src={row.photoUrl} alt="" fill sizes="112px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-muted">No photo</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{row.title}</h3>
            <StatusBadge status={row.status} needsReview={row.needs_review} />
            <Badge variant={row.type === 'service' ? 'accent' : 'primary'}>{row.type === 'service' ? 'Service' : 'Goods'}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {row.categoryName} · {row.area} · by {row.ownerName} · {new Date(row.created_at).toLocaleDateString('en-GB')}
          </p>
          <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-ink/90">{row.description}</p>
          <div className="mt-3">
            <ContactButtons {...row.contact} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Link href={`/l/${row.slug}`} target="_blank" className={`${btn} border border-line bg-white hover:bg-surface`}>Preview</Link>
        {row.needs_review && row.status !== 'pending' ? (
          // An edit on a live or member-hidden listing: clearing the flag keeps the member's own visibility choice.
          <form action={clearReviewFlag}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>Looks fine</button>
          </form>
        ) : (
          <form action={approveListing}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>Approve</button>
          </form>
        )}
        <button type="button" onClick={() => setRejecting((v) => !v)} className={`${btn} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}>
          Reject…
        </button>
        <form action={hideListing}>
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className={`${btn} border border-line bg-white text-muted hover:bg-surface`}>Hide</button>
        </form>
      </div>

      {rejecting && !state.ok && (
        <form action={reject} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="id" value={row.id} />
          <input
            name="reason"
            required
            minLength={3}
            maxLength={300}
            placeholder="Reason the member will see, e.g. “Please add a phone number or WhatsApp”"
            className="min-h-11 flex-1 rounded-lg border border-line bg-white px-3 text-sm"
          />
          <button type="submit" disabled={pending} className={`${btn} bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60`}>
            {pending ? 'Rejecting…' : 'Reject with reason'}
          </button>
          {state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
        </form>
      )}
    </article>
  )
}
