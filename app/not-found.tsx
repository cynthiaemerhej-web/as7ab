import Link from 'next/link'
import SearchBar from '@/components/SearchBar'

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">The listing may have been removed, or the link is wrong. Try a search instead.</p>
      <div className="mt-6">
        <SearchBar />
      </div>
      <Link href="/" className="mt-4 text-sm font-semibold text-accent-dark hover:underline">
        Back to the home page
      </Link>
    </main>
  )
}
