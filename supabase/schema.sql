-- helpBham demo schema
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- Safe to re-run: it drops and recreates the demo tables and reseeds them.
--
-- DEMO ONLY: policies below let the public (anon) key read and write
-- everything, because the app uses hard-coded demo logins rather than
-- Supabase Auth. Lock these down before any real use.

create extension if not exists pgcrypto;

drop table if exists public.report_events cascade;
drop table if exists public.reports cascade;
drop table if exists public.shelters cascade;
drop table if exists public.settings cascade;

-- Shelters, managed by missionaries ------------------------------------
create table public.shelters (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  lat             double precision not null,
  lng             double precision not null,
  beds_total      integer not null default 0 check (beds_total >= 0),
  beds_available  integer not null default 0 check (beds_available >= 0),
  open_tonight    boolean not null default true,
  owner           text,              -- demo username of the missionary
  updated_at      timestamptz not null default now()
);

-- Reports of people in need ---------------------------------------------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique
                  default upper(substr(md5(random()::text), 1, 6)),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  lat           double precision not null,
  lng           double precision not null,
  people_count  integer not null default 1 check (people_count > 0),
  needs         text[] not null default '{}',
  note          text,
  contact       text,                -- optional, reporter-supplied
  urgent        boolean not null default false,
  status        text not null default 'reported'
                  check (status in ('reported','claimed','needs_bed','placed','closed')),
  reporter      text,                -- demo username
  helper        text,                -- demo username of claiming helper
  claimed_at    timestamptz,
  shelter_id    uuid references public.shelters(id) on delete set null,
  outcome       text
);

create index reports_status_idx on public.reports (status);

-- Audit trail -------------------------------------------------------------
create table public.report_events (
  id         bigserial primary key,
  report_id  uuid not null references public.reports(id) on delete cascade,
  at         timestamptz not null default now(),
  actor      text,
  role       text,
  action     text not null,
  detail     text
);

create index report_events_report_idx on public.report_events (report_id, at);

-- App-wide settings (single row) -----------------------------------------
create table public.settings (
  id         integer primary key default 1 check (id = 1),
  cold_mode  text not null default 'auto' check (cold_mode in ('auto','on','off')),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- Keep updated_at fresh ----------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger reports_touch  before update on public.reports
  for each row execute function public.touch_updated_at();
create trigger shelters_touch before update on public.shelters
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Demo RLS: open to anon ---------------------------------------------------
alter table public.shelters      enable row level security;
alter table public.reports       enable row level security;
alter table public.report_events enable row level security;
alter table public.settings      enable row level security;

create policy "demo open" on public.shelters      for all to anon, authenticated using (true) with check (true);
create policy "demo open" on public.reports       for all to anon, authenticated using (true) with check (true);
create policy "demo open" on public.report_events for all to anon, authenticated using (true) with check (true);
create policy "demo open" on public.settings      for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Realtime -----------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.reports;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.shelters;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.settings;
  exception when duplicate_object then null;
  end;
end $$;

-- Seed data (demo) ---------------------------------------------------------
insert into public.shelters (name, address, lat, lng, beds_total, beds_available, open_tonight, owner) values
  ('Firehouse Shelter',        '626 2nd Ave N',       33.5179, -86.8120, 40, 6, true,  'missionary'),
  ('Jimmie Hale Mission',      '3420 2nd Ave N',      33.5268, -86.7889, 60, 3, true,  'missionary2'),
  ('Salvation Army Center',    '2015 26th Ave N',     33.5420, -86.8120, 50, 0, true,  null),
  ('Grace House Warming Site', '1st Ave S & 20th St', 33.5108, -86.8040, 25, 12, true, null);

with r as (
  insert into public.reports (lat, lng, people_count, needs, note, status, reporter, helper, claimed_at)
  values
    (33.521, -86.803, 1, '{blanket,food}',   'Under the bridge near the rail yard', 'reported',  'reporter', null,     null),
    (33.514, -86.811, 2, '{blanket}',        'Two people in doorway, Morris Ave',   'claimed',   'reporter', 'helper', now() - interval '20 minutes'),
    (33.509, -86.799, 1, '{medical}',        'Older man, seems unwell, bus stop',   'needs_bed', 'reporter', 'helper', now() - interval '45 minutes')
  returning id, status
)
insert into public.report_events (report_id, actor, role, action)
select id, 'reporter', 'reporter', 'reported' from r;
