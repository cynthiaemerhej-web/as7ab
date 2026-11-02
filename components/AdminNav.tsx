'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/admin', label: 'Queue' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/ads', label: 'Ads' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/admins', label: 'Admins' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminNav({ pendingCount }: { pendingCount: number }) {
  const path = usePathname()
  return (
    <nav aria-label="Back office" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 border-b border-line">
        {items.map((it) => {
          const active = it.href === '/admin' ? path === '/admin' : path.startsWith(it.href)
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${active ? 'border-primary text-primary-dark' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {it.label}
                {it.href === '/admin' && pendingCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{pendingCount}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
