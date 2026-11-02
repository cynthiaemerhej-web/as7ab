import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, makeHref }: { page: number; totalPages: number; makeHref: (page: number) => string }) {
  if (totalPages <= 1) return null
  const btn = 'inline-flex min-h-11 items-center gap-1 rounded-card border border-line bg-white px-4 font-medium text-ink hover:bg-surface'
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={btn}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={makeHref(page + 1)} className={btn}>
          Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
