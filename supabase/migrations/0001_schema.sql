-- As7ab schema. Runs on Supabase (auth schema, API roles and pgcrypto are
-- provided by the platform) and on the local test cluster (tests/db/shim.sql).
create extension if not exists pgcrypto;

-- The site operates on Lebanon time: "today" for ad scheduling is the Beirut calendar date.
create or replace function public.beirut_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Beirut')::date;
$$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  phone text,
  whatsapp text,
  contact_email text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(coalesce(new.email, 'member'), '@', 1),
        'member'
      ),
      60
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- categories
create table public.categories (
  id serial primary key,
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 40),
  icon text not null default 'shapes',
  sort_order int not null default 100,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 20 and 2000),
  category_id int not null references public.categories (id),
  type text not null check (type in ('service', 'goods')),
  -- Keep this list identical to lib/areas.ts (a unit test checks it).
  area text not null check (area in ('Beirut', 'Metn', 'Keserwan', 'Jbeil', 'Baabda', 'Aley', 'Chouf', 'Batroun', 'Koura', 'Zgharta', 'Bcharre', 'Tripoli', 'Minieh-Danniyeh', 'Akkar', 'Zahle', 'West Bekaa', 'Rachaya', 'Baalbek', 'Hermel', 'Saida', 'Jezzine', 'Sour', 'Nabatieh', 'Marjeyoun', 'Hasbaya', 'Bint Jbeil', 'All Lebanon / Online')),
  phone text,
  whatsapp text,
  email text,
  instagram text,
  website text check (website is null or website ~* '^https?://'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  hidden_by_admin boolean not null default false,  -- set when an admin hides; members cannot unhide
  needs_review boolean not null default false,
  rejection_reason text,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored
);

create index listings_status_created_idx on public.listings (status, created_at desc);
create index listings_category_idx on public.listings (category_id);
create index listings_area_idx on public.listings (area);
create index listings_owner_idx on public.listings (owner_id);
create index listings_search_idx on public.listings using gin (search_vector);

-- ---------------------------------------------------------- listing_photos
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, sort_order);

-- --------------------------------------------------------------------- ads
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser_name text not null check (char_length(advertiser_name) between 1 and 80),
  link_url text not null,
  image_path text not null,
  slot text not null check (slot in ('home_banner', 'sidebar', 'search_inline', 'listing_bottom')),
  starts_at date not null default public.beirut_today(),
  ends_at date not null default public.beirut_today(),
  is_active boolean not null default true,
  impressions int not null default 0,
  clicks int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index ads_slot_active_idx on public.ads (slot, is_active, starts_at, ends_at);

-- ------------------------------------------------------------- ad_requests
create table public.ad_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text,
  email text not null,
  phone text,
  slot text not null,
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------- site_settings
create table public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Public, limited view of profiles: only what a listing page needs.
create view public.public_profiles with (security_invoker = false) as
  select id, display_name from public.profiles;
