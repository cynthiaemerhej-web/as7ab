-- Row Level Security, guard triggers and RPCs. All authorisation lives here.

-- ---------------------------------------------------------------- helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- --------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Members cannot change their own role. Runs only for API callers (a JWT is
-- present); the owner setting the first admin from the SQL editor is unaffected.
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  new.id := old.id;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

grant select on public.public_profiles to anon, authenticated, service_role;

-- ------------------------------------------------------------- categories
alter table public.categories enable row level security;

create policy categories_select on public.categories
  for select using (is_active or public.is_admin());

create policy categories_admin_write on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- listings
alter table public.listings enable row level security;

create policy listings_select_public on public.listings
  for select using (status = 'approved');

create policy listings_select_own on public.listings
  for select to authenticated using (owner_id = auth.uid());

create policy listings_select_admin on public.listings
  for select to authenticated using (public.is_admin());

create policy listings_insert_own on public.listings
  for insert to authenticated with check (owner_id = auth.uid());

create policy listings_update_own on public.listings
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy listings_delete_own on public.listings
  for delete to authenticated using (owner_id = auth.uid());

create policy listings_admin_all on public.listings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Members always start pending and may not exceed the cap.
create or replace function public.enforce_listing_insert()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    new.status := 'pending';
    new.needs_review := false;
    new.rejection_reason := null;
    new.views := 0;
    new.hidden_by_admin := false;
    if not exists (select 1 from public.categories where id = new.category_id and is_active) then
      raise exception 'CATEGORY_INACTIVE' using hint = 'Pick a category from the current list';
    end if;
    -- Hidden listings don't count: members free a slot by hiding or deleting (spec §11).
    if (select count(*) from public.listings where owner_id = new.owner_id and status <> 'hidden') >= 10 then
      raise exception 'LISTING_LIMIT' using hint = 'A member may have at most 10 visible listings';
    end if;
  end if;
  return new;
end;
$$;

create trigger listings_enforce_insert before insert on public.listings
  for each row execute function public.enforce_listing_insert();

-- Members may only move approved<->hidden and rejected->pending; everything
-- moderation-related is reverted. Editing a live listing flags it for review.
create or replace function public.enforce_listing_member_update()
returns trigger language plpgsql as $$
declare
  content_changed boolean;
begin
  -- Admins skip the guard. So do our own security-definer RPCs, which run as the
  -- function owner rather than the API roles (no client-settable flag involved).
  if public.is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.owner_id := old.owner_id;
  new.slug := old.slug;
  new.views := old.views;
  new.needs_review := old.needs_review;
  new.rejection_reason := old.rejection_reason;
  new.hidden_by_admin := old.hidden_by_admin;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    if old.status = 'approved' and new.status = 'hidden' then
      null; -- member hides their own listing
    elsif old.status = 'hidden' and new.status = 'approved' and not old.hidden_by_admin then
      null; -- member unhides a listing they hid themselves
    elsif old.status = 'rejected' and new.status = 'pending' then
      new.rejection_reason := null;
    else
      new.status := old.status;
    end if;
  end if;

  content_changed :=
    new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.category_id is distinct from old.category_id
    or new.type is distinct from old.type
    or new.area is distinct from old.area
    or new.phone is distinct from old.phone
    or new.whatsapp is distinct from old.whatsapp
    or new.email is distinct from old.email
    or new.instagram is distinct from old.instagram
    or new.website is distinct from old.website;

  if new.category_id is distinct from old.category_id
     and not exists (select 1 from public.categories where id = new.category_id and is_active) then
    raise exception 'CATEGORY_INACTIVE' using hint = 'Pick a category from the current list';
  end if;

  if content_changed and old.status in ('approved', 'hidden') then
    new.needs_review := true;
  end if;

  return new;
end;
$$;

create trigger listings_enforce_member_update before update on public.listings
  for each row execute function public.enforce_listing_member_update();

-- --------------------------------------------------------- listing_photos
alter table public.listing_photos enable row level security;

create policy listing_photos_select on public.listing_photos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'approved' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_photos_owner_write on public.listing_photos
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and (l.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and (l.owner_id = auth.uid() or public.is_admin())));

create or replace function public.enforce_photo_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.listing_photos where listing_id = new.listing_id) >= 6 then
    raise exception 'PHOTO_LIMIT' using hint = 'A listing may have at most 6 photos';
  end if;
  return new;
end;
$$;

create trigger listing_photos_enforce_limit before insert on public.listing_photos
  for each row execute function public.enforce_photo_limit();

