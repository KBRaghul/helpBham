-- helpBham migration 002: atomic bed counts + placement time
-- Paste into Supabase Dashboard -> SQL Editor -> Run (after schema.sql).
-- Additive and safe to re-run: no tables are dropped, no data is deleted.
--
-- Why: the app used to compute new bed counts in the browser and write the
-- absolute number back, so concurrent changes (two placements, or rapid +/-
-- clicks) overwrote each other. These functions do the arithmetic inside one
-- database transaction with a row lock, so every change is applied exactly once.

-- When a person was placed (used for "Avg. Time to Bed"). --------------------
alter table public.reports add column if not exists placed_at timestamptz;
update public.reports
   set placed_at = coalesce(placed_at, updated_at)
 where status = 'placed' and placed_at is null;

-- Never let free beds exceed total beds. -------------------------------------
update public.shelters
   set beds_available = total_beds
 where total_beds is not null and beds_available > total_beds;

-- +/- buttons: add or remove beds atomically. --------------------------------
create or replace function public.adjust_beds(p_shelter uuid, p_delta integer)
returns public.shelters
language sql
as $$
  update public.shelters
     set beds_available = greatest(
           0,
           least(coalesce(total_beds, beds_available + p_delta), beds_available + p_delta)
         )
   where id = p_shelter
  returning *;
$$;

-- Missionary "Accept and Place": all-or-nothing. ------------------------------
-- Returns 'ok' | 'taken' (no longer waiting) | 'closed' | 'no_beds' | 'not_found'
create or replace function public.place_report(
  p_report uuid,
  p_shelter uuid,
  p_actor text,
  p_role text default 'missionary'
) returns text
language plpgsql
as $$
declare
  s public.shelters;
  r public.reports;
begin
  select * into s from public.shelters where id = p_shelter for update;
  if not found then return 'not_found'; end if;

  select * into r from public.reports where id = p_report for update;
  if not found then return 'not_found'; end if;
  if r.status <> 'needs_bed' then return 'taken'; end if;
  if not s.open_tonight then return 'closed'; end if;
  if s.beds_available < r.people_count then return 'no_beds'; end if;

  update public.shelters
     set beds_available = beds_available - r.people_count
   where id = p_shelter;

  update public.reports
     set status = 'placed', shelter_id = p_shelter, placed_at = now()
   where id = p_report;

  insert into public.report_events (report_id, actor, role, action, detail)
  values (p_report, p_actor, p_role, 'placed', s.name);

  return 'ok';
end $$;

-- Admin status override that keeps beds consistent. --------------------------
-- Leaving 'placed' returns the beds to that shelter; entering 'placed'
-- requires a shelter and takes the beds (same checks as place_report).
-- Returns 'ok' | 'no_shelter' | 'closed' | 'no_beds' | 'not_found'
create or replace function public.admin_set_status(
  p_report uuid,
  p_status text,
  p_actor text,
  p_shelter uuid default null
) returns text
language plpgsql
as $$
declare
  r public.reports;
  s public.shelters;
begin
  select * into r from public.reports where id = p_report for update;
  if not found then return 'not_found'; end if;
  if r.status = p_status and p_status <> 'placed' then return 'ok'; end if;

  -- Moving to placed: validate and take beds from the chosen shelter.
  if p_status = 'placed' then
    if p_shelter is null then return 'no_shelter'; end if;
    if r.status = 'placed' and r.shelter_id = p_shelter then return 'ok'; end if;
    select * into s from public.shelters where id = p_shelter for update;
    if not found then return 'not_found'; end if;
    if not s.open_tonight then return 'closed'; end if;
    if s.beds_available < r.people_count then return 'no_beds'; end if;
  end if;

  -- Leaving placed (or moving to another shelter): give the old beds back.
  if r.status = 'placed' and r.shelter_id is not null then
    update public.shelters
       set beds_available = least(
             coalesce(total_beds, beds_available + r.people_count),
             beds_available + r.people_count
           )
     where id = r.shelter_id;
  end if;

  if p_status = 'placed' then
    update public.shelters set beds_available = beds_available - r.people_count where id = p_shelter;
    update public.reports
       set status = 'placed', shelter_id = p_shelter, placed_at = now()
     where id = p_report;
  else
    update public.reports
       set status = p_status,
           shelter_id = null,
           placed_at = null,
           helper = case when p_status = 'reported' then null else helper end,
           claimed_at = case when p_status = 'reported' then null else claimed_at end
     where id = p_report;
  end if;

  insert into public.report_events (report_id, actor, role, action, detail)
  values (p_report, p_actor, 'admin', 'admin set ' || p_status,
          case when p_status = 'placed' then s.name end);

  return 'ok';
end $$;

-- Deleting a placed report also frees its beds. ------------------------------
create or replace function public.delete_report(p_report uuid) returns text
language plpgsql
as $$
declare
  r public.reports;
begin
  select * into r from public.reports where id = p_report for update;
  if not found then return 'not_found'; end if;
  if r.status = 'placed' and r.shelter_id is not null then
    update public.shelters
       set beds_available = least(
             coalesce(total_beds, beds_available + r.people_count),
             beds_available + r.people_count
           )
     where id = r.shelter_id;
  end if;
  delete from public.reports where id = p_report;
  return 'ok';
end $$;

grant execute on function public.adjust_beds(uuid, integer)                to anon, authenticated;
grant execute on function public.place_report(uuid, uuid, text, text)      to anon, authenticated;
grant execute on function public.admin_set_status(uuid, text, text, uuid)  to anon, authenticated;
grant execute on function public.delete_report(uuid)                       to anon, authenticated;

-- Make PostgREST pick up the new functions immediately.
notify pgrst, 'reload schema';
