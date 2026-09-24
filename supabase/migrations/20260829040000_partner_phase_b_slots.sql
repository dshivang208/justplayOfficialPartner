-- ============================================================================
-- JustPlay Partner — Backend Phase B: Slot & Inventory Sync
-- ============================================================================
-- Same shared Supabase project. This migration adds the one real schema gap
-- Phase A didn't need to touch: the consumer schema has no notion of
-- "courts" (two physical courts offering the same sport at the same venue,
-- each with independent hours/pricing) — but the Partner app's Slot &
-- Inventory UI (already built, Phase 2) is built entirely around that
-- concept. Adding it properly here, rather than faking it in the frontend,
-- is what "Replace Phase 2's mock calendar data with real queries" actually
-- requires.
--
-- Everything here is additive to `venues`/`venue_pricing`/`slots` — no
-- existing consumer-facing column, query, or booking flow changes
-- behavior, and every new column is nullable so the untouched consumer
-- demo venues (no courts, no partner) keep working exactly as before.
-- ============================================================================

-- ============================================================================
-- B1. courts — the operational/scheduling entity Phase 2's UI already models
-- ============================================================================
-- Pricing itself stays on `venue_pricing` (below) per how that table's
-- already used elsewhere — `courts` only owns the scheduling metadata:
-- hours, slot duration, how far ahead slots have been generated, and
-- active/inactive status.

create table if not exists public.courts (
  id                      uuid primary key default gen_random_uuid(),
  venue_id                uuid not null references public.venues (id) on delete cascade,
  sport                   text not null,
  name                    text not null,
  status                  text not null default 'active',
  opens_at                time,
  closes_at               time,
  slot_duration_minutes   integer,
  slots_generated_until   date,
  created_at              timestamptz not null default now(),

  constraint courts_status_check check (status in ('active', 'inactive')),
  constraint courts_hours_check check (opens_at is null or closes_at is null or closes_at > opens_at),
  constraint courts_duration_check check (slot_duration_minutes is null or slot_duration_minutes > 0)
);

comment on table public.courts is
  'One row per physical court/turf/cage a venue offers. opens_at/closes_at/'
  'slot_duration_minutes/slots_generated_until are null until the owner runs '
  'Bulk Slot Setup for it at least once.';

alter table public.courts enable row level security;

drop policy if exists "courts partner read" on public.courts;
create policy "courts partner read" on public.courts
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = courts.venue_id and pv.partner_id = auth.uid()
    )
  );
-- No client write policies — every mutation goes through the SECURITY
-- DEFINER functions below (same pattern as every other write path in this
-- schema), which check role (owner vs staff) precisely rather than via RLS
-- alone.

grant select on public.courts to authenticated;

-- ============================================================================
-- B2. venue_pricing — extended to support per-court, time-banded pricing
-- ============================================================================
-- Previously: one flat price_per_slot per (venue, sport). Now: optionally
-- scoped to a specific court AND a specific time band within that court's
-- hours (e.g. "Evening (peak)" 17:00-23:00 at a higher rate). Existing
-- consumer-seeded rows are untouched — court_id/band_label/start_time/
-- end_time all stay null on them, and they keep behaving as a single flat
-- all-day rate exactly as before.

alter table public.venue_pricing add column if not exists court_id uuid references public.courts (id) on delete cascade;
alter table public.venue_pricing add column if not exists band_label text;
alter table public.venue_pricing add column if not exists start_time time;
alter table public.venue_pricing add column if not exists end_time time;

comment on column public.venue_pricing.court_id is
  'Null for legacy/consumer-demo rows (one flat venue-wide price). Set for '
  'partner-managed courts, where a court can have several banded price rows.';

-- ============================================================================
-- B3. slots — court_id + block metadata
-- ============================================================================

alter table public.slots add column if not exists court_id uuid references public.courts (id) on delete cascade;
alter table public.slots add column if not exists blocked_reason text;
alter table public.slots add column if not exists blocked_at timestamptz;

