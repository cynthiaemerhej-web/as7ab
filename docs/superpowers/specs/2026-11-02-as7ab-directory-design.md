# As7ab — community services & goods directory (design spec)

Date: 2026-11-02
Status: draft for owner review
Owner: Cynthia Merhej

## 1. Purpose

As7ab ("friends" in Arabic, written the Lebanese texting way) is a free,
English-language online directory
for Lebanon. Anyone who offers a service or sells goods (a parent selling
birthday supplies, a tutor, a plumber, a home baker) signs up, posts a
listing with photos and contact details, and visitors find them by
searching or browsing categories and contact them directly.

The site itself never handles bookings or payments between members.
Everything is free for members. The only paid feature is advertising:
businesses pay the site owner for banner slots, arranged by contacting the
owner (no card checkout in v1).

Success at launch means:

- A member can sign up with Google or any email address (Gmail, Hotmail,
  etc.) and publish a listing in under five minutes from a phone.
- A visitor can find a relevant listing by category, type, area, or name
  and reach the member by phone, WhatsApp, email, or Instagram.
- An admin team can approve or reject listings, switch ads on and off, and
  add other admins without touching code.
- Hosting costs nothing at launch (Vercel free tier + Supabase free tier).

## 2. What was agreed with the owner

Stated by the owner:

- Free for everyone; paid ads only; ad payment arranged offline for now.
- Open to anyone with a service or goods, not just parents.
- Lebanon; English only for v1.
- Moderated by the owner plus other admins they appoint.
- Members provide: business details, photos, Instagram page, phone, email.
- Visitors search by category, type, or name. Feel like Dubizzle / OLX.
- Name: **As7ab** (owner's choice, replacing the earlier working name As7ab;
  domain availability unverified at time of writing).
- Hosting: free tiers set up with step-by-step instructions.

Assumptions made (owner may correct):

- Sign-in by Google OAuth plus email magic link. Microsoft OAuth is not in
  v1; Hotmail/Outlook users sign in with the email link, which needs no
  extra setup. Microsoft OAuth can be added later.
- Contact details shown on a listing are those the member chooses to show.
  Phone is optional to display; WhatsApp button appears only if the member
  provides a WhatsApp number.
- Launch areas are the Lebanese districts (list in §6) plus "All Lebanon /
  Online".

## 3. Approach

**Next.js (App Router, TypeScript, Tailwind CSS) on Vercel + Supabase**
(Postgres, Auth, Storage). Chosen over a no-code tool (free tiers cap
records and make ad slots awkward) and over a static prototype (no real
sign-in, dead end for launch).

Why this fits: the owner is not a developer, so the whole backend
(database, login, file storage, access rules) is one managed service with a
web dashboard; the front end deploys from GitHub with no servers to run;
both have free tiers that comfortably cover a city-sized directory.

## 4. Users and roles

| Role | Who | Can |
|------|-----|-----|
| Visitor | anyone, not signed in | browse, search, view listings, open contact links, submit an ad request |
| Member | signed-in user | everything a visitor can, plus create/edit/hide their own listings (max 10), edit their profile |
| Admin | member with `role = 'admin'` | everything a member can, plus approve/reject/hide any listing, manage ads and ad requests, manage categories, promote/demote admins |

The first admin is set by the owner once, by running one SQL statement in
the Supabase dashboard (documented in setup). After that admins are managed
in the Admin area.

## 5. Pages and flows

Public:

- `/` Home: search bar, category tiles, "Latest listings" grid, home banner
  ad slot, sidebar ad slot (desktop) / inline (mobile).
- `/search` Results: query `q`, filters `category`, `type` (service |
  goods), `area`. Grid of listing cards, paginated 24 per page, an inline
  ad card after every 8th result.
- `/c/[category-slug]` Category page: same as search, pre-filtered.
- `/l/[listing-slug]` Listing detail: photo gallery (1–6 photos), title,
  category, type, area, description, member display name, contact buttons
  (Call, WhatsApp, Email, Instagram, Website — each only if provided),
  "Report this listing" mailto link to the site contact address, bottom ad
  slot. Increments a view counter.
