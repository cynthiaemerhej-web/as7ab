import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Image as ImageGlyph, Pencil, Plus } from 'lucide-react'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import StatusBadge from '@/components/StatusBadge'
import { MAX_LISTINGS_PER_MEMBER } from '@/lib/constants'
import { requireMember } from '@/lib/auth'
import { getMyListings } from '@/lib/data/listings'
import { createClient } from '@/lib/supabase/server'
import { changeListingStatus, deleteListing } from './actions'

export const metadata: Metadata = { title: 'My listings' }
export const dynamic = 'force-dynamic'

const smallBtn = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-surface'

export default async function DashboardPage() {
  const profile = await requireMember('/dashboard')
  const sb = await createClient()
  const listings = await getMyListings(sb, profile.id)
  const atCap = listings.length >= MAX_LISTINGS_PER_MEMBER

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My listings</h1>
          <p className="text-sm text-muted">
            Hi {profile.display_name}. {listings.length} of {MAX_LISTINGS_PER_MEMBER} listings used.
          </p>
        </div>
        {atCap ? (
          <p className="text-sm text-muted">Hide or delete a listing to add another.</p>
        ) : (
          <Link href="/dashboard/listings/new" className="inline-flex min-h-11 items-center gap-1.5 rounded-card bg-primary px-4 font-semibold text-white hover:bg-primary-dark">
            <Plus className="h-4 w-4" aria-hidden="true" /> New listing
          </Link>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-card bg-card p-10 text-center shadow-card ring-1 ring-line/60">
          <p className="text-lg font-semibold">You haven&apos;t posted anything yet</p>
          <p className="mt-1 text-sm text-muted">Tell people what you offer. It is free and takes a few minutes.</p>
          <Link href="/dashboard/listings/new" className="mt-5 inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white hover:bg-primary-dark">
            Post your first listing
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 rounded-card bg-card p-3 shadow-card ring-1 ring-line/60 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                {l.firstPhotoUrl ? (
                  <Image src={l.firstPhotoUrl} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-line"><ImageGlyph className="h-7 w-7" aria-hidden="true" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold">{l.title}</h2>
                  <StatusBadge status={l.status} needsReview={l.needs_review} />
                </div>
                {l.status === 'rejected' && l.rejection_reason && (
                  <p className="mt-1 text-sm text-rose-800">Reason: {l.rejection_reason}</p>
                )}
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {l.views} views · updated {new Date(l.updated_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/l/${l.slug}`} className={smallBtn}>View</Link>
                <Link href={`/dashboard/listings/${l.id}/edit`} className={smallBtn}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </Link>
                {l.status === 'approved' && (
                  <form action={changeListingStatus}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value="hidden" />
                    <button type="submit" className={smallBtn}>Hide</button>
                  </form>
                )}
                {l.status === 'hidden' && (
                  <form action={changeListingStatus}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className={smallBtn}>Unhide</button>
                  </form>
                )}
                {l.status === 'rejected' && (
                  <form action={changeListingStatus}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value="pending" />
                    <button type="submit" className={`${smallBtn} border-accent text-accent-dark`}>Resubmit</button>
                  </form>
                )}
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={l.id} />
                  <ConfirmSubmit message={`Delete “${l.title}”? This cannot be undone.`} className={`${smallBtn} text-rose-700 hover:bg-rose-50`}>
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
