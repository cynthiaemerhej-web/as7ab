import type { Metadata } from 'next'
import SearchBar from '@/components/SearchBar'
import SearchResults from '@/components/SearchResults'
import { parseSearchParams } from '@/lib/search-params'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: PageProps<'/search'>): Promise<Metadata> {
  const p = parseSearchParams(await props.searchParams)
  return { title: p.q ? `“${p.q}”` : 'Browse listings' }
}

export default async function SearchPage(props: PageProps<'/search'>) {
  const params = parseSearchParams(await props.searchParams)
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold">{params.q ? `Results for “${params.q}”` : 'Browse listings'}</h1>
      <div className="mt-3 md:hidden">
        <SearchBar defaultValue={params.q} />
      </div>
      <div className="mt-4">
        <SearchResults params={params} />
      </div>
    </main>
  )
}
