-- ============================================================================
-- JustPlay Partner — Backend Phase C: Booking Management
-- ============================================================================
-- Same shared Supabase project, same `bookings` table the consumer app
-- already uses — no parallel bookings table, no parallel refund pathway.
-- Phase A already gave partners read access to their venue's bookings
-- ("bookings partner read venue"); this migration adds the write side.
-- ============================================================================

-- ============================================================================
-- C1. bookings — walk-in support + payment/notes fields the Partner UI needs
-- ============================================================================
-- user_id becomes nullable because a walk-in customer usually has no
-- JustPlay account at all — their name/phone are captured directly instead.
-- The check constraint below ensures every row still identifies SOMEONE,
-- just via one path or the other, never neither.

alter table public.bookings alter column user_id drop not null;

alter table public.bookings add column if not exists walkin_customer_name text;
alter table public.bookings add column if not exists walkin_customer_phone text;
alter table public.bookings add column if not exists source text not null default 'online';
alter table public.bookings add column if not exists payment_method text not null default 'online';
alter table public.bookings add column if not exists payment_status text not null default 'pending';
alter table public.bookings add column if not exists notes text not null default '';

alter table public.bookings drop constraint if exists bookings_source_check;
alter table public.bookings add constraint bookings_source_check check (source in ('online', 'walk_in'));

alter table public.bookings drop constraint if exists bookings_payment_method_check;
alter table public.bookings add constraint bookings_payment_method_check
  check (payment_method in ('cash', 'upi', 'online'));

alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('paid', 'pending', 'refunded'));

alter table public.bookings drop constraint if exists bookings_identifies_someone;
alter table public.bookings add constraint bookings_identifies_someone
  check (user_id is not null or (source = 'walk_in' and walkin_customer_name is not null));

comment on column public.bookings.payment_status is
  'Set by mark_booking_confirmed (-> paid), mark_booking_refunded (-> refunded), or '
  'directly at insert time for walk-ins. Independent of `status`, which tracks the '
  'booking''s lifecycle rather than its payment.';

-- ============================================================================
-- C2. booking_flags — no-show / dispute, kept separate from bookings.status
--     per the brief ("for future use", e.g. platform-level trust scoring)
-- ============================================================================

create table if not exists public.booking_flags (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  flag_type   text not null,
  reason      text,
  flagged_by  uuid references public.partners (id) on delete set null,
  created_at  timestamptz not null default now(),

  constraint booking_flags_type_check check (flag_type in ('no_show', 'dispute')),
  constraint booking_flags_unique unique (booking_id, flag_type)
);

alter table public.booking_flags enable row level security;

drop policy if exists "booking_flags partner read" on public.booking_flags;
create policy "booking_flags partner read" on public.booking_flags
  for select using (
    exists (
      select 1 from public.bookings b
      join public.partner_venues pv on pv.venue_id = b.venue_id
      where b.id = booking_flags.booking_id and pv.partner_id = auth.uid()
    )
  );

grant select on public.booking_flags to authenticated;
-- Writes via partner_flag_booking / partner_unflag_booking only, below.

-- ============================================================================
-- C3. create_booking — extended for walk-ins, reusing the exact same
--     locking loop (and therefore the exact same double-booking
--     protection) the consumer app's booking flow depends on, rather than
--     a separate insert path. Also fixes a real bug from the Phase B
--     re-declaration of this function: the time-range separator was typed
--     as the literal text "\u2013" instead of an actual en-dash character
--     — Postgres string literals don't interpret \u escapes, so every
--     booking made since Phase B shipped would have stored a time label
--     with a visible backslash-u-2013 in it. Fixed below.
-- ============================================================================