- `/advertise` Why advertise, the four slots with sizes, request form
  (name, business, email, phone, preferred slot, message). Saves an
  `ad_requests` row and shows a thank-you; admin sees it in the queue.
- `/login` Google button + email magic-link form. `/auth/callback` handles
  the return.
- `/about`, `/terms` short static pages (terms: no illegal goods, accurate
  contact details, admins may remove any listing).

Member (signed in):

- `/dashboard` My listings with status badges (Pending, Live, Rejected +
  reason, Hidden), buttons New / Edit / Hide / Unhide / Delete.
- `/dashboard/listings/new` and `/dashboard/listings/[id]/edit` Listing
  form (§7). Create → status `pending`. Edit of a live listing stays live
  and sets `needs_review = true` so an admin re-checks it.
- `/dashboard/profile` Display name, default phone/WhatsApp/email used to
  prefill new listings.

Admin:

- `/admin` Queue: pending listings and flagged (needs_review) listings, each
  with a preview and Approve / Reject (with reason) / Hide buttons.
- `/admin/listings` All listings, filter by status, search by title/owner.
- `/admin/ads` Active and scheduled ads per slot; create/edit: banner
  image, link URL, advertiser name, slot, start/end dates, active toggle;
  shows impressions and clicks. Ad requests list with status
  (new / contacted / closed).
- `/admin/categories` Add / rename / reorder / hide categories.
- `/admin/admins` List admins; promote a member by email; demote (cannot
  demote yourself).
- `/admin/settings` Back-office text settings editable without code: site
  tagline, contact email shown on the site, About page text, Terms page
  text, optional announcement banner (text + on/off) shown under the top
  bar. Stored in `site_settings`.

Route protection: middleware redirects unauthenticated users away from
`/dashboard*` and `/admin*`; `/admin*` additionally requires `role = 'admin'`
checked server-side on every request (never only in the browser).

## 6. Reference data

Categories at launch (admins can change later): Parties & Events, Food &
Catering, Education & Tutoring, Health & Beauty, Home & Repairs, Kids &
Baby, Fashion & Accessories, Handmade & Gifts, Tech & Electronics, Cars &
Transport, Professional Services, Photography & Media, Other.

Listing type: `service` or `goods`.

Areas (Lebanese districts): Beirut, Metn, Keserwan, Jbeil, Baabda, Aley,
Chouf, Batroun, Koura, Zgharta, Bcharre, Tripoli, Minieh-Danniyeh, Akkar,
Zahle, West Bekaa, Rachaya, Baalbek, Hermel, Saida, Jezzine, Sour,
Nabatieh, Marjeyoun, Hasbaya, Bint Jbeil, plus "All Lebanon / Online".
Stored as a fixed enum-like text list in code, not a table (rarely
changes).

Phone format: Lebanon, +961. Input accepts local formats (03 123 456,
71 123 456) and normalises to E.164 for the WhatsApp link
(`https://wa.me/961XXXXXXXX`).

## 7. Data model (Supabase Postgres)

```
profiles          id uuid PK = auth.users.id
                  display_name text not null
                  phone text, whatsapp text, contact_email text
                  role text not null default 'member'  -- 'member' | 'admin'
                  created_at timestamptz

categories        id serial PK, slug text unique, name text,
                  icon text, sort_order int, is_active bool default true

listings          id uuid PK default gen_random_uuid()
                  owner_id uuid FK profiles(id) on delete cascade
                  slug text unique                 -- from title + short id
                  title text not null (3..80)
                  description text not null (20..2000)
                  category_id int FK categories(id)
                  type text not null               -- 'service' | 'goods'
                  area text not null               -- one of §6 areas
                  phone text, whatsapp text, email text,
                  instagram text, website text
                  status text not null default 'pending'
                    -- 'pending' | 'approved' | 'rejected' | 'hidden'
                  needs_review bool not null default false
                  rejection_reason text
                  views int not null default 0
                  created_at, updated_at timestamptz
                  search_vector tsvector (generated from title+description)

listing_photos    id uuid PK, listing_id uuid FK on delete cascade,
                  storage_path text, sort_order int   -- max 6 per listing

ads               id uuid PK, advertiser_name text, link_url text,
                  image_path text, slot text
                    -- 'home_banner' | 'sidebar' | 'search_inline' | 'listing_bottom'
                  starts_at date, ends_at date, is_active bool,
                  impressions int default 0, clicks int default 0,
                  created_by uuid, created_at

ad_requests       id uuid PK, name, business, email, phone, slot,
                  message, status text default 'new'
                    -- 'new' | 'contacted' | 'closed'
                  created_at

site_settings     key text PK, value text not null, updated_at timestamptz
                  -- keys: tagline, contact_email, about_text, terms_text,
                  --       announcement_text, announcement_enabled
```

