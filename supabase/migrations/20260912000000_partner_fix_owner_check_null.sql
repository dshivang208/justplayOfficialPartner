-- ============================================================================
-- JustPlay Partner — SECURITY FIX: owner checks let non-members through
-- ============================================================================
-- Nine partner_* functions guard themselves with
--
--     if public.partner_role_for_venue(p_venue_id) <> 'owner' then raise ...
--
-- partner_role_for_venue() returns NULL for anyone with no partner_venues
-- link to that venue. In SQL, NULL <> 'owner' is NULL (not true), and
-- PL/pgSQL treats a NULL condition as false — so the exception was never
-- raised for a stranger. Any signed-in user (including any ordinary
-- consumer account, since both apps share one Supabase auth) who knew a
-- venue's UUID (they appear in consumer venue URLs) could call these RPCs
-- and, for any venue:
--     partner_set_venue_active        pause / unpause it
--     partner_save_venue_minor        overwrite its description, photos, amenities
--     partner_submit_venue_major_change / _discard_  file or cancel name/address changes
--     partner_update_business_details change legal name / GST number
--     partner_save_payout_account     change where the venue's payouts are sent
--     partner_invite_staff / _revoke_ / partner_remove_staff_member  manage its staff
-- Reproduced on a real Postgres before writing this fix.
--
-- Fix: `is distinct from 'owner'` (NULL-safe: NULL is distinct from 'owner'),
-- the same form partner_add_court and friends already use. Bodies below are
-- byte-for-byte the originals with that one comparison changed.
-- CREATE OR REPLACE keeps the existing GRANTs. Safe to re-run.
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
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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

create or replace function public.partner_discard_venue_pending_change(p_venue_id uuid)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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

create or replace function public.partner_set_venue_active(p_venue_id uuid, p_is_active boolean)
returns public.venues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue public.venues;
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.venues set is_active = p_is_active where id = p_venue_id returning * into v_venue;

  if v_venue.id is null then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  return v_venue;
end;
$$;

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
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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
  if public.partner_role_for_venue(v_venue_id) is distinct from 'owner' then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.staff_invites set status = 'revoked' where id = p_invite_id and status = 'invited';
end;
$$;

create or replace function public.partner_remove_staff_member(p_venue_id uuid, p_staff_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.partner_role_for_venue(p_venue_id) is distinct from 'owner' then
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