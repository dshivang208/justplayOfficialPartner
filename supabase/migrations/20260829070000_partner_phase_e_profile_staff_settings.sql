-- ============================================================================
-- JustPlay Partner — Backend Phase E: Venue Profile, Staff Roles & Settings
-- ============================================================================
-- Matches the existing (mock) frontend contracts exactly, rather than
-- inventing a different shape: `src/lib/venueProfile.tsx`'s pendingName/
-- pendingAddress + reviewPending gate, `src/lib/staff.tsx`'s invite/accept
-- flow, `src/lib/notifications.tsx`'s NotificationPrefs shape.
--
-- Role enforcement note (the brief's "not just UI hiding" requirement):
-- payout_accounts/payouts/payout_line_items/payout_deductions ALREADY
-- restrict every policy to `pv.role = 'owner'` — that was built into
-- Phase A from the start specifically so Phase D never had to touch RLS.
-- Nothing new is needed there; this migration is what was actually
-- deferred: venues writes, staff_invites acceptance, and a new
-- partner_settings table, all following the same "owner-only via
-- SECURITY DEFINER function, staff never gets a client write path"
-- pattern already used throughout this codebase.
-- ============================================================================

-- ============================================================================
-- E1. venues — columns Phase A never needed until profile editing existed.
--     pending_name/pending_address ARE the review-gate: reviewPending in
--     the UI is just "either of these is non-null", no separate status
--     column needed, matching lib/venueProfile.tsx's own logic exactly.
-- ============================================================================

alter table public.venues add column if not exists pending_name text;
alter table public.venues add column if not exists pending_address text;
alter table public.venues add column if not exists legal_business_name text;
alter table public.venues add column if not exists gst_number text;

comment on column public.venues.pending_name is
  'Non-null while a name change awaits admin approval. The LIVE name column '
  'is untouched until admin_approve_venue_change applies it.';
comment on column public.venues.pending_address is
  'Same review-gating as pending_name, for the address field.';

-- ============================================================================
-- E2. partner_save_venue_minor — instant-save fields (about/amenities/
--     photos), owner-only. `about` is this schema's existing column for
--     what the frontend calls "description" (consumer Phase A already
--     has it — no reason to add a duplicate column).
--     Each param defaults to null meaning "leave unchanged", so the
--     frontend's three separate save actions (description / photos /
--     amenities) can all call this one function without stomping on the
--     other two fields.
-- ============================================================================

create or replace function public.partner_save_venue_minor(
  p_venue_id  uuid,
  p_about     text default null,
  p_amenities jsonb default null,
  p_photos    text[] default null
)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.venues
  set about     = coalesce(p_about, about),
      amenities = coalesce(p_amenities, amenities),
      photos    = coalesce(p_photos, photos)
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_save_venue_minor(uuid, text, jsonb, text[]) to authenticated;

