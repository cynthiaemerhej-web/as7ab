import Link from 'next/link'
import { ChevronDown, Plus, UserRound } from 'lucide-react'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { getCurrentProfile } from '@/lib/auth'

export default async function TopBar() {
  const profile = await getCurrentProfile()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <Logo />
        <div className="hidden flex-1 md:block">
          <SearchBar id="q-top" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/listings/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-card bg-primary px-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark sm:px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Post a listing</span>
            <span className="sm:hidden">Post</span>
          </Link>
          {profile ? (
            <details className="relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-card border border-line bg-white px-3 text-sm font-medium hover:bg-surface [&::-webkit-details-marker]:hidden">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden max-w-28 truncate sm:inline">{profile.display_name}</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-card bg-card p-1 shadow-lg ring-1 ring-line">
                <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">My listings</Link>
                <Link href="/dashboard/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface">My profile</Link>
                {profile.role === 'admin' && (
                  <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-accent-dark hover:bg-surface">Back office</Link>
                )}
                <form action="/auth/signout" method="post">
                  <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface">Sign out</button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-card border border-line bg-white px-3 text-sm font-medium hover:bg-surface sm:px-4">
              Sign in
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
        <SearchBar id="q-mobile" />
      </div>
    </header>
  )
}
