import type { Metadata } from 'next'
import Prose from '@/components/Prose'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Terms of use' }
export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const sb = await createClient()
  const settings = await getSettings(sb)
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Terms of use</h1>
      <Prose text={settings.terms_text} className="mt-6" />
    </main>
  )
}