Indexes: `listings(status, created_at desc)`, `listings(category_id)`,
`listings(area)`, GIN on `search_vector`, `ads(slot, is_active)`.

Profile row is created automatically by a database trigger on
`auth.users` insert (display name from OAuth metadata or the email local
part).

### Access rules (Row Level Security, enforced in the database)

- `profiles`: anyone can read `display_name`; a user can update their own
  row except `role`; admins can update `role`.
- `categories`: public read of active rows; admin write.
- `listings`: public read where `status = 'approved'`; owner reads own rows
  in any status; owner inserts with `status='pending'` only and at most 10
  listings; owner updates own rows, with a trigger enforcing the only
  status changes a member may make: `approved → hidden` and
  `hidden → approved` (the dashboard Hide / Unhide buttons) and
  `rejected → pending` (resubmit after fixing). Any other status value,
  and any change to `needs_review`, `rejection_reason`, `views`, or
  `owner_id`, is reverted by the trigger. Editing the content of an
  `approved` row sets `needs_review = true`. Admins have full access.
- `listing_photos`: public read for photos of approved listings; owner
  manages photos of own listings; admin full.
- `ads`: public read of active rows within date range; admin write.
  Impressions/clicks are incremented through a security-definer RPC, not
  by direct update.
- `ad_requests`: anyone may insert; only admins may read/update.
- `site_settings`: public read; admin write.
- `views` on listings incremented through a security-definer RPC.

`is_admin()` is a SQL function reading `profiles.role` for `auth.uid()`,
used in policies.

### Storage

One public bucket `listing-photos`, path `{owner_id}/{listing_id}/{uuid}.jpg`.
Upload policy: authenticated users only, into their own `{owner_id}/`
folder, `image/jpeg|png|webp`, max 5 MB. Images are resized client-side
to max 1600px before upload to keep the free storage quota healthy. One
public bucket `ad-banners`, admin upload only.

## 8. Ads

Four slots with fixed sizes so advertisers know what to supply:

| Slot | Where | Size (desktop / mobile) |
|------|-------|-------------------------|
| home_banner | top of home page under search | 970×250 / 360×120 |
| sidebar | right column on home and search (desktop); between sections on mobile | 300×250 |
| search_inline | a card in the results grid after every 8th result | card size (same as listing card, ~300×300) |
| listing_bottom | under contact buttons on a listing | 728×90 / 360×120 |

Behaviour: if several ads are active for a slot, pick one at random per
page render (pages with ad slots are rendered dynamically, not cached
statically). If none, show an "Advertise here" placeholder linking to
`/advertise`. Each render calls the impression RPC; the ad link goes
through `/go/[adId]` which records a click then redirects. Banners carry a
small "Ad" label.

## 9. Search

Postgres full-text search on `search_vector` (title weighted A, description
B) plus `ILIKE` fallback on title for partial words, combined with the
category / type / area filters. Results ordered by text rank when `q` is
set, otherwise newest first. No external search service in v1.

## 10. Design (look and feel)

- Mobile-first: most Lebanese users will arrive from WhatsApp links on a
  phone. Every page usable at 360 px wide; contact buttons are large and
  thumb-reachable.
- Layout: top bar (logo, search, "Post a listing" button, avatar); card
  grid 2 columns on mobile, 3–4 on desktop; listing card = photo, title,
  category chip, area, type badge.
- Tone: warm and neighbourly, not corporate. Palette: primary terracotta
  `#D96C47`, accent deep teal `#1F6F78`, background warm off-white
  `#FAF7F2`, text `#1E1E1E`. Font: Plus Jakarta Sans (Google Fonts) with
  system fallback. Rounded corners (12 px), soft shadows, generous
  whitespace.