create or replace function public.create_booking(
  p_slot_ids                uuid[],
  p_credit_applied          integer default 0,
  p_walkin_customer_name    text default null,
  p_walkin_customer_phone   text default null,
  p_walkin_payment_method   text default null,
  p_walkin_payment_status   text default null,
  p_walkin_amount           integer default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_walkin     boolean := p_walkin_customer_name is not null;
  v_user_id       uuid;
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
  if v_is_walkin then
    if p_walkin_customer_phone is null then raise exception 'WALKIN_PHONE_REQUIRED'; end if;
    v_user_id := null;
  else
    v_user_id := auth.uid();
    if v_user_id is null then
      raise exception 'AUTH_REQUIRED' using errcode = '28000';
    end if;
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

  -- A walk-in is created BY the venue, on the venue's own terms — no
  -- platform fee/GST breakdown (that's specifically how the consumer
  -- checkout prices an ONLINE booking), and the front desk can override
  -- the amount (e.g. a discount) rather than it being strictly
  -- slot-price-derived.
  if v_is_walkin then
    if public.partner_role_for_venue(v_venue_id) is null then
      raise exception 'NOT_ALLOWED';
    end if;
    v_platform_fee := 0;
    v_gst := 0;
    v_total := coalesce(p_walkin_amount, v_base_price);
    v_credit := 0;
  else
    v_platform_fee := round(v_base_price * 0.05);
    v_gst := round((v_base_price + v_platform_fee) * 0.18);
    v_total := v_base_price + v_platform_fee + v_gst;
    v_credit := greatest(0, least(coalesce(p_credit_applied, 0), v_total, public.my_wallet_balance()));
  end if;

  v_time_label := to_char(v_first_start, 'HH12:MI AM') || ' – ' || to_char(v_last_end, 'HH12:MI AM');

  insert into public.bookings (
    user_id, venue_id, slot_id, sport, date, time,
    price_paid, platform_fee, gst, credit_applied, status,
    walkin_customer_name, walkin_customer_phone, source, payment_method, payment_status
  ) values (
    v_user_id, v_venue_id, p_slot_ids[1], v_sport, v_date, v_time_label,
    v_total, v_platform_fee, v_gst, v_credit,
    case when v_is_walkin then 'confirmed' else 'pending' end,
    p_walkin_customer_name, p_walkin_customer_phone,
    case when v_is_walkin then 'walk_in' else 'online' end,
    coalesce(p_walkin_payment_method, 'online'),
    case when v_is_walkin then coalesce(p_walkin_payment_status, 'paid') else 'pending' end
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

grant execute on function public.create_booking(uuid[], integer, text, text, text, text, integer) to authenticated;

-- The old 2-argument signature is superseded by the 7-argument one above —
-- Postgres treats different argument lists as different functions, so the
-- original stays callable (harmless) unless explicitly dropped. Drop it so
-- there's exactly one create_booking, matching "the SAME atomic RPC" the
-- brief calls for rather than two similar-looking ones.
drop function if exists public.create_booking(uuid[], integer);

-- ============================================================================
-- C4. cancel_booking — now callable by the customer OR the venue
--     (owner/staff), same function either way. cancel-booking-refund (the
--     existing consumer Edge Function) calls this AS the caller, so a
--     partner invoking that SAME Edge Function with their own session now
--     works unmodified — no second refund pathway needed.
-- ============================================================================

create or replace function public.cancel_booking(p_booking_id uuid, p_reason text default null)
returns table (booking public.bookings, hours_before_slot numeric, refund_eligible boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking     public.bookings;
  v_slot_start  timestamptz;
  v_hours_left  numeric;
  v_is_partner  boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking.id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  v_is_partner := public.partner_role_for_venue(v_booking.venue_id) is not null;
  if v_booking.user_id is distinct from auth.uid() and not v_is_partner then
    raise exception 'NOT_YOUR_BOOKING';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'BOOKING_NOT_CANCELLABLE';
  end if;

  select (v_booking.date + s.start_time)::timestamptz into v_slot_start
  from public.slots s where s.id = v_booking.slot_id;

  v_hours_left := extract(epoch from (v_slot_start - now())) / 3600.0;

  update public.bookings
  set status = 'cancelled', cancellation_reason = coalesce(p_reason, 'user_cancelled')
  where id = p_booking_id
  returning * into v_booking;

  update public.slots s
  set status = 'available'
  from public.booking_slots bs
  where bs.booking_id = p_booking_id and s.id = bs.slot_id;

  -- A walk-in was never paid through Razorpay — there's nothing for the
  -- refund Edge Function to refund, cash-in-hand settlements are between
  -- the venue and the customer directly.
  return query select v_booking, v_hours_left,
    (v_hours_left > 2 and v_booking.payment_id is not null and v_booking.source = 'online');
end;
$$;

grant execute on function public.cancel_booking(uuid, text) to authenticated;

-- ============================================================================
-- C5. payment_status kept in sync at the two points that already exist
-- ============================================================================

create or replace function public.mark_booking_confirmed(p_booking_id uuid, p_payment_id text)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  update public.bookings
  set status = 'confirmed', payment_id = p_payment_id, payment_status = 'paid'
  where id = p_booking_id and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    select * into v_booking from public.bookings where id = p_booking_id;
    if v_booking.id is null then
      raise exception 'BOOKING_NOT_FOUND';
    end if;
    return v_booking;
  end if;

  perform public.maybe_reward_referral(v_booking.user_id);

  return v_booking;
end;
$$;

revoke all on function public.mark_booking_confirmed(uuid, text) from public, authenticated, anon;
grant execute on function public.mark_booking_confirmed(uuid, text) to service_role;

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
  v_booking public.bookings;
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

  return v_booking;
end;
$$;

revoke all on function public.mark_booking_refunded(uuid, text, text, integer) from public, authenticated, anon;
grant execute on function public.mark_booking_refunded(uuid, text, text, integer) to service_role;

-- ============================================================================
-- C6. Mark completed — owner or staff
-- ============================================================================

create or replace function public.partner_mark_booking_completed(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_booking  public.bookings;
begin
  select venue_id into v_venue_id from public.bookings where id = p_booking_id;
  if v_venue_id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  update public.bookings
  set status = 'completed'
  where id = p_booking_id and status = 'confirmed'
  returning * into v_booking;

  if v_booking.id is null then raise exception 'BOOKING_NOT_CONFIRMED'; end if;
  return v_booking;
end;
$$;

grant execute on function public.partner_mark_booking_completed(uuid) to authenticated;

-- ============================================================================
-- C7. Flag / unflag — no-show or dispute, owner or staff. Deliberately NOT
--     a bookings.status transition (see C2) — a no-show booking is still,
--     structurally, a confirmed booking that simply wasn't attended.
-- ============================================================================

create or replace function public.partner_flag_booking(p_booking_id uuid, p_flag_type text, p_reason text)
returns public.booking_flags
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_flag     public.booking_flags;
begin
  select venue_id into v_venue_id from public.bookings where id = p_booking_id;
  if v_venue_id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;
  if p_flag_type not in ('no_show', 'dispute') then raise exception 'INVALID_FLAG_TYPE'; end if;

  insert into public.booking_flags (booking_id, flag_type, reason, flagged_by)
  values (p_booking_id, p_flag_type, p_reason, auth.uid())
  on conflict (booking_id, flag_type) do update set reason = excluded.reason
  returning * into v_flag;

  return v_flag;
end;
$$;

grant execute on function public.partner_flag_booking(uuid, text, text) to authenticated;

create or replace function public.partner_unflag_booking(p_booking_id uuid, p_flag_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
begin
  select venue_id into v_venue_id from public.bookings where id = p_booking_id;
  if v_venue_id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  delete from public.booking_flags where booking_id = p_booking_id and flag_type = p_flag_type;
end;
$$;

grant execute on function public.partner_unflag_booking(uuid, text) to authenticated;

-- ============================================================================
-- C8. Internal staff notes — owner or staff
-- ============================================================================

create or replace function public.partner_save_booking_notes(p_booking_id uuid, p_notes text)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_booking  public.bookings;
begin
  select venue_id into v_venue_id from public.bookings where id = p_booking_id;
  if v_venue_id is null then raise exception 'BOOKING_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  update public.bookings set notes = p_notes where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.partner_save_booking_notes(uuid, text) to authenticated;

-- ============================================================================
-- C9. Customer visibility — a partner needs the name/phone of whoever
--     booked at their venue (online bookings only; walk-ins already store
--     the customer's name/phone directly on the booking row). `public.users`
--     otherwise only allows a user to read their own row — this adds a
--     narrowly-scoped exception: visible only for a customer who has an
--     actual booking at a venue this partner is linked to, not globally.
-- ============================================================================

drop policy if exists "users partner read for own venue bookings" on public.users;
create policy "users partner read for own venue bookings" on public.users
  for select using (
    exists (
      select 1 from public.bookings b
      join public.partner_venues pv on pv.venue_id = b.venue_id
      where b.user_id = users.id and pv.partner_id = auth.uid()
    )
  );

-- ============================================================================
-- End of Backend Phase C
-- ============================================================================
