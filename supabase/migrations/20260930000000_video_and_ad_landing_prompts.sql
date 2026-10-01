-- Per-ad production prompts.
--
-- video_prompts: an AI-video generation prompt (Higgsfield, Veo, Sora) for one
-- ad angle, written from its video script. Saved per placement / level copy.
create table if not exists public.video_prompts (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid references public.funnel_placements(id) on delete cascade,
  contribution_id uuid references public.funnel_contributions(id) on delete cascade,
  angle_index integer not null default 0 check (angle_index >= 0),
  platform text not null check (platform in ('higgsfield', 'veo', 'sora')),
  aspect text not null check (aspect in ('9:16', '4:5', '1:1')),
  prompt text not null,
  voiceover text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (num_nonnulls(placement_id, contribution_id) = 1)
);
create index if not exists video_prompts_placement_idx on public.video_prompts (placement_id, created_at desc);
create index if not exists video_prompts_contribution_idx on public.video_prompts (contribution_id, created_at desc);
alter table public.video_prompts enable row level security;
revoke all on public.video_prompts from anon, authenticated;
grant all on public.video_prompts to service_role;

-- landing_prompts can now belong to a single ad angle (a funnel page for that
-- ad) instead of a whole level. Level-wide prompts leave these columns null.
alter table public.landing_prompts
  add column if not exists placement_id uuid references public.funnel_placements(id) on delete cascade,
  add column if not exists contribution_id uuid references public.funnel_contributions(id) on delete cascade,
  add column if not exists angle_index integer check (angle_index >= 0);
alter table public.landing_prompts drop constraint if exists landing_prompts_one_owner;
alter table public.landing_prompts add constraint landing_prompts_one_owner check (num_nonnulls(placement_id, contribution_id) <= 1);
create index if not exists landing_prompts_placement_idx on public.landing_prompts (placement_id, created_at desc);
create index if not exists landing_prompts_contribution_idx on public.landing_prompts (contribution_id, created_at desc);
