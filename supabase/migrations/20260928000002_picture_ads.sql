-- Uploaded picture-ad images. Each belongs to exactly one item in a funnel
-- level: an ad (campaign_runs) or a piece of level copy (funnel_contributions).
-- Kept in their own table, not on those rows, so listing ads never drags the
-- image data along — images load only when the Picture ad tab is opened.
create table if not exists public.picture_ads (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.campaign_runs(id) on delete cascade,
  contribution_id uuid references public.funnel_contributions(id) on delete cascade,
  name text not null default '',
  image text not null, -- data: URL
  created_at timestamptz not null default now(),
  check ((run_id is null) <> (contribution_id is null))
);
create index if not exists picture_ads_run_idx on public.picture_ads (run_id, created_at);
create index if not exists picture_ads_contribution_idx on public.picture_ads (contribution_id, created_at);
alter table public.picture_ads enable row level security;
revoke all on public.picture_ads from anon, authenticated;
grant all on public.picture_ads to service_role;
