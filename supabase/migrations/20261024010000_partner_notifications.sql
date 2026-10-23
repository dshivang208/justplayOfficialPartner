-- ============================================================================
-- Partner notifications — a real, persisted inbox for venue owners / staff.
-- ============================================================================
-- Until now the Partner bell only showed alerts computed on the fly (nothing
-- stored, nothing "read", no events). This adds a proper notifications table
-- that DATABASE TRIGGERS fill when something actually happens:
--
--   • a player books one of your slots             (new_booking)
--   • a player cancels a confirmed booking          (cancellation)
--   • a payout is processing / sent / failed        (payout)       owners only
--   • your payout account is verified / fails       (payout)       owners only
--   • your venue is approved / rejected              (venue_status)
--   • a player leaves a review                       (review)
--   • JustPlay Support replies or resolves a ticket  (support)
--
-- Each partner's own Settings → Notifications "in-app" switches are honoured.
-- Run AFTER 20261024000000_partner_support.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.partner_notifications (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  venue_id   uuid references public.venues (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  created_at timestamptz not null default now(),
  read_at    timestamptz,

  constraint partner_notifications_kind_check
    check (kind in ('new_booking', 'cancellation', 'payout', 'venue_status', 'review', 'support', 'system'))
);

create index if not exists idx_partner_notifications_partner
  on public.partner_notifications (partner_id, created_at desc);
create index if not exists idx_partner_notifications_unread
  on public.partner_notifications (partner_id) where read_at is null;

alter table public.partner_notifications enable row level security;

-- Read your own; every write goes through triggers / the two RPCs below.
drop policy if exists "partner_notifications select own" on public.partner_notifications;
create policy "partner_notifications select own" on public.partner_notifications
  for select to authenticated using (partner_id = auth.uid());

create or replace function public.mark_partner_notification_read(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.partner_notifications
  set read_at = coalesce(read_at, now())
  where id = p_id and partner_id = auth.uid();
$$;

create or replace function public.mark_all_partner_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.partner_notifications
  set read_at = now()
  where partner_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_partner_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_partner_notifications_read() to authenticated;

-- ── Fan-out helper: one row per owner/staff of the venue ──────────────────
-- p_pref: key in partner_settings.notification_prefs (newBooking, cancellation,
--         payout, lowOccupancy…). NULL = always notify. A partner who switched
--         "in-app" off for that key is skipped; no settings row = on.
create or replace function public._notify_venue_partners(
  p_venue_id   uuid,
  p_kind       text,
  p_title      text,
  p_body       text,
  p_link       text,
  p_pref       text default null,
  p_owner_only boolean default false
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.partner_notifications (partner_id, venue_id, kind, title, body, link)
  select pv.partner_id, p_venue_id, p_kind, p_title, coalesce(p_body, ''), p_link
  from public.partner_venues pv
  left join public.partner_settings ps on ps.partner_id = pv.partner_id
  where pv.venue_id = p_venue_id
    and (not p_owner_only or pv.role = 'owner')
    and (
      p_pref is null
      or coalesce((ps.notification_prefs -> p_pref ->> 'inApp')::boolean, true)
    );
$$;

revoke all on function public._notify_venue_partners(uuid, text, text, text, text, text, boolean)
  from public, anon, authenticated;

-- ── Bookings: new + cancelled ─────────────────────────────────────────────
create or replace function public._trg_notify_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_when text;
  v_actor_is_partner boolean;
begin
  begin
  if NEW.source is distinct from 'online' then return NEW; end if;

  v_when := to_char(NEW.date, 'Dy, DD Mon') || coalesce(' · ' || NEW.time, '');

  -- A player's booking just became confirmed (paid).
  if NEW.status = 'confirmed'
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'confirmed')
     and (TG_OP = 'INSERT' or OLD.status = 'pending') then
    select split_part(coalesce(name, ''), ' ', 1) into v_name from public.users where id = NEW.user_id;
    perform public._notify_venue_partners(
      NEW.venue_id, 'new_booking',
      'New booking · ' || initcap(coalesce(NEW.sport, 'Slot')),
      coalesce(nullif(v_name, ''), 'A player') || ' booked ' || v_when
        || ' · ₹' || coalesce(NEW.price_paid, 0),
      '/dashboard/bookings/' || NEW.id, 'newBooking', false);
  end if;

  -- A confirmed booking was cancelled — unless a partner did it themselves.
  if TG_OP = 'UPDATE'
     and OLD.status in ('confirmed', 'completed')
     and NEW.status like 'cancelled%' then
    v_actor_is_partner := auth.uid() is not null
      and public.partner_role_for_venue(NEW.venue_id) is not null;
    if not v_actor_is_partner then
      select split_part(coalesce(name, ''), ' ', 1) into v_name from public.users where id = NEW.user_id;
      perform public._notify_venue_partners(
        NEW.venue_id, 'cancellation',
        'Booking cancelled',
        coalesce(nullif(v_name, ''), 'A player') || ' cancelled ' || v_when
          || case when NEW.status = 'cancelled_refunded' then ' (refunded)' else '' end,
        '/dashboard/bookings/' || NEW.id, 'cancellation', false);
    end if;
  end if;

  exception when others then
    -- A notification problem must NEVER block the booking / payout itself.
    raise warning 'partner notification failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_booking on public.bookings;
create trigger trg_notify_booking
  after insert or update of status on public.bookings
  for each row execute function public._trg_notify_booking();

-- ── Payouts ───────────────────────────────────────────────────────────────
create or replace function public._trg_notify_payout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
  if TG_OP = 'INSERT' or NEW.status is distinct from OLD.status then
    perform public._notify_venue_partners(
      NEW.venue_id, 'payout',
      case NEW.status
        when 'processing' then 'Payout on its way'
        when 'completed'  then 'Payout sent'
        else 'Payout failed' end,
      case NEW.status
        when 'processing' then '₹' || NEW.amount || ' is being transferred to your account.'
        when 'completed'  then '₹' || NEW.amount || ' has been sent to your ' || NEW.payout_method || ' account.'
        else '₹' || NEW.amount || ' could not be sent. Check your payout details or contact support.' end,
      '/dashboard/payouts', 'payout', true);
  end if;
  exception when others then
    -- A notification problem must NEVER block the booking / payout itself.
    raise warning 'partner notification failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_payout on public.payouts;
create trigger trg_notify_payout
  after insert or update of status on public.payouts
  for each row execute function public._trg_notify_payout();

-- ── Payout account verification ───────────────────────────────────────────
create or replace function public._trg_notify_payout_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
  if NEW.verification_status is distinct from OLD.verification_status
     and NEW.verification_status in ('verified', 'failed') then
    perform public._notify_venue_partners(
      NEW.venue_id, 'payout',
      case NEW.verification_status when 'verified' then 'Payout account verified'
                                   else 'Payout account verification failed' end,
      case NEW.verification_status
        when 'verified' then 'Your ' || NEW.method || ' details are verified — payouts can now be sent.'
        else 'We couldn''t verify your ' || NEW.method || ' details. Please re-check and resubmit, or contact support.' end,
      '/dashboard/payouts', 'payout', true);
  end if;
  exception when others then
    -- A notification problem must NEVER block the booking / payout itself.
    raise warning 'partner notification failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_payout_account on public.payout_accounts;
create trigger trg_notify_payout_account
  after update of verification_status on public.payout_accounts
  for each row execute function public._trg_notify_payout_account();

-- ── Venue approval ────────────────────────────────────────────────────────
create or replace function public._trg_notify_venue_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
  if NEW.approval_status is distinct from OLD.approval_status
     and NEW.approval_status in ('approved', 'rejected') then
    perform public._notify_venue_partners(
      NEW.id, 'venue_status',
      case NEW.approval_status when 'approved' then NEW.name || ' is approved'
                               else NEW.name || ' was not approved' end,
      case NEW.approval_status
        when 'approved' then 'Your venue is live on JustPlay — players can now book it.'
        else coalesce(nullif(NEW.rejection_reason, ''), 'Contact support for details.') end,
      '/dashboard', null, false);
  end if;
  exception when others then
    -- A notification problem must NEVER block the booking / payout itself.
    raise warning 'partner notification failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_venue_status on public.venues;
create trigger trg_notify_venue_status
  after update of approval_status on public.venues
  for each row execute function public._trg_notify_venue_status();

-- ── Reviews ───────────────────────────────────────────────────────────────
create or replace function public._trg_notify_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
  perform public._notify_venue_partners(
    NEW.venue_id, 'review',
    'New ' || NEW.rating || '★ review',
    coalesce(nullif(NEW.author_name, ''), 'A player')
      || case when coalesce(trim(NEW.body), '') <> '' then ': ' || left(trim(NEW.body), 120) else ' left a rating.' end,
    '/dashboard', null, false);
  exception when others then
    -- A notification problem must NEVER block the booking / payout itself.
    raise warning 'partner notification failed: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_review on public.reviews;
create trigger trg_notify_review
  after insert on public.reviews
  for each row execute function public._trg_notify_review();

-- ── Support: tell the venue's partners when the team replies / resolves ───
create or replace function public.admin_reply_support_ticket(
  p_ticket_id uuid,
  p_body      text,
  p_internal  boolean default false,
  p_status    text default null
)
returns public.support_ticket_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.support_tickets;
  v_row    public.support_ticket_messages;
  v_status text;
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED'; end if;
  select * into v_ticket from public.support_tickets where id = p_ticket_id;
  if v_ticket.id is null then raise exception 'TICKET_NOT_FOUND'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 1 then raise exception 'MESSAGE_REQUIRED'; end if;
  if char_length(p_body) > 2000 then raise exception 'MESSAGE_TOO_LONG'; end if;
  if p_status is not null and p_status not in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed') then
    raise exception 'INVALID_STATUS';
  end if;

  insert into public.support_ticket_messages (ticket_id, sender_kind, sender_user_id, body, internal)
  values (p_ticket_id, 'admin', auth.uid(), trim(p_body), coalesce(p_internal, false))
  returning * into v_row;

  if coalesce(p_internal, false) then
    update public.support_tickets set updated_at = now() where id = p_ticket_id;
  else
    v_status := coalesce(p_status,
      case when v_ticket.status in ('open', 'in_progress') then 'waiting_user' else v_ticket.status end);
    update public.support_tickets
    set status = v_status,
        resolved_at = case when v_status = 'resolved' then coalesce(resolved_at, now()) else null end,
        assigned_admin_id = coalesce(assigned_admin_id, auth.uid()),
        last_message_at = now(), last_sender_kind = 'admin', updated_at = now()
    where id = p_ticket_id;

    if v_ticket.user_id is not null then
      insert into public.user_notifications (user_id, message)
      values (
        v_ticket.user_id,
        'Support replied on ticket #' || v_ticket.ticket_no || ': ' || left(trim(p_body), 120)
      );
    end if;
    if v_ticket.source = 'partner' and v_ticket.venue_id is not null then
      perform public._notify_venue_partners(
        v_ticket.venue_id, 'support',
        'JustPlay Support replied · #' || v_ticket.ticket_no,
        left(trim(p_body), 140),
        '/dashboard/support/' || v_ticket.id, null, false);
    end if;
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_reply_support_ticket(uuid, text, boolean, text) to authenticated;

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status    text default null,
  p_priority  text default null,
  p_assign    boolean default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.support_tickets;
  v_row public.support_tickets;
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED'; end if;
  if p_status is not null and p_status not in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed') then
    raise exception 'INVALID_STATUS';
  end if;
  if p_priority is not null and p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'INVALID_PRIORITY';
  end if;

  select * into v_old from public.support_tickets where id = p_ticket_id;

  update public.support_tickets
  set status   = coalesce(p_status, status),
      priority = coalesce(p_priority, priority),
      assigned_admin_id = case
        when p_assign is true then auth.uid()
        when p_assign is false then null
        else assigned_admin_id end,
      resolved_at = case
        when coalesce(p_status, status) in ('resolved', 'closed') then coalesce(resolved_at, now())
        else null end,
      updated_at = now()
  where id = p_ticket_id
  returning * into v_row;

  if v_row.id is null then raise exception 'TICKET_NOT_FOUND'; end if;

  if v_row.source = 'partner' and v_row.venue_id is not null
     and p_status in ('resolved', 'closed') and v_old.status is distinct from v_row.status then
    perform public._notify_venue_partners(
      v_row.venue_id, 'support',
      'Ticket #' || v_row.ticket_no || ' ' || case p_status when 'resolved' then 'resolved' else 'closed' end,
      v_row.subject,
      '/dashboard/support/' || v_row.id, null, false);
  end if;
  return v_row;
end;
$$;

grant execute on function public.admin_update_support_ticket(uuid, text, text, boolean) to authenticated;

-- ── Realtime (the bell updates live) ──────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.partner_notifications;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
