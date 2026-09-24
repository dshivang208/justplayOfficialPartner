-- ============================================================================
-- JustPlay Partner — Fix: multi-slot selection for walk-in booking / block
-- ============================================================================
-- create_booking already accepted p_slot_ids as an array (Phase C) — a
-- walk-in booking spanning several slots was always possible from the
-- backend's side. Blocking never had the same: partner_block_slot/
-- partner_unblock_slot only ever took one slot_id. The actual bug report
-- ("can't select multiple slots before booking") was really a frontend
-- gap (no multi-select interaction existed at all), but blocking needed
-- this backend piece too to be consistent, and to do it atomically —
-- looping single-slot calls from the client risks a partial block if one
-- call in the middle fails.
-- ============================================================================

create or replace function public.partner_block_slots(p_slot_ids uuid[], p_reason text)
returns setof public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id     uuid;
  v_found_count  integer;
begin
  if p_slot_ids is null or array_length(p_slot_ids, 1) is null then
    raise exception 'NO_SLOTS_SELECTED';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  -- Lock every target row up front so a concurrent booking/block on any
  -- of them serializes against this call rather than racing it.
  perform 1 from public.slots where id = any(p_slot_ids) for update;

  select venue_id into v_venue_id from public.slots where id = p_slot_ids[1];
  if v_venue_id is null then
    raise exception 'SLOT_NOT_FOUND';
  end if;
  if public.partner_role_for_venue(v_venue_id) is null then
    raise exception 'NOT_ALLOWED';
  end if;

  -- All-or-nothing: every selected slot must belong to this same venue
  -- and still be available, or nothing gets blocked. Matches
  -- create_booking's own all-or-nothing slot validation.
  select count(*) into v_found_count
  from public.slots
  where id = any(p_slot_ids) and venue_id = v_venue_id and status = 'available';

  if v_found_count <> array_length(p_slot_ids, 1) then
    raise exception 'SLOT_NOT_AVAILABLE';
  end if;

  return query
    update public.slots
    set status = 'blocked', blocked_reason = p_reason, blocked_at = now()
    where id = any(p_slot_ids)
    returning *;
end;
$$;

grant execute on function public.partner_block_slots(uuid[], text) to authenticated;

create or replace function public.partner_unblock_slots(p_slot_ids uuid[])
returns setof public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id     uuid;
  v_found_count  integer;
begin
  if p_slot_ids is null or array_length(p_slot_ids, 1) is null then
    raise exception 'NO_SLOTS_SELECTED';
  end if;

  perform 1 from public.slots where id = any(p_slot_ids) for update;

  select venue_id into v_venue_id from public.slots where id = p_slot_ids[1];
  if v_venue_id is null then
    raise exception 'SLOT_NOT_FOUND';
  end if;
  if public.partner_role_for_venue(v_venue_id) is null then
    raise exception 'NOT_ALLOWED';
  end if;

  select count(*) into v_found_count
  from public.slots
  where id = any(p_slot_ids) and venue_id = v_venue_id and status = 'blocked';

  if v_found_count <> array_length(p_slot_ids, 1) then
    raise exception 'SLOT_NOT_BLOCKED';
  end if;

  return query
    update public.slots
    set status = 'available', blocked_reason = null, blocked_at = null
    where id = any(p_slot_ids)
    returning *;
end;
$$;

grant execute on function public.partner_unblock_slots(uuid[]) to authenticated;