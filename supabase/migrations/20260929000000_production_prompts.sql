-- AI-written prompts to paste into outside production tools.
--
-- image_prompts: a static Facebook image ad, for ChatGPT or Higgsfield. Saved per item in a funnel level — an ad
-- angle placement or a piece of level copy (with which of its angles).
create table if not exists public.image_prompts (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid references public.funnel_placements(id) on delete cascade,
  contribution_id uuid references public.funnel_contributions(id) on delete cascade,
  angle_index integer not null default 0 check (angle_index >= 0),
  platform text not null check (platform in ('chatgpt', 'higgsfield')),
  aspect text not null check (aspect in ('4:5', '1:1', '9:16')),
  prompt text not null,
  on_image_text text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (num_nonnulls(placement_id, contribution_id) = 1)
);
create index if not exists image_prompts_placement_idx on public.image_prompts (placement_id, created_at desc);
create index if not exists image_prompts_contribution_idx on public.image_prompts (contribution_id, created_at desc);
alter table public.image_prompts enable row level security;
revoke all on public.image_prompts from anon, authenticated;
grant all on public.image_prompts to service_role;

-- landing_prompts: a landing page for one funnel level, for an AI site
-- builder, ChatGPT/Claude, or a hand-built page (section-by-section brief).
create table if not exists public.landing_prompts (
  id uuid primary key default gen_random_uuid(),
  funnel_set_id uuid not null references public.funnel_projects(id) on delete cascade,
  stage text not null check (stage in ('TOFO', 'MOFO', 'BOFO')),
  goal text not null check (goal in ('email_phone', 'download', 'book_call')),
  builder text not null check (builder in ('ai_builder', 'html', 'manual')),
  offer text not null default '',
  prompt text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists landing_prompts_level_idx on public.landing_prompts (funnel_set_id, stage, created_at desc);
alter table public.landing_prompts enable row level security;
revoke all on public.landing_prompts from anon, authenticated;
grant all on public.landing_prompts to service_role;
