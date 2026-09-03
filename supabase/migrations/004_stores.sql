-- ============================================================
-- Warungpedia migration 004 — Seller system (stores)
-- ============================================================
-- Defines `stores`: the seller-owned entity behind every storefront.
-- A store is created by a BUYER as a PENDING application, reviewed by an
-- admin (security-definer functions below), and only becomes ACTIVE after
-- approval — at which point the owner's profile role is elevated to SELLER.
--
-- Roles are never self-assigned: RLS lets an owner create/update their own
-- PENDING (or REJECTED → resubmit) row, and any attempt to set status to
-- 'ACTIVE' by the owner fails at the RLS layer. Approval/suspension only
-- happens through the admin-only definer functions.

create table if not exists public.stores (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null unique references public.profiles (id) on delete cascade,
  slug            text not null unique,
  name            text not null,
  tagline         text,
  description     text,
  logo_url        text,
  banner_url      text,
  contact_email   text not null default '',
  phone           text,
  province        text,
  city            text,
  status          text not null default 'PENDING'
                    check (status in ('PENDING','ACTIVE','REJECTED','SUSPENDED','CLOSED')),
  rejection_reason text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index stores_status_idx on public.stores (status);
create index stores_owner_idx on public.stores (owner_id);

create trigger stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.stores enable row level security;

-- Read: the public storefront shows ACTIVE stores; owners can always see
-- their own application; admins see everything.
create policy "stores_select_public"
  on public.stores for select
  using (
    status = 'ACTIVE'
    or owner_id = auth.uid()
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Create: a user may open exactly one application (unique owner_id) with a
-- PENDING status. They cannot self-approve.
create policy "stores_insert_owner_pending"
  on public.stores for insert
  with check (owner_id = auth.uid() and status = 'PENDING');

-- Update: owners may edit their own row but can only set status to PENDING
-- (editing a draft, or resubmitting a rejected application). Only admins may
-- move a store into ACTIVE / SUSPENDED / CLOSED (done via definer functions
-- in practice, but the RLS rule closes the loop).
create policy "stores_update_owner_pending"
  on public.stores for update
  using (owner_id = auth.uid() or public.current_role() in ('ADMIN','SUPER_ADMIN'))
  with check (
    (owner_id = auth.uid() and status = 'PENDING')
    or public.current_role() in ('ADMIN','SUPER_ADMIN')
  );

-- Delete: administrative only. Sellers close stores via deny_close_store()
-- (status CLOSED), they never hard-delete.
create policy "stores_delete_admin"
  on public.stores for delete
  using (public.current_role() in ('ADMIN','SUPER_ADMIN'));

-- ============================================================
-- Store mutation functions (security definer)
-- ============================================================
-- All store writes from the app flow through these definer functions so the
-- transition rules live in one auditable place and never depend on a client
-- being careful with RLS. Functions verify ownership/roles internally.

-- Open a store application. Only a BUYER (no store yet) may create one;
-- the store is created as PENDING and can never be self-approved.
create or replace function public.create_store_application(
  p_slug text,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
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
    phone, province, city, logo_url, banner_url, status
  )
  values (
    v_owner, p_slug, p_name, nullif(p_tagline, ''), nullif(p_description, ''),
    p_contact_email, nullif(p_phone, ''), p_province, p_city,
    nullif(p_logo_url, ''), nullif(p_banner_url, ''), 'PENDING'
  )
  returning id into v_store_id;

  return v_store_id;
end;
$$;

-- Update store details. Owners may edit their store while PENDING / ACTIVE /
-- REJECTED (never when SUSPENDED/CLOSED); admins may edit any store. The
-- status column is never changed here.
create or replace function public.update_store(
  p_store_id uuid,
  p_name text,
  p_tagline text,
  p_description text,
  p_contact_email text,
  p_phone text,
  p_province text,
  p_city text,
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
      logo_url = nullif(p_logo_url, ''),
      banner_url = nullif(p_banner_url, ''),
      updated_at = now()
  where id = p_store_id;
end;
$$;

-- Resubmit a rejected application: moves it back to PENDING (clears reason).
create or replace function public.resubmit_store(p_store_id uuid)
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

  if v_owner <> auth.uid() then
    raise exception 'Permission denied: store owner required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'PENDING', rejection_reason = null, approved_at = null, updated_at = now()
  where id = p_store_id and status = 'REJECTED';

  if not found then
    raise exception 'Only rejected applications can be resubmitted'
      using errcode = 'P0002';
  end if;
end;
$$;

-- ============================================================
-- Admin review functions (security definer)
-- ============================================================
-- These bypass RLS but verify the caller's admin status inside the function,
-- so elevation can never be triggered by a non-admin client.

-- Approve: store becomes ACTIVE and the owner's role is elevated to SELLER.
create or replace function public.approve_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'ACTIVE', rejection_reason = null, approved_at = now()
  where id = p_store_id;

  update public.profiles
  set role = 'SELLER'
  where id = (
    select owner_id from public.stores where id = p_store_id
  );

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Reject: store stays visible to its owner with a reason; role unchanged.
create or replace function public.reject_store(p_store_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'REJECTED', rejection_reason = p_reason, approved_at = null
  where id = p_store_id;

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Suspend: hide the storefront (public select requires ACTIVE).
create or replace function public.suspend_store(p_store_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin role required'
      using errcode = '42501';
  end if;

  update public.stores
  set status = 'SUSPENDED', approved_at = null
  where id = p_store_id;

  if not found then
    raise exception 'Store not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Close: owner-initiated or admin. Status becomes CLOSED (storefront hidden).
create or replace function public.close_store(p_store_id uuid)
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

  update public.stores set status = 'CLOSED' where id = p_store_id;
end;
$$;