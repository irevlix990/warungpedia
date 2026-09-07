-- Fix: qualify ambiguous column references in validate_voucher
create or replace function public.validate_voucher(
  p_code     text,
  p_user_id  uuid,
  p_subtotal integer
)
returns table (
  voucher_id uuid,
  discount   integer,
  message    text
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v           record;
  v_redemptions integer;
  v_discount  integer;
begin
  discount := 0;
  message := null;

  select id, discount_type, discount_value, min_spend, max_discount,
         per_user_limit, total_usage_limit, uses_count, is_active,
         starts_at, expires_at
    into v
  from public.vouchers
  where code = upper(btrim(coalesce(p_code, '')));

  if v.id is null then
    message := 'Kode kupon tidak ditemukan.';
    return next;
  end if;

  if not v.is_active then
    message := 'Kupon sudah tidak aktif.';
    return next;
  end if;
  if v.starts_at is not null and v.starts_at > now() then
    message := 'Kupon belum dapat digunakan.';
    return next;
  end if;
  if v.expires_at is not null and v.expires_at <= now() then
    message := 'Kupon sudah kedaluwarsa.';
    return next;
  end if;
  if v.total_usage_limit is not null and v.uses_count >= v.total_usage_limit then
    message := 'Kupon sudah habis digunakan.';
    return next;
  end if;
  if v.per_user_limit > 0 then
    select count(*) into v_redemptions
    from public.user_voucher_redemptions r
    where r.voucher_id = v.id and r.user_id = p_user_id;
    if v_redemptions >= v.per_user_limit then
      message := 'Anda sudah memakai kupon ini.';
      return next;
    end if;
  end if;
  if p_subtotal < v.min_spend then
    message := 'Belanja belum mencapai minimum kupon.';
    return next;
  end if;

  if v.discount_type = 'AMOUNT' then
    v_discount := least(v.discount_value, p_subtotal);
  else
    v_discount := floor(p_subtotal * v.discount_value / 100);
    if v.max_discount is not null and v_discount > v.max_discount then
      v_discount := v.max_discount;
    end if;
  end if;

  if v_discount >= p_subtotal then
    message := 'Kupon tidak dapat digunakan untuk pesanan ini.';
    return next;
  end if;

  voucher_id := v.id;
  discount := v_discount;
  return next;
end;
$$;