-- ============================================================================
-- E3. partner_submit_venue_major_change / partner_discard_venue_pending_change
--     — the review-gated pair for name/address, owner-only. Submitting
--     only touches pending_* for whichever field actually changed (matches
--     submitMajorChange's independent name/address handling in the mock)
--     — the LIVE name/address are never written by a partner directly.
-- ============================================================================

create or replace function public.partner_submit_venue_major_change(
  p_venue_id uuid,
  p_name     text default null,
  p_address  text default null
)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.venues
  set pending_name = case
        when p_name is not null and p_name <> name then p_name
        else pending_name
      end,
      pending_address = case
        when p_address is not null and p_address <> address then p_address
        else pending_address
      end
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_submit_venue_major_change(uuid, text, text) to authenticated;

create or replace function public.partner_discard_venue_pending_change(p_venue_id uuid)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.venues
  set pending_name = null, pending_address = null
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_discard_venue_pending_change(uuid) to authenticated;

-- ============================================================================
-- E4. admin_approve_venue_change — service-role stand-in for the (not
--     built in this pass) admin panel, same "SQL editor today, real admin
--     UI later" pattern as admin_approve_partner (Phase A) and
--     admin_set_court_commission_rate (Phase D).
-- ============================================================================

create or replace function public.admin_approve_venue_change(p_venue_id uuid)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  update public.venues
  set name            = coalesce(pending_name, name),
      address         = coalesce(pending_address, address),
      pending_name    = null,
      pending_address = null
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

revoke all on function public.admin_approve_venue_change(uuid) from public, authenticated, anon;
grant execute on function public.admin_approve_venue_change(uuid) to service_role;

-- ============================================================================
-- E5. partner_update_business_details / partner_set_venue_active —
--     instant-save, owner-only, no review-gating (matches
--     dashboard.settings.account.tsx, which saves these directly today).
-- ============================================================================

create or replace function public.partner_update_business_details(
  p_venue_id            uuid,
  p_legal_business_name text,
  p_gst_number          text
)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  if p_legal_business_name is null or length(trim(p_legal_business_name)) < 2 then
    raise exception 'LEGAL_BUSINESS_NAME_REQUIRED';
  end if;

  update public.venues
  set legal_business_name = trim(p_legal_business_name),
      gst_number = nullif(trim(coalesce(p_gst_number, '')), '')
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_update_business_details(uuid, text, text) to authenticated;

create or replace function public.partner_set_venue_active(p_venue_id uuid, p_is_active boolean)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.venues set is_active = p_is_active where id = p_venue_id returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_set_venue_active(uuid, boolean) to authenticated;

-- ============================================================================
-- E6. staff_invites — invited_name so the "who has access" list can show
--     a name for a still-pending invite (the mock UI's invite form
--     already collects one; storing it is the only gap).
-- ============================================================================

alter table public.staff_invites add column if not exists invited_name text;

-- ============================================================================
-- E7. partner_invite_staff — owner-only. Normalizes the phone to full
--     E.164 (+91XXXXXXXXXX) to match invited_phone's existing convention
--     (see the "staff_invites select own phone" policy from Phase A),
--     and blocks a duplicate invite or inviting someone who already has
--     access, rather than silently creating confusing extra rows.
-- ============================================================================

create or replace function public.partner_invite_staff(p_venue_id uuid, p_name text, p_phone text)
returns public.staff_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.staff_invites;
  v_phone  text;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'NAME_REQUIRED';
  end if;
  if p_phone is null or length(regexp_replace(p_phone, '\D', '', 'g')) <> 10 then
    raise exception 'PHONE_MUST_BE_10_DIGITS';
  end if;

  v_phone := '+91' || regexp_replace(p_phone, '\D', '', 'g');

  if exists (
    select 1
    from public.partner_venues pv
    join public.partners p on p.id = pv.partner_id
    where pv.venue_id = p_venue_id and p.phone = v_phone
  ) then
    raise exception 'ALREADY_HAS_ACCESS';
  end if;

  if exists (
    select 1 from public.staff_invites
    where venue_id = p_venue_id and invited_phone = v_phone and status = 'invited'
  ) then
    raise exception 'INVITE_ALREADY_PENDING';
  end if;

  insert into public.staff_invites (venue_id, invited_phone, invited_name, invited_by, role, status)
  values (p_venue_id, v_phone, trim(p_name), auth.uid(), 'staff', 'invited')
  returning * into v_invite;

  return v_invite;
end;
$$;

grant execute on function public.partner_invite_staff(uuid, text, text) to authenticated;

-- ============================================================================
-- E8. accept_staff_invite — callable by the INVITEE, not the owner. Runs
--     as SECURITY DEFINER rather than as a service-role Edge Function
--     (Phase A's comment flagged this as "service-role" generically,
--     before deciding the actual mechanism) — a SECURITY DEFINER function
--     bypasses RLS the same way a service-role client would, and needs no
--     Cashfree-style external API call, so there's no reason to leave
--     Postgres for this one. Phone recovery mirrors the exact convention
--     already established by partner-signup and the "staff_invites select
--     own phone" RLS policy: identity here is email-shaped under the
--     mock-OTP flow, so the phone comes back out of that synthetic email.
--
--     Idempotent by design: re-calling with an invite already consumed by
--     this same phone just returns the existing link rather than erroring
--     — a retried request (e.g. a flaky connection) can't create a
--     duplicate partner_venues row (also structurally impossible, thanks
--     to partner_venues_unique).
-- ============================================================================

create or replace function public.accept_staff_invite(p_invite_id uuid)
returns public.partner_venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite     public.staff_invites;
  v_phone      text;
  v_venue_name text;
  v_link       public.partner_venues;
begin
  v_phone := '+' || split_part((select email from auth.users where id = auth.uid()), '@', 1);

  select * into v_invite
  from public.staff_invites
  where id = p_invite_id and status = 'invited' and invited_phone = v_phone;

  if v_invite.id is null then
    raise exception 'INVITE_NOT_FOUND_OR_NOT_YOURS';
  end if;

  -- Bootstrap a partners row if this phone number has never been a
  -- partner before — mirrors partner-signup's own idempotent insert, but
  -- sets approval_status = 'approved' immediately: a staff member is
  -- vouched for by an already-approved owner inviting them by name, not a
  -- new business signing up cold, so the owner-approval gate (which
  -- exists to vet NEW businesses) doesn't apply here.
  if not exists (select 1 from public.partners where id = auth.uid()) then
    select name into v_venue_name from public.venues where id = v_invite.venue_id;

    insert into public.partners (id, phone, owner_name, business_name, approval_status)
    values (
      auth.uid(), v_phone,
      coalesce(v_invite.invited_name, 'Staff member'),
      coalesce(v_venue_name, 'JustPlay venue'),
      'approved'
    );
  end if;

  if not exists (
    select 1 from public.partner_venues
    where venue_id = v_invite.venue_id and partner_id = auth.uid()
  ) then
    insert into public.partner_venues (partner_id, venue_id, role)
    values (auth.uid(), v_invite.venue_id, 'staff')
    returning * into v_link;
  else
    select * into v_link
    from public.partner_venues
    where venue_id = v_invite.venue_id and partner_id = auth.uid();
  end if;

  update public.staff_invites set status = 'accepted' where id = p_invite_id;

  return v_link;
end;
$$;

grant execute on function public.accept_staff_invite(uuid) to authenticated;

-- ============================================================================
-- E9. partner_revoke_staff_invite / partner_remove_staff_member —
--     owner-only. Two functions because they act on two different tables
--     (an invite that was never accepted vs. an already-active
--     partner_venues link) — the frontend decides which one to call based
--     on the row's current status, same distinction the UI already shows
--     via the "Invite pending" badge.
-- ============================================================================

create or replace function public.partner_revoke_staff_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.staff_invites where id = p_invite_id;
  if v_venue_id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if public.partner_role_for_venue(v_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.staff_invites set status = 'revoked' where id = p_invite_id and status = 'invited';
end;
$$;

grant execute on function public.partner_revoke_staff_invite(uuid) to authenticated;

create or replace function public.partner_remove_staff_member(p_venue_id uuid, p_staff_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  -- role = 'staff' guard means this can never be used to remove the
  -- venue's own owner link, even by accident.
  delete from public.partner_venues
  where venue_id = p_venue_id
    and partner_id = p_staff_partner_id
    and role = 'staff';
end;
$$;

grant execute on function public.partner_remove_staff_member(uuid, uuid) to authenticated;

-- ============================================================================
-- E10. partner_settings — "straightforward CRUD", so plain RLS is the
--      right amount of machinery here, no RPC needed. Scoped to the
--      partner (person), not the venue: notification preferences are
--      inherently personal, not something an owner sets on a staff
--      member's behalf. Today's frontend only exposes this UI to owners
--      (Settings is owner-only per OwnerOnlyGuard), but the table itself
--      doesn't need to bake that in — if staff ever get their own
--      notification settings later, this already supports it correctly.
-- ============================================================================

create table if not exists public.partner_settings (
  partner_id          uuid primary key references public.partners (id) on delete cascade,
  notification_prefs  jsonb not null default '{
    "newBooking": {"sms": true, "email": false, "inApp": true},
    "cancellation": {"sms": true, "email": true, "inApp": true},
    "payout": {"sms": false, "email": true, "inApp": true},
    "lowOccupancy": {"sms": false, "email": false, "inApp": true}
  }'::jsonb,
  updated_at          timestamptz not null default now()
);

alter table public.partner_settings enable row level security;

drop policy if exists "partner_settings select own" on public.partner_settings;
create policy "partner_settings select own" on public.partner_settings
  for select using (auth.uid() = partner_id);

drop policy if exists "partner_settings insert own" on public.partner_settings;
create policy "partner_settings insert own" on public.partner_settings
  for insert with check (auth.uid() = partner_id);

drop policy if exists "partner_settings update own" on public.partner_settings;
create policy "partner_settings update own" on public.partner_settings
  for update using (auth.uid() = partner_id) with check (auth.uid() = partner_id);

-- ============================================================================
-- E11. Role-based access to payout data — VERIFICATION, not new policy.
--      Every one of payout_accounts/payouts/payout_line_items/
--      payout_deductions' Phase A select policies already require
--      `pv.role = 'owner'`, so a staff-role session is blocked by RLS
--      from reading any of them today, regardless of what the frontend
--      shows or hides. Nothing to add here — this comment exists so that
--      requirement has a place in Phase E's migration confirming it, not
--      a false impression that it was ever missing.
-- ============================================================================

-- ============================================================================
-- E12. Staff roster read access — a REAL gap this phase's staff list
--      exposed. Phase A's "partner_venues select own" only ever lets a
--      partner see their OWN single row (auth.uid() = partner_id) — it
--      was written for "which venues can I access", not "who else has
--      access to my venue". Without this, an owner querying
--      partner_venues for their venue_id would only ever get back their
--      own row, never their staff's. Same problem one level down: even
--      with the row visible, embedding partners(owner_name, phone) for a
--      colleague hits "partners select own" and comes back null.
--
--      IMPORTANT: both checks go through partner_role_for_venue(), a
--      SECURITY DEFINER function, rather than a raw subquery against
--      partner_venues written inline in the policy. A policy on table T
--      that subqueries T itself is ALWAYS rejected by Postgres as
--      "infinite recursion detected in policy for relation", even when
--      the logic would obviously terminate (e.g. by falling back to
--      "select own" for the caller's own row) — Postgres's policy
--      rewriter expands this structurally, not by simulating actual row
--      visibility, so there's no clever way to write the raw self-join
--      that avoids the error. Routing through a SECURITY DEFINER function
--      sidesteps this entirely: the function executes as its owner
--      (bypassing RLS internally), so from the policy rewriter's
--      perspective it's an opaque call, not a self-reference to expand.
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

-- ============================================================================
-- End of Backend Phase E
-- ============================================================================