-- The original uniqueness rule (venue_id, sport, date, start_time) is
-- exactly right for legacy/non-court venues, but would wrongly forbid two
-- DIFFERENT courts of the same sport from both having, say, a 6pm slot —
-- which is the entire point of supporting multiple courts. Split it into
-- two partial unique indexes instead of one constraint: legacy rows
-- (court_id is null) keep the exact original protection; court-managed
-- rows get an equivalent protection scoped by court instead of by
-- venue+sport. Neither path gets weaker than the original.

alter table public.slots drop constraint if exists slots_no_double_booking;

drop index if exists slots_no_double_booking_legacy;
create unique index slots_no_double_booking_legacy
  on public.slots (venue_id, sport, date, start_time)
  where court_id is null;

drop index if exists slots_no_double_booking_court;
create unique index slots_no_double_booking_court
  on public.slots (court_id, date, start_time)
  where court_id is not null;

-- ============================================================================
-- B4. create_booking — close the new cross-court gap
-- ============================================================================
-- Adding court_id introduces one new way a booking could be wrong that
-- the original function (venue+sport+date only) couldn't have anticipated:
-- someone booking two contiguous hours where hour 1 is Court A's slot and
-- hour 2 is Court B's slot (same sport, same venue, same date — so the
-- original check passed) would silently merge two different physical
-- courts into one "booking". Re-declaring the whole function since
-- PL/pgSQL doesn't support patching just the loop body in place.

create or replace function public.create_booking(p_slot_ids uuid[], p_credit_applied integer default 0)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       uuid := auth.uid();
  v_slot          record;
  v_venue_id      uuid;
  v_sport         text;
  v_date          date;
  v_court_id      uuid;
  v_court_id_set  boolean := false;
  v_first_start   time;
  v_last_end      time;
  v_base_price    integer := 0;
  v_platform_fee  integer;
  v_gst           integer;
  v_total         integer;
  v_credit        integer;
  v_time_label    text;
  v_found_count   integer;
  v_booking       public.bookings;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if p_slot_ids is null or array_length(p_slot_ids, 1) is null then
    raise exception 'NO_SLOTS_SELECTED';
  end if;

  for v_slot in
    select * from public.slots
    where id = any (p_slot_ids)
    order by id
    for update
  loop
    if v_slot.status <> 'available' then
      raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001',
        detail = v_slot.id::text;
    end if;

    if v_venue_id is null then
      v_venue_id := v_slot.venue_id;
      v_sport := v_slot.sport;
      v_date := v_slot.date;
      v_court_id := v_slot.court_id;
      v_court_id_set := true;
      v_first_start := v_slot.start_time;
      v_last_end := v_slot.end_time;
    else
      if v_slot.venue_id <> v_venue_id or v_slot.sport <> v_sport or v_slot.date <> v_date then
        raise exception 'SLOTS_MUST_SHARE_VENUE_SPORT_DATE';
      end if;
      -- IS DISTINCT FROM treats two nulls as equal (both "no court" —
      -- fine, that's the legacy single-court-implied case) but null vs.
      -- a real court_id, or two different court_ids, as a mismatch.
      if v_court_id_set and v_slot.court_id is distinct from v_court_id then
        raise exception 'SLOTS_MUST_SHARE_COURT';
      end if;
      if v_slot.start_time < v_first_start then v_first_start := v_slot.start_time; end if;
      if v_slot.end_time > v_last_end then v_last_end := v_slot.end_time; end if;
    end if;

    v_base_price := v_base_price + coalesce(v_slot.price, 0);
  end loop;

  select count(*) into v_found_count from public.slots where id = any (p_slot_ids);
  if v_found_count <> array_length(p_slot_ids, 1) or v_found_count = 0 then
    raise exception 'SLOT_NOT_FOUND';
  end if;

  v_platform_fee := round(v_base_price * 0.05);
  v_gst := round((v_base_price + v_platform_fee) * 0.18);
  v_total := v_base_price + v_platform_fee + v_gst;
  v_credit := greatest(0, least(coalesce(p_credit_applied, 0), v_total, public.my_wallet_balance()));

  v_time_label := to_char(v_first_start, 'HH12:MI AM') || ' \u2013 ' || to_char(v_last_end, 'HH12:MI AM');

  insert into public.bookings (
    user_id, venue_id, slot_id, sport, date, time,
    price_paid, platform_fee, gst, credit_applied, status
  ) values (
    v_user_id, v_venue_id, p_slot_ids[1], v_sport, v_date, v_time_label,
    v_total, v_platform_fee, v_gst, v_credit, 'pending'
  ) returning * into v_booking;

  insert into public.booking_slots (booking_id, slot_id)
  select v_booking.id, s_id from unnest(p_slot_ids) as s_id;

  update public.slots set status = 'booked' where id = any (p_slot_ids);

  if v_credit > 0 then
    insert into public.wallet_transactions (user_id, amount, type, description)
    values (v_user_id, -v_credit, 'redeemed', 'Applied to booking ' || v_booking.id::text);
  end if;

  return v_booking;
end;
$$;

grant execute on function public.create_booking(uuid[], integer) to authenticated;

-- ============================================================================
-- B5. venue_exceptions — venue-wide closures/modified hours for a date
-- ============================================================================
-- `slots.status` intentionally has no 'closed' value (see Phase A schema) —
-- an exception doesn't add a new slot state, it bulk-blocks whichever of
-- the venue's already-generated slots fall inside the closure window (see
-- partner_add_venue_exception below), the same way a manual block does.
-- This table is the durable record of WHY, and is also what future slot
-- generation checks so newly-generated dates respect it too.

