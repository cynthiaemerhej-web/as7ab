import type { Metadata } from 'next'
import Link from 'next/link'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import Pagination from '@/components/Pagination'
import StatusBadge from '@/components/StatusBadge'
import { LISTING_STATUSES } from '@/lib/constants'
import { getAllListings } from '@/lib/data/admin'
import { createClient } from '@/lib/supabase/server'
import { approveListing, deleteListingAsAdmin, hideListing } from '../actions'

export const metadata: Metadata = { title: 'All listings' }

const small = 'inline-flex min-h-9 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-surface'

export default async function AdminListingsPage(props: PageProps<'/admin/listings'>) {
  const sp = await props.searchParams
  const status = typeof sp.status === 'string' && (LISTING_STATUSES as readonly string[]).includes(sp.status) ? sp.status : null
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : null
  const page = Math.max(1, Number.parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1)
  const sb = await createClient()
  const { items, total, totalPages } = await getAllListings(sb, { status, q, page })
  const href = (p: number) => {
    const u = new URLSearchParams()
    if (status) u.set('status', status)
    if (q) u.set('q', q)
    if (p > 1) u.set('page', String(p))
    return `/admin/listings${u.size ? `?${u}` : ''}`
  }

  return (
    <div>
      <form className="flex flex-wrap gap-2" action="/admin/listings">
        <input name="q" defaultValue={q ?? ''} placeholder="Search titles…" className="min-h-11 flex-1 rounded-card border border-line bg-white px-3 text-sm" />
        <select name="status" defaultValue={status ?? ''} className="min-h-11 rounded-card border border-line bg-white px-3 text-sm">
          <option value="">All statuses</option>
          {LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-card bg-accent px-4 text-sm font-semibold text-white">Filter</button>
      </form>
      <p className="mt-3 text-sm text-muted">{total} listing{total === 1 ? '' : 's'}</p>
      <ul className="mt-3 divide-y divide-line rounded-card bg-card shadow-card ring-1 ring-line/60">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/l/${r.slug}`} className="truncate font-semibold hover:underline">{r.title}</Link>
                <StatusBadge status={r.status} needsReview={r.needs_review} />
              </div>
              <p className="text-xs text-muted">{r.categoryName} · {r.area} · {r.ownerName} · {r.views} views</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.status !== 'approved' && (
                <form action={approveListing}><input type="hidden" name="id" value={r.id} /><button className={small}>Approve</button></form>
              )}
              {r.status === 'approved' && (
                <form action={hideListing}><input type="hidden" name="id" value={r.id} /><button className={small}>Hide</button></form>
              )}
              <form action={deleteListingAsAdmin}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmSubmit message={`Delete “${r.title}” permanently?`} className={`${small} text-rose-700`}>Delete</ConfirmSubmit>
              </form>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="p-6 text-center text-sm text-muted">No listings match.</li>}
      </ul>
      <Pagination page={page} totalPages={totalPages} makeHref={href} />
    </div>
  )
}