-- A photo row may only point at a file inside its own listing's folder
-- ({owner_id}/{listing_id}/...), so nobody can attach (and later delete) someone else's file.
create or replace function public.enforce_photo_path()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select owner_id into owner from public.listings where id = new.listing_id;
  if owner is null or position(owner::text || '/' || new.listing_id::text || '/' in new.storage_path) <> 1 then
    raise exception 'PHOTO_PATH' using hint = 'storage_path must be under {owner_id}/{listing_id}/';
  end if;
  return new;
end;
$$;

create trigger listing_photos_enforce_path before insert or update on public.listing_photos
  for each row execute function public.enforce_photo_path();

-- Changing photos on a live (or hidden) listing is an edit: flag it for an admin re-check.
-- Security definer so the listings guard (which ignores non-API roles) lets the flag through.
create or replace function public.flag_listing_on_photo_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lid uuid := coalesce(new.listing_id, old.listing_id);
begin
  if not public.is_admin() then
    update public.listings set needs_review = true where id = lid and status in ('approved', 'hidden');
  end if;
  return coalesce(new, old);
end;
$$;

create trigger listing_photos_flag_review after insert or delete on public.listing_photos
  for each row execute function public.flag_listing_on_photo_change();

-- -------------------------------------------------------------------- ads
alter table public.ads enable row level security;

create policy ads_select_live on public.ads
  for select using (
    (is_active and starts_at <= public.beirut_today() and ends_at >= public.beirut_today())
    or public.is_admin()
  );

create policy ads_admin_write on public.ads
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ ad_requests
alter table public.ad_requests enable row level security;

create policy ad_requests_insert_anyone on public.ad_requests
  for insert with check (true);

create policy ad_requests_admin on public.ad_requests
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Requests from the public always start as 'new' so none can hide from the queue.
create or replace function public.enforce_ad_request_insert()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    new.status := 'new';
  end if;
  return new;
end;
$$;

create trigger ad_requests_enforce_insert before insert on public.ad_requests
  for each row execute function public.enforce_ad_request_insert();

-- ---------------------------------------------------------- site_settings
alter table public.site_settings enable row level security;

create policy site_settings_select on public.site_settings
  for select using (true);

create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------- RPCs
create or replace function public.increment_listing_views(p_listing uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings set views = views + 1 where id = p_listing and status = 'approved';
$$;

create or replace function public.record_ad_impression(p_ad uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ads set impressions = impressions + 1 where id = p_ad and is_active;
$$;

create or replace function public.record_ad_click(p_ad uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ads set clicks = clicks + 1 where id = p_ad and is_active;
$$;

-- Full-text search over approved listings (security invoker: RLS applies).
create or replace function public.search_listings(
  q text,
  p_category int,
  p_type text,
  p_area text,
  p_limit int,
  p_offset int
)
returns setof public.listings
language sql
stable
as $$
  select l.*
  from public.listings l
  where l.status = 'approved'
    and (p_category is null or l.category_id = p_category)
    and (p_type is null or l.type = p_type)
    and (p_area is null or l.area = p_area)
    and (
      coalesce(q, '') = ''
      or l.search_vector @@ websearch_to_tsquery('simple', q)
      or l.title ilike '%' || q || '%'
    )
  order by
    case when coalesce(q, '') = '' then 0
         else ts_rank(l.search_vector, websearch_to_tsquery('simple', q)) end desc,
    l.created_at desc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.count_search_listings(
  q text,
  p_category int,
  p_type text,
  p_area text
)
returns bigint
language sql
stable
as $$
  select count(*)
  from public.listings l
  where l.status = 'approved'
    and (p_category is null or l.category_id = p_category)
    and (p_type is null or l.type = p_type)
    and (p_area is null or l.area = p_area)
    and (
      coalesce(q, '') = ''
      or l.search_vector @@ websearch_to_tsquery('simple', q)
      or l.title ilike '%' || q || '%'
    );
$$;

-- Admin management by email. Returns false when no such member exists.
create or replace function public.set_admin_by_email(target_email text, make_admin boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  select u.id into target from auth.users u where lower(u.email) = lower(trim(target_email)) limit 1;
  if target is null then
    return false;
  end if;
  if target = auth.uid() and not make_admin then
    raise exception 'SELF_DEMOTE';
  end if;
  update public.profiles set role = case when make_admin then 'admin' else 'member' end where id = target;
  return true;
end;
$$;

-- Admins: list of admin accounts with emails for the back office.
create or replace function public.list_admins()
returns table (id uuid, display_name text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'admin' and public.is_admin()
  order by p.display_name;
$$;
