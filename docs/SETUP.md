# Setting up As7ab (for the site owner)

This guide takes you from the code to a live website at no monthly cost. You
need about an hour, a Google account, and your regular email. No coding.

You will create three free accounts: **GitHub** (stores the code),
**Supabase** (database, sign-in and photo storage), **Vercel** (hosts the
website). Keep this page open and work top to bottom.

> If anything looks different from these steps, the services sometimes move
> buttons around. The names of the settings stay the same, so look for the
> words in bold.

---

## 1. GitHub — the code

1. Go to github.com and create an account (or sign in).
2. Create a new **repository** called `as7ab`. Keep it **Private**.
3. Upload the project code to it. Whoever gave you this code can push it for
   you; if you have the folder on your computer and Git installed:

```bash
cd as7ab
git remote add origin https://github.com/YOUR-USERNAME/as7ab.git
git push -u origin main
```

## 2. Supabase — database, sign-in, photos

### 2.1 Create the project

1. Go to supabase.com → **Start your project** → sign in with GitHub.
2. **New project**. Name: `as7ab`. Choose a strong database password and
   save it somewhere safe (you rarely need it, but don't lose it). Region:
   **Frankfurt (eu-central-1)** is closest to Lebanon. Plan: **Free**.
3. Wait a minute while it provisions.

### 2.2 Create the tables and rules

1. In the left menu open **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/0001_schema.sql` from the code, copy
   everything, paste it into the editor, press **Run**. You should see
   "Success".
3. Do the same, in this order, for:
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql`
   - `supabase/seed.sql`

   Each one should end with "Success". If one fails, read the red message:
   usually it means a previous file was skipped. Run them in order.

### 2.3 Allow sign-in from your website

1. Left menu → **Authentication** → **URL Configuration**.
2. **Site URL**: for now `http://localhost:3000`. You will change this to your
   real address in step 4.
3. **Redirect URLs** → add:
   - `http://localhost:3000/auth/callback`
   - (after step 3) `https://YOUR-SITE.vercel.app/auth/callback`
   - (if you buy a domain) `https://www.yourdomain.com/auth/callback`

### 2.4 Email sign-in link (works for Hotmail, Gmail, anything)

Nothing to switch on: **Email** provider is enabled by default. On the free
plan Supabase sends a limited number of emails per hour (a few per hour at
the time of writing; check **Authentication → Rate Limits**). That is fine
to start. If the site grows, connect a free email service under
**Project Settings → Authentication → SMTP Settings**.

### 2.5 Google sign-in (optional but recommended)

1. Go to console.cloud.google.com, create a project called **As7ab**.
2. **APIs & Services → OAuth consent screen**: External, app name As7ab,
   your email as support and developer contact. Save. Publish the app.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   Type **Web application**. Under **Authorised redirect URIs** add exactly:

   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

   (Find YOUR-PROJECT-REF in Supabase → **Project Settings → General**. The
   full callback URL is also shown in Supabase under
   Authentication → Providers → Google.)
4. Copy the **Client ID** and **Client secret**.
5. Supabase → **Authentication → Providers → Google**: turn on, paste both,
   **Save**.

### 2.6 Copy two values for the website

Supabase → **Project Settings → API**:

- **Project URL** (looks like `https://abcd1234.supabase.co`)
- **anon public** key (a long string; newer projects call it the
  **publishable** key — either works)

Never share the **service_role** key or put it in the website. It is not
needed anywhere in As7ab.

## 3. Vercel — put the site online

1. Go to vercel.com → sign up with GitHub.
2. **Add New → Project** → import the `as7ab` repository.
3. Before pressing Deploy, open **Environment Variables** and add four:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from 2.6 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon / publishable key from 2.6 |
| `NEXT_PUBLIC_SITE_URL` | `https://as7ab.vercel.app` (you can change later) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the email people should write to |

4. **Deploy**. Two or three minutes later you get an address like
   `https://as7ab-xxxx.vercel.app`. Open it: the home page should load with
   the categories and "No listings yet".
5. Go back to Supabase → Authentication → URL Configuration and set **Site
   URL** to that address, and add `.../auth/callback` to Redirect URLs
   (step 2.3). Also update `NEXT_PUBLIC_SITE_URL` in Vercel → Settings →
   Environment Variables to the same address and **Redeploy**.

## 4. Make yourself admin

1. On your live site, click **Sign in** and sign in once (Google or the
   email link). You now have a member account.
2. Supabase → **SQL Editor** → New query → paste, replacing the email with
   the one you signed in with:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

3. Run it. Refresh the site: the menu under your name now shows **Back
   office**. From there you can add other admins by email (they must sign in
   once first), so you only ever do this SQL step once.

## 5. First things to do in the back office

- **Settings**: set the tagline, contact email, About and Terms text.
- **Categories**: rename, reorder or hide any you don't want.
- **Ads**: nothing to do until someone asks. Requests from the Advertise page
  appear at the bottom of this tab.
- Post a first listing yourself so the home page isn't empty, then approve it
  from **Queue**.

## 6. Your own domain (optional)

Buy a domain (for example on Namecheap or GoDaddy). In Vercel → Project →
**Settings → Domains** add it and follow the DNS instructions shown. Then
update **Site URL** / Redirect URLs in Supabase and `NEXT_PUBLIC_SITE_URL` in
Vercel to the new address, and redeploy.

## 7. Weekly routine (5 minutes)

- Open **Back office → Queue**: approve or reject new listings. Reasons you
  type are shown to the member.
- **Ads**: answer new requests; switch ads on/off; check views and clicks.
- Keep the site alive: the Supabase free plan **pauses a project after about
  a week without activity**. Normal visitors prevent this. If it ever shows
  "paused" in the Supabase dashboard, press **Restore**.

## 8. Checks to do once, from a phone

- Sign in with Google and with an email link (try a Hotmail address).
- Post a listing with 2–3 photos taken on the phone. They should appear
  within a few seconds. If uploads fail, re-run `0003_storage.sql`
  (step 2.2) and make sure the two buckets exist under **Storage**.
- Open a listing and press **WhatsApp**: it must open WhatsApp with the right
  number.
- Sign in as a second member and confirm you cannot see /admin.

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| Sign-in email never arrives | Check spam. Free-plan email limits are low; wait an hour or set up SMTP (2.4). |
| Google shows `redirect_uri_mismatch` | The URI in Google Cloud must be exactly the Supabase callback from 2.5, with no trailing slash. |
| "That link has expired" | Links are single-use and expire after an hour. Request a new one. |
| Photos don't upload | Buckets missing or policies not applied: re-run `0003_storage.sql`. |
| Home page says it can't connect | One of the four environment variables in Vercel is wrong. Fix and **Redeploy**. |
| `/admin` shows "page not found" for you | You are not admin yet: repeat step 4 with the exact email you signed in with. |

## 10. For whoever maintains the code

- Database changes go in new files under `supabase/migrations/` and are
  tested locally with `npm run test:db` (needs Postgres 16 installed).
- `npm test` runs unit and component tests; `npm run build` must pass before
  deploying. The GitHub Actions workflow in `.github/workflows/ci.yml` runs
  all of this on every push.
- **Running the browser tests** (`npm run test:e2e`) needs a real Supabase
  project, ideally a separate "staging" one:

```bash
export E2E_SUPABASE_URL=https://xxxx.supabase.co
export E2E_SUPABASE_ANON_KEY=...
export E2E_SUPABASE_SERVICE_ROLE_KEY=...   # test project only, never the live one
export E2E_MEMBER_EMAIL=member@example.com # any address; the test mints a sign-in link, no email is sent
export E2E_ADMIN_EMAIL=admin@example.com   # must already be an admin in that project
npx playwright install chromium
npm run test:e2e
```
