-- ============================================================
-- 012_admin.sql — Admin dashboard & user administration
-- ============================================================
-- Phase 12 (Admin & CMS).
--
-- Adds the security-definer entry points that enforce business
-- rules which plain RLS cannot express:
--   1. admin_dashboard_stats()  – aggregate KPIs for /admin.
--   2. admin_set_user_role()    – SUPER_ADMIN-only role changes with
--     self-demotion / last-admin protection.
--
-- Categories, products, reviews and settings already carry admin
-- RLS grants (current_role() in ('ADMIN','SUPER_ADMIN')), so the
-- rest of the admin/CMS surface reads & writes those tables directly
-- through application-layer authorization.

-- ------------------------------------------------------------
-- Admin dashboard KPIs
-- ------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns table (
  total_users         bigint,
  total_buyers        bigint,
  total_sellers       bigint,
  total_admins        bigint,
  total_stores        bigint,
  pending_stores      bigint,
  active_stores       bigint,
  total_products      bigint,
  active_products     bigint,
  total_orders        bigint,
  committed_orders    bigint,
  gmv                 bigint,
  pending_withdrawals bigint,
  pending_withdrawals_value bigint,
  open_disputes       bigint,
  pending_returns     bigint,
  hidden_reviews      bigint
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (where role = 'BUYER'),
    count(*) filter (where role = 'SELLER'),
    count(*) filter (where role in ('ADMIN','SUPER_ADMIN'))
  into total_users, total_buyers, total_sellers, total_admins
  from public.profiles;

  select
    count(*),
    count(*) filter (where status = 'PENDING'),
    count(*) filter (where status = 'ACTIVE')
  into total_stores, pending_stores, active_stores
  from public.stores;

  select
    count(*),
    count(*) filter (where status = 'ACTIVE')
  into total_products, active_products
  from public.products;

  select
    count(*),
    count(*) filter (where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')),
    coalesce(sum(total) filter (where status in ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')), 0)
  into total_orders, committed_orders, gmv
  from public.orders;

  select
    count(*),
    coalesce(sum(amount) filter (where status = 'PENDING'), 0)
  into pending_withdrawals, pending_withdrawals_value
  from public.withdrawals;

  select count(*) into open_disputes
  from public.disputes where status = 'OPEN';

  select count(*) into pending_returns
  from public.returns where status = 'REQUESTED';

  select count(*) into hidden_reviews
  from public.product_reviews where status = 'HIDDEN';

  return next;
end;
$$;

-- ------------------------------------------------------------
-- Admin user listing (with emails from auth.users)
-- ------------------------------------------------------------
-- profiles do not store email (it lives in auth.users, which is not
-- reachable through the anon-keyed client), so list users through a
-- security-definer that joins auth.users by id.
create or replace function public.admin_list_users()
returns table (
  id             uuid,
  email          text,
  full_name      text,
  phone          text,
  role           text,
  email_verified boolean,
  created_at     timestamptz,
  updated_at     timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required'
      using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text as email,
    p.full_name,
    p.phone,
    p.role,
    p.email_verified,
    p.created_at,
    p.updated_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at asc;
end;
$$;

-- ------------------------------------------------------------
-- Admin user role management (SUPER_ADMIN only)
-- ------------------------------------------------------------
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role    text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_target record;
  v_role   text;
begin
  if public.current_role() not in ('SUPER_ADMIN') then
    raise exception 'Permission denied: super admin required'
      using errcode = '42501';
  end if;

  if p_role not in ('BUYER','SELLER','ADMIN','SUPER_ADMIN') then
    raise exception 'Peran tidak valid.'
      using errcode = '23514';
  end if;

  select * into v_target from public.profiles where id = p_user_id;

  if v_target is null then
    raise exception 'Pengguna tidak ditemukan.'
      using errcode = 'P0002';
  end if;

  -- A super admin may not change their own role.
  if p_user_id = v_uid then
    raise exception 'Anda tidak dapat mengubah peran Anda sendiri.'
      using errcode = '42501';
  end if;

  -- Guard the last SUPER_ADMIN: never demote the final one.
  if v_target.role = 'SUPER_ADMIN'
     and p_role <> 'SUPER_ADMIN'
     and (select count(*) from public.profiles where role = 'SUPER_ADMIN') <= 1
  then
    raise exception 'Tidak dapat menurunkan admin super terakhir.'
      using errcode = '42501';
  end if;

  update public.profiles set role = p_role, updated_at = now()
  where id = p_user_id;
end;
$$;
