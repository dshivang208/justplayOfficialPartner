-- ============================================================================
-- JustPlay Partner — Backend Phase D: Payouts — Cashfree Integration
-- ============================================================================
-- Same shared Supabase project. Phase A already created payout_accounts /
-- payouts / payout_line_items / payout_deductions with owner-only RLS and
-- explicitly deferred every write path to this phase ("every write ... goes
-- through a service-role Edge Function/RPC — built in Phase D"). This
-- migration is that write side: nothing here changes the RLS added in
-- Phase A, it only adds the SECURITY DEFINER functions those policies were
-- always meant to be paired with.
--
-- Money-moving note on the "gross" figure below: a booking's price_paid
-- already includes JustPlay's 5% convenience fee + 18% GST on that fee (see
-- create_booking in the Phase C migration) — those are JustPlay's own
-- revenue/tax-remittance, never the venue's. What the venue is owed is
-- price_paid minus whatever wallet credit the customer applied (JustPlay
-- eats the wallet-credit cost, not the venue).
--
-- Commission itself is NOT the old frontend mock's fixed 10% — per
-- product decision, it's a per-COURT rate (courts.commission_rate, added
-- below), set by a future admin panel and defaulting to 0 until that
-- exists. There's no admin panel in this codebase yet, so
-- admin_set_court_commission_rate (D1b) is the service-role-only stand-in,
-- same pattern as admin_approve_partner in Phase A: callable from the SQL
-- editor today, wired to a real admin UI later without changing this
-- function's contract. IMPORTANT for the frontend rewire: src/data/
-- payouts.ts's COMMISSION_RATE/netAmount() are now WRONG and must not be
-- used once this ships — the server-computed net_amount (already
-- commission-applied, per booking) is the only correct number to display.
-- ============================================================================

-- ============================================================================
-- D1. courts.commission_rate — per-court, admin-set, 0 until an admin
--     panel exists. Stored as a fraction (0.10 = 10%), not a percentage,
--     to match how it's used directly in the arithmetic below.
-- ============================================================================

alter table public.courts add column if not exists commission_rate numeric not null default 0;

alter table public.courts drop constraint if exists courts_commission_rate_check;
alter table public.courts add constraint courts_commission_rate_check
  check (commission_rate >= 0 and commission_rate <= 1);

comment on column public.courts.commission_rate is
  'JustPlay''s cut of this court''s bookings, as a fraction (0.10 = 10%). '
  'Defaults to 0 — no admin panel sets this yet; admin_set_court_commission_rate '
  'below is the service-role stand-in until one exists.';

-- ============================================================================
-- D1b. admin_set_court_commission_rate — service-role only, same "SQL
--      editor today, real admin UI later" pattern as admin_approve_partner
--      (Phase A). Never callable by a partner — a venue setting its own
--      commission rate would defeat the entire point of it being
--      platform-controlled.
-- ============================================================================

create or replace function public.admin_set_court_commission_rate(p_court_id uuid, p_rate numeric)
returns public.courts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts;
begin
  if p_rate < 0 or p_rate > 1 then
    raise exception 'RATE_MUST_BE_BETWEEN_0_AND_1';
  end if;

  update public.courts
  set commission_rate = p_rate
  where id = p_court_id
  returning * into v_court;

  if v_court.id is null then
    raise exception 'COURT_NOT_FOUND';
  end if;

  return v_court;
end;
$$;

revoke all on function public.admin_set_court_commission_rate(uuid, numeric) from public, authenticated, anon;
grant execute on function public.admin_set_court_commission_rate(uuid, numeric) to service_role;

-- ============================================================================
-- D1c. venue_payout_net_amount — single source of truth for the commission
--      arithmetic itself, so the pending-payout preview and the actual
--      batch job (and any future reporting) can never compute two
--      different numbers for the same booking. Rate is passed in per-call
--      rather than hardcoded, since it now varies by court.
-- ============================================================================

-- Defensive: if an earlier draft of this migration already created the
-- old 1-arg signature against this database, drop it — Postgres treats
-- different argument lists as different functions, so create-or-replace
-- alone wouldn't remove it.
drop function if exists public.venue_payout_net_amount(integer);

