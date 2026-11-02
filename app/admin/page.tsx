import type { Metadata } from 'next'
import ModerationCard from '@/components/admin/ModerationCard'
import { getQueue } from '@/lib/data/admin'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Queue' }

export default async function QueuePage() {
  const sb = await createClient()
  const { pending, flagged } = await getQueue(sb)
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-bold">Waiting for approval <span className="text-muted">({pending.length})</span></h2>
        {pending.length === 0 ? (
          <p className="mt-2 rounded-card bg-card p-6 text-center text-sm text-muted ring-1 ring-line/60">Nothing waiting. Nice.</p>
        ) : (
          <div className="mt-3 space-y-4">{pending.map((r) => <ModerationCard key={r.id} row={r} />)}</div>
        )}
      </section>
      <section>
        <h2 className="text-lg font-bold">Edited since approval <span className="text-muted">({flagged.length})</span></h2>
        <p className="text-sm text-muted">These stay live. Press “Looks fine” to clear the flag, or hide/reject if the edit is a problem.</p>
        {flagged.length === 0 ? (
          <p className="mt-2 rounded-card bg-card p-6 text-center text-sm text-muted ring-1 ring-line/60">No edits to re-check.</p>
        ) : (
          <div className="mt-3 space-y-4">{flagged.map((r) => <ModerationCard key={r.id} row={r} />)}</div>
        )}
      </section>
    </div>
  )
}
