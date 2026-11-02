import type { Metadata } from 'next'
import { AD_SLOT_INFO } from '@/lib/ad-slots'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'
import AdRequestForm from './AdRequestForm'

export const metadata: Metadata = { title: 'Advertise' }
export const dynamic = 'force-dynamic'

export default async function AdvertisePage() {
  const settings = await getSettings(await createClient())
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Advertise on As7ab</h1>
      <p className="mt-3 text-lg text-muted">
        As7ab is free for everyone. Advertising is how we keep it that way. Put your business in front of people across Lebanon who are already looking for services and goods.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold">The four slots</h2>
        <div className="mt-3 overflow-hidden rounded-card bg-card shadow-card ring-1 ring-line/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Where it shows</th>
                <th className="px-4 py-3">Image size</th>
              </tr>
            </thead>
            <tbody>
              {AD_SLOT_INFO.map((s) => (
                <tr key={s.slot} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.where}</td>
                  <td className="px-4 py-3 text-muted">{s.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Prices depend on the slot and how long the ad runs. Tell us what you have in mind and we&apos;ll come back with a quote. You can also write to{' '}
          <a href={`mailto:${settings.contact_email}`} className="font-medium text-accent-dark hover:underline">{settings.contact_email}</a>.
        </p>
      </section>

      <section className="mt-10 rounded-card bg-card p-5 shadow-card ring-1 ring-line/60 sm:p-6">
        <h2 className="text-xl font-bold">Request a slot</h2>
        <div className="mt-4">
          <AdRequestForm slots={AD_SLOT_INFO.map((s) => ({ slot: s.slot, name: s.name }))} />
        </div>
      </section>
    </main>
  )
}
