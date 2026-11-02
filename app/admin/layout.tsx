import type { Metadata } from 'next'
import AdminNav from '@/components/AdminNav'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: { default: 'Back office', template: '%s · Back office · As7ab' } }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireAdmin()
  const sb = await createClient()
  const { count } = await sb.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Back office</h1>
        <span className="text-xs text-muted">Admins only</span>
      </div>
      <AdminNav pendingCount={count ?? 0} />
      <div className="mt-6">{children}</div>
    </main>
  )
}
