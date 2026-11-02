import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { decideRedirect } from '@/lib/auth-redirect'
import { supabaseEnv } from '@/lib/supabase/env'
import type { Database } from '@/lib/supabase/types'

/**
 * Refreshes the Supabase session cookie on every matched request and applies
 * the sign-in / admin redirects. Pages and server actions check authorisation
 * again themselves; this is the first line, not the only one.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, anonKey } = supabaseEnv()

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  let role: string | null = null
  if (user && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    role = data?.role ?? 'member'
  } else if (user) {
    role = 'member'
  }

  const target = decideRedirect(pathname, user ? { role: role ?? 'member' } : null, request.nextUrl.searchParams.get('next'))
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url))
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
}
