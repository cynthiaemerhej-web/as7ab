# As7ab Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build As7ab, a free English-language directory for Lebanon where members post services/goods listings with photos and contact details, admins moderate, and four paid ad slots are managed from an admin area.

**Architecture:** Next.js App Router front end deployed on Vercel talks to Supabase (Postgres + Auth + Storage) through `@supabase/ssr` clients. All authorisation lives in Postgres Row Level Security and triggers; the Next.js layer only renders and calls server actions. A thin `lib/data` layer wraps every query so pages stay declarative.

**Tech Stack:** Next.js 16 (TypeScript, App Router, `proxy.ts`), Tailwind CSS 4, zod 4, `@supabase/supabase-js` 2 + `@supabase/ssr` 0.12, `browser-image-compression`, Vitest 5 + React Testing Library + jsdom, `pg` for database tests on a local Postgres 16, Playwright 1.64 (env-gated E2E).

**Spec:** `docs/superpowers/specs/2026-11-02-jiran-directory-design.md`

## Global Constraints

- Node 22, Next.js `16.x`, React 19, Tailwind `4.x`, zod `4.x`, `@supabase/ssr` `0.12.x`, `@supabase/supabase-js` `2.x`. Pin exact versions in `package.json` at scaffold time.
- Site name everywhere: **As7ab** (capital A, digit seven, lowercase "ab"). Default tagline: "Find services and goods from people you know, across Lebanon." Tagline and other site text are editable in `/admin/settings`.
- English only. No Arabic/French UI strings in v1.
- Palette (spec §10): primary `#D96C47`, accent `#1F6F78`, background `#FAF7F2`, text `#1E1E1E`. Font: Plus Jakarta Sans via `next/font/google`, system fallback. Corner radius 12 px.
- Every page usable at 360 px width; contact buttons ≥ 44 px tall.
- Listing limits: title 3–80 chars, description 20–2000 chars, max 6 photos, max 10 listings per member, photo ≤ 5 MB, types `image/jpeg|png|webp`, client-side resize to max 1600 px.
- Listing status values: `pending | approved | rejected | hidden`. Member-allowed transitions: `approved→hidden`, `hidden→approved`, `rejected→pending`.
- Ad slots: `home_banner | sidebar | search_inline | listing_bottom`. Inline ad after every 8th search result. 24 results per page. Empty slot shows "Advertise here" linking to `/advertise`.
- Phone country: Lebanon `+961`; WhatsApp link `https://wa.me/961XXXXXXXX`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`. No service-role key anywhere in the app.
- Role checks on `/admin*` happen server-side on every request (proxy + `requireAdmin()` in each page/action).
- User-entered text rendered as text only (React default); never `dangerouslySetInnerHTML`.
- Commits: conventional prefix (`feat:`, `test:`, `chore:`, `docs:`), one commit per task minimum.

## Review Focus

1. Phone numbers typed with a zero after the country code (`+961 03 123 456`) or with Arabic-Indic digits (`٠٣١٢٣٤٥٦`) should normalise to `+9613123456`, not be rejected. → test in Task 2.
2. A title made only of emoji or Arabic letters produces an empty slug body; the slug must still be valid (`listing-<id6>`). → test in Task 2.
3. A search query containing tsquery operators (`cake & "party"`, `a:b`, `|`) must return results or nothing, never a database error. → test in Task 3 (uses `websearch_to_tsquery`).
4. An ad whose `ends_at` is today must still be served; one that ended yesterday must not; one that starts tomorrow must not. → test in Task 3.
5. A Google account with no name in its metadata must still get a profile, with `display_name` = email local part. → test in Task 3.

---

## File structure

```
as7ab/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs
  vitest.config.ts, playwright.config.ts, .env.example, .gitignore
  proxy.ts                           # session refresh + route protection
  app/
    layout.tsx, globals.css, not-found.tsx, page.tsx (home)
    search/page.tsx   c/[slug]/page.tsx   l/[slug]/page.tsx
    go/[adId]/route.ts   advertise/page.tsx   advertise/actions.ts
    about/page.tsx   terms/page.tsx
    login/page.tsx   login/actions.ts   auth/callback/route.ts   auth/signout/route.ts
    dashboard/page.tsx   dashboard/actions.ts
    dashboard/listings/new/page.tsx   dashboard/listings/[id]/edit/page.tsx
    dashboard/profile/page.tsx
    admin/layout.tsx   admin/page.tsx   admin/actions.ts
    admin/listings/page.tsx   admin/ads/page.tsx   admin/categories/page.tsx   admin/admins/page.tsx
  components/
    TopBar.tsx  Footer.tsx  SearchBar.tsx  ListingCard.tsx  ListingGrid.tsx
    CategoryTile.tsx  AdSlot.tsx  AdBanner.tsx  Badge.tsx  ContactButtons.tsx
    PhotoGallery.tsx  PhotoUploader.tsx  ListingForm.tsx  Pagination.tsx
    FiltersBar.tsx  StatusBadge.tsx  Logo.tsx
  lib/
    constants.ts  areas.ts  phone.ts  slug.ts  schemas.ts  search-params.ts
    ads/pick.ts
    supabase/server.ts  supabase/client.ts  supabase/types.ts
    auth.ts
    data/listings.ts  data/categories.ts  data/ads.ts  data/profiles.ts  data/admin.ts
  supabase/
    migrations/0001_schema.sql  0002_rls.sql  0003_storage.sql
    seed.sql
  scripts/db-test.sh
  tests/
    unit/*.test.ts   components/*.test.tsx   db/shim.sql  db/rls.test.ts   e2e/*.spec.ts
  public/logo.svg  public/favicon.svg  public/og.png
  docs/SETUP.md  docs/design/style-guide.md  docs/design/mockup.html  docs/design/screens/*.png
```

---

### Task 1: Scaffold the app with design tokens and test tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `vitest.config.ts`, `tests/setup.ts`, `.env.example`, `.gitignore`, `lib/constants.ts`
- Test: `tests/unit/constants.test.ts`

**Interfaces:**
- Produces: `lib/constants.ts` exporting `SITE_NAME = 'As7ab'`, `SITE_TAGLINE`, `LISTING_TYPES = ['service','goods'] as const`, `AD_SLOTS = ['home_banner','sidebar','search_inline','listing_bottom'] as const`, `LISTING_STATUSES = ['pending','approved','rejected','hidden'] as const`, `MAX_PHOTOS = 6`, `MAX_LISTINGS_PER_MEMBER = 10`, `RESULTS_PER_PAGE = 24`, `INLINE_AD_EVERY = 8`, and types `ListingType`, `AdSlot`, `ListingStatus`.
- Produces: Tailwind theme tokens `--color-primary`, `--color-accent`, `--color-surface`, `--color-ink`, `--radius-card: 12px` in `app/globals.css` under `@theme`.
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test` (vitest run), `test:db` (Task 3 fills), `test:e2e`.

- [ ] **Step 1: Scaffold with create-next-app**

Run from `/home/user`: `npx --yes create-next-app@16 as7ab-tmp --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --yes`, then move its generated files into `/home/user/as7ab` (keep the existing `docs/` and `.git`). Pin exact versions in `package.json`.

- [ ] **Step 2: Add test tooling**

`npm i -D vitest@5 @vitejs/plugin-react@6 jsdom@30 @testing-library/react@16 @testing-library/jest-dom@7 pg@8 @types/pg @playwright/test@1.64`. Write `vitest.config.ts` with `environmentMatchGlobs: [['tests/components/**', 'jsdom']]`, `include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.tsx']`, alias `@` → project root, `setupFiles: ['tests/setup.ts']` (imports `@testing-library/jest-dom/vitest`).

- [ ] **Step 3: Write the failing test**

```ts
// tests/unit/constants.test.ts
import { AD_SLOTS, LISTING_STATUSES, SITE_NAME, RESULTS_PER_PAGE, INLINE_AD_EVERY } from '@/lib/constants'
test('constants match the spec', () => {
  expect(SITE_NAME).toBe('As7ab')
  expect(AD_SLOTS).toEqual(['home_banner','sidebar','search_inline','listing_bottom'])
  expect(LISTING_STATUSES).toEqual(['pending','approved','rejected','hidden'])
  expect(RESULTS_PER_PAGE).toBe(24)
  expect(INLINE_AD_EVERY).toBe(8)
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/unit/constants.test.ts`
Expected: FAIL, cannot resolve `@/lib/constants`.

- [ ] **Step 5: Implement `lib/constants.ts`, `app/globals.css` theme, `app/layout.tsx`**

`globals.css`: `@import "tailwindcss"; @theme { --color-primary: #D96C47; --color-accent: #1F6F78; --color-surface: #FAF7F2; --color-ink: #1E1E1E; --radius-card: 12px; --font-sans: var(--font-jakarta), system-ui, sans-serif; }` and `body { background: var(--color-surface); color: var(--color-ink); }`.
`layout.tsx`: loads `Plus_Jakarta_Sans` from `next/font/google` with `variable: '--font-jakarta'`, sets `<html lang="en">`, metadata title template `%s · As7ab`.
`.env.example`: the four env vars from Global Constraints with placeholder values. `.gitignore` must include `.env*.local`, `node_modules`, `.next`, `test-results`, `playwright-report`.

- [ ] **Step 6: Run tests, lint and build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: test PASS, lint clean, build succeeds (font download requires network; if `fonts.googleapis.com` is unreachable at build time, fall back to a local `@font-face` and note it in the commit).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with As7ab design tokens and test tooling"
```

---

### Task 2: Pure helpers — areas, phone, slug, schemas, search params, ad picker

**Files:**
- Create: `lib/areas.ts`, `lib/phone.ts`, `lib/slug.ts`, `lib/schemas.ts`, `lib/search-params.ts`, `lib/ads/pick.ts`
- Test: `tests/unit/phone.test.ts`, `tests/unit/slug.test.ts`, `tests/unit/schemas.test.ts`, `tests/unit/search-params.test.ts`, `tests/unit/pick.test.ts`

**Interfaces:**
- Produces `lib/areas.ts`: `AREAS` readonly tuple in exactly the spec §6 order ending with `'All Lebanon / Online'`; type `Area`.
- Produces `lib/phone.ts`: `normalizeLebanesePhone(input: string): string | null` (returns `+961` + 7 or 8 digits, else null), `whatsappLink(e164: string): string`, `displayPhone(e164: string): string` (`+961 3 123 456` style: `+961 ` then digits grouped 1-3-3 for 7 digits, 2-3-3 for 8).
- Produces `lib/slug.ts`: `slugify(text: string): string` (lowercase ASCII a–z0–9 and hyphens, collapsed, trimmed, max 60), `makeListingSlug(title: string, id: string): string` = `${slugify(title) || 'listing'}-${id.replace(/-/g,'').slice(0,6)}`.
- Produces `lib/schemas.ts` (zod 4): `listingInputSchema`, `profileInputSchema`, `adRequestSchema`, `adInputSchema`, `categoryInputSchema` and inferred types `ListingInput`, `ProfileInput`, `AdRequestInput`, `AdInput`, `CategoryInput`. Phone-like fields are optional strings transformed through `normalizeLebanesePhone`; invalid → issue "Enter a valid Lebanese number". `instagram` accepts `@handle`, `handle`, or an instagram.com URL and outputs the bare handle (`^[A-Za-z0-9._]{1,30}$`). `website` must be http(s) URL. `adRequestSchema` has honeypot field `website_url` that must be empty string. `adInputSchema`: `advertiserName` 2–80, `linkUrl` url, `slot` ∈ `AD_SLOTS`, `startsAt`/`endsAt` ISO dates with `endsAt >= startsAt`, `isActive` boolean.
- Produces `lib/search-params.ts`: `export type ParsedSearch = { q: string; category: string | null; type: ListingType | null; area: Area | null; page: number }` and `parseSearchParams(raw: Record<string, string | string[] | undefined>): ParsedSearch`.
- Produces `lib/ads/pick.ts`: `pickAd<T>(ads: readonly T[], random: () => number = Math.random): T | null`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/phone.test.ts
import { normalizeLebanesePhone as n, whatsappLink, displayPhone } from '@/lib/phone'
test.each([
  ['03 123 456', '+9613123456'], ['71123456', '+96171123456'], ['+961 3 123 456', '+9613123456'],
  ['00961 71 123 456', '+96171123456'], ['+961 03 123 456', '+9613123456'],   // zero after country code
  ['٠٣١٢٣٤٥٦', '+9613123456'],                                               // Arabic-Indic digits
  ['01 234 567', '+9611234567'],
])('normalises %s', (input, out) => expect(n(input)).toBe(out))
test.each(['', '12', '+1 212 555 0100', 'abc', '961', '+9613'])('rejects %s', (x) => expect(n(x)).toBeNull())
test('whatsapp link', () => expect(whatsappLink('+9613123456')).toBe('https://wa.me/9613123456'))
test('display', () => { expect(displayPhone('+9613123456')).toBe('+961 3 123 456'); expect(displayPhone('+96171123456')).toBe('+961 71 123 456') })
```

```ts
// tests/unit/slug.test.ts
import { slugify, makeListingSlug } from '@/lib/slug'
test('slugify', () => expect(slugify("  Mia's Birthday  Supplies & Décor! ")).toBe('mia-s-birthday-supplies-decor'))
test('slug max 60', () => expect(slugify('a'.repeat(100)).length).toBe(60))
test('emoji/Arabic-only title still valid', () => expect(makeListingSlug('🎂🎈 حلويات', '3f2a9c1e-1111-2222-3333-444444444444')).toBe('listing-3f2a9c'))
test('listing slug', () => expect(makeListingSlug('Cake Lady', '3f2a9c1e-1111-2222-3333-444444444444')).toBe('cake-lady-3f2a9c'))
```

```ts
// tests/unit/schemas.test.ts
import { listingInputSchema, adRequestSchema, adInputSchema } from '@/lib/schemas'
const base = { title: 'Birthday supplies', description: 'Balloons, banners, candles and themed tableware for kids parties.', categoryId: 1, type: 'goods', area: 'Metn' }
test('valid listing normalises phone and instagram', () => {
  const r = listingInputSchema.parse({ ...base, phone: '03 123 456', instagram: 'https://instagram.com/mia.party/' })
  expect(r.phone).toBe('+9613123456'); expect(r.instagram).toBe('mia.party')
})
test('short description rejected', () => expect(listingInputSchema.safeParse({ ...base, description: 'too short' }).success).toBe(false))
test('bad area rejected', () => expect(listingInputSchema.safeParse({ ...base, area: 'Paris' }).success).toBe(false))
test('bad phone gives message', () => {
  const r = listingInputSchema.safeParse({ ...base, phone: '12' })
  expect(r.success).toBe(false); expect(JSON.stringify(r.error)).toContain('valid Lebanese number')
})
test('empty optional fields become undefined', () => expect(listingInputSchema.parse({ ...base, phone: '', website: '' }).phone).toBeUndefined())
test('ad request honeypot', () => expect(adRequestSchema.safeParse({ name: 'Ali', email: 'a@b.com', slot: 'sidebar', message: 'hi', website_url: 'spam' }).success).toBe(false))
test('ad dates ordered', () => expect(adInputSchema.safeParse({ advertiserName: 'X', linkUrl: 'https://x.com', slot: 'sidebar', startsAt: '2026-12-10', endsAt: '2026-12-01', isActive: true }).success).toBe(false))
```

```ts
// tests/unit/search-params.test.ts
import { parseSearchParams } from '@/lib/search-params'
test('defaults', () => expect(parseSearchParams({})).toEqual({ q: '', category: null, type: null, area: null, page: 1 }))
test('parses and drops invalid', () => expect(parseSearchParams({ q: ' cake ', type: 'nonsense', area: 'Beirut', page: '0', category: ['a','b'] }))
  .toEqual({ q: 'cake', category: 'a', type: null, area: 'Beirut', page: 1 }))
test('page', () => expect(parseSearchParams({ page: '3', type: 'service' }).page).toBe(3))
```

```ts
// tests/unit/pick.test.ts
import { pickAd } from '@/lib/ads/pick'
test('empty → null', () => expect(pickAd([])).toBeNull())
test('deterministic with injected random', () => expect(pickAd(['a','b','c'], () => 0.99)).toBe('c'))
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit`
Expected: FAIL on missing modules.

- [ ] **Step 3: Implement the six modules with the signatures above**

`normalizeLebanesePhone`: map Arabic-Indic (U+0660–0669) and Eastern Arabic-Indic (U+06F0–06F9) digits to ASCII; strip everything except digits and a leading `+`; strip prefix `+961`, `00961`, or `961`; then strip one leading `0`; accept 7 or 8 remaining digits whose first digit is 1–9.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib tests/unit && git commit -m "feat: add phone, slug, schema, search-param and ad-pick helpers"
```

---

### Task 3: Database migrations, seed, and RLS tests on local Postgres

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_rls.sql`, `supabase/migrations/0003_storage.sql`, `supabase/seed.sql`, `supabase/config.toml` (minimal, for `supabase db push` later), `scripts/db-test.sh`, `tests/db/shim.sql`, `tests/db/helpers.ts`, `tests/db/rls.test.ts`, `vitest.db.config.ts`
- Modify: `package.json` (`test:db` script)

**Interfaces:**
- Produces tables and columns exactly as spec §7 (including `site_settings`), with `listings.search_vector` as a generated column: `setweight(to_tsvector('simple', title),'A') || setweight(to_tsvector('simple', description),'B')`.
- Produces SQL functions: `public.is_admin() returns boolean` (stable, security definer, `select role = 'admin' from profiles where id = auth.uid()`); `public.handle_new_user()` trigger on `auth.users` insert → profile with `display_name = coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email,'@',1))`; `public.enforce_listing_member_update()` BEFORE UPDATE trigger; `public.enforce_listing_cap()` BEFORE INSERT trigger raising `'LISTING_LIMIT'` when a non-admin owner already has 10; `public.search_listings(q text, p_category int, p_type text, p_area text, p_limit int, p_offset int) returns setof listings` (security invoker, uses `websearch_to_tsquery('simple', q)` when `q <> ''`, falls back to `title ilike '%'||q||'%'` OR match, orders by `ts_rank` desc then `created_at` desc); `public.increment_listing_views(p_listing uuid)`, `public.record_ad_impression(p_ad uuid)`, `public.record_ad_click(p_ad uuid)` (all security definer, void); `public.set_admin_by_email(target_email text, make_admin boolean) returns boolean` (security definer; raises `'NOT_ADMIN'` if caller not admin, `'SELF_DEMOTE'` if demoting self, returns false if email not found); view `public.public_profiles (id, display_name)`.
- Produces `tests/db/helpers.ts`: `connect(): Promise<Client>`, `as(client, userId: string | null, cb)` which runs `cb` inside a transaction with `set local role authenticated|anon` and `set local request.jwt.claims = '{"sub":"<id>","role":"authenticated"}'`, `createUser(client, { email, meta? }): Promise<string>` inserting into `auth.users`.
- Produces `scripts/db-test.sh`: creates a throwaway cluster in `/tmp/as7ab-pg` as the `postgres` OS user on port 54329, applies `tests/db/shim.sql`, `0001`, `0002`, `seed.sql`, runs `vitest run -c vitest.db.config.ts`, stops the cluster. `0003_storage.sql` is NOT applied locally (no `storage` schema); it is reviewed by reading.

- [ ] **Step 1: Write `tests/db/shim.sql`**

Creates roles `anon`, `authenticated`, `service_role` (nologin), schema `auth`, table `auth.users (id uuid pk default gen_random_uuid(), email text unique, raw_user_meta_data jsonb default '{}', created_at timestamptz default now())`, function `auth.uid() returns uuid` = `nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'`, `auth.role()`, and `grant usage on schema public to anon, authenticated`. Mirrors what Supabase provides so `0001`/`0002` run unchanged.

- [ ] **Step 2: Write the failing DB tests**

```ts
// tests/db/rls.test.ts  (one describe per rule; abbreviated signatures — write all listed cases)
import { connect, as, createUser } from './helpers'
let db; let alice, bob, admin, catId
beforeAll(async () => { db = await connect(); alice = await createUser(db,{email:'alice@x.com', meta:{full_name:'Alice'}}); bob = await createUser(db,{email:'bob@x.com'}); admin = await createUser(db,{email:'admin@x.com'}); await db.query(`update profiles set role='admin' where id=$1`,[admin]); catId = (await db.query(`select id from categories where slug='parties-events'`)).rows[0].id })
test('profile auto-created; name falls back to email local part', async () => { expect((await db.query('select display_name from profiles where id=$1',[bob])).rows[0].display_name).toBe('bob') })
test('member inserts pending listing; cannot insert approved', ...)        // insert with status 'approved' as alice → row ends up 'pending' or is rejected
test('anon sees only approved listings', ...)                               // insert pending as alice; as(null) select → 0 rows; admin approves; as(null) → 1 row
test('member cannot approve own listing', ...)                              // as alice update status='approved' → still 'pending'
test('member can hide/unhide approved and resubmit rejected', ...)          // approved→hidden ok, hidden→approved ok, rejected→pending ok, rejected→approved reverted
test('editing approved content sets needs_review', ...)
test('member cannot change owner_id, views, rejection_reason', ...)
test('11th listing raises LISTING_LIMIT', ...)
test('bob cannot update alice listing', ...)                                // 0 rows affected
test('profiles: bob cannot read alice phone; public_profiles exposes name only', ...)
test('member cannot change own role', ...)
test('ad_requests: anon can insert, cannot select; admin can select', ...)
test('ads: anon sees active in-window only (ends today yes, ended yesterday no, starts tomorrow no)', ...)
test('record_ad_click increments as anon', ...)
test('set_admin_by_email: non-admin → NOT_ADMIN; admin promotes bob; admin cannot demote self', ...)
test('search_listings handles operators without error', async () => { for (const q of ['cake & "party"', 'a:b', '|', "it's"]) await expect(as(db,null,c=>c.query('select * from search_listings($1,null,null,null,24,0)',[q]))).resolves.toBeTruthy() })
test('search ranks title match above description match', ...)
test('deleting listing cascades photos', ...)
test('site_settings: anon can read; member cannot write; admin can upsert', ...)
```

- [ ] **Step 3: Run DB tests to verify they fail**

Run: `bash scripts/db-test.sh`
Expected: cluster starts; migrations fail to apply or tests FAIL because tables/functions are missing.

- [ ] **Step 4: Write `0001_schema.sql`, `0002_rls.sql`, `seed.sql`**

`0001`: extensions `pgcrypto`; tables from spec §7 with check constraints (`char_length(title) between 3 and 80`, description 20–2000, `type in ('service','goods')`, status enum check, `slot` check); indexes from §7; `updated_at` trigger; `handle_new_user` trigger; grants: `grant select, insert, update, delete on all tables in schema public to authenticated; grant select on listings, listing_photos, categories, ads, public_profiles to anon; grant insert on ad_requests to anon`.
`0002`: `alter table ... enable row level security` on all six tables; policies per spec §7 (write them one per operation, named `<table>_<op>_<who>`); the two listing triggers; RPCs; `set_admin_by_email`; `public_profiles` view with `security_invoker = false` (runs as owner; exposes only id + display_name).
`seed.sql`: default `site_settings` rows (`tagline` = default tagline, `contact_email` = 'hello@example.com', `about_text`, `terms_text` = spec §5 copy, `announcement_text` = '', `announcement_enabled` = 'false') and the 13 categories from spec §6 with slugs (`parties-events`, `food-catering`, `education-tutoring`, `health-beauty`, `home-repairs`, `kids-baby`, `fashion-accessories`, `handmade-gifts`, `tech-electronics`, `cars-transport`, `professional-services`, `photography-media`, `other`), icon names (lucide names, e.g. `party-popper`, `utensils`, `graduation-cap`, `sparkles`, `wrench`, `baby`, `shirt`, `gift`, `laptop`, `car`, `briefcase`, `camera`, `shapes`), `sort_order` 10..130. Use `on conflict (slug) do nothing`.

- [ ] **Step 5: Write `0003_storage.sql`**

Inserts buckets `listing-photos` (public, `file_size_limit = 5242880`, `allowed_mime_types = '{image/jpeg,image/png,image/webp}'`) and `ad-banners` (public, same limit). Policies on `storage.objects`: public select for both buckets; authenticated insert/update/delete on `listing-photos` where `(storage.foldername(name))[1] = auth.uid()::text`; insert/update/delete on `ad-banners` where `public.is_admin()`.

- [ ] **Step 6: Run DB tests to verify they pass**

Run: `bash scripts/db-test.sh`
Expected: all PASS; script exits 0 and stops the cluster.

- [ ] **Step 7: Commit**

```bash
git add supabase scripts tests/db vitest.db.config.ts package.json && git commit -m "feat: database schema, RLS policies, RPCs and seed with local Postgres tests"
```

---

### Task 4: Supabase clients, auth pages, and route protection

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/types.ts`, `lib/auth.ts`, `proxy.ts`, `app/login/page.tsx`, `app/login/actions.ts`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts`, `components/Logo.tsx`
- Test: `tests/unit/auth-redirect.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks except constants.
- Produces `lib/supabase/server.ts`: `createClient(): Promise<SupabaseClient<Database>>` (uses `cookies()` from `next/headers`, `@supabase/ssr` `createServerClient` with `getAll/setAll`).
- Produces `lib/supabase/client.ts`: `createBrowserClient(): SupabaseClient<Database>`.
- Produces `lib/supabase/types.ts`: hand-written `Database` type covering the tables, view, and RPCs from Task 3 (regenerate later with `supabase gen types`; keep hand-written in sync).
- Produces `lib/auth.ts`: `getCurrentProfile(): Promise<{ id: string; email: string; display_name: string; role: 'member' | 'admin' } | null>`, `requireMember(): Promise<Profile>` (redirects to `/login?next=<path>` when null), `requireAdmin(): Promise<Profile>` (calls `notFound()` for non-admins so the admin area is invisible), `decideRedirect(pathname: string, user: { role: string } | null): string | null` (pure; `/dashboard*` without user → `/login?next=...`; `/admin*` without user → `/login?next=...`; `/admin*` non-admin → `/`; `/login` with user → `/dashboard`; else null).
- Produces `proxy.ts`: default export `proxy(request: NextRequest)` refreshing the session with `supabase.auth.getUser()`, reading `profiles.role` for the user, and applying `decideRedirect`; `config.matcher` excludes `_next/static`, `_next/image`, `favicon`, and image files.
- Produces `app/login/actions.ts`: `signInWithGoogle(next: string)` server action returning the OAuth URL via `signInWithOAuth({ provider: 'google', options: { redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=${next}` } })` then `redirect(url)`; `sendMagicLink(prev, formData)` using `signInWithOtp` with `emailRedirectTo` same callback, returning `{ ok: true } | { error: string }`.
- Produces `app/auth/callback/route.ts`: GET exchanges `code` with `exchangeCodeForSession`, redirects to `next` (only if it starts with `/`, else `/dashboard`); on error redirects to `/login?error=link`.
- Produces `app/auth/signout/route.ts`: POST signs out, redirects `/`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/auth-redirect.test.ts
import { decideRedirect } from '@/lib/auth'
test.each([
  ['/dashboard', null, '/login?next=%2Fdashboard'],
  ['/dashboard/listings/new', null, '/login?next=%2Fdashboard%2Flistings%2Fnew'],
  ['/admin/ads', null, '/login?next=%2Fadmin%2Fads'],
  ['/admin', { role: 'member' }, '/'],
  ['/admin', { role: 'admin' }, null],
  ['/login', { role: 'member' }, '/dashboard'],
  ['/search', null, null],
])('%s with %o → %s', (p, u, out) => expect(decideRedirect(p, u)).toBe(out))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/auth-redirect.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement the modules listed in Interfaces**

`lib/auth.ts` must import `decideRedirect` from a dependency-free file so the test does not pull in `next/headers`: put `decideRedirect` in `lib/auth-redirect.ts` and re-export it from `lib/auth.ts`.
Login page: Logo, "Sign in to As7ab", Google button (form posting to `signInWithGoogle`), divider "or", email input + "Send me a sign-in link" button, success state "Check your inbox — the link works for Gmail, Hotmail, and any other email.", error state for `?error=link`: "That link has expired. Send a new one below."

- [ ] **Step 4: Run tests, lint, build**

Run: `npx vitest run && npm run lint && npm run build` — Expected: PASS / clean / builds (build must not require live Supabase; env vars from `.env.example` with placeholder URL are enough because no page fetches at build time yet).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: supabase clients, login with Google and magic link, route protection"
```

---

### Task 5: UI shell and presentational components

**Files:**
- Create: `components/TopBar.tsx`, `components/Footer.tsx`, `components/SearchBar.tsx`, `components/ListingCard.tsx`, `components/ListingGrid.tsx`, `components/CategoryTile.tsx`, `components/AdBanner.tsx`, `components/Badge.tsx`, `components/StatusBadge.tsx`, `components/ContactButtons.tsx`, `components/PhotoGallery.tsx`, `components/Pagination.tsx`, `components/FiltersBar.tsx`, `public/logo.svg`, `public/favicon.svg`
- Modify: `app/layout.tsx` (TopBar + Footer around children), `app/not-found.tsx`
- Test: `tests/components/ListingCard.test.tsx`, `tests/components/AdBanner.test.tsx`, `tests/components/ContactButtons.test.tsx`, `tests/components/Pagination.test.tsx`

**Interfaces:**
- Consumes: `displayPhone`, `whatsappLink` (Task 2), constants (Task 1), `getCurrentProfile` (Task 4) in `TopBar` (server component).
- Produces `ListingCardProps = { slug: string; title: string; categoryName: string; area: string; type: ListingType; photoUrl: string | null }` rendering a link to `/l/<slug>`, a placeholder image block when `photoUrl` is null, type badge text `Service` / `Goods`.
- Produces `AdBanner` props `{ ad: { id: string; imageUrl: string; linkUrl: string; advertiserName: string } | null; slot: AdSlot; className?: string }`: with ad → `<a href="/go/<id>">` wrapping `<img alt="<advertiserName>">` and a small "Ad" label; with null → placeholder "Advertise here" linking to `/advertise`.
- Produces `ContactButtons` props `{ phone?: string | null; whatsapp?: string | null; email?: string | null; instagram?: string | null; website?: string | null }`: renders only provided buttons: Call (`tel:`), WhatsApp (`whatsappLink`), Email (`mailto:`), Instagram (`https://instagram.com/<handle>`), Website; each `rel="noopener noreferrer"`, `target="_blank"` except tel/mailto; min height 44 px (`min-h-11`).
- Produces `Pagination` props `{ page: number; totalPages: number; makeHref: (page: number) => string }`.
- Produces `FiltersBar` props `{ categories: { slug: string; name: string }[]; current: ReturnType<typeof parseSearchParams> }` (client component; changes push to `/search?...`).
- Produces `PhotoGallery` props `{ photos: { url: string; alt: string }[] }` (client; main image + thumbnails).
- Produces `TopBar` (server): logo → `/`, `SearchBar`, "Post a listing" → `/dashboard/listings/new`, avatar menu with Dashboard / Admin (if admin) / Sign out (form POST `/auth/signout`), or "Sign in".

- [ ] **Step 1: Write the failing component tests**

```tsx
// tests/components/ListingCard.test.tsx
import { render, screen } from '@testing-library/react'
import ListingCard from '@/components/ListingCard'
test('links to listing and shows badge', () => {
  render(<ListingCard slug="cake-lady-3f2a9c" title="Cake Lady" categoryName="Food & Catering" area="Beirut" type="goods" photoUrl={null} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/l/cake-lady-3f2a9c')
  expect(screen.getByText('Goods')).toBeInTheDocument()
  expect(screen.getByText('Beirut')).toBeInTheDocument()
})
```

```tsx
// tests/components/AdBanner.test.tsx
test('placeholder when no ad', () => { render(<AdBanner ad={null} slot="sidebar" />); expect(screen.getByRole('link', { name: /advertise here/i })).toHaveAttribute('href', '/advertise') })
test('ad goes through /go and is labelled', () => {
  render(<AdBanner slot="home_banner" ad={{ id: 'ad1', imageUrl: 'https://x/y.png', linkUrl: 'https://adv.com', advertiserName: 'Adv' }} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/go/ad1'); expect(screen.getByText('Ad')).toBeInTheDocument(); expect(screen.getByRole('img')).toHaveAttribute('alt', 'Adv')
})
```

```tsx
// tests/components/ContactButtons.test.tsx
test('renders only provided contacts', () => {
  render(<ContactButtons phone="+9613123456" whatsapp="+9613123456" instagram="mia.party" />)
  expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute('href', 'tel:+9613123456')
  expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', 'https://wa.me/9613123456')
  expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', 'https://instagram.com/mia.party')
  expect(screen.queryByRole('link', { name: /email/i })).toBeNull()
})
```

```tsx
// tests/components/Pagination.test.tsx
test('hides when one page, shows prev/next otherwise', () => {
  const { rerender } = render(<Pagination page={1} totalPages={1} makeHref={(p) => `/search?page=${p}`} />)
  expect(screen.queryByRole('navigation')).toBeNull()
  rerender(<Pagination page={2} totalPages={3} makeHref={(p) => `/search?page=${p}`} />)
  expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('href', '/search?page=3')
})
```

- [ ] **Step 2: Run tests to verify they fail** — `npx vitest run tests/components` → FAIL.

- [ ] **Step 3: Implement the components, logo, favicon, layout, not-found**

Logo: SVG wordmark "As7ab" in Plus Jakarta Sans weight 800 with a mark of two overlapping circles (two friends) in primary and accent. `not-found.tsx`: "We couldn't find that page" + `SearchBar`. Images: use `next/image` with `remotePatterns: [{ hostname: '*.supabase.co' }]` in `next.config.ts`; in tests, `next/image` renders a plain `img` under jsdom (set `images.unoptimized` via `vi.mock('next/image')` in `tests/setup.ts` to return a plain `<img>`).

- [ ] **Step 4: Run tests, lint, build** — all green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: UI shell, listing card, ad banner, contact buttons and shared components"
```

---

### Task 6: Data access layer

**Files:**
- Create: `lib/data/listings.ts`, `lib/data/categories.ts`, `lib/data/ads.ts`, `lib/data/profiles.ts`, `lib/data/photos.ts`
- Test: `tests/unit/data-mappers.test.ts`

**Interfaces:**
- Consumes: `Database` type, `createClient` (Task 4), `pickAd`, `parseSearchParams` (Task 2).
- Produces `lib/data/listings.ts`: `type ListingCardData = ListingCardProps & { id: string }`; `getLatestListings(sb, limit = 12): Promise<ListingCardData[]>`; `searchListings(sb, params: ParsedSearch, categoryId: number | null): Promise<{ items: ListingCardData[]; total: number; totalPages: number }>` (calls RPC `search_listings` with `p_limit = RESULTS_PER_PAGE`, `p_offset = (page-1)*24`, and a `count` query for total); `getListingBySlug(sb, slug): Promise<ListingDetail | null>` where `ListingDetail` = all listing columns + `category: { slug; name }` + `photos: { url; alt }[]` + `ownerName: string`; `getMyListings(sb, ownerId): Promise<MyListing[]>` (`id, slug, title, status, needs_review, rejection_reason, updated_at, firstPhotoUrl`); `getMyListing(sb, id)`; `incrementViews(sb, listingId)`.
- Produces `lib/data/categories.ts`: `getActiveCategories(sb)`, `getCategoryBySlug(sb, slug)`.
- Produces `lib/data/ads.ts`: `getAdForSlot(sb, slot: AdSlot): Promise<AdBannerData | null>` (query active, `starts_at <= current_date <= ends_at`, pick with `pickAd`, call `record_ad_impression`), `getAdById(sb, id)`.
- Produces `lib/data/photos.ts`: `publicPhotoUrl(sb, path: string): string` (via `storage.from('listing-photos').getPublicUrl`), `toCardData(row): ListingCardData` and `toDetail(row): ListingDetail` pure mappers exported for tests.
- Produces `lib/data/profiles.ts`: `getProfile(sb, id)`, `updateProfile(sb, id, input: ProfileInput)`.

- [ ] **Step 1: Write the failing mapper test**

```ts
// tests/unit/data-mappers.test.ts
import { toCardData } from '@/lib/data/photos'
test('maps row to card with first photo and null when none', () => {
  const row = { id: 'i', slug: 's', title: 't', area: 'Beirut', type: 'service', categories: { name: 'Food & Catering', slug: 'food-catering' }, listing_photos: [{ storage_path: 'u/l/a.jpg', sort_order: 1 }, { storage_path: 'u/l/b.jpg', sort_order: 0 }] }
  expect(toCardData(row, (p) => `https://cdn/${p}`)).toEqual({ id: 'i', slug: 's', title: 't', area: 'Beirut', type: 'service', categoryName: 'Food & Catering', photoUrl: 'https://cdn/u/l/b.jpg' })
  expect(toCardData({ ...row, listing_photos: [] }, (p) => p).photoUrl).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails.** `npx vitest run tests/unit/data-mappers.test.ts` → FAIL.

- [ ] **Step 3: Implement the data modules.** Mappers take a `urlFor: (path: string) => string` so they stay pure. Queries select `*, categories(name, slug), listing_photos(storage_path, sort_order)`.

- [ ] **Step 4: Run tests, lint, typecheck** (`npx tsc --noEmit`) → green.

- [ ] **Step 5: Commit** — `git commit -m "feat: data access layer for listings, categories, ads and profiles"`.

---

### Task 7: Public pages — home, search, category, listing, ad redirect, static pages

**Files:**
- Create: `app/page.tsx`, `app/search/page.tsx`, `app/c/[slug]/page.tsx`, `app/l/[slug]/page.tsx`, `app/go/[adId]/route.ts`, `app/about/page.tsx`, `app/terms/page.tsx`, `components/AdSlot.tsx`
- Test: `tests/unit/interleave.test.ts`, `tests/components/AdSlot.test.tsx` is not needed (AdSlot is a server component wrapper; covered by E2E in Task 12)

**Interfaces:**
- Consumes: Task 5 components, Task 6 data functions, `parseSearchParams`.
- Produces `components/AdSlot.tsx` (async server component) `{ slot: AdSlot; className?: string }` → fetches `getAdForSlot` and renders `AdBanner`.
- Produces `lib/interleave.ts`: `interleaveAds<T>(items: T[], every: number): (T | { ad: true })[]` inserting an `{ ad: true }` marker after every `every` items.
- Pages: home = hero with `SearchBar` and tagline, `AdSlot slot="home_banner"`, category tiles grid (`getActiveCategories`), "Latest listings" (`getLatestListings`), `AdSlot slot="sidebar"` in a right column on `lg:` and under the grid on mobile; search = `FiltersBar`, result count, `ListingGrid` with `interleaveAds(items, INLINE_AD_EVERY)` where markers render `AdSlot slot="search_inline"`, `Pagination`; category page = search page pre-filtered (reuse one `SearchResults` component with `categorySlug` prop); listing = `PhotoGallery`, title, badges, description (`whitespace-pre-line`), "Posted by <ownerName>", `ContactButtons`, "Report this listing" `mailto:${NEXT_PUBLIC_CONTACT_EMAIL}?subject=Report listing <slug>`, `AdSlot slot="listing_bottom"`, calls `incrementViews` (fire-and-forget), `generateMetadata` with title and description excerpt; `/go/[adId]` = looks up ad, calls `record_ad_click`, 302 to `link_url` (404 if unknown or inactive); about/terms = static copy per spec §5 (terms: no illegal goods, accurate contact details, admins may remove any listing, contact email).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/interleave.test.ts
import { interleaveAds } from '@/lib/interleave'
test('marker after every 8th', () => {
  const out = interleaveAds(Array.from({ length: 17 }, (_, i) => i), 8)
  expect(out.length).toBe(19); expect(out[8]).toEqual({ ad: true }); expect(out[17]).toEqual({ ad: true })
})
test('no trailing marker when exact multiple', () => expect(interleaveAds([1,2,3,4,5,6,7,8], 8).length).toBe(8))
```

Rule: a marker goes after item `i` (1-based) when `i % every === 0` and `i < items.length`; never a trailing marker.

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement `lib/interleave.ts`, `AdSlot`, and the pages.** All pages that render `AdSlot` or read cookies are dynamic by nature; add `export const dynamic = 'force-dynamic'` to home, search, category, listing to be explicit.

- [ ] **Step 4: Run tests, lint, build** → green.

- [ ] **Step 5: Commit** — `git commit -m "feat: public pages with search, listing detail and ad slots"`.

---

### Task 8: Member dashboard — listing form with photo upload, hide/unhide/delete, profile

**Files:**
- Create: `app/dashboard/page.tsx`, `app/dashboard/actions.ts`, `app/dashboard/listings/new/page.tsx`, `app/dashboard/listings/[id]/edit/page.tsx`, `app/dashboard/profile/page.tsx`, `components/ListingForm.tsx`, `components/PhotoUploader.tsx`, `lib/photos/prepare.ts`
- Test: `tests/unit/photos-prepare.test.ts`, `tests/unit/form-state.test.ts`

**Interfaces:**
- Consumes: `requireMember` (Task 4), `listingInputSchema`, `profileInputSchema` (Task 2), data layer (Task 6), `MAX_PHOTOS`, `MAX_LISTINGS_PER_MEMBER`.
- Produces `app/dashboard/actions.ts` server actions, each starting with `requireMember()`:
  - `createListing(prev: FormState, formData: FormData): Promise<FormState>` → validates with `listingInputSchema`; inserts with `slug = makeListingSlug(title, crypto.randomUUID())` (use that same UUID as `id`); returns `{ ok: true, listingId, slug }`; maps Postgres error containing `LISTING_LIMIT` to `{ error: 'You already have 10 listings. Hide or delete one to add another.' }`.
  - `updateListing(id, prev, formData)`, `attachPhotos(listingId: string, paths: string[]): Promise<FormState>` (validates each path starts with `${userId}/${listingId}/`, inserts rows with `sort_order` by index, max 6 total), `removePhoto(listingId, photoId)`, `setListingStatus(id, status: 'hidden' | 'approved' | 'pending')`, `deleteListing(id)` (removes storage objects under `${userId}/${id}/` via the user's client, then the row), `updateProfileAction`.
  - `type FormState = { ok?: true; listingId?: string; slug?: string; error?: string; fieldErrors?: Record<string, string> }`; pure helper `zodToFieldErrors(error: ZodError): Record<string, string>` in `lib/form-state.ts`.
- Produces `lib/photos/prepare.ts`: `validatePhotoFile(file: { type: string; size: number }): string | null` (returns message or null), `photoStoragePath(userId: string, listingId: string): string` = `${userId}/${listingId}/${crypto.randomUUID()}.jpg`; `prepareImage(file: File): Promise<File>` (client-only; `browser-image-compression` with `maxWidthOrHeight: 1600, maxSizeMB: 1, fileType: 'image/jpeg'`).
- Produces `components/PhotoUploader.tsx` (client) props `{ listingId: string; userId: string; initial: { id: string; url: string }[]; onChange?: () => void }`: shows up to 6 tiles, upload via `createBrowserClient().storage.from('listing-photos').upload(path, file)`, then `attachPhotos`; per-tile error text; remove button calls `removePhoto`.
- Produces `components/ListingForm.tsx` (client): fields title, type (radio Service/Goods), category (select), area (select), description (textarea with counter), phone, whatsapp (checkbox "same as phone"), email, instagram, website; submits to `createListing`/`updateListing` via `useActionState`; on create success it reveals the `PhotoUploader` step ("Now add up to 6 photos") and a "Done" link to `/dashboard`.
- Dashboard page: list of `getMyListings` rows with `StatusBadge` (`Pending review`, `Live`, `Rejected` + reason, `Hidden`), buttons Edit / Hide / Unhide / Resubmit / Delete (confirm dialog), empty state "You haven't posted anything yet" with CTA; counter "x of 10 listings".
- Profile page: `profileInputSchema` fields, prefill into new listings.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/photos-prepare.test.ts
import { validatePhotoFile, photoStoragePath } from '@/lib/photos/prepare'
test('rejects wrong type and oversize', () => {
  expect(validatePhotoFile({ type: 'image/gif', size: 10 })).toMatch(/JPG, PNG or WebP/)
  expect(validatePhotoFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toMatch(/5 MB/)
  expect(validatePhotoFile({ type: 'image/webp', size: 1000 })).toBeNull()
})
test('path is under user and listing', () => expect(photoStoragePath('u1', 'l1')).toMatch(/^u1\/l1\/[0-9a-f-]{36}\.jpg$/))
```

```ts
// tests/unit/form-state.test.ts
import { zodToFieldErrors } from '@/lib/form-state'
import { listingInputSchema } from '@/lib/schemas'
test('maps first issue per field', () => {
  const r = listingInputSchema.safeParse({ title: 'x', description: 'short', categoryId: 1, type: 'goods', area: 'Beirut' })
  expect(zodToFieldErrors(r.error!)).toMatchObject({ title: expect.any(String), description: expect.any(String) })
})
```

- [ ] **Step 2: Run to verify they fail.**

- [ ] **Step 3: Implement actions, helpers, uploader, form, pages.** `attachPhotos` must reject paths outside the caller's folder with `{ error: 'Invalid photo path' }` even though storage policy already prevents the upload.

- [ ] **Step 4: Run tests, lint, build** → green. Also add a DB test to `tests/db/rls.test.ts`: "member can insert listing_photos only for own listing" and run `bash scripts/db-test.sh`.

- [ ] **Step 5: Commit** — `git commit -m "feat: member dashboard with listing form, photo upload and profile"`.

---

### Task 9: Advertise page and ad request form

**Files:**
- Create: `app/advertise/page.tsx`, `app/advertise/actions.ts`, `lib/rate-limit.ts`
- Test: `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Consumes: `adRequestSchema`, `AD_SLOTS`, `createClient`.
- Produces `lib/rate-limit.ts`: `class SlidingLimiter { constructor(maxPerWindow: number, windowMs: number); allow(key: string, now?: number): boolean }` in-memory (per serverless instance; documented limitation).
- Produces `submitAdRequest(prev, formData): Promise<FormState>`: honeypot via schema, limiter `new SlidingLimiter(1, 60_000)` keyed by `x-forwarded-for` first IP (from `headers()`), inserts `ad_requests` with the anon-capable client, returns `{ ok: true }` → page shows "Thanks! We'll be in touch within two working days."
- Page copy: intro ("As7ab is free for everyone. Advertising is how we keep it that way."), table of the four slots with sizes from spec §8, form (name, business, email, phone, preferred slot select, message, hidden `website_url`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/rate-limit.test.ts
import { SlidingLimiter } from '@/lib/rate-limit'
test('one per minute per key', () => {
  const l = new SlidingLimiter(1, 60_000)
  expect(l.allow('1.1.1.1', 0)).toBe(true); expect(l.allow('1.1.1.1', 30_000)).toBe(false)
  expect(l.allow('2.2.2.2', 30_000)).toBe(true); expect(l.allow('1.1.1.1', 60_001)).toBe(true)
})
```

- [ ] **Step 2: Run to verify it fails.** → **Step 3: Implement.** → **Step 4: Tests, lint, build green.**

- [ ] **Step 5: Commit** — `git commit -m "feat: advertise page with rate-limited ad request form"`.

---

### Task 10: Admin area — queue, listings, ads, categories, admins

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/actions.ts`, `app/admin/listings/page.tsx`, `app/admin/ads/page.tsx`, `app/admin/categories/page.tsx`, `app/admin/admins/page.tsx`, `app/admin/settings/page.tsx`, `lib/data/admin.ts`, `lib/data/settings.ts`, `components/AdForm.tsx`, `components/AdminNav.tsx`, `components/Announcement.tsx`
- Test: `tests/db/rls.test.ts` (extend), `tests/unit/admin-actions-guard.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 4), `adInputSchema`, `categoryInputSchema`, data layer.
- Produces `lib/data/admin.ts`: `getQueue(sb): Promise<{ pending: AdminListingRow[]; flagged: AdminListingRow[] }>`, `getAllListings(sb, { status?, q?, page })`, `getAds(sb)`, `getAdRequests(sb)`, `getAllCategories(sb)`, `getAdmins(sb)`.
- Produces `app/admin/actions.ts`, each starting with `requireAdmin()`: `approveListing(id)`, `rejectListing(id, reason: string)` (reason 3–300 chars required), `hideListing(id)`, `clearReviewFlag(id)`, `deleteListingAsAdmin(id)`, `saveAd(prev, formData)` (create or update; banner uploaded by the browser to `ad-banners/<uuid>.<ext>` then path posted), `toggleAd(id, isActive)`, `deleteAd(id)`, `setAdRequestStatus(id, status)`, `saveCategory(prev, formData)`, `toggleCategory(id, isActive)`, `promoteAdmin(email)` / `demoteAdmin(email)` via RPC `set_admin_by_email`, mapping `SELF_DEMOTE` → "You can't remove your own admin access." and `false` → "No member with that email."
- Produces `lib/data/settings.ts`: `getSettings(sb): Promise<SiteSettings>` (typed object with the six keys, defaults applied) and `saveSettings(prev, formData)` action in `app/admin/actions.ts` validating with `settingsSchema` (tagline ≤120, contact_email email, texts ≤5000, announcement_text ≤200). `Announcement` renders under `TopBar` when `announcement_enabled === 'true'`. Home, About, Terms and the report mailto read from `getSettings` instead of hard-coded copy (About/Terms render text with paragraphs split on blank lines).
- Admin layout: `requireAdmin()` then `AdminNav` (Queue · Listings · Ads · Categories · Admins · Settings); queue page shows counts and per-row preview card with Approve / Reject (inline reason field) / Hide.
- Ads page: table per slot with impressions/clicks and a `AdForm`; ad requests list below with status select.

- [ ] **Step 1: Write the failing tests**

Extend `tests/db/rls.test.ts`: "admin can update any listing status and rejection_reason", "admin can insert/update ads; member cannot", "admin can update categories; member cannot".

```ts
// tests/unit/admin-actions-guard.test.ts — static guard: every exported action calls requireAdmin first
import { readFileSync } from 'node:fs'
test('every admin action starts with requireAdmin()', () => {
  const src = readFileSync('app/admin/actions.ts', 'utf8')
  const fns = [...src.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{\s*([^\n]*)/g)]
  expect(fns.length).toBeGreaterThan(5)
  for (const [, name, firstLine] of fns) expect(firstLine, name).toMatch(/requireAdmin\(\)/)
})
```

(Same pattern for `app/dashboard/actions.ts` with `requireMember()` — add to Task 8's test file now.)

- [ ] **Step 2: Run to verify they fail.** → **Step 3: Implement.** → **Step 4: `npx vitest run && bash scripts/db-test.sh && npm run lint && npm run build` green.**

- [ ] **Step 5: Commit** — `git commit -m "feat: admin area with moderation queue, ads, categories and admin management"`.

---

### Task 11: Design deliverables — style guide, static mockup, screenshots, OG image

**Files:**
- Create: `docs/design/style-guide.md`, `docs/design/mockup.html`, `docs/design/screens/{home-mobile,home-desktop,listing-mobile,search-desktop,dashboard-mobile,admin-queue-desktop}.png`, `public/og.png`, `scripts/screenshots.mjs`

**Interfaces:**
- Consumes: tokens from Task 1, `public/logo.svg`.
- Produces a self-contained `mockup.html` (inline CSS using the same token values, Plus Jakarta Sans from Google Fonts, sample listings with placeholder image blocks) showing the six screens above at 390×844 (mobile) and 1280×800 (desktop) frames, so the owner can share the look before Supabase is set up.
- Produces `scripts/screenshots.mjs`: Playwright (pre-installed Chromium) opens `mockup.html`, screenshots each `[data-screen]` frame into `docs/design/screens/`, and renders `public/og.png` (1200×630: logo, tagline, three sample cards).
- Produces `style-guide.md`: palette with hex and usage, type scale (display 32/40, h1 28, h2 22, body 16, small 14), spacing (4-pt grid), radius, shadow, button variants (primary terracotta, secondary teal outline, WhatsApp green `#25D366` only for the WhatsApp button), card anatomy, ad slot sizes table, logo usage, do/don't list.

- [ ] **Step 1: Write `mockup.html` and `style-guide.md`.**
- [ ] **Step 2: Write `scripts/screenshots.mjs`; run `node scripts/screenshots.mjs`.** Expected: six PNGs and `public/og.png` exist, each > 10 KB.
- [ ] **Step 3: Visually check** each PNG with the Read tool; fix layout issues in `mockup.html` and re-run.
- [ ] **Step 4: Commit** — `git commit -m "docs: design style guide, mockups, screenshots and OG image"`.

---

### Task 12: Setup guide, README, E2E tests (env-gated), final verification

**Files:**
- Create: `docs/SETUP.md`, `README.md`, `playwright.config.ts`, `tests/e2e/public.spec.ts`, `tests/e2e/member-admin.spec.ts`, `tests/e2e/global-setup.ts`, `vercel.json` (only if needed), `.github/workflows/ci.yml`
- Modify: `package.json` scripts (`test:e2e`)

**Interfaces:**
- Consumes: everything.
- Produces `docs/SETUP.md` for a non-developer, in this order with screenshots described in words: (1) create GitHub account and get the repo; (2) Supabase: new project, SQL editor → paste `0001`, `0002`, `0003`, `seed.sql` in order (or `npx supabase db push`), Authentication → URL configuration (site URL + `/auth/callback` redirect), enable Google provider with a Google Cloud OAuth client (exact console steps, authorised redirect URI = `https://<project>.supabase.co/auth/v1/callback`), copy Project URL and anon/publishable key; (3) Vercel: import repo, add the four env vars, deploy; (4) first sign-in then run `update profiles set role='admin' where id = (select id from auth.users where email='<you>')`; (5) custom domain; (6) weekly checklist (queue, ad requests, free-tier pause warning); (7) troubleshooting (magic link in spam, Google "redirect_uri_mismatch", photo upload fails → bucket policies).
- Produces `tests/e2e/*.spec.ts` skipped unless `E2E_SUPABASE_URL` is set: public flow (home loads, search "cake" shows results or empty state, listing page shows contact buttons, placeholder ad shown), member/admin flow using `E2E_MEMBER_TOKEN`/`E2E_ADMIN_TOKEN` cookies set in `global-setup.ts` (documented how to obtain).
- Produces `.github/workflows/ci.yml`: Node 22, `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, DB tests via `services: postgres:16` + `scripts/db-test.sh --external "$DATABASE_URL"` (script accepts an external connection string), `npm run build`.

- [ ] **Step 1: Write the docs, config and E2E specs.**
- [ ] **Step 2: Run the full local verification:** `npm run lint && npx tsc --noEmit && npx vitest run && bash scripts/db-test.sh && npm run build`. Expected: all green. E2E: `npx playwright test` reports all tests skipped (no `E2E_SUPABASE_URL`), exit 0.
- [ ] **Step 3: Commit** — `git commit -m "docs: setup guide, README, CI and env-gated E2E tests"`.

---

## Self-review notes

- Spec coverage: §5 pages → Tasks 4, 7, 8, 9, 10; §6 data → Tasks 2, 3; §7 model/RLS/storage → Task 3; §8 ads → Tasks 3, 6, 7, 10; §9 search → Task 3 (`search_listings`) + Task 6; §10 design → Tasks 1, 5, 11; §11 errors → Tasks 4 (expired link), 8 (upload errors, cap, resubmit), 10 (self-demote); §12 security → Tasks 3, 4, 8, 9, 10; §13 testing → unit/component/DB across tasks, E2E in Task 12; §14 setup → Task 12.
- Not runnable in this sandbox: Playwright E2E against Supabase, storage policies (`0003`), Google OAuth. These are verified on the owner's project after setup; `docs/SETUP.md` includes the manual checklist from spec §13.
- Names used consistently: `createClient` (server), `createBrowserClient` (browser), `requireMember`, `requireAdmin`, `decideRedirect`, `getAdForSlot`, `search_listings`, `set_admin_by_email`, `FormState`, `zodToFieldErrors`, `ListingCardData`.
