import Link from 'next/link'
import CategoryIcon from './CategoryIcon'

export default function CategoryTile({ slug, name, icon }: { slug: string; name: string; icon: string }) {
  return (
    <Link
      href={`/c/${slug}`}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-card bg-card p-3 text-center shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:ring-accent"
    >
      <span className="rounded-full bg-accent/10 p-2.5 text-accent-dark">
        <CategoryIcon name={icon} />
      </span>
      <span className="text-sm font-semibold leading-tight">{name}</span>
    </Link>
  )
}
