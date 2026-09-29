-- Ad idea library: ads to run in the future, jotted down as they come to mind.
-- stage is an optional target funnel level; used marks ideas already built.
create table if not exists public.ad_ideas (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  note text not null default '',
  stage text check (stage in ('TOFO', 'MOFO', 'BOFO')),
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ad_ideas_created_at_idx on public.ad_ideas (created_at desc);
alter table public.ad_ideas enable row level security;
revoke all on public.ad_ideas from anon, authenticated;
grant all on public.ad_ideas to service_role;
