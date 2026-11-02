import type { Metadata } from 'next'
import Logo from '@/components/Logo'
import { SITE_NAME } from '@/lib/constants'
import { safeNextPath } from '@/lib/auth-redirect'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage(props: PageProps<'/login'>) {
  const sp = await props.searchParams
  const next = safeNextPath(typeof sp.next === 'string' ? sp.next : null)
  const error = typeof sp.error === 'string' ? sp.error : null
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-card bg-card p-6 shadow-card sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">Sign in to {SITE_NAME}</h1>
        <p className="mt-1 text-sm text-muted">Free to join. Post what you offer, or save your favourites.</p>
        {error === 'link' && (
          <p role="alert" className="mt-4 rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">
            That link has expired. Send a new one below.
          </p>
        )}
        {error === 'google' && (
          <p role="alert" className="mt-4 rounded-card border border-primary/30 bg-primary/5 p-3 text-sm text-primary-dark">
            Google sign-in is not available right now. Use the email link instead.
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  )
}
