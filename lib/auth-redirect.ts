/** Pure routing decisions shared by proxy.ts and the auth pages. */

export type RedirectUser = { role: string } | null

export function decideRedirect(pathname: string, user: RedirectUser): string | null {
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  if ((isDashboard || isAdmin) && !user) return `/login?next=${encodeURIComponent(pathname)}`
  if (isAdmin && user && user.role !== 'admin') return '/'
  if (pathname === '/login' && user) return '/dashboard'
  return null
}

/** Only allow same-site relative paths as a post-login destination. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard'
  return raw
}
