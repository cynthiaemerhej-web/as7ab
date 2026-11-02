'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 text-center">
      <p className="text-6xl">🔌</p>
      <h1 className="mt-4 text-2xl font-bold">As7ab can&apos;t reach its database right now</h1>
      <p className="mt-2 text-muted">
        This usually clears up in a minute. If you run the site: check the Supabase project is not paused and the four environment variables in Vercel are correct.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="inline-flex min-h-11 items-center rounded-card bg-primary px-5 font-semibold text-white hover:bg-primary-dark">
          Try again
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-card border border-line bg-white px-5 font-semibold hover:bg-surface">
          Home
        </Link>
      </div>
    </main>
  )
}
