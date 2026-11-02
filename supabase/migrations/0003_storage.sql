-- Storage buckets and policies. Supabase only (the local test cluster has no
-- storage schema); apply after 0001 and 0002.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('ad-banners', 'ad-banners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can view photos and banners (buckets are public).
create policy "public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "public read ad banners" on storage.objects
  for select using (bucket_id = 'ad-banners');

-- Members manage files only inside their own folder: {user_id}/{listing_id}/file
create policy "members upload own listing photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members update own listing photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members delete own listing photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Admins manage ad banners.
create policy "admins manage ad banners" on storage.objects
  for all to authenticated
  using (bucket_id = 'ad-banners' and public.is_admin())
  with check (bucket_id = 'ad-banners' and public.is_admin());
