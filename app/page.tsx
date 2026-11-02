import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AdSlot from '@/components/AdSlot'
import CategoryTile from '@/components/CategoryTile'
import ListingCard from '@/components/ListingCard'
import ListingGrid from '@/components/ListingGrid'
import SearchBar from '@/components/SearchBar'
import { getActiveCategories } from '@/lib/data/categories'
import { getLatestListings } from '@/lib/data/listings'
import { getSettings } from '@/lib/data/settings'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await createClient()
  const [settings, categories, latest] = await Promise.all([getSettings(sb), getActiveCategories(sb), getLatestListings(sb, 12)])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12">
      <section className="py-8 text-center sm:py-12">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{settings.tagline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Free to search, free to post. Cakes, tutors, plumbers, party supplies and more, offered by real people near you.
        </p>
        <div className="mx-auto mt-6 max-w-2xl">
          <SearchBar size="lg" id="q-hero" />
        </div>
      </section>

      <AdSlot slot="home_banner" className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <section aria-labelledby="cats">
            <h2 id="cats" className="mb-3 text-xl font-bold">Browse by category</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
              {categories.map((c) => (
                <CategoryTile key={c.slug} slug={c.slug} name={c.name} icon={c.icon} />
              ))}
            </div>
          </section>

          <section aria-labelledby="latest">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="latest" className="text-xl font-bold">Latest listings</h2>
              <Link href="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-dark hover:underline">
                See all <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {latest.length === 0 ? (
              <div className="rounded-card bg-card p-8 text-center shadow-card ring-1 ring-line/60">
                <p className="text-lg font-semibold">No listings yet</p>
                <p className="mt-1 text-sm text-muted">Be the first to post what you offer.</p>
                <Link href="/dashboard/listings/new" className="mt-4 inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white hover:bg-primary-dark">
                  Post a listing
                </Link>
              </div>
            ) : (
              <ListingGrid>
                {latest.map((l) => (
                  <ListingCard key={l.id} {...l} />
                ))}
              </ListingGrid>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <AdSlot slot="sidebar" />
          <div className="rounded-card bg-accent p-5 text-white shadow-card">
            <h2 className="text-lg font-bold">Offer something?</h2>
            <p className="mt-1 text-sm text-white/85">Post your service or goods for free. It takes a few minutes from your phone.</p>
            <Link href="/dashboard/listings/new" className="mt-4 inline-flex min-h-11 items-center rounded-card bg-white px-4 font-semibold text-accent-dark hover:bg-surface">
              Post a listing
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
