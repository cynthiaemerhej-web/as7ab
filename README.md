# As7ab

A free directory for Lebanon: anyone offering a service or selling goods posts
a listing with photos and contact details; visitors search by category, type
or area and get in touch directly. Admins approve listings and manage the
paid ad slots from a built-in back office.

- **Spec:** `docs/superpowers/specs/2026-11-02-as7ab-directory-design.md`
- **Setup for the site owner (non-technical):** `docs/SETUP.md`
- **Design:** `docs/design/style-guide.md`, mockups in `docs/design/mockup.html`, screenshots in `docs/design/screens/`

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4) on Vercel · Supabase (Postgres
with Row Level Security, Auth, Storage) · zod · Vitest · Playwright.

## Develop

```bash
cp .env.example .env.local   # fill in your Supabase project values
npm install
npm run dev
```

## Test

```bash
npm test            # unit + component tests (Vitest)
npm run test:db     # database rules on a throwaway local Postgres 16
npm run lint && npm run typecheck && npm run build
npm run test:e2e    # browser tests; skipped unless E2E_SUPABASE_URL is set (see docs/SETUP.md)
```

## Layout

```
app/          routes (public, /login, /dashboard, /admin) and server actions
components/   UI building blocks (ListingCard, AdBanner, ContactButtons, …)
lib/          helpers, zod schemas, Supabase clients, data access layer
supabase/     SQL migrations (schema, RLS, storage) and seed
scripts/      db-test.sh (local Postgres tests), screenshots.mjs (design PNGs)
tests/        unit, components, db, e2e
docs/         setup guide, design, spec and plan
```
