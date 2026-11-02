import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { AREAS } from '@/lib/areas'

test('the SQL area check lists exactly the same areas as lib/areas.ts', () => {
  const sql = readFileSync('supabase/migrations/0001_schema.sql', 'utf8')
  const m = sql.match(/area in \(([^)]+)\)/)
  expect(m, 'listings.area CHECK not found').toBeTruthy()
  const inSql = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  expect(inSql.sort()).toEqual([...AREAS].sort())
})