create or replace function public.venue_payout_net_amount(p_gross_amount integer, p_commission_rate numeric)
returns integer
language sql
immutable
as $$
  select round(p_gross_amount * (1 - p_commission_rate))::integer;
$$;

comment on function public.venue_payout_net_amount(integer, numeric) is
  'gross_amount minus JustPlay''s commission at the given rate (a fraction, '
  'e.g. 0.10). The rate comes from the booking''s court — see '
  'partner_pending_payout_line_items — and is 0 for any court an admin '
  'hasn''t explicitly set a rate on.';

-- ============================================================================
-- D2. partner_save_payout_account — owner-only write to payout_accounts.
--     Changing details always resets verification_status to 'pending', but
--     deliberately leaves the OLD cashfree_beneficiary_id in place (rather
--     than nulling it) — the save-beneficiary Edge Function reads it back
--     off the returned row so it can remove that beneficiary at Cashfree
--     BEFORE registering a fresh one. Cashfree Payouts V2 has no "update
--     beneficiary" endpoint, only add/remove, and it 409s if you try to add
--     a beneficiary with the same bank_account_number+ifsc under a new id
--     while the old one still exists — removing first avoids that entirely.
-- ============================================================================

create or replace function public.partner_save_payout_account(
  p_venue_id             uuid,
  p_method               text,
  p_account_holder_name  text default null,
  p_account_number       text default null,
  p_ifsc                 text default null,
  p_upi_id               text default null
)
returns public.payout_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.payout_accounts;
begin
  if public.partner_role_for_venue(p_venue_id) <> 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  if p_method not in ('bank', 'upi') then
    raise exception 'INVALID_METHOD';
  end if;

  if p_method = 'bank' then
    if p_account_holder_name is null or length(trim(p_account_holder_name)) < 2 then
      raise exception 'ACCOUNT_HOLDER_NAME_REQUIRED';
    end if;
    if p_account_number is null or length(regexp_replace(p_account_number, '\D', '', 'g')) < 4 then
      raise exception 'ACCOUNT_NUMBER_INVALID';
    end if;
    -- Cashfree's own IFSC rule: 4 letters, then a literal '0', then 6 digits.
    if p_ifsc is null or upper(p_ifsc) !~ '^[A-Z]{4}0[0-9]{6}$' then
      raise exception 'IFSC_INVALID';
    end if;
  else
    if p_upi_id is null or p_upi_id !~ '^[\w.-]{2,}@[\w]{2,}$' then
      raise exception 'UPI_ID_INVALID';
    end if;
  end if;

  insert into public.payout_accounts (
    venue_id, method, account_holder_name, account_number, ifsc, upi_id,
    verification_status, cashfree_beneficiary_id, updated_at
  ) values (
    p_venue_id, p_method,
    case when p_method = 'bank' then trim(p_account_holder_name) else null end,
    case when p_method = 'bank' then regexp_replace(p_account_number, '\D', '', 'g') else null end,
    case when p_method = 'bank' then upper(p_ifsc) else null end,
    case when p_method = 'upi' then lower(trim(p_upi_id)) else null end,
    'pending', null, now()
  )
  on conflict (venue_id) do update set
    method               = excluded.method,
    account_holder_name  = excluded.account_holder_name,
    account_number       = excluded.account_number,
    ifsc                 = excluded.ifsc,
    upi_id               = excluded.upi_id,
    verification_status  = 'pending',
    -- cashfree_beneficiary_id intentionally NOT touched here — see comment
    -- above D2. The caller (Edge Function) is responsible for removing it
    -- at Cashfree and then overwriting it via mark_payout_account_verified.
    updated_at           = now()
  returning * into v_account;

  return v_account;
end;
$$;

grant execute on function public.partner_save_payout_account(uuid, text, text, text, text, text) to authenticated;

-- ============================================================================
-- D3. mark_payout_account_verified — service-role only. Called by the
--     save-beneficiary Edge Function after it talks to Cashfree, never by a
--     client directly (a client could otherwise mark its own unverified
--     account "verified").
-- ============================================================================

