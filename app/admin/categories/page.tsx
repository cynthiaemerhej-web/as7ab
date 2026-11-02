import type { Metadata } from 'next'
import CategoryForm from '@/components/admin/CategoryForm'
import Badge from '@/components/Badge'
import CategoryIcon from '@/components/CategoryIcon'
import { getAllCategories } from '@/lib/data/admin'
import { createClient } from '@/lib/supabase/server'
import { toggleCategory } from '../actions'

export const metadata: Metadata = { title: 'Categories' }

export default async function CategoriesPage() {
  const sb = await createClient()
  const categories = await getAllCategories(sb)
  return (
    <div className="space-y-8">
      <section className="rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
        <h2 className="text-lg font-bold">Add a category</h2>
        <p className="mb-3 text-sm text-muted">Lower order numbers show first. Hidden categories keep their listings but disappear from menus.</p>
        <CategoryForm />
      </section>
      <ul className="divide-y divide-line rounded-card bg-card shadow-card ring-1 ring-line/60">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <span className="flex items-center gap-2 lg:w-56">
              <span className="rounded-full bg-accent/10 p-2 text-accent-dark"><CategoryIcon name={c.icon} className="h-5 w-5" /></span>
              <span className="font-semibold">{c.name}</span>
              {!c.is_active && <Badge variant="neutral">Hidden</Badge>}
            </span>
            <div className="flex-1"><CategoryForm category={c} /></div>
            <form action={toggleCategory}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="isActive" value={c.is_active ? 'false' : 'true'} />
              <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-surface">{c.is_active ? 'Hide' : 'Show'}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
