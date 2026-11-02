import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryIcon from '@/components/CategoryIcon'
import SearchResults from '@/components/SearchResults'
import { getCategoryBySlug } from '@/lib/data/categories'
import { parseSearchParams } from '@/lib/search-params'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: PageProps<'/c/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const sb = await createClient()
  const cat = await getCategoryBySlug(sb, slug)
  return { title: cat ? cat.name : 'Category' }
}

export default async function CategoryPage(props: PageProps<'/c/[slug]'>) {
  const { slug } = await props.params
  const sb = await createClient()
  const cat = await getCategoryBySlug(sb, slug)
  if (!cat || !cat.is_active) notFound()
  const params = { ...parseSearchParams(await props.searchParams), category: cat.slug }
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-accent/10 p-2.5 text-accent-dark">
          <CategoryIcon name={cat.icon} />
        </span>
        <h1 className="text-2xl font-bold">{cat.name}</h1>
      </div>
      <div className="mt-4">
        <SearchResults params={params} lockCategory />
      </div>
    </main>
  )
}
