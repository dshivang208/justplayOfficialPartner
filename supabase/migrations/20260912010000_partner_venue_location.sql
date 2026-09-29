-- ============================================================================
-- JustPlay Partner — venue location & listing details (area, tagline, map pin)
-- ============================================================================
-- Consumer reads venues.area (neighbourhood + area filter), venues.tagline
-- (subtitle) and venues.latitude/longitude (map + distance). The Partner
-- signup only collects business name / owner / city, and nothing in the
-- Partner app could set these afterwards, so every partner-created venue
-- showed no map, a placeholder distance and a blank tagline on Consumer.
--
-- One owner-only function sets all four together. It is a "set wholesale"
-- write (the Settings form always sends the full set), so an owner can also
-- CLEAR a value by sending null/blank.
--
-- Requires 20260912000000_partner_fix_owner_check_null.sql to be applied
-- first only in the sense that this function uses the same NULL-safe owner
-- check; it does not depend on it technically.
-- Safe to re-run.
-- ============================================================================

create or replace function public.partner_save_venue_location(
  p_venue_id  uuid,
  p_area      text,
  p_tagline   text,
  p_latitude  numeric,
  p_longitude numeric
)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue   public.venues;
  v_area    text := nullif(btrim(p_area), '');
  v_tagline text := nullif(btrim(p_tagline), '');
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  if v_area is not null and char_length(v_area) > 60 then
    raise exception 'AREA_TOO_LONG';
  end if;
  if v_tagline is not null and char_length(v_tagline) > 120 then
    raise exception 'TAGLINE_TOO_LONG';
  end if;

  -- A pin needs both coordinates; a half-set pin would silently break the
  -- Consumer map, which only renders when both are present.
  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'LOCATION_INCOMPLETE';
  end if;
  if p_latitude is not null
     and (p_latitude not between -90 and 90 or p_longitude not between -180 and 180) then
    raise exception 'LOCATION_OUT_OF_RANGE';
  end if;

  update public.venues
  set area      = v_area,
      tagline   = v_tagline,
      latitude  = round(p_latitude, 6),
      longitude = round(p_longitude, 6)
  where id = p_venue_id
  returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

grant execute on function public.partner_save_venue_location(uuid, text, text, numeric, numeric) to authenticated;