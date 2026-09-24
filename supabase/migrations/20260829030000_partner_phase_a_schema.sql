-- ============================================================================
-- JustPlay Partner — Backend Phase A: Schema Extensions + Partner Auth
-- ============================================================================
-- Extends the SAME Supabase project as the consumer app (justplay-kanpur).
-- No duplicate venues/slots/bookings/venue_pricing tables — this migration
-- only adds partner-specific tables on top of that existing schema, plus
-- the RLS a partner dashboard needs to read its own venue's data.
--
-- Run this AFTER the consumer app's migrations are already applied to the
-- same project (20260829000000_phase_a_schema.sql onward).
-- ============================================================================

-- ============================================================================
-- A1. partners — one row per person who has signed up as a venue partner
-- ============================================================================
-- id = auth.users.id, same convention as public.users (the consumer
-- profile). A person can have BOTH a public.users row (consumer) and a
-- public.partners row (partner) for the same auth identity — that's
-- expected, not a bug: someone can play at other venues AND run their own.
-- What actually keeps "partner session" and "consumer session" from
-- blurring together is that every partner-only table/policy below checks
-- membership in `partners`/`partner_venues`, never just "is logged in".

create table if not exists public.partners (
  id                 uuid primary key references auth.users (id) on delete cascade,
  phone              text unique not null,
  owner_name         text not null,
  business_name      text not null,
  approval_status    text not null default 'pending',
  created_at         timestamptz not null default now(),

  constraint partners_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected'))
);

comment on table public.partners is
  'Venue-partner account. approval_status gates dashboard access — see admin_approve_partner().';

alter table public.partners enable row level security;

drop policy if exists "partners select own" on public.partners;
create policy "partners select own" on public.partners
  for select using (auth.uid() = id);

drop policy if exists "partners update own" on public.partners;
create policy "partners update own" on public.partners
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert policy: rows are created only by the partner-signup Edge
-- Function (service role), which also creates the venue + partner_venues
-- link atomically — never directly by a client. That also means a client
-- can never set their own approval_status to 'approved'.

revoke update (approval_status) on public.partners from authenticated;
-- Column-level: even though "partners update own" allows updating their
-- own row (e.g. owner_name typo fixes later), approval_status specifically
-- can only move via admin_approve_partner() (service role), not a client
-- UPDATE — belt-and-suspenders against a self-approval bug.

-- ============================================================================
-- A2. partner_venues — links a partner to one or more venues, with a role
-- ============================================================================
-- This is the join table every partner-scoped RLS policy below checks
-- membership against. A venue can have exactly one 'owner' and any number
-- of 'staff' — enforced by the unique index below, not just app logic.

create table if not exists public.partner_venues (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references public.partners (id) on delete cascade,
  venue_id    uuid not null references public.venues (id) on delete cascade,
  role        text not null,
  created_at  timestamptz not null default now(),

  constraint partner_venues_role_check check (role in ('owner', 'staff')),
  constraint partner_venues_unique unique (partner_id, venue_id)
);

comment on table public.partner_venues is
  'Which partners can access which venue''s dashboard, and at what role.';

alter table public.partner_venues enable row level security;

drop policy if exists "partner_venues select own" on public.partner_venues;
create policy "partner_venues select own" on public.partner_venues
  for select using (auth.uid() = partner_id);
-- No client insert/update/delete: links are created by the partner-signup
-- Edge Function (owner link) or the staff-invite-acceptance flow (Phase E),
-- both service-role — never directly by a client, so nobody can grant
-- themselves access to someone else's venue.

-- ============================================================================
-- A3. staff_invites — an owner invites a phone number; they accept later
-- ============================================================================

create table if not exists public.staff_invites (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid not null references public.venues (id) on delete cascade,
  invited_phone   text not null,
  role            text not null default 'staff',
  status          text not null default 'invited',
  invited_by      uuid not null references public.partners (id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint staff_invites_role_check check (role in ('staff')),
  constraint staff_invites_status_check check (status in ('invited', 'accepted', 'revoked'))
);

alter table public.staff_invites enable row level security;

-- An owner can see/manage invites for venues they own.
drop policy if exists "staff_invites select own venue" on public.staff_invites;
create policy "staff_invites select own venue" on public.staff_invites
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = staff_invites.venue_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );

drop policy if exists "staff_invites insert own venue" on public.staff_invites;
create policy "staff_invites insert own venue" on public.staff_invites
  for insert with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = staff_invites.venue_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );

-- An invited (but not yet linked) person needs to find invites addressed
-- to their own phone number, to accept them — matched against the phone
-- their own verified session actually corresponds to. Note: this session's
-- identity is email-shaped under the hood (see mock-otp-verify /
-- partner-signup) — auth.users.phone is never populated by that flow, so
-- the phone has to be recovered from the synthetic email instead, exactly
-- like partner-signup does. invited_phone must be stored as full E.164
-- ("+919876543210") to match.
drop policy if exists "staff_invites select own phone" on public.staff_invites;
create policy "staff_invites select own phone" on public.staff_invites
  for select using (
    status = 'invited'
    and invited_phone = '+' || split_part((select email from auth.users where id = auth.uid()), '@', 1)
  );
-- Accepting an invite (status -> 'accepted' + creating the partner_venues
-- row) happens via a Phase E Edge Function/RPC, not a raw client UPDATE —
-- deferred to that phase.

-- ============================================================================
-- A4. Payouts schema (tables only in this phase — Cashfree wiring is
--     Phase D; creating the tables now so Phase A's RLS-based data
--     isolation for payout data is in place from the start)
-- ============================================================================

create table if not exists public.payout_accounts (
  id                    uuid primary key default gen_random_uuid(),
  venue_id              uuid not null references public.venues (id) on delete cascade,
  method                text not null,
  -- Bank fields (null when method = 'upi')
  account_holder_name   text,
  account_number        text,
  ifsc                  text,
  -- UPI field (null when method = 'bank')
  upi_id                text,
  verification_status   text not null default 'pending',
  cashfree_beneficiary_id text,                                       -- set once Phase D registers this with Cashfree
  updated_at            timestamptz not null default now(),

  constraint payout_accounts_method_check check (method in ('bank', 'upi')),
  constraint payout_accounts_verification_check
    check (verification_status in ('pending', 'verified', 'failed')),
  constraint payout_accounts_venue_unique unique (venue_id)
);

comment on table public.payout_accounts is
  'One beneficiary (bank or UPI) per venue. account_number is stored as given by the '
  'owner today; Phase D should move this to Cashfree''s vault/tokenized storage rather '
  'than keeping raw account numbers in this table long-term.';

create table if not exists public.payouts (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid not null references public.venues (id) on delete cascade,
  amount          integer not null,                                  -- net amount transferred, whole rupees
  status          text not null default 'processing',
  payout_date     date not null default current_date,
  payout_method   text not null,
  cashfree_transfer_id text,                                          -- set once Phase D calls the Cashfree API
  created_at      timestamptz not null default now(),

  constraint payouts_status_check check (status in ('processing', 'completed', 'failed')),
  constraint payouts_method_check check (payout_method in ('bank', 'upi'))
);

create table if not exists public.payout_line_items (
  id          uuid primary key default gen_random_uuid(),
  payout_id   uuid not null references public.payouts (id) on delete cascade,
  booking_id  uuid not null references public.bookings (id) on delete restrict,
  amount      integer not null,                                      -- net amount for this booking, whole rupees

  constraint payout_line_items_unique unique (payout_id, booking_id)
);

comment on table public.payout_line_items is
  'Which bookings made up a payout, and how much of the payout each contributed — '
  'this is what makes every payout amount auditable/reconstructable.';

create table if not exists public.payout_deductions (
  id                 uuid primary key default gen_random_uuid(),
  venue_id           uuid not null references public.venues (id) on delete cascade,
  booking_id         uuid not null references public.bookings (id) on delete restrict,
  amount             integer not null,
  reason             text not null,
  applied_to_payout_id uuid references public.payouts (id) on delete set null,
  created_at         timestamptz not null default now()
);

comment on table public.payout_deductions is
  'A booking that was already paid out, then refunded — the clawback amount sits '
  'here (applied_to_payout_id null) until the next payout batch job (Phase D) '
  'subtracts it and stamps applied_to_payout_id.';

alter table public.payout_accounts enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_line_items enable row level security;
alter table public.payout_deductions enable row level security;

-- Owner-only, explicitly — staff must never see this data even though they
-- can otherwise access the same venue's bookings/slots. This is enforced
-- at the RLS/query level (per the brief), not just hidden in the UI: a
-- staff-role partner's Supabase session simply cannot SELECT these rows,
-- full stop, regardless of what the frontend does or doesn't render.
drop policy if exists "payout_accounts owner only" on public.payout_accounts;
create policy "payout_accounts owner only" on public.payout_accounts
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = payout_accounts.venue_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );

drop policy if exists "payouts owner only" on public.payouts;
create policy "payouts owner only" on public.payouts
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = payouts.venue_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );

drop policy if exists "payout_line_items owner only" on public.payout_line_items;
create policy "payout_line_items owner only" on public.payout_line_items
  for select using (
    exists (
      select 1 from public.payouts p
      join public.partner_venues pv on pv.venue_id = p.venue_id
      where p.id = payout_line_items.payout_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );

drop policy if exists "payout_deductions owner only" on public.payout_deductions;
create policy "payout_deductions owner only" on public.payout_deductions
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = payout_deductions.venue_id
        and pv.partner_id = auth.uid()
        and pv.role = 'owner'
    )
  );