create or replace function public.mark_payout_account_verified(
  p_venue_id                uuid,
  p_cashfree_beneficiary_id text,
  p_verified                boolean
)
returns public.payout_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.payout_accounts;
begin
  update public.payout_accounts
  set cashfree_beneficiary_id = p_cashfree_beneficiary_id,
      verification_status = case when p_verified then 'verified' else 'failed' end,
      updated_at = now()
  where venue_id = p_venue_id
  returning * into v_account;

  if v_account.id is null then
    raise exception 'PAYOUT_ACCOUNT_NOT_FOUND';
  end if;

  return v_account;
end;
$$;

revoke all on function public.mark_payout_account_verified(uuid, text, boolean) from public, authenticated, anon;
grant execute on function public.mark_payout_account_verified(uuid, text, boolean) to service_role;

-- ============================================================================
-- D4. partner_pending_payout_line_items — owner-only read. The ONE place
--     that decides "which bookings count toward the next payout" — both the
--     Payouts Overview page's live preview and the actual batch job read
--     through this, so the number a partner sees before payout day is
--     always exactly what they get paid.
--
--     A booking counts once it's confirmed/completed AND actually paid
--     (payment_status = 'paid' — excludes a walk-in logged as "pay later"),
--     and only if it doesn't already have a payout_line_items row (the
--     unique constraint added in D6 makes that impossible to double-count
--     even under concurrent runs, this NOT EXISTS is just the normal-path
--     filter).
--
--     Commission rate comes from the booking's COURT, not a flat platform
--     rate — bookings don't store court_id directly, so it's recovered via
--     booking_slots -> slots (a multi-slot booking's slots all share one
--     court, enforced at create_booking time, so LIMIT 1 is safe). A
--     booking with no resolvable court (legacy/non-court venues, per the
--     Phase B note that court_id is nullable) is treated as rate 0 —
--     matching "no admin-set rate" everywhere else, not a special case.
-- ============================================================================