- Logo: wordmark "As7ab" with a simple mark of two overlapping rounded
  circles (two friends) in primary and accent; SVG.
- Accessibility: WCAG AA contrast, keyboard-reachable controls, alt text on
  photos (listing title), form errors announced.
- Deliverables: the live site plus a short visual style sheet
  (`docs/design/style-guide.md`) and a screenshot set so the owner can
  share the look with others.

## 11. Error handling and edge cases

- Sign-in link expired → clear message with a "send again" button.
- Upload fails or wrong file type → inline error on that photo slot; the
  rest of the form is kept.
- Member hits the 10-listing cap → form shows a message and a link to hide
  or delete old ones.
- Listing rejected → member sees the reason in the dashboard and can edit
  and resubmit, which sets status back to `pending` (allowed by the
  trigger in §7).
- Admin tries to demote themselves → blocked with message.
- Deleted listing → photos removed from storage via a database webhook or
  a scheduled cleanup (v1: storage cleanup on delete done in the server
  action; orphan sweep is a later improvement).
- Unknown slug → friendly 404 with search box.
- All server actions validate input with zod; the same schema is used in
  the browser for instant feedback.

## 12. Security notes

- Role checks and all data rules live in Postgres RLS, so a tampered
  browser cannot bypass them.
- Service-role key never ships to the browser; used only in server-side
  code where unavoidable (none planned for v1).
- Rate limiting: Supabase Auth's built-in limits for magic links; listing
  creation capped at 10 per member; ad request form protected by a
  honeypot field and a 1-per-minute per IP limit in the server action.
- Contact links use `rel="noopener"`; user text is rendered as text, never
  HTML.
- Terms page states that admins may remove any content.

## 13. Testing

- Unit (Vitest): zod schemas, phone normaliser, slug generator, ad picker,
  search query builder.
- Database: SQL policy tests run against a local Supabase (pgTAP-style
  assertions via the Supabase CLI) covering: anonymous can't read pending
  listings; member can't set status; non-admin can't read ad requests;
  member can't exceed 10 listings.
- End-to-end (Playwright, against a local Supabase with seed data): visitor
  searches and opens a listing; member signs in with a test magic link,
  creates a listing, sees it pending; admin approves it; it appears
  publicly; ad placeholder shown when no ad; ad shown when seeded.
- Manual checklist before launch: Google sign-in on the real project,
  photo upload from a phone, WhatsApp link opens correctly on iOS and
  Android.

## 14. Hosting and setup (owner-facing)

Documented in `docs/SETUP.md`, written for a non-developer:

1. Create a free GitHub account; the code is pushed to a repository there.
2. Create a free Supabase project; run the provided SQL migrations from
   the dashboard (or `supabase db push`); enable Google provider (needs a
   Google Cloud OAuth client, steps included); set site URL and redirect
   URLs.
3. Create a free Vercel account; import the GitHub repo; paste two
   environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`); deploy.
4. Sign in once, then run the one-line SQL to make that account admin.
5. Optional: buy the domain and point it at Vercel.

Free-tier limits to watch (as of writing; verify in each provider's
pricing page): Supabase pauses free projects after 7 days of no API
activity, 500 MB database, 1 GB storage; Vercel 100 GB bandwidth/month.

## 15. Out of scope for v1 (possible later)

Arabic / French UI, Microsoft OAuth, in-site messaging, reviews and
ratings, card payments for ads, listing boosts, email notifications to
members on approve/reject (v1 shows status in dashboard only), map view,
mobile app, automated spam detection.

## 16. Project structure (for the implementation plan)

```
as7ab/
  app/                # Next.js routes as in §5
  components/         # UI: ListingCard, AdSlot, SearchBar, PhotoUploader...
  lib/                # supabase clients, schemas (zod), phone, slug, search
  supabase/
    migrations/       # SQL: tables, RLS, functions, triggers, seed
    seed.sql
  docs/
    SETUP.md
    design/style-guide.md
    superpowers/specs/, superpowers/plans/
  tests/              # unit, e2e
```
