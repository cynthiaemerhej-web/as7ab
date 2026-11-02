'use client'

import { useActionState } from 'react'
import { demoteAdmin, promoteAdmin } from '@/app/admin/actions'
import type { FormState } from '@/lib/form-state'

type Admin = { id: string; display_name: string; email: string }

export default function AdminsManager({ admins, meId }: { admins: Admin[]; meId: string }) {
  const [promote, promoteAction, promoting] = useActionState<FormState, FormData>(promoteAdmin, {})
  const [demote, demoteAction, demoting] = useActionState<FormState, FormData>(demoteAdmin, {})
  return (
    <div className="space-y-8">
      <section className="rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
        <h2 className="text-lg font-bold">Add an admin</h2>
        <p className="text-sm text-muted">The person must have signed in to As7ab at least once with this email.</p>
        <form action={promoteAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="email" type="email" required placeholder="friend@gmail.com" className="min-h-11 flex-1 rounded-card border border-line bg-white px-3 text-sm" />
          <button type="submit" disabled={promoting} className="min-h-11 rounded-card bg-accent px-4 text-sm font-semibold text-white disabled:opacity-60">Make admin</button>
        </form>
        {promote.error && <p role="alert" className="mt-2 text-sm text-primary-dark">{promote.error}</p>}
        {promote.ok && <p role="status" className="mt-2 text-sm text-emerald-800">{promote.message}</p>}
      </section>
      <section>
        <h2 className="text-lg font-bold">Current admins <span className="text-muted">({admins.length})</span></h2>
        {demote.error && <p role="alert" className="mt-2 text-sm text-primary-dark">{demote.error}</p>}
        {demote.ok && <p role="status" className="mt-2 text-sm text-emerald-800">{demote.message}</p>}
        <ul className="mt-3 divide-y divide-line rounded-card bg-card shadow-card ring-1 ring-line/60">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-semibold">{a.display_name} {a.id === meId && <span className="text-xs font-normal text-muted">(you)</span>}</p>
                <p className="text-sm text-muted">{a.email}</p>
              </div>
              {a.id !== meId && (
                <form action={demoteAction}>
                  <input type="hidden" name="email" value={a.email} />
                  <button type="submit" disabled={demoting} className="min-h-9 rounded-lg border border-line bg-white px-3 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60">Remove admin</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
