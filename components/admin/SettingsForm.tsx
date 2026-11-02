'use client'

import { useActionState } from 'react'
import { saveSettings } from '@/app/admin/actions'
import type { SiteSettings } from '@/lib/data/settings'
import type { FormState } from '@/lib/form-state'

const field = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'
const label = 'block text-sm font-medium'

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {})
  const fe = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && <p role="alert" className="rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{state.message}</p>}

      <section className="space-y-4 rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
        <h2 className="text-lg font-bold">Site text</h2>
        <div>
          <label htmlFor="tagline" className={label}>Tagline (home page headline and footer)</label>
          <input id="tagline" name="tagline" defaultValue={settings.tagline} maxLength={120} className={field} />
          {fe.tagline && <p className="mt-1 text-sm text-primary-dark">{fe.tagline}</p>}
        </div>
        <div>
          <label htmlFor="contact_email" className={label}>Contact email (footer, Advertise page, “Report listing”)</label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={settings.contact_email} className={field} />
          {fe.contact_email && <p className="mt-1 text-sm text-primary-dark">{fe.contact_email}</p>}
        </div>
        <div>
          <label htmlFor="about_text" className={label}>About page text</label>
          <textarea id="about_text" name="about_text" rows={6} defaultValue={settings.about_text} maxLength={5000} className={`${field} py-2`} />
          <p className="mt-1 text-xs text-muted">Leave an empty line between paragraphs.</p>
        </div>
        <div>
          <label htmlFor="terms_text" className={label}>Terms page text</label>
          <textarea id="terms_text" name="terms_text" rows={8} defaultValue={settings.terms_text} maxLength={5000} className={`${field} py-2`} />
        </div>
      </section>

      <section className="space-y-4 rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
        <h2 className="text-lg font-bold">Announcement banner</h2>
        <p className="text-sm text-muted">A one-line notice shown under the top bar on every page. Useful for holidays or news.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="announcement_enabled" value="true" defaultChecked={settings.announcement_enabled} className="accent-accent" /> Show the announcement
        </label>
        <div>
          <label htmlFor="announcement_text" className={label}>Announcement text</label>
          <input id="announcement_text" name="announcement_text" defaultValue={settings.announcement_text} maxLength={200} className={field} />
          {fe.announcement_text && <p className="mt-1 text-sm text-primary-dark">{fe.announcement_text}</p>}
        </div>
      </section>

      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center rounded-card bg-primary px-6 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
