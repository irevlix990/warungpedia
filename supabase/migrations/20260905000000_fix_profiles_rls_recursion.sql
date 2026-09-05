-- ============================================================
-- Migration 014 — Fix infinite recursion in profiles RLS
-- ============================================================
-- Bug: current_role() queries profiles, but profiles policies
--      also call current_role() → infinite recursion.
--
-- Fix: Remove current_role() from profiles policies.
--      Admin access uses the service-role client (bypasses RLS).
--      Regular users only see/update their own profile.
-- ============================================================

-- Drop the recursive policies
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Recreate without current_role() — users can only see their own profile.
-- Admin operations use the service-role client which bypasses RLS.
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