-- No client write policies on any of the four tables above: every write
-- (saving bank details, recording a payout, logging a deduction) goes
-- through a service-role Edge Function/RPC — built in Phase D.

-- Table-level grants: authenticated needs SELECT to even be considered by
-- RLS, but no write verbs — matches the "RLS is necessary but the grant
-- is the actual gate" pattern used throughout this schema.
grant select on public.partners, public.partner_venues, public.staff_invites,
  public.payout_accounts, public.payouts, public.payout_line_items, public.payout_deductions
  to authenticated;
grant update on public.partners to authenticated;
grant insert on public.staff_invites to authenticated;

-- ============================================================================
-- A5. Partner read access to venues/bookings
-- ============================================================================
-- venue_pricing and slots are already publicly readable by anyone (see the
-- consumer schema's "venue_pricing public read" / "slots public read"
-- policies, both `using (true)`) — a partner reading their own venue's
-- pricing/slots already works with no change here.
--
-- venues and bookings are NOT already open enough for a partner dashboard:
--   - "venues public read" only shows is_active = true rows — a brand-new
--     partner's still-in-draft venue (is_active = false, pre-approval)
--     would be invisible even to its own owner without the policy below.
--   - bookings only has "select own" (the customer who made it) — nothing
--     lets a venue see the bookings made AT it. That's the whole point of
--     the Bookings Management screen, so it needs its own policy.

drop policy if exists "venues partner read own" on public.venues;
create policy "venues partner read own" on public.venues
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = venues.id
        and pv.partner_id = auth.uid()
    )
  );

drop policy if exists "bookings partner read venue" on public.bookings;
create policy "bookings partner read venue" on public.bookings
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = bookings.venue_id
        and pv.partner_id = auth.uid()
    )
  );
-- Staff and owner both get read access here — Phase C's write-side RPCs
-- (mark completed/no-show, cancel, manual booking creation) will decide
-- separately whether both roles may call them or owner-only, same pattern
-- as the payout tables above already show for the strictest case.

-- ============================================================================
-- A6. Security hardening found while wiring this up (unrelated to Phase A's
--     own scope, but a real gap worth closing while touching this table):
--     `bookings` never had INSERT/DELETE revoked from `authenticated`,
--     only UPDATE. That means a client could INSERT a bookings row
--     directly — bypassing create_booking()'s slot-locking entirely and
--     creating a booking with no matching slot ever marked 'booked'. All
--     booking creation must go through a SECURITY DEFINER function (the
--     consumer app's create_booking(), and Phase C's upcoming manual/
--     walk-in equivalent for partners) — never a raw client INSERT.
-- ============================================================================

drop policy if exists "bookings insert own" on public.bookings;
revoke insert, delete on public.bookings from authenticated;

-- ============================================================================
-- A7. Partner signup / approval
-- ============================================================================
-- Signup itself (creating the partners + venues + partner_venues rows
-- together, atomically) is a service-role Edge Function — see
-- supabase/functions/partner-signup/index.ts — not a SQL function, because
-- it needs to read the caller's verified phone number off their auth
-- session (never trust a client-supplied phone) before writing anything.
--
-- Approval has no admin panel yet (out of scope for this pass), so it's a
-- one-line manual step for now, run from the Supabase SQL editor (which
-- executes as the table owner and bypasses RLS, same as any other
-- superuser context) — either directly (note: phone is stored as full
-- E.164, matching public.users.phone's convention, e.g. "+919876500000"
-- not "9876500000"):
--
--   update public.partners set approval_status = 'approved' where phone = '+919876500000';
--
-- or via this small wrapper, kept service-role-only so it can never be
-- called from the client even by accident:

create or replace function public.admin_approve_partner(p_phone text)
returns public.partners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner public.partners;
begin
  update public.partners
  set approval_status = 'approved'
  where phone = p_phone
  returning * into v_partner;

  if v_partner.id is null then
    raise exception 'NO_PARTNER_WITH_THAT_PHONE';
  end if;

  return v_partner;
end;
$$;

revoke all on function public.admin_approve_partner(text) from public, authenticated, anon;
grant execute on function public.admin_approve_partner(text) to service_role;

-- Note: this deliberately does NOT flip the linked venue's `is_active` to
-- true — a freshly-approved partner still has an empty draft venue (no
-- courts, no pricing, no photos). Going live to consumers is a separate
-- "publish" action, once Phase B/E have given them something worth
-- showing — not implemented yet, tracked for Phase E.

-- ============================================================================
-- End of Backend Phase A
-- ============================================================================
