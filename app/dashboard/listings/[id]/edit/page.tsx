import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListingForm from '@/components/ListingForm'
import StatusBadge from '@/components/StatusBadge'
import { requireMember } from '@/lib/auth'
import { getActiveCategories } from '@/lib/data/categories'
import { getMyListing } from '@/lib/data/listings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Edit listing' }
export const dynamic = 'force-dynamic'

export default async function EditListingPage(props: PageProps<'/dashboard/listings/[id]/edit'>) {
  const { id } = await props.params
  const me = await requireMember(`/dashboard/listings/${id}/edit`)
  const sb = await createClient()
  const [listing, categories] = await Promise.all([getMyListing(sb, id), getActiveCategories(sb)])
  if (!listing || listing.owner_id !== me.id) notFound()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Edit listing</h1>
        <StatusBadge status={listing.status} needsReview={listing.needs_review} />
      </div>
      {listing.status === 'rejected' && listing.rejection_reason && (
        <p className="mt-3 rounded-card border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Rejected: {listing.rejection_reason}. Fix it here, then press Resubmit on your listings page.
        </p>
      )}
      <div className="mt-6">
        <ListingForm
          mode="edit"
          listingId={listing.id}
          userId={me.id}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          defaults={{
            title: listing.title,
            description: listing.description,
            categoryId: listing.category_id,
            type: listing.type,
            area: listing.area,
            phone: listing.phone,
            whatsapp: listing.whatsapp,
            email: listing.email,
            instagram: listing.instagram,
            website: listing.website,
          }}
          initialPhotos={listing.photos.map((p) => ({ id: p.id, url: p.url }))}
        />
      </div>
    </main>
  )
}
