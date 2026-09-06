-- ============================================================
-- Migration: Storage buckets for images
-- ============================================================
-- Creates public buckets for store logos/banners and product images.
-- RLS policies on storage.objects control who can upload/view.

-- --- Buckets ---------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('stores', 'stores', true, 5242880, '{image/png,image/jpeg,image/webp,image/gif}'),
  ('products', 'products', true, 5242880, '{image/png,image/jpeg,image/webp,image/gif}')
on conflict (id) do nothing;

-- --- Storage RLS policies --------------------------------------

-- Public: anyone can view images (bucket is public).
create policy "Public read access for store images"
  on storage.objects for select
  using (bucket_id = 'stores');

create policy "Public read access for product images"
  on storage.objects for select
  using (bucket_id = 'products');

-- Upload: store owners can upload to their own folder (stores/{user_id}/...)
create policy "Store owners can upload store images"
  on storage.objects for insert
  with check (
    bucket_id = 'stores'
    and (string_to_array(name, '/'))[1] = auth.uid()::text
  );

-- Upload: sellers can upload to their store folder (products/{store_id}/...)
create policy "Sellers can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from public.stores
      where id = (string_to_array(storage.objects.name, '/'))[1]::uuid
        and owner_id = auth.uid()
    )
  );

-- Delete: store owners can delete their own images
create policy "Store owners can delete store images"
  on storage.objects for delete
  using (
    bucket_id = 'stores'
    and (string_to_array(storage.objects.name, '/'))[1] = auth.uid()::text
  );

-- Delete: sellers can delete their own product images
create policy "Sellers can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.stores
      where id = (string_to_array(storage.objects.name, '/'))[1]::uuid
        and owner_id = auth.uid()
    )
  );
