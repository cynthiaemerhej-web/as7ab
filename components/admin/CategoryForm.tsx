'use client'

import { useActionState } from 'react'
import { saveCategory } from '@/app/admin/actions'
import { CATEGORY_ICON_NAMES } from '@/components/CategoryIcon'
import type { FormState } from '@/lib/form-state'
import type { CategoryRow } from '@/lib/supabase/types'

const field = 'min-h-10 rounded-lg border border-line bg-white px-3 text-sm'

export default function CategoryForm({ category }: { category?: CategoryRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, {})
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <label className="flex flex-col text-xs text-muted">
        Name
        <input name="name" defaultValue={category?.name ?? ''} required minLength={2} maxLength={40} className={`${field} w-44`} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        Icon
        <select name="icon" defaultValue={category?.icon ?? 'shapes'} className={field}>
          {CATEGORY_ICON_NAMES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-muted">
        Order
        <input name="sortOrder" type="number" min={0} max={1000} defaultValue={category?.sort_order ?? 100} className={`${field} w-20`} />
      </label>
      <button type="submit" disabled={pending} className="min-h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-white disabled:opacity-60">
        {category ? 'Save' : 'Add category'}
      </button>
      {state.error && <p role="alert" className="w-full text-sm text-primary-dark">{state.error}</p>}
      {state.ok && <p role="status" className="w-full text-sm text-emerald-800">{state.message}</p>}
    </form>
  )
}
