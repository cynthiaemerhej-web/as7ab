import { LISTING_TYPES, type ListingType } from './constants'
import { isArea, type Area } from './areas'

export type ParsedSearch = {
  q: string
  category: string | null
  type: ListingType | null
  area: Area | null
  page: number
}

type Raw = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

export function parseSearchParams(raw: Raw): ParsedSearch {
  const q = first(raw.q).trim().slice(0, 100)
  const category = first(raw.category).trim() || null
  const typeRaw = first(raw.type)
  const type = (LISTING_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as ListingType) : null
  const areaRaw = first(raw.area)
  const area = isArea(areaRaw) ? areaRaw : null
  const pageNum = Number.parseInt(first(raw.page), 10)
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1
  return { q, category, type, area, page }
}
