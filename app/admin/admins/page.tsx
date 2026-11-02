import type { Metadata } from 'next'
import AdminsManager from '@/components/admin/AdminsManager'
import { requireAdmin } from '@/lib/auth'
import { getAdmins } from '@/lib/data/admin'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Admins' }

export default async function AdminsPage() {
  const me = await requireAdmin()
  const sb = await createClient()
  const admins = await getAdmins(sb)
  return <AdminsManager admins={admins} meId={me.id} />
}
