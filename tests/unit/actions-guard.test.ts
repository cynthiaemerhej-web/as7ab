import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

function exportedActions(src: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = []
  const re = /export async function (\w+)\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g
  for (const m of src.matchAll(re)) out.push({ name: m[1], body: m[2] })
  return out
}

describe('server actions check authorisation first', () => {
  test('dashboard actions start with requireMember()', () => {
    const src = readFileSync('app/dashboard/actions.ts', 'utf8')
    const fns = exportedActions(src)
    expect(fns.length).toBeGreaterThan(5)
    for (const f of fns) expect(f.body.trim().split('\n')[0], f.name).toMatch(/requireMember\(/)
  })

  test('admin actions start with requireAdmin()', () => {
    if (!existsSync('app/admin/actions.ts')) return // added in a later task
    const src = readFileSync('app/admin/actions.ts', 'utf8')
    const fns = exportedActions(src)
    expect(fns.length).toBeGreaterThan(5)
    for (const f of fns) expect(f.body.trim().split('\n')[0], f.name).toMatch(/requireAdmin\(/)
  })
})
