-- ============================================================
-- Migration: Update store RPC functions with district & village
-- ============================================================

-- Recreate create_store_application with district & village params
create or replace function public.create_store_application(
  p_slug text,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
  p_district text,
  p_village text,
  p_logo_url text,
  p_banner_url text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_store_id uuid;
begin
  if v_owner is null then
    raise exception 'Permission denied: sign in required' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.profiles
    where id = v_owner and role in ('SELLER','ADMIN','SUPER_ADMIN')
  ) then
    raise exception 'Only buyers can open a store application'
      using errcode = '42501';
  end if;

  insert into public.stores (
    owner_id, slug, name, tagline, description, contact_email,
    phone, province, city, district, village, logo_url, banner_url, status
  )
  values (
    v_owner, p_slug, p_name, nullif(p_tagline, ''), nullif(p_description, ''),
    p_contact_email, nullif(p_phone, ''), p_province, p_city,
    nullif(p_district, ''), nullif(p_village, ''),
    nullif(p_logo_url, ''), nullif(p_banner_url, ''), 'PENDING'
  )
  returning id into v_store_id;

  return v_store_id;
end;
$$;

-- Recreate update_store with district & village params
create or replace function public.update_store(
  p_store_id uuid,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
  p_district text,
  p_village text,
  p_logo_url text,
  p_banner_url text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.stores where id = p_store_id;

  if v_owner is null then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;

  if v_owner <> auth.uid() and public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: store owner or admin required'
      using errcode = '42501';
  end if;

  if v_owner = auth.uid() and exists (
    select 1 from public.stores
    where id = p_store_id and status in ('SUSPENDED','CLOSED')
  ) then
    raise exception 'Suspended or closed stores cannot be edited'
      using errcode = '42501';
  end if;

  update public.stores
  set name = p_name,
      tagline = nullif(p_tagline, ''),
      description = nullif(p_description, ''),
      contact_email = p_contact_email,
      phone = nullif(p_phone, ''),
      province = p_province,
      city = p_city,
      district = nullif(p_district, ''),
      village = nullif(p_village, ''),
      logo_url = nullif(p_logo_url, ''),
      banner_url = nullif(p_banner_url, ''),
      updated_at = now()
  where id = p_store_id;
end;
$$;