'use client'

import { useRef } from 'react'
import { AREAS } from '@/lib/areas'
import type { ParsedSearch } from '@/lib/search-params'

type Props = { categories: { slug: string; name: string }[]; current: ParsedSearch; lockCategory?: boolean }

const select = 'min-h-11 w-full rounded-card border border-line bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

export default function FiltersBar({ categories, current, lockCategory = false }: Props) {
  const form = useRef<HTMLFormElement>(null)
  const submit = () => form.current?.requestSubmit()
  return (
    <form ref={form} action="/search" className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Filters">
      <input type="hidden" name="q" value={current.q} />
      {lockCategory ? (
        <input type="hidden" name="category" value={current.category ?? ''} />
      ) : (
        <label className="sr-only" htmlFor="f-category">Category</label>
      )}
      {!lockCategory && (
        <select id="f-category" name="category" defaultValue={current.category ?? ''} onChange={submit} className={select}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      )}
      <label className="sr-only" htmlFor="f-type">Type</label>
      <select id="f-type" name="type" defaultValue={current.type ?? ''} onChange={submit} className={select}>
        <option value="">Services & goods</option>
        <option value="service">Services</option>
        <option value="goods">Goods</option>
      </select>
      <label className="sr-only" htmlFor="f-area">Area</label>
      <select id="f-area" name="area" defaultValue={current.area ?? ''} onChange={submit} className={select}>
        <option value="">All of Lebanon</option>
        {AREAS.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button type="submit" className="min-h-11 rounded-card border border-line bg-white px-3 text-sm font-semibold hover:bg-surface">
        Apply filters
      </button>
    </form>
  )
}
