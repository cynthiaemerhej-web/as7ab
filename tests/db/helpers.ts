import { Client } from 'pg'

export type Db = Client

export async function connect(): Promise<Db> {
  const client = process.env.DATABASE_URL
    ? new Client({ connectionString: process.env.DATABASE_URL })
    : new Client({
        host: process.env.PGHOST ?? '/tmp/as7ab-pg',
        port: Number(process.env.PGPORT ?? 54329),
        user: process.env.PGUSER ?? 'postgres',
        database: process.env.PGDATABASE ?? 'as7ab_test',
      })
  await client.connect()
  return client
}

/**
 * Run `cb` the way PostgREST would for this caller: as the `anon` role when
 * userId is null, otherwise as `authenticated` with a JWT whose sub is the user.
 * Effects are committed so multi-step scenarios can build on each other.
 */
export async function as<T>(db: Db, userId: string | null, cb: (db: Db) => Promise<T>): Promise<T> {
  await db.query('begin')
  try {
    if (userId) {
      await db.query('set local role authenticated')
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: userId, role: 'authenticated' }),
      ])
    } else {
      await db.query('set local role anon')
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ role: 'anon' })])
    }
    const result = await cb(db)
    await db.query('commit')
    return result
  } catch (e) {
    await db.query('rollback')
    throw e
  }
}

export async function createUser(db: Db, opts: { email: string; meta?: Record<string, unknown> }): Promise<string> {
  const r = await db.query<{ id: string }>(
    'insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id',
    [opts.email, JSON.stringify(opts.meta ?? {})],
  )
  return r.rows[0].id
}

export const LISTING = {
  title: 'Birthday supplies',
  description: 'Balloons, banners, candles and themed tableware for kids parties in Metn.',
  type: 'goods',
  area: 'Metn',
}

export async function insertListing(
  db: Db,
  ownerId: string,
  categoryId: number,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const row = { ...LISTING, ...overrides }
  const r = await as(db, ownerId, (c) =>
    c.query<{ id: string }>(
      `insert into listings (owner_id, slug, title, description, category_id, type, area, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [
        ownerId,
        `slug-${Math.random().toString(36).slice(2, 10)}`,
        row.title,
        row.description,
        categoryId,
        row.type,
        row.area,
        (overrides.status as string | undefined) ?? 'pending',
      ],
    ),
  )
  return r.rows[0].id
}
