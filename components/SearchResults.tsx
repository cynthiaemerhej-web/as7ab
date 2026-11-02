import AdSlot from './AdSlot'
import FiltersBar from './FiltersBar'
import ListingCard from './ListingCard'
import ListingGrid from './ListingGrid'
import Pagination from './Pagination'
import { INLINE_AD_EVERY } from '@/lib/constants'
import { getActiveCategories } from '@/lib/data/categories'
import { searchListings } from '@/lib/data/listings'
import { interleaveAds, isAdMarker } from '@/lib/interleave'
import type { ParsedSearch } from '@/lib/search-params'
import { createClient } from '@/lib/supabase/server'

type Props = { params: ParsedSearch; lockCategory?: boolean }

export function searchHref(p: ParsedSearch, page: number): string {
  const sp = new URLSearchParams()
  if (p.q) sp.set('q', p.q)
  if (p.category) sp.set('category', p.category)
  if (p.type) sp.set('type', p.type)
  if (p.area) sp.set('area', p.area)
  if (page > 1) sp.set('page', String(page))
  const qs = sp.toString()
  return `/search${qs ? `?${qs}` : ''}`
}

export default async function SearchResults({ params, lockCategory = false }: Props) {
  const sb = await createClient()
  const categories = await getActiveCategories(sb)
  const category = params.category ? categories.find((c) => c.slug === params.category) ?? null : null
  const { items, total, totalPages } = await searchListings(sb, params, category?.id ?? null)
  const mixed = interleaveAds(items, INLINE_AD_EVERY)

  return (
    <div className="space-y-4">
      <FiltersBar categories={categories} current={params} lockCategory={lockCategory} />
      <p className="text-sm text-muted" aria-live="polite">
        {total === 0 ? 'No listings found' : `${total} listing${total === 1 ? '' : 's'}`}
        {params.q && (
          <>
            {' '}
            for <span className="font-semibold text-ink">“{params.q}”</span>
          </>
        )}
      </p>
      {items.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card ring-1 ring-line/60">
          <p className="text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">Try fewer filters or a different word. Or be the first to post in this category.</p>
        </div>
      ) : (
        <ListingGrid>
          {mixed.map((entry, i) =>
            isAdMarker(entry) ? <AdSlot key={`ad-${i}`} slot="search_inline" /> : <ListingCard key={entry.id} {...entry} />,
          )}
        </ListingGrid>
      )}
      <Pagination page={params.page} totalPages={totalPages} makeHref={(p) => searchHref(params, p)} />
    </div>
  )
}
