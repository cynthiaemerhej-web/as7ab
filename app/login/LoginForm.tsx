'use client'

import { useActionState } from 'react'
import { sendMagicLink, signInWithGoogle, type LoginState } from './actions'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {})

  if (state.ok) {
    return (
      <div className="mt-6 rounded-card border border-accent/30 bg-accent/5 p-4 text-sm" role="status">
        <p className="font-semibold text-accent-dark">Check your inbox</p>
        <p className="mt-1 text-ink">
          We sent a sign-in link to <span className="font-medium">{state.email}</span>. The link works for Gmail, Hotmail
          and any other email. If you don&apos;t see it, check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-5">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-card border border-line bg-white px-4 font-semibold text-ink shadow-sm transition hover:bg-surface"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm font-medium" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@hotmail.com"
          className="min-h-12 w-full rounded-card border border-line bg-white px-4 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        {state.error && (
          <p role="alert" className="text-sm text-primary-dark">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-card bg-primary px-4 font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Send me a sign-in link'}
        </button>
        <p className="text-xs text-muted">No password needed. We email you a link that signs you in.</p>
      </form>
    </div>
  )
}
