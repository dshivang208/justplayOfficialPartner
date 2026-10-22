-- "select own phone" policy queried auth.users directly; the `authenticated`
-- role has no SELECT on auth.users, so EVERY select on staff_invites failed
-- with "permission denied for table users" (even for the owner policy).
-- Move the lookup into a SECURITY DEFINER helper.
create or replace function public.current_user_phone()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select '+' || split_part(email, '@', 1) from auth.users where id = auth.uid()
$$;

revoke all on function public.current_user_phone() from public, anon;
grant execute on function public.current_user_phone() to authenticated;

drop policy if exists "staff_invites select own phone" on public.staff_invites;
create policy "staff_invites select own phone" on public.staff_invites
  for select using (
    status = 'invited'
    and invited_phone = public.current_user_phone()
  );
