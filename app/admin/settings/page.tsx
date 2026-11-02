import type { Metadata } from 'next'
import SettingsForm from '@/components/admin/SettingsForm'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const settings = await getSettings(await createClient())
  return <SettingsForm settings={settings} />
}
