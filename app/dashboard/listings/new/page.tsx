import type { Metadata } from 'next'
import Link from 'next/link'
import ListingForm from '@/components/ListingForm'
import { MAX_LISTINGS_PER_MEMBER } from '@/lib/constants'
import { requireMember } from '@/lib/auth'
import { getActiveCategories } from '@/lib/data/categories'
import { getProfile } from '@/lib/data/profiles'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Post a listing' }
export const dynamic = 'force-dynamic'

export default async function NewListingPage() {
  const me = await requireMember('/dashboard/listings/new')
  const sb = await createClient()
  const [categories, profile, { count }] = await Promise.all([
    getActiveCategories(sb),
    getProfile(sb, me.id),
    sb.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', me.id),
  ])

  if ((count ?? 0) >= MAX_LISTINGS_PER_MEMBER) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">You already have {MAX_LISTINGS_PER_MEMBER} listings</h1>
        <p className="mt-2 text-muted">Hide or delete one of your existing listings to add a new one.</p>
        <Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white">Go to my listings</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Post a listing</h1>
      <p className="mt-1 text-sm text-muted">Free, always. An admin checks new listings before they go live, usually within a day.</p>
      <div className="mt-6">
        <ListingForm
          mode="create"
          userId={me.id}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          defaults={{ phone: profile?.phone, whatsapp: profile?.whatsapp, email: profile?.contact_email }}
        />
      </div>
    </main>
  )
}
