-- ============================================================================
-- JustPlay Partner — Fix: Bulk Slot Setup couldn't represent overnight or
-- 24-hour court hours.
--
-- partner_generate_slots (Phase B) rejected any p_closes_at <= p_opens_at
-- with INVALID_HOURS, and even without that guard, its slot-count math
-- (extract(epoch from (p_closes_at - p_opens_at))) would have gone
-- negative for the same case, generating zero slots. That made it
-- impossible to set up a court that runs "10 PM–6 AM" (closes before it
-- opens, by clock time) or "6 AM–6 AM next day" / any 24-hour venue
-- (opens_at = closes_at). Both are legitimate, common cases for indoor
-- sports/turf venues.
--
-- Fix: closes_at <= opens_at now means "wraps into the next day" rather
-- than invalid — equal times specifically mean a full 24-hour day. The
-- per-slot start_time/end_time math already wrapped correctly on its own
-- (Postgres's `time + interval` arithmetic wraps within a day when cast
-- back to `::time`) — only the total-minutes bound driving
-- generate_series needed fixing, matching the same formula added to the
-- frontend's data/inventory.ts (rangeDurationMinutes) so the wizard's
-- slot-count preview and what actually gets created can never disagree.
--
-- Each generated day `d` owns its FULL session including any hours past
-- midnight — e.g. a 22:00–06:00 court's "Monday" slots run 22:00 Monday
-- through 05:xx Tuesday, all tagged date = Monday. This matches how such
-- venues are normally browsed/booked ("Friday night" covers the small
-- hours of Saturday) and avoids the generated date range's last day
-- needing to spill into a day outside p_generate_days.
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
  v_venue_id       uuid;
  v_sport          text;
  v_court          public.courts;
  v_until          date;
  v_band           jsonb;
  v_total_minutes  integer;
begin
  select venue_id, sport into v_venue_id, v_sport from public.courts where id = p_court_id;
  if v_venue_id is null then raise exception 'COURT_NOT_FOUND'; end if;
  if public.partner_role_for_venue(v_venue_id) is null then raise exception 'NOT_ALLOWED'; end if;

  if p_opens_at is null or p_closes_at is null then raise exception 'INVALID_HOURS'; end if;
  if p_duration_mins is null or p_duration_mins <= 0 then raise exception 'INVALID_DURATION'; end if;
  if p_generate_days is null or p_generate_days < 1 or p_generate_days > 365 then
    raise exception 'INVALID_RANGE';
  end if;

  -- closes_at > opens_at: same-day window, e.g. 06:00-22:00 = 16h.
  -- closes_at <= opens_at: wraps past midnight, e.g. 22:00-06:00 = 8h, or
  -- opens_at = closes_at (e.g. 06:00-06:00) = a full 24h day.
  v_total_minutes := case
    when p_closes_at > p_opens_at then extract(epoch from (p_closes_at - p_opens_at))::integer / 60
    else 1440 - (extract(epoch from p_opens_at)::integer / 60) + (extract(epoch from p_closes_at)::integer / 60)
  end;

  if v_total_minutes < p_duration_mins then raise exception 'HOURS_SHORTER_THAN_DURATION'; end if;

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
  -- from opens_at as integers (generate_series has no interval overload)
  -- up to v_total_minutes (not the raw closes_at - opens_at, which would
  -- be negative/wrong for an overnight range). `(p_opens_at + offset
  -- minutes)::time` wraps past midnight automatically once cast back to
  -- `time`, so start_time/end_time come out correct without special-
  -- casing — only the upper bound needed the wrap-aware total above.
  --
  -- Price-band matching also needs its own wrap awareness: a band can
  -- itself span midnight (e.g. a "Night" band from 22:00-06:00). For such
  -- a band, [start_time, end_time) with start > end must match via OR
  -- (>= start OR < end), not AND (>= start AND < end) — the AND form can
  -- never be true when start > end, so a wrapping band would silently
  -- never match its own post-midnight hours and fall through to whatever
  -- band happens to be listed first.
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
        where case
          when (band ->> 'end_time')::time > (band ->> 'start_time')::time then
            (p_opens_at + (offset_min || ' minutes')::interval)::time >= (band ->> 'start_time')::time
            and (p_opens_at + (offset_min || ' minutes')::interval)::time < (band ->> 'end_time')::time
          else
            (p_opens_at + (offset_min || ' minutes')::interval)::time >= (band ->> 'start_time')::time
            or (p_opens_at + (offset_min || ' minutes')::interval)::time < (band ->> 'end_time')::time
        end
        limit 1
      ),
      (p_price_bands -> 0 ->> 'price')::integer,
      0
    )
  from generate_series(current_date, v_until, interval '1 day') as d
  cross join generate_series(0, v_total_minutes - p_duration_mins, p_duration_mins) as offset_min
  on conflict (court_id, date, start_time) where court_id is not null
  do update set price = excluded.price
  where slots.status = 'available';

  return v_court;
end;
$$;

grant execute on function public.partner_generate_slots(uuid, time, time, integer, jsonb, integer) to authenticated;