create or replace function public.partner_pending_payout_line_items(p_venue_id uuid)
returns table (
  booking_id     uuid,
  customer_name  text,
  sport          text,
  date           date,
  gross_amount   integer,
  net_amount     integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    coalesce(b.walkin_customer_name, u.name, 'JustPlay customer'),
    b.sport,
    b.date,
    (b.price_paid - b.credit_applied),
    public.venue_payout_net_amount(b.price_paid - b.credit_applied, coalesce(c.commission_rate, 0))
  from public.bookings b
  left join public.users u on u.id = b.user_id
  left join lateral (
    select s.court_id
    from public.booking_slots bs
    join public.slots s on s.id = bs.slot_id
    where bs.booking_id = b.id and s.court_id is not null
    limit 1
  ) bc on true
  left join public.courts c on c.id = bc.court_id
  where b.venue_id = p_venue_id
    and b.status in ('confirmed', 'completed')
    and b.payment_status = 'paid'
    and public.partner_role_for_venue(p_venue_id) = 'owner'
    and not exists (
      select 1 from public.payout_line_items pli where pli.booking_id = b.id
    )
  order by b.date asc, b.id asc;
$$;

grant execute on function public.partner_pending_payout_line_items(uuid) to authenticated;

-- ============================================================================
-- D5. payout_runs — a lock row, not a data table. An Edge Function batch
--     job is stateless across separate RPC calls (no single DB transaction
--     spans "compute pending amount" -> "call Cashfree" -> "record the
--     payout"), so a session/transaction-scoped advisory lock wouldn't
--     actually hold across that gap. A plain row with a unique primary key
--     does: begin_payout_run's INSERT either succeeds (lock acquired) or
--     hits the primary key and fails (someone else is already running this
--     venue's payout) — atomic regardless of which stateless call gets
--     there first. The 10-minute staleness override exists so a crashed
--     Edge Function invocation (Cashfree call succeeded, function died
--     before recording) can't permanently wedge a venue's payouts.
-- ============================================================================

create table if not exists public.payout_runs (
  venue_id    uuid primary key references public.venues (id) on delete cascade,
  started_at  timestamptz not null default now()
);

comment on table public.payout_runs is
  'Presence of a row = a payout run is in progress for that venue. Not '
  'user-facing data — no RLS needed, only ever touched by service-role '
  'functions below.';

create or replace function public.begin_payout_run(p_venue_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acquired boolean;
begin
  -- RETURNING only produces a row for THIS statement's own write: either a
  -- brand-new insert, or a conflict resolved by the stale-takeover UPDATE.
  -- If the conflicting row is fresh (someone else's active lock), the DO
  -- UPDATE's WHERE clause skips it and RETURNING yields nothing here —
  -- unlike re-reading the table afterward, which every concurrent caller
  -- would see as "recent" regardless of who wrote it.
  insert into public.payout_runs (venue_id, started_at)
  values (p_venue_id, now())
  on conflict (venue_id) do update
    set started_at = excluded.started_at
    where public.payout_runs.started_at < now() - interval '10 minutes'
  returning true into v_acquired;

  return coalesce(v_acquired, false);
end;
$$;

comment on function public.begin_payout_run(uuid) is
  'Returns true iff the caller now holds the lock for this venue. Always '
  'pair with end_payout_run in a try/finally — see cashfree-run-payout.';

revoke all on function public.begin_payout_run(uuid) from public, authenticated, anon;
grant execute on function public.begin_payout_run(uuid) to service_role;

create or replace function public.end_payout_run(p_venue_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.payout_runs where venue_id = p_venue_id;
$$;

revoke all on function public.end_payout_run(uuid) from public, authenticated, anon;
grant execute on function public.end_payout_run(uuid) to service_role;

-- ============================================================================
-- D6. payout_line_items — a booking must never appear in two payouts. The
--     Phase A table only had a (payout_id, booking_id) unique constraint,
--     which does nothing to stop the SAME booking being paid out under two
--     DIFFERENT payout_ids if a race ever slips past the payout_runs lock
--     above (belt-and-suspenders: the lock should already prevent this).
-- ============================================================================

alter table public.payout_line_items drop constraint if exists payout_line_items_unique;
alter table public.payout_line_items
  add constraint payout_line_items_booking_unique unique (booking_id);

-- ============================================================================
-- D7. record_payout_batch — service-role only. Atomically writes the
--     payout + its line items + closes out exactly the deductions the
--     caller already subtracted (passed in explicitly, not re-queried here
--     — the caller's SELECT and this INSERT must agree on which deductions
--     were actually accounted for in p_amount).
-- ============================================================================

create or replace function public.record_payout_batch(
  p_venue_id             uuid,
  p_amount               integer,
  p_method               text,
  p_cashfree_transfer_id text,
  p_status               text,
  p_booking_ids          uuid[],
  p_net_amounts          integer[],
  p_deduction_ids        uuid[] default '{}'
)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts;
  v_i      integer;
begin
  if p_booking_ids is null or p_net_amounts is null
     or array_length(p_booking_ids, 1) is distinct from array_length(p_net_amounts, 1) then
    raise exception 'BOOKING_IDS_AND_NET_AMOUNTS_MUST_MATCH';
  end if;

  insert into public.payouts (venue_id, amount, status, payout_method, cashfree_transfer_id)
  values (p_venue_id, p_amount, p_status, p_method, p_cashfree_transfer_id)
  returning * into v_payout;

  for v_i in 1 .. coalesce(array_length(p_booking_ids, 1), 0) loop
    insert into public.payout_line_items (payout_id, booking_id, amount)
    values (v_payout.id, p_booking_ids[v_i], p_net_amounts[v_i]);
  end loop;

  if p_deduction_ids is not null and array_length(p_deduction_ids, 1) > 0 then
    update public.payout_deductions
    set applied_to_payout_id = v_payout.id
    where id = any (p_deduction_ids)
      and venue_id = p_venue_id
      and applied_to_payout_id is null;
  end if;

  return v_payout;
end;
$$;

revoke all on function public.record_payout_batch(uuid, integer, text, text, text, uuid[], integer[], uuid[])
  from public, authenticated, anon;
grant execute on function public.record_payout_batch(uuid, integer, text, text, text, uuid[], integer[], uuid[])
  to service_role;

-- ============================================================================
-- D8. mark_payout_status — service-role only, called by the Cashfree
--     webhook to flip processing -> completed/failed.
-- ============================================================================

create or replace function public.mark_payout_status(
  p_cashfree_transfer_id text,
  p_status               text
)
returns public.payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.payouts;
begin
  if p_status not in ('processing', 'completed', 'failed') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.payouts
  set status = p_status
  where cashfree_transfer_id = p_cashfree_transfer_id
  returning * into v_payout;

  if v_payout.id is null then
    raise exception 'PAYOUT_NOT_FOUND';
  end if;

  return v_payout;
end;
$$;

revoke all on function public.mark_payout_status(text, text) from public, authenticated, anon;
grant execute on function public.mark_payout_status(text, text) to service_role;

-- ============================================================================
-- D9. The post-payout refund/deduction case. mark_booking_refunded (Phase C,
--     consumer-shared) is the single place a booking's payment_status
--     becomes 'refunded' — reusing it here (create-or-replace, same
--     signature) rather than adding a second refund pathway. If the
--     booking being refunded already has a payout_line_items row, its
--     payout already went out, so the clawback is logged to
--     payout_deductions for the NEXT payout batch to subtract — exactly
--     the case flagged in the brief. If it was never paid out yet (still
--     sitting in partner_pending_payout_line_items), there's nothing to
--     claw back — it simply won't be included in a future payout.
-- ============================================================================

create or replace function public.mark_booking_refunded(
  p_booking_id          uuid,
  p_razorpay_refund_id  text,
  p_razorpay_payment_id text,
  p_amount              integer
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking      public.bookings;
  v_paid_out_net integer;
begin
  update public.bookings
  set status = 'cancelled_refunded', payment_status = 'refunded'
  where id = p_booking_id and status = 'cancelled'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception 'BOOKING_NOT_CANCELLED';
  end if;

  insert into public.refund_log (
    booking_id, user_id, razorpay_payment_id, razorpay_refund_id, amount, status
  ) values (
    p_booking_id, v_booking.user_id, p_razorpay_payment_id, p_razorpay_refund_id, p_amount, 'processed'
  );

  select amount into v_paid_out_net
  from public.payout_line_items
  where booking_id = p_booking_id;

  if v_paid_out_net is not null then
    insert into public.payout_deductions (venue_id, booking_id, amount, reason)
    values (
      v_booking.venue_id,
      p_booking_id,
      v_paid_out_net,
      'Booking refunded after its payout had already gone out'
    );
  end if;

  return v_booking;
end;
$$;

revoke all on function public.mark_booking_refunded(uuid, text, text, integer) from public, authenticated, anon;
grant execute on function public.mark_booking_refunded(uuid, text, text, integer) to service_role;

-- ============================================================================
-- D10. payout_webhook_events — audit trail for every Cashfree payout
--      webhook received, mirroring payment_events' role for Razorpay.
--      Written and read only via service role (Edge Functions) — no RLS
--      policies needed, same reasoning as payment_events.
-- ============================================================================

create table if not exists public.payout_webhook_events (
  id              uuid primary key default gen_random_uuid(),
  payout_id       uuid references public.payouts (id) on delete set null,
  cashfree_event  text,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_payout_webhook_events_payout_id on public.payout_webhook_events (payout_id);

alter table public.payout_webhook_events enable row level security;
-- No policies: service-role only, same as payment_events.

create or replace function public.record_payout_webhook_event(
  p_cashfree_transfer_id text,
  p_cashfree_event       text,
  p_payload              jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout_id uuid;
begin
  select id into v_payout_id from public.payouts where cashfree_transfer_id = p_cashfree_transfer_id;

  insert into public.payout_webhook_events (payout_id, cashfree_event, payload)
  values (v_payout_id, p_cashfree_event, p_payload);
end;
$$;

revoke all on function public.record_payout_webhook_event(text, text, jsonb) from public, authenticated, anon;
grant execute on function public.record_payout_webhook_event(text, text, jsonb) to service_role;

-- ============================================================================
-- End of Backend Phase D
-- ============================================================================