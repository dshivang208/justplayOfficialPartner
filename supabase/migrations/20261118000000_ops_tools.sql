-- Ops tools: contact inbox, review moderation + partner replies, partner offers.

-- ============ 1. Contact inbox ============
alter table public.contact_submissions
  add column if not exists status      text not null default 'new',
  add column if not exists admin_note  text,
  add column if not exists handled_by  uuid references public.admin_users (id) on delete set null,
  add column if not exists updated_at  timestamptz not null default now();
do $$ begin
  alter table public.contact_submissions
    add constraint contact_submissions_status_check check (status in ('new','in_progress','resolved'));
exception when duplicate_object then null; end $$;

drop policy if exists "contact admin select" on public.contact_submissions;
create policy "contact admin select" on public.contact_submissions
  for select to authenticated using (public.is_admin());
drop policy if exists "contact admin update" on public.contact_submissions;
create policy "contact admin update" on public.contact_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, update on public.contact_submissions to authenticated;

create or replace function public.admin_update_contact_submission(
  p_id uuid, p_status text, p_note text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_status not in ('new','in_progress','resolved') then raise exception 'INVALID_STATUS'; end if;
  update public.contact_submissions
     set status = p_status, admin_note = nullif(btrim(coalesce(p_note,'')), ''),
         handled_by = auth.uid(), updated_at = now()
   where id = p_id;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
  values (auth.uid(), 'contact_submission.update', 'contact_submissions', p_id::text,
          jsonb_build_object('status', p_status));
end $$;
grant execute on function public.admin_update_contact_submission(uuid, text, text) to authenticated;

-- ============ 2. Review moderation + partner reply ============
alter table public.reviews
  add column if not exists is_hidden       boolean not null default false,
  add column if not exists hidden_reason   text,
  add column if not exists partner_reply   text,
  add column if not exists partner_replied_at timestamptz;
do $$ begin
  alter table public.reviews add constraint reviews_reply_length
    check (partner_reply is null or char_length(partner_reply) <= 600);
exception when duplicate_object then null; end $$;

-- Public sees only visible reviews of active venues.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select using (
    is_hidden = false
    and exists (select 1 from public.venues v where v.id = reviews.venue_id and v.is_active = true)
  );
-- Admins see everything (incl. hidden).
drop policy if exists "reviews admin read" on public.reviews;
create policy "reviews admin read" on public.reviews
  for select to authenticated using (public.is_admin());

-- Venue rating ignores hidden reviews; recompute when visibility flips.
create or replace function public.trg_reviews_sync_venue_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_venue_id uuid := coalesce(new.venue_id, old.venue_id);
  v_avg numeric; v_count integer;
begin
  select round(avg(rating)::numeric, 1), count(*) into v_avg, v_count
  from public.reviews where venue_id = v_venue_id and is_hidden = false;
  update public.venues set rating = v_avg, review_count = coalesce(v_count, 0) where id = v_venue_id;
  return null;
end $$;

create or replace function public.admin_set_review_hidden(p_id uuid, p_hidden boolean, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_hidden and (p_reason is null or length(btrim(p_reason)) < 3) then raise exception 'REASON_REQUIRED'; end if;
  update public.reviews
     set is_hidden = p_hidden, hidden_reason = case when p_hidden then btrim(p_reason) else null end
   where id = p_id;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
  values (auth.uid(), case when p_hidden then 'review.hide' else 'review.unhide' end,
          'reviews', p_id::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_delete_review(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
  select auth.uid(), 'review.delete', 'reviews', r.id::text,
         jsonb_build_object('reason', p_reason, 'venue_id', r.venue_id, 'rating', r.rating, 'body', r.body)
  from public.reviews r where r.id = p_id;
  delete from public.reviews where id = p_id;
end $$;
grant execute on function public.admin_set_review_hidden(uuid, boolean, text) to authenticated;
grant execute on function public.admin_delete_review(uuid, text) to authenticated;

-- Partner replies to a review of a venue they are linked to.
create or replace function public.partner_reply_review(p_review_id uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
declare v_venue uuid; v_reply text := nullif(btrim(coalesce(p_reply,'')), '');
begin
  select venue_id into v_venue from public.reviews where id = p_review_id;
  if v_venue is null then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.partner_venues pv
                  where pv.venue_id = v_venue and pv.partner_id = auth.uid() and pv.role = 'owner') then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_reply is not null and char_length(v_reply) > 600 then raise exception 'REPLY_TOO_LONG'; end if;
  update public.reviews
     set partner_reply = v_reply, partner_replied_at = case when v_reply is null then null else now() end
   where id = p_review_id;
end $$;
grant execute on function public.partner_reply_review(uuid, text) to authenticated;

-- Partner sees all reviews (incl. hidden is NOT needed) of own venues: public read already covers it.
-- Columns for the reply are readable via select on reviews (table-level grant already exists).

-- ============ 3. Partner offers (venue-scoped coupons) ============
alter table public.coupons
  add column if not exists created_by_partner uuid references public.partners (id) on delete set null;

drop policy if exists "coupons partner read own" on public.coupons;
create policy "coupons partner read own" on public.coupons
  for select to authenticated using (created_by_partner = auth.uid());

create or replace function public.partner_create_offer(
  p_code text, p_discount_type text, p_value integer, p_usage_limit integer,
  p_expiry_date date, p_venue_id uuid
) returns public.coupons language plpgsql security definer set search_path = public as $$
declare v_code text := upper(btrim(coalesce(p_code,''))); v_row public.coupons;
begin
  if not exists (select 1 from public.partner_venues pv
                  where pv.venue_id = p_venue_id and pv.partner_id = auth.uid() and pv.role = 'owner') then
    raise exception 'NOT_ALLOWED';
  end if;
  if v_code !~ '^[A-Z0-9]{4,16}$' then raise exception 'INVALID_CODE'; end if;
  if p_discount_type not in ('flat','percentage') then raise exception 'INVALID_TYPE'; end if;
  if p_value is null or p_value <= 0 or (p_discount_type = 'percentage' and p_value > 90) then
    raise exception 'INVALID_VALUE';
  end if;
  if p_usage_limit is null or p_usage_limit <= 0 or p_usage_limit > 10000 then raise exception 'INVALID_LIMIT'; end if;
  if p_expiry_date is null or p_expiry_date < current_date then raise exception 'INVALID_EXPIRY'; end if;
  if exists (select 1 from public.coupons where code = v_code) then raise exception 'CODE_TAKEN'; end if;

  insert into public.coupons (code, discount_type, value, usage_limit, expiry_date, applicable_venues, created_by_partner)
  values (v_code, p_discount_type, p_value, p_usage_limit, p_expiry_date,
          jsonb_build_array(p_venue_id::text), auth.uid())
  returning * into v_row;
  return v_row;
end $$;

-- Ending an offer = expiring it yesterday (validate_and_apply_coupon already rejects expired codes).
create or replace function public.partner_end_offer(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.coupons set expiry_date = current_date - 1
   where id = p_id and created_by_partner = auth.uid();
  if not found then raise exception 'NOT_ALLOWED'; end if;
end $$;
grant execute on function public.partner_create_offer(text, text, integer, integer, date, uuid) to authenticated;
grant execute on function public.partner_end_offer(uuid) to authenticated;
