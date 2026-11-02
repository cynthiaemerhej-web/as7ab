import type { Sb } from './photos'

export type CategoryItem = { id: number; slug: string; name: string; icon: string; sort_order: number; is_active: boolean }

export async function getActiveCategories(sb: Sb): Promise<CategoryItem[]> {
  const { data, error } = await sb.from('categories').select('*').eq('is_active', true).order('sort_order')
  if (error) throw error
  return data
}

export async function getCategoryBySlug(sb: Sb, slug: string): Promise<CategoryItem | null> {
  const { data, error } = await sb.from('categories').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}