create table if not exists public.venue_exceptions (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues (id) on delete cascade,
  date        date not null,
  type        text not null,
  opens_at    time,
  closes_at   time,
  reason      text not null,
  created_at  timestamptz not null default now(),

  constraint venue_exceptions_type_check check (type in ('closed', 'modified_hours')),
  constraint venue_exceptions_unique unique (venue_id, date)
);

alter table public.venue_exceptions enable row level security;

drop policy if exists "venue_exceptions partner read" on public.venue_exceptions;
create policy "venue_exceptions partner read" on public.venue_exceptions
  for select using (
    exists (
      select 1 from public.partner_venues pv
      where pv.venue_id = venue_exceptions.venue_id and pv.partner_id = auth.uid()
    )
  );

grant select on public.venue_exceptions to authenticated;

-- ============================================================================
-- B6. Role check helper — every RPC below uses this instead of repeating
--     the same exists(...) five times
-- ============================================================================

create or replace function public.partner_role_for_venue(p_venue_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.partner_venues
  where venue_id = p_venue_id and partner_id = auth.uid()
  limit 1;
$$;

grant execute on function public.partner_role_for_venue(uuid) to authenticated;

-- ============================================================================
-- B7. Court management — owner-only (structural venue decisions), matching
--     how Settings/Payouts are owner-gated elsewhere in this app
-- ============================================================================

create or replace function public.partner_add_court(p_venue_id uuid, p_sport text, p_name text)
returns public.courts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts;
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  insert into public.courts (venue_id, sport, name)
  values (p_venue_id, p_sport, p_name)
  returning * into v_court;

  -- Keep venues.sports_offered in sync, per spec.
  update public.venues
  set sports_offered = (
    select coalesce(jsonb_agg(distinct s), '[]'::jsonb)
    from (
      select jsonb_array_elements_text(sports_offered) as s from public.venues where id = p_venue_id
      union
      select p_sport
    ) x
  )
  where id = p_venue_id;

  return v_court;
end;
$$;

grant execute on function public.partner_add_court(uuid, text, text) to authenticated;

create or replace function public.partner_update_court(p_court_id uuid, p_name text, p_sport text, p_status text)
returns public.courts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_court    public.courts;
begin
  select venue_id into v_venue_id from public.courts where id = p_court_id;
  if v_venue_id is null then raise exception 'COURT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_status not in ('active', 'inactive') then raise exception 'INVALID_STATUS'; end if;

  update public.courts
  set name = p_name, sport = p_sport, status = p_status
  where id = p_court_id
  returning * into v_court;

  update public.venues
  set sports_offered = (
    select coalesce(jsonb_agg(distinct s), '[]'::jsonb)
    from (
      select jsonb_array_elements_text(sports_offered) as s from public.venues where id = v_venue_id
      union
      select p_sport
    ) x
  )
  where id = v_venue_id;

  return v_court;
end;
$$;

grant execute on function public.partner_update_court(uuid, text, text, text) to authenticated;

create or replace function public.partner_delete_court(p_court_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.courts where id = p_court_id;
  if v_venue_id is null then raise exception 'COURT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  -- Slots/venue_pricing rows for this court cascade-delete via their FK,
  -- EXCEPT any slot already referenced by a real booking — `booking_slots`
  -- and `bookings.slot_id` reference slots with no cascade, so a court
  -- that's ever had a real booking can't be deleted outright.
  if exists (
    select 1 from public.booking_slots bs
    join public.slots s on s.id = bs.slot_id
    where s.court_id = p_court_id
  ) then
    raise exception 'COURT_HAS_BOOKING_HISTORY';
  end if;

  delete from public.courts where id = p_court_id;
end;
$$;

grant execute on function public.partner_delete_court(uuid) to authenticated;

-- ============================================================================
-- B8. Bulk slot generation — owner OR staff ("slot management" is
--     explicitly in staff's scope per the brief)
-- ============================================================================

create or replace function public.partner_generate_slots(
  p_court_id       uuid,
  p_opens_at       time,
  p_closes_at      time,
  p_duration_mins  integer,
  p_price_bands    jsonb,   -- [{"label":"Morning","start_time":"06:00","end_time":"12:00","price":600}, ...]
  p_generate_days  integer
)
returns public.courts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id  uuid;
  v_sport     text;
  v_court     public.courts;
  v_until     date;
  v_band      jsonb;
begin
  select venue_id, sport into v_venue_id, v_sport from public.courts where id = p_court_id;
  if v_venue_id is null then raise exception 'COURT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  if p_closes_at <= p_opens_at then raise exception 'INVALID_HOURS'; end if;
  if p_duration_mins is null or p_duration_mins <= 0 then raise exception 'INVALID_DURATION'; end if;
  if p_generate_days is null or p_generate_days < 1 or p_generate_days > 365 then
    raise exception 'INVALID_RANGE';
  end if;

  v_until := current_date + (p_generate_days - 1);

  update public.courts
  set opens_at = p_opens_at,
      closes_at = p_closes_at,
      slot_duration_minutes = p_duration_mins,
      slots_generated_until = v_until
  where id = p_court_id
  returning * into v_court;

  -- Replace this court's price bands wholesale with the new set.
  delete from public.venue_pricing where court_id = p_court_id;
  for v_band in select * from jsonb_array_elements(p_price_bands)
  loop
    insert into public.venue_pricing (venue_id, sport, court_id, band_label, start_time, end_time, price_per_slot, slot_duration_minutes)
    values (
      v_venue_id, v_sport, p_court_id,
      v_band ->> 'label',
      (v_band ->> 'start_time')::time,
      (v_band ->> 'end_time')::time,
      (v_band ->> 'price')::integer,
      p_duration_mins
    );
  end loop;

  -- Set-based slot generation via generate_series — far cheaper than a
  -- per-slot PL/pgSQL loop for a 90-day range. Iterates minute-offsets
  -- from opens_at as integers (generate_series has no interval/interval/
  -- interval overload) rather than intervals directly. price comes from
  -- whichever band's [start_time, end_time) covers that slot's
  -- start_time, falling back to the first band if none match (mirrors the
  -- frontend's original mock priceAt() fallback).
  insert into public.slots (venue_id, sport, court_id, date, start_time, end_time, status, price)
  select
    v_venue_id,
    v_sport,
    p_court_id,
    d::date,
    (p_opens_at + (offset_min || ' minutes')::interval)::time as start_time,
    (p_opens_at + ((offset_min + p_duration_mins) || ' minutes')::interval)::time as end_time,
    'available',
    coalesce(
      (
        select (band ->> 'price')::integer
        from jsonb_array_elements(p_price_bands) band
        where (p_opens_at + (offset_min || ' minutes')::interval)::time >= (band ->> 'start_time')::time
          and (p_opens_at + (offset_min || ' minutes')::interval)::time < (band ->> 'end_time')::time
        limit 1
      ),
      (p_price_bands -> 0 ->> 'price')::integer,
      0
    )
  from generate_series(current_date, v_until, interval '1 day') as d
  cross join generate_series(
    0,
    (extract(epoch from (p_closes_at - p_opens_at))::integer / 60) - p_duration_mins,
    p_duration_mins
  ) as offset_min
  on conflict (court_id, date, start_time) where court_id is not null
  do update set price = excluded.price
  where slots.status = 'available';

  return v_court;
end;
$$;

grant execute on function public.partner_generate_slots(uuid, time, time, integer, jsonb, integer) to authenticated;

-- ============================================================================
-- B9. Block / unblock a slot — owner or staff
-- ============================================================================

create or replace function public.partner_block_slot(p_slot_id uuid, p_reason text)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_slot     public.slots;
begin
  select venue_id into v_venue_id from public.slots where id = p_slot_id for update;
  if v_venue_id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  update public.slots
  set status = 'blocked', blocked_reason = p_reason, blocked_at = now()
  where id = p_slot_id and status = 'available'
  returning * into v_slot;

  if v_slot.id is null then raise exception 'SLOT_NOT_AVAILABLE'; end if;
  return v_slot;
end;
$$;

grant execute on function public.partner_block_slot(uuid, text) to authenticated;

create or replace function public.partner_unblock_slot(p_slot_id uuid)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_slot     public.slots;
begin
  select venue_id into v_venue_id from public.slots where id = p_slot_id for update;
  if v_venue_id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  update public.slots
  set status = 'available', blocked_reason = null, blocked_at = null
  where id = p_slot_id and status = 'blocked'
  returning * into v_slot;

  if v_slot.id is null then raise exception 'SLOT_NOT_BLOCKED'; end if;
  return v_slot;
end;
$$;

grant execute on function public.partner_unblock_slot(uuid) to authenticated;

-- ============================================================================
-- B10. Venue exceptions (holidays / modified hours) — owner-only
-- ============================================================================

create or replace function public.partner_add_venue_exception(
  p_venue_id  uuid,
  p_date      date,
  p_type      text,
  p_opens_at  time,
  p_closes_at time,
  p_reason    text
)
returns public.venue_exceptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exception public.venue_exceptions;
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;
  if p_type not in ('closed', 'modified_hours') then raise exception 'INVALID_TYPE'; end if;

  insert into public.venue_exceptions (venue_id, date, type, opens_at, closes_at, reason)
  values (p_venue_id, p_date, p_type, p_opens_at, p_closes_at, p_reason)
  on conflict (venue_id, date) do update
    set type = excluded.type, opens_at = excluded.opens_at, closes_at = excluded.closes_at, reason = excluded.reason
  returning * into v_exception;

  -- Bulk-block whichever already-generated, still-available slots (across
  -- every court at this venue) fall outside the new effective hours for
  -- that date — reusing 'blocked' status rather than a new slots.status
  -- value, same as a manual block.
  update public.slots
  set status = 'blocked', blocked_reason = 'Venue exception: ' || p_reason, blocked_at = now()
  where venue_id = p_venue_id
    and date = p_date
    and status = 'available'
    and (
      p_type = 'closed'
      or start_time < coalesce(p_opens_at, '00:00'::time)
      or start_time >= coalesce(p_closes_at, '24:00'::time)
    );

  return v_exception;
end;
$$;

grant execute on function public.partner_add_venue_exception(uuid, date, text, time, time, text) to authenticated;

create or replace function public.partner_remove_venue_exception(p_exception_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_date     date;
begin
  select venue_id, date into v_venue_id, v_date from public.venue_exceptions where id = p_exception_id;
  if v_venue_id is null then raise exception 'EXCEPTION_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  delete from public.venue_exceptions where id = p_exception_id;

  -- Un-block whatever this exception had blocked — a straight reversal,
  -- not a re-derivation, so a slot the owner had ALSO manually blocked for
  -- an unrelated reason on that same date stays blocked (its
  -- blocked_reason won't match this exception's signature).
  update public.slots
  set status = 'available', blocked_reason = null, blocked_at = null
  where venue_id = v_venue_id
    and date = v_date
    and status = 'blocked'
    and blocked_reason like 'Venue exception: %';
end;
$$;

grant execute on function public.partner_remove_venue_exception(uuid) to authenticated;

-- ============================================================================
-- End of Backend Phase B
-- ============================================================================
