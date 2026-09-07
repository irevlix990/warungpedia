-- Migration 20260907010000_fix_withdrawal_approve.sql
-- Fix: approve_withdrawal should set status to PAID, not PROCESSING.

create or replace function public.approve_withdrawal(p_withdrawal_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() not in ('ADMIN','SUPER_ADMIN') then
    raise exception 'Permission denied: admin required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.withdrawals
    where id = p_withdrawal_id and status = 'PENDING'
  ) then
    raise exception 'Withdrawal not found or not pending' using errcode = 'P0002';
  end if;

  update public.withdrawals
  set status = 'PAID', processed_at = now()
  where id = p_withdrawal_id;
end;
$$;
