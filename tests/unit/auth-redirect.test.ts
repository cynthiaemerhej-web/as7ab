import { expect, test } from 'vitest'
import { decideRedirect } from '@/lib/auth-redirect'

test.each([
  ['/dashboard', null, '/login?next=%2Fdashboard'],
  ['/dashboard/listings/new', null, '/login?next=%2Fdashboard%2Flistings%2Fnew'],
  ['/admin/ads', null, '/login?next=%2Fadmin%2Fads'],
  ['/admin', { role: 'member' }, '/'],
  ['/admin', { role: 'admin' }, null],
  ['/dashboard', { role: 'member' }, null],
  ['/login', { role: 'member' }, '/dashboard'],
  ['/login', null, null],
  ['/search', null, null],
  ['/administrator', null, null],
])('%s with %o → %s', (p, u, out) => expect(decideRedirect(p, u as { role: string } | null)).toBe(out))

import { safeNextPath } from '@/lib/auth-redirect'
test.each([
  ['/dashboard', '/dashboard'],
  ['/admin/ads?x=1', '/admin/ads?x=1'],
  [null, '/dashboard'],
  ['', '/dashboard'],
  ['https://evil.com', '/dashboard'],
  ['//evil.com', '/dashboard'],
  ['/\\evil.com', '/dashboard'],
])('safeNextPath(%s) → %s', (raw, out) => expect(safeNextPath(raw)).toBe(out))
