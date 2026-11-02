import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, Flag, MapPin } from 'lucide-react'
import AdSlot from '@/components/AdSlot'
import Badge from '@/components/Badge'
import ContactButtons from '@/components/ContactButtons'
import PhotoGallery from '@/components/PhotoGallery'
import { getListingBySlug, incrementViews } from '@/lib/data/listings'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: PageProps<'/l/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const sb = await createClient()
  const l = await getListingBySlug(sb, slug)
  if (!l) return { title: 'Listing' }
  const description = l.description.length > 160 ? `${l.description.slice(0, 157)}…` : l.description
  return {
    title: l.title,
    description,
    openGraph: { title: l.title, description, images: l.photos[0] ? [{ url: l.photos[0].url }] : undefined },
  }
}

export default async function ListingPage(props: PageProps<'/l/[slug]'>) {
  const { slug } = await props.params
  const sb = await createClient()
  const [listing, settings] = await Promise.all([getListingBySlug(sb, slug), getSettings(sb)])
  if (!listing) notFound()
  if (listing.status === 'approved') void incrementViews(sb, listing.id)

  const posted = new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const reportHref = `mailto:${settings.contact_email}?subject=${encodeURIComponent(`Report listing: ${listing.title} (${listing.slug})`)}`

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/search" className="hover:text-accent-dark">Listings</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/c/${listing.category.slug}`} className="hover:text-accent-dark">{listing.category.name}</Link>
      </nav>

      {listing.status !== 'approved' && (
        <p role="status" className="mt-3 rounded-card border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This listing is not public yet. Only you and the admins can see this preview.
        </p>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          <PhotoGallery photos={listing.photos} />
          <section className="mt-6">
            <h2 className="text-lg font-bold">About</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/90">{listing.description}</p>
          </section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
            <div className="flex flex-wrap gap-2">
              <Badge variant={listing.type === 'service' ? 'accent' : 'primary'}>{listing.type === 'service' ? 'Service' : 'Goods'}</Badge>
              <Badge variant="neutral">
                <MapPin className="mr-1 h-3 w-3" aria-hidden="true" />
                {listing.area}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight">{listing.title}</h1>
            <p className="mt-2 text-sm text-muted">
              Posted by <span className="font-medium text-ink">{listing.ownerName}</span> · {posted}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {listing.views} views
            </p>
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Get in touch</h2>
              <ContactButtons {...listing.contact} />
            </div>
          </div>
          <a href={reportHref} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary-dark">
            <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Report this listing
          </a>
        </div>
      </div>

      <div className="mt-10">
        <AdSlot slot="listing_bottom" />
      </div>
    </main>
  )
}
