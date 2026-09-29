-- Placements: one row per (ad, angle) put into a funnel level. Replaces the
-- single funnel_set_id/stage/funnel_angle_index on campaign_runs, so the same
-- ad can appear several times — different angles in different levels, or
-- several angles in one level.
create table if not exists public.funnel_placements (
  id uuid primary key default gen_random_uuid(),
  funnel_set_id uuid not null references public.funnel_projects(id) on delete cascade,
  stage text not null check (stage in ('TOFO', 'MOFO', 'BOFO')),
  run_id uuid not null references public.campaign_runs(id) on delete cascade,
  angle_index integer check (angle_index >= 0), -- null = angle not chosen yet
  created_at timestamptz not null default now()
);
create index if not exists funnel_placements_set_idx on public.funnel_placements (funnel_set_id, stage, created_at);
create index if not exists funnel_placements_run_idx on public.funnel_placements (run_id);
alter table public.funnel_placements enable row level security;
revoke all on public.funnel_placements from anon, authenticated;
grant all on public.funnel_placements to service_role;

-- Carry over existing assignments (once).
insert into public.funnel_placements (funnel_set_id, stage, run_id, angle_index)
select r.funnel_set_id, r.stage, r.id, r.funnel_angle_index
from public.campaign_runs r
where r.funnel_set_id is not null and r.stage is not null
  and not exists (select 1 from public.funnel_placements p where p.run_id = r.id);

-- Pictures now belong to a placement (so each angle in a level can have its
-- own image) instead of to the whole ad.
alter table public.picture_ads add column if not exists placement_id uuid references public.funnel_placements(id) on delete cascade;
alter table public.picture_ads drop constraint if exists picture_ads_check;
update public.picture_ads pa set placement_id = p.id, run_id = null
from public.funnel_placements p
where pa.run_id is not null and p.run_id = pa.run_id;
alter table public.picture_ads drop constraint if exists picture_ads_one_owner;
alter table public.picture_ads add constraint picture_ads_one_owner
  check (num_nonnulls(run_id, contribution_id, placement_id) = 1);
create index if not exists picture_ads_placement_idx on public.picture_ads (placement_id, created_at);
