-- ============================================================
-- Migration: Avatar storage bucket
-- ============================================================
-- Public bucket for user profile photos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, '{image/png,image/jpeg,image/webp,image/gif}')
on conflict (id) do nothing;

-- Public read (avatars are public)
create policy "Public read access for avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload to their own folder (avatars/{user_id}/...)
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (string_to_array(storage.objects.name, '/'))[1] = auth.uid()::text
  );

-- Users can delete their own avatars
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (string_to_array(storage.objects.name, '/'))[1] = auth.uid()::text
  );