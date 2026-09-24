-- ============================================================================
-- JustPlay Partner — Hotfix: infinite recursion in Phase E's staff-roster
-- RLS policies.
--
-- "partner_venues owner reads venue roster" (Phase E, section E12) wrote a
-- raw subquery against partner_venues INSIDE a policy on partner_venues
-- itself. Postgres always rejects that as "infinite recursion detected in
-- policy for relation" — this is structural (the policy rewriter expands
-- it before ever looking at actual rows), not something fixable by
-- rewording the same subquery. Every read of partners/partner_venues,
-- including the login/signup lookup in auth.tsx, broke as a result.
--
-- Fix: route the same check through partner_role_for_venue(), the
-- existing SECURITY DEFINER function (Phase B) that already looks up a
-- caller's role for a venue. Because it's SECURITY DEFINER, it executes
-- bypassing RLS internally and is opaque to the policy rewriter — no
-- self-reference for Postgres to (incorrectly, but unavoidably) flag.
-- ============================================================================

drop policy if exists "partner_venues owner reads venue roster" on public.partner_venues;
create policy "partner_venues owner reads venue roster" on public.partner_venues
  for select using (
    public.partner_role_for_venue(partner_venues.venue_id) = 'owner'
  );

drop policy if exists "partners owner reads venue roster" on public.partners;
create policy "partners owner reads venue roster" on public.partners
  for select using (
    exists (
      select 1
      from public.partner_venues target_pv
      where target_pv.partner_id = partners.id
        and public.partner_role_for_venue(target_pv.venue_id) = 'owner'
    )
  );