'use client'

import { useActionState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { submitAdRequest } from './actions'
import type { FormState } from '@/lib/form-state'
import type { AdSlot } from '@/lib/constants'

const field = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'
const label = 'block text-sm font-medium'

export default function AdRequestForm({ slots }: { slots: { slot: AdSlot; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitAdRequest, {})
  const fe = state.fieldErrors ?? {}

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-5" role="status">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
        <div>
          <p className="font-semibold text-emerald-900">Thanks! We&apos;ll be in touch within two working days.</p>
          <p className="text-sm text-emerald-900/80">We&apos;ll confirm the slot, dates and price by email or WhatsApp.</p>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <p role="alert" className="rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>Your name</label>
          <input id="name" name="name" required className={field} />
          {fe.name && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.name}</p>}
        </div>
        <div>
          <label htmlFor="business" className={label}>Business (optional)</label>
          <input id="business" name="business" className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required className={field} />
          {fe.email && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone / WhatsApp (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="03 123 456" className={field} />
          {fe.phone && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="slot" className={label}>Preferred slot</label>
          <select id="slot" name="slot" required defaultValue="" className={field}>
            <option value="" disabled>Choose a slot</option>
            {slots.map((s) => (
              <option key={s.slot} value={s.slot}>{s.name}</option>
            ))}
          </select>
          {fe.slot && <p role="alert" className="mt-1 text-sm text-primary-dark">{fe.slot}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={label}>Message</label>
          <textarea id="message" name="message" rows={4} maxLength={1000} placeholder="What would you like to promote, and roughly when?" className={`${field} py-2`} />
        </div>
      </div>
      {/* Honeypot: real people never see or fill this. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website_url">Website</label>
        <input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-card bg-primary px-6 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? 'Sending…' : 'Send request'}
      </button>
    </form>
  )
}
