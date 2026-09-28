-- Lets a campaign_runs row ("Ad") be assigned into a specific funnel set's
-- TOFU/MOFU/BOFU campaign block. Both columns null means the ad sits
-- unassigned in the ad pool.
alter table public.campaign_runs
  add column if not exists funnel_set_id uuid references public.funnel_projects(id) on delete set null,
  add column if not exists stage text check (stage in ('TOFO', 'MOFO', 'BOFO'));

create index if not exists campaign_runs_funnel_set_idx on public.campaign_runs(funnel_set_id, stage);
