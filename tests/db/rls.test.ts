import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { as, connect, createUser, insertListing, type Db } from './helpers'

let db: Db
let alice: string
let bob: string
let admin: string
let catId: number

beforeAll(async () => {
  db = await connect()
  alice = await createUser(db, { email: 'alice@x.com', meta: { full_name: 'Alice' } })
  bob = await createUser(db, { email: 'bob@x.com' })
  admin = await createUser(db, { email: 'admin@x.com', meta: { name: 'Admin' } })
  await db.query(`update profiles set role = 'admin' where id = $1`, [admin])
  catId = (await db.query<{ id: number }>(`select id from categories where slug = 'parties-events'`)).rows[0].id
})

afterAll(async () => {
  await db.end()
})

describe('profiles', () => {
  test('profile auto-created; name from metadata or email local part', async () => {
    expect((await db.query('select display_name from profiles where id = $1', [alice])).rows[0].display_name).toBe('Alice')
    expect((await db.query('select display_name from profiles where id = $1', [bob])).rows[0].display_name).toBe('bob')
    expect((await db.query('select display_name from profiles where id = $1', [admin])).rows[0].display_name).toBe('Admin')
  })

  test('bob cannot read alice profile; public_profiles exposes name only', async () => {
    await db.query(`update profiles set phone = '+9613123456' where id = $1`, [alice])
    const r = await as(db, bob, (c) => c.query('select * from profiles where id = $1', [alice]))
    expect(r.rowCount).toBe(0)
    const pub = await as(db, null, (c) => c.query('select * from public_profiles where id = $1', [alice]))
    expect(pub.rows[0]).toEqual({ id: alice, display_name: 'Alice' })
    const own = await as(db, alice, (c) => c.query('select phone from profiles where id = $1', [alice]))
    expect(own.rows[0].phone).toBe('+9613123456')
  })

  test('member cannot change own role', async () => {
    await as(db, bob, (c) => c.query(`update profiles set role = 'admin', display_name = 'Bobby' where id = $1`, [bob]))
    const r = await db.query('select role, display_name from profiles where id = $1', [bob])
    expect(r.rows[0]).toEqual({ role: 'member', display_name: 'Bobby' })
  })
})

