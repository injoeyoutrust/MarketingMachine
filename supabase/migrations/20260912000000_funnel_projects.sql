create table public.funnel_projects (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  fields jsonb not null default '{}',
  stages jsonb not null,
  created_at timestamptz not null default now()
);
create table public.funnel_contributions (
  id uuid primary key,
  project_id uuid not null references public.funnel_projects(id) on delete cascade,
  stage text not null check (stage in ('TOFO', 'MOFO', 'BOFO')),
  mode text not null check (mode in ('base', 'quick', 'push')),
  idea text not null default '',
  copy jsonb not null,
  created_at timestamptz not null default now()
);
create unique index funnel_one_base_per_stage on public.funnel_contributions(project_id, stage) where mode = 'base';
create index funnel_contributions_project on public.funnel_contributions(project_id, created_at);
alter table public.funnel_projects enable row level security;
alter table public.funnel_contributions enable row level security;
-- Access is through server routes using the service role, consistent with campaign_runs.
revoke all on public.funnel_projects, public.funnel_contributions from anon, authenticated;
grant all on public.funnel_projects, public.funnel_contributions to service_role;
