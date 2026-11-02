import type { Metadata } from 'next'
import Prose from '@/components/Prose'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'About' }
export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const sb = await createClient()
  const settings = await getSettings(sb)
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">About As7ab</h1>
      <Prose text={settings.about_text} className="mt-6" />
      <p className="mt-8 text-sm text-muted">
        Questions? Write to <a href={`mailto:${settings.contact_email}`} className="font-medium text-accent-dark hover:underline">{settings.contact_email}</a>.
      </p>
    </main>
  )
}