describe('listings', () => {
  let pendingId: string

  test('member insert is forced to pending even when claiming approved', async () => {
    pendingId = await insertListing(db, alice, catId, { status: 'approved' })
    const r = await db.query('select status, needs_review, views from listings where id = $1', [pendingId])
    expect(r.rows[0]).toEqual({ status: 'pending', needs_review: false, views: 0 })
  })

  test('anon sees only approved listings; owner sees own pending', async () => {
    expect((await as(db, null, (c) => c.query('select id from listings where id = $1', [pendingId]))).rowCount).toBe(0)
    expect((await as(db, alice, (c) => c.query('select id from listings where id = $1', [pendingId]))).rowCount).toBe(1)
    expect((await as(db, bob, (c) => c.query('select id from listings where id = $1', [pendingId]))).rowCount).toBe(0)
  })

  test('member cannot approve own listing', async () => {
    await as(db, alice, (c) => c.query(`update listings set status = 'approved' where id = $1`, [pendingId]))
    expect((await db.query('select status from listings where id = $1', [pendingId])).rows[0].status).toBe('pending')
  })

  test('admin approves; anon can now see it', async () => {
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = $1`, [pendingId]))
    expect((await as(db, null, (c) => c.query('select title from listings where id = $1', [pendingId]))).rowCount).toBe(1)
  })

  test('member can hide and unhide an approved listing', async () => {
    await as(db, alice, (c) => c.query(`update listings set status = 'hidden' where id = $1`, [pendingId]))
    expect((await db.query('select status from listings where id = $1', [pendingId])).rows[0].status).toBe('hidden')
    expect((await as(db, null, (c) => c.query('select id from listings where id = $1', [pendingId]))).rowCount).toBe(0)
    await as(db, alice, (c) => c.query(`update listings set status = 'approved' where id = $1`, [pendingId]))
    expect((await db.query('select status from listings where id = $1', [pendingId])).rows[0].status).toBe('approved')
  })

  test('editing approved content sets needs_review; admin can clear it', async () => {
    await as(db, alice, (c) => c.query(`update listings set description = $2 where id = $1`, [pendingId, 'Updated description with enough characters in it.']))
    let r = await db.query('select needs_review, status from listings where id = $1', [pendingId])
    expect(r.rows[0]).toEqual({ needs_review: true, status: 'approved' })
    await as(db, alice, (c) => c.query(`update listings set needs_review = false where id = $1`, [pendingId]))
    expect((await db.query('select needs_review from listings where id = $1', [pendingId])).rows[0].needs_review).toBe(true)
    await as(db, admin, (c) => c.query(`update listings set needs_review = false where id = $1`, [pendingId]))
    r = await db.query('select needs_review from listings where id = $1', [pendingId])
    expect(r.rows[0].needs_review).toBe(false)
  })

  test('member cannot change owner_id, views or rejection_reason', async () => {
    await as(db, alice, (c) =>
      c.query(`update listings set owner_id = $2, views = 999, rejection_reason = 'x' where id = $1`, [pendingId, bob]),
    )
    const r = await db.query('select owner_id, views, rejection_reason from listings where id = $1', [pendingId])
    expect(r.rows[0]).toEqual({ owner_id: alice, views: 0, rejection_reason: null })
  })

  test('rejected → member resubmits to pending (reason cleared); cannot jump to approved', async () => {
    const id = await insertListing(db, alice, catId)
    await as(db, admin, (c) => c.query(`update listings set status = 'rejected', rejection_reason = 'Missing contact details' where id = $1`, [id]))
    await as(db, alice, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    expect((await db.query('select status from listings where id = $1', [id])).rows[0].status).toBe('rejected')
    await as(db, alice, (c) => c.query(`update listings set status = 'pending' where id = $1`, [id]))
    const r = await db.query('select status, rejection_reason from listings where id = $1', [id])
    expect(r.rows[0]).toEqual({ status: 'pending', rejection_reason: null })
  })

  test('bob cannot update or delete alice listing', async () => {
    const upd = await as(db, bob, (c) => c.query(`update listings set title = 'Hacked title' where id = $1`, [pendingId]))
    expect(upd.rowCount).toBe(0)
    const del = await as(db, bob, (c) => c.query(`delete from listings where id = $1`, [pendingId]))
    expect(del.rowCount).toBe(0)
  })

  test('11th listing raises LISTING_LIMIT', async () => {
    const count = Number((await db.query('select count(*) from listings where owner_id = $1', [bob])).rows[0].count)
    for (let i = count; i < 10; i++) await insertListing(db, bob, catId)
    await expect(insertListing(db, bob, catId)).rejects.toThrow(/LISTING_LIMIT/)
  })

  test('hidden listings do not count toward the cap (spec §11: hide or delete)', async () => {
    const one = (await db.query('select id from listings where owner_id = $1 limit 1', [bob])).rows[0].id
    await as(db, admin, (c) => c.query(`update listings set status = 'hidden' where id = $1`, [one]))
    await expect(insertListing(db, bob, catId)).resolves.toBeTruthy()
    await expect(insertListing(db, bob, catId)).rejects.toThrow(/LISTING_LIMIT/)
  })

  test('admin hide is sticky: member cannot unhide until an admin approves again', async () => {
    const id = await insertListing(db, alice, catId)
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    await as(db, admin, (c) => c.query(`update listings set status = 'hidden', hidden_by_admin = true where id = $1`, [id]))
    await as(db, alice, (c) => c.query(`update listings set status = 'approved', hidden_by_admin = false where id = $1`, [id]))
    expect((await db.query('select status, hidden_by_admin from listings where id = $1', [id])).rows[0]).toEqual({ status: 'hidden', hidden_by_admin: true })
    await as(db, admin, (c) => c.query(`update listings set status = 'approved', hidden_by_admin = false where id = $1`, [id]))
    expect((await db.query('select status from listings where id = $1', [id])).rows[0].status).toBe('approved')
    // a member's own hide is still reversible
    await as(db, alice, (c) => c.query(`update listings set status = 'hidden' where id = $1`, [id]))
    await as(db, alice, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    expect((await db.query('select status from listings where id = $1', [id])).rows[0].status).toBe('approved')
  })

  test('member cannot bypass the guard by setting the old GUC', async () => {
    const id = await insertListing(db, alice, catId)
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    await as(db, alice, async (c) => {
      await c.query(`select set_config('as7ab.bypass_guard', 'on', true)`)
      await c.query(`update listings set views = 999, needs_review = false, status = 'approved' where id = $1`, [id])
    })
    expect((await db.query('select views from listings where id = $1', [id])).rows[0].views).toBe(0)
  })

  test('increment_listing_views works for anon on approved only', async () => {
    await as(db, null, (c) => c.query('select increment_listing_views($1)', [pendingId]))
    expect((await db.query('select views from listings where id = $1', [pendingId])).rows[0].views).toBe(1)
    const hidden = await insertListing(db, alice, catId)
    await as(db, null, (c) => c.query('select increment_listing_views($1)', [hidden]))
    expect((await db.query('select views from listings where id = $1', [hidden])).rows[0].views).toBe(0)
  })
})

describe('listing_photos', () => {
  test('owner adds photos (max 6); bob cannot; anon sees photos of approved only', async () => {
    const id = await insertListing(db, alice, catId)
    for (let i = 0; i < 6; i++) {
      await as(db, alice, (c) =>
        c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, $3)', [id, `${alice}/${id}/${i}.jpg`, i]),
      )
    }
    await expect(
      as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 6)', [id, `${alice}/${id}/6.jpg`])),
    ).rejects.toThrow(/PHOTO_LIMIT/)
    await expect(
      as(db, bob, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${alice}/${id}/x.jpg`])),
    ).rejects.toThrow(/row-level security/)
    expect((await as(db, null, (c) => c.query('select id from listing_photos where listing_id = $1', [id]))).rowCount).toBe(0)
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    expect((await as(db, null, (c) => c.query('select id from listing_photos where listing_id = $1', [id]))).rowCount).toBe(6)
  })

  test('photo path must live under the owner/listing folder', async () => {
    const id = await insertListing(db, alice, catId)
    await expect(
      as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${bob}/${id}/x.jpg`])),
    ).rejects.toThrow(/PHOTO_PATH/)
    await expect(
      as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${alice}/other-listing/x.jpg`])),
    ).rejects.toThrow(/PHOTO_PATH/)
    await as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${alice}/${id}/ok.jpg`]))
  })

  test('adding or removing photos on a live listing flags it for review', async () => {
    const id = await insertListing(db, alice, catId)
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = $1`, [id]))
    await as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${alice}/${id}/a.jpg`]))
    expect((await db.query('select needs_review from listings where id = $1', [id])).rows[0].needs_review).toBe(true)
    await as(db, admin, (c) => c.query(`update listings set needs_review = false where id = $1`, [id]))
    await as(db, alice, (c) => c.query('delete from listing_photos where listing_id = $1', [id]))
    expect((await db.query('select needs_review from listings where id = $1', [id])).rows[0].needs_review).toBe(true)
  })

  test('deleting a listing cascades its photos', async () => {
    const id = await insertListing(db, alice, catId)
    await as(db, alice, (c) => c.query('insert into listing_photos (listing_id, storage_path, sort_order) values ($1, $2, 0)', [id, `${alice}/${id}/a.jpg`]))
    await as(db, alice, (c) => c.query('delete from listings where id = $1', [id]))
    expect((await db.query('select id from listing_photos where listing_id = $1', [id])).rowCount).toBe(0)
  })
})

describe('search', () => {
  test('handles tsquery operators without error', async () => {
    for (const q of ['cake & "party"', 'a:b', '|', "it's", '!', '(', 'cake OR -party']) {
      const r = await as(db, null, (c) => c.query('select id from search_listings($1, null, null, null, 24, 0)', [q]))
      expect(Array.isArray(r.rows)).toBe(true)
    }
  })

  test('ranks title match above description match; filters apply; count matches', async () => {
    const a = await insertListing(db, alice, catId, { title: 'Chocolate cake orders', description: 'Home made desserts for every occasion, delivered.' })
    const b = await insertListing(db, alice, catId, { title: 'Party planner', description: 'We also bake a cake for your party if you like.', area: 'Beirut', type: 'service' })
    await as(db, admin, (c) => c.query(`update listings set status = 'approved' where id = any($1)`, [[a, b]]))
    const r = await as(db, null, (c) => c.query('select id from search_listings($1, null, null, null, 24, 0)', ['cake']))
    const ids = r.rows.map((x) => x.id)
    expect(ids.indexOf(a)).toBeLessThan(ids.indexOf(b))
    expect(ids).toContain(b)
    const filtered = await as(db, null, (c) => c.query('select id from search_listings($1, $2, $3, $4, 24, 0)', ['cake', catId, 'service', 'Beirut']))
    expect(filtered.rows.map((x) => x.id)).toEqual([b])
    const count = await as(db, null, (c) => c.query('select count_search_listings($1, $2, $3, $4) as n', ['cake', catId, 'service', 'Beirut']))
    expect(Number(count.rows[0].n)).toBe(1)
    const partial = await as(db, null, (c) => c.query('select id from search_listings($1, null, null, null, 24, 0)', ['choco']))
    expect(partial.rows.map((x) => x.id)).toContain(a)
  })
})

describe('ads', () => {
  test('anon sees active in-window ads only; member cannot insert', async () => {
    const mk = (name: string, start: string, end: string, active = true) =>
      as(db, admin, (c) =>
        c.query<{ id: string }>(
          `insert into ads (advertiser_name, link_url, image_path, slot, starts_at, ends_at, is_active)
           values ($1, 'https://adv.example', 'ads/x.png', 'sidebar', beirut_today() + ($2)::int, beirut_today() + ($3)::int, $4) returning id`,
          [name, start, end, active],
        ),
      )
    const today = (await mk('ends today', '-5', '0')).rows[0].id
    const yesterday = (await mk('ended yesterday', '-5', '-1')).rows[0].id
    const tomorrow = (await mk('starts tomorrow', '1', '5')).rows[0].id
    const inactive = (await mk('inactive', '-1', '1', false)).rows[0].id
    const visible = (await as(db, null, (c) => c.query('select id from ads'))).rows.map((x) => x.id)
    expect(visible).toContain(today)
    expect(visible).not.toContain(yesterday)
    expect(visible).not.toContain(tomorrow)
    expect(visible).not.toContain(inactive)
    expect((await as(db, admin, (c) => c.query('select id from ads'))).rowCount).toBeGreaterThanOrEqual(4)
    await expect(
      as(db, alice, (c) =>
        c.query(`insert into ads (advertiser_name, link_url, image_path, slot, starts_at, ends_at, is_active) values ('x','https://x','p','sidebar',beirut_today(),beirut_today(),true)`),
      ),
    ).rejects.toThrow(/row-level security/)
  })

  test('record_ad_click and record_ad_impression increment as anon', async () => {
    const id = (await db.query<{ id: string }>(`select id from ads where advertiser_name = 'ends today'`)).rows[0].id
    await as(db, null, (c) => c.query('select record_ad_click($1)', [id]))
    await as(db, null, (c) => c.query('select record_ad_impression($1)', [id]))
    await as(db, null, (c) => c.query('select record_ad_impression($1)', [id]))
    const r = await db.query('select clicks, impressions from ads where id = $1', [id])
    expect(r.rows[0]).toEqual({ clicks: 1, impressions: 2 })
  })
})

describe('data quality checks', () => {
  let carol: string
  beforeAll(async () => {
    carol = await createUser(db, { email: 'carol@x.com' })
  })

  test('beirut_today() is the calendar date in Asia/Beirut', async () => {
    const r = await db.query(`select beirut_today() = (now() at time zone 'Asia/Beirut')::date as ok, beirut_today()::text as d`)
    expect(r.rows[0].ok).toBe(true)
    expect(r.rows[0].d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('area must be a known district', async () => {
    await expect(insertListing(db, carol, catId, { area: 'Mars' })).rejects.toThrow(/listings_area_check/)
    await expect(insertListing(db, carol, catId, { area: 'All Lebanon / Online' })).resolves.toBeTruthy()
  })

  test('website must be http(s); slug must be url-safe', async () => {
    const id = await insertListing(db, carol, catId)
    await expect(as(db, carol, (c) => c.query(`update listings set website = 'javascript:alert(1)' where id = $1`, [id]))).rejects.toThrow(/listings_website_check/)
    await as(db, carol, (c) => c.query(`update listings set website = 'https://example.com' where id = $1`, [id]))
    await expect(
      as(db, carol, (c) => c.query(`insert into listings (owner_id, slug, title, description, category_id, type, area) values ($1, 'Bad Slug!', 'Valid title', 'A perfectly valid description text here.', $2, 'goods', 'Beirut')`, [carol, catId])),
    ).rejects.toThrow(/listings_slug_check/)
  })

  test('members cannot post into a hidden category', async () => {
    const hid = (await db.query(`insert into categories (slug, name, is_active) values ('inactive-cat', 'Inactive', false) returning id`)).rows[0].id
    await expect(insertListing(db, carol, hid)).rejects.toThrow(/CATEGORY_INACTIVE/)
  })

  test('anon ad requests always start as new', async () => {
    await as(db, null, (c) => c.query(`insert into ad_requests (name, email, slot, message, status) values ('Spam', 's@x.com', 'sidebar', 'hi', 'closed')`))
    const r = await db.query(`select status from ad_requests where name = 'Spam'`)
    expect(r.rows[0].status).toBe('new')
  })
})

describe('ad_requests', () => {
  test('anon can insert but not read; admin can read and update', async () => {
    await as(db, null, (c) =>
      c.query(`insert into ad_requests (name, business, email, phone, slot, message) values ('Ali', 'Ali Cakes', 'ali@x.com', null, 'sidebar', 'hi')`),
    )
    expect((await as(db, null, (c) => c.query('select id from ad_requests'))).rowCount).toBe(0)
    expect((await as(db, alice, (c) => c.query('select id from ad_requests'))).rowCount).toBe(0)
    const r = await as(db, admin, (c) => c.query(`select id, status from ad_requests where name = 'Ali'`))
    expect(r.rowCount).toBe(1)
    expect(r.rows[0].status).toBe('new')
    await as(db, admin, (c) => c.query(`update ad_requests set status = 'contacted' where id = $1`, [r.rows[0].id]))
    expect((await db.query('select status from ad_requests where id = $1', [r.rows[0].id])).rows[0].status).toBe('contacted')
  })
})

describe('categories and settings', () => {
  test('anon sees active categories only; admin can add and hide', async () => {
    await as(db, admin, (c) => c.query(`insert into categories (slug, name, icon, sort_order, is_active) values ('hidden-cat', 'Hidden', 'x', 999, false)`))
    const slugs = (await as(db, null, (c) => c.query('select slug from categories'))).rows.map((x) => x.slug)
    expect(slugs).toContain('parties-events')
    expect(slugs).not.toContain('hidden-cat')
    expect(slugs.length).toBe(13)
    await expect(as(db, alice, (c) => c.query(`insert into categories (slug, name) values ('mine', 'Mine')`))).rejects.toThrow(/row-level security/)
  })

  test('site_settings: anon can read; member cannot write; admin can upsert', async () => {
    const r = await as(db, null, (c) => c.query(`select value from site_settings where key = 'tagline'`))
    expect(r.rows[0].value).toBe('Find services and goods from people you know, across Lebanon.')
    const upd = await as(db, alice, (c) => c.query(`update site_settings set value = 'hack' where key = 'tagline'`))
    expect(upd.rowCount).toBe(0)
    await as(db, admin, (c) =>
      c.query(`insert into site_settings (key, value) values ('tagline', 'New tagline') on conflict (key) do update set value = excluded.value`),
    )
    expect((await db.query(`select value from site_settings where key = 'tagline'`)).rows[0].value).toBe('New tagline')
  })
})

describe('admins', () => {
  test('set_admin_by_email: non-admin → NOT_ADMIN; admin promotes bob; unknown email → false; cannot demote self', async () => {
    await expect(as(db, alice, (c) => c.query(`select set_admin_by_email('bob@x.com', true)`))).rejects.toThrow(/NOT_ADMIN/)
    const ok = await as(db, admin, (c) => c.query(`select set_admin_by_email('BOB@x.com', true) as ok`))
    expect(ok.rows[0].ok).toBe(true)
    expect((await db.query('select role from profiles where id = $1', [bob])).rows[0].role).toBe('admin')
    const missing = await as(db, admin, (c) => c.query(`select set_admin_by_email('nobody@x.com', true) as ok`))
    expect(missing.rows[0].ok).toBe(false)
    await expect(as(db, admin, (c) => c.query(`select set_admin_by_email('admin@x.com', false)`))).rejects.toThrow(/SELF_DEMOTE/)
    await as(db, admin, (c) => c.query(`select set_admin_by_email('bob@x.com', false)`))
    expect((await db.query('select role from profiles where id = $1', [bob])).rows[0].role).toBe('member')
  })
})
