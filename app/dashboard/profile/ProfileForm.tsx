'use client'

import { useActionState } from 'react'
import { updateProfileAction } from '@/app/dashboard/actions'
import type { FormState } from '@/lib/form-state'

const field = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

type Defaults = { displayName: string; phone: string; whatsapp: string; contactEmail: string; accountEmail: string }

export default function ProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {})
  const fe = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <p role="alert" className="rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{state.message}</p>}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium">Name shown on your listings</label>
        <input id="displayName" name="displayName" defaultValue={defaults.displayName} maxLength={60} required className={field} />
        {fe.displayName && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.displayName}</p>}
      </div>
      <div>
        <p className="block text-sm font-medium">Sign-in email</p>
        <p className="mt-1 text-sm text-muted">{defaults.accountEmail} (used to sign in, never shown publicly)</p>
      </div>
      <fieldset className="space-y-4 rounded-card border border-line bg-card p-4">
        <legend className="px-1 text-sm font-semibold">Default contact details for new listings</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
            <input id="phone" name="phone" type="tel" defaultValue={defaults.phone} className={field} />
            {fe.phone && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.phone}</p>}
          </div>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" type="tel" defaultValue={defaults.whatsapp} className={field} />
            {fe.whatsapp && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.whatsapp}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contactEmail" className="block text-sm font-medium">Public contact email</label>
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={defaults.contactEmail} className={field} />
            {fe.contactEmail && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.contactEmail}</p>}
          </div>
        </div>
      </fieldset>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-card bg-primary px-6 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
