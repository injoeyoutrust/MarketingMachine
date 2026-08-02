-- Campaign Engine schema: style library + saved campaign runs.
-- All app access goes through server-side Next.js API routes using the
-- service role key, which bypasses RLS by design. RLS is still enabled with
-- no public policies, so the anon/publishable key can never read or write
-- these tables even if it were ever exposed to the browser.

create extension if not exists pgcrypto;

create table if not exists styles (
  id text primary key,
  category text not null check (category in ('adAngle', 'funnelStyle', 'vslStyle')),
  name text not null,
  description text not null,
  built_in boolean not null default false,
  examples jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign_runs (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  created_at timestamptz not null default now(),
  intake text not null,
  fields jsonb not null default '{}'::jsonb,
  ad_angle_names text[] not null default '{}',
  funnel_style_name text not null default '',
  vsl_style_name text not null default '',
  kit jsonb not null
);

create index if not exists campaign_runs_created_at_idx on campaign_runs (created_at desc);
create index if not exists styles_category_idx on styles (category);

alter table styles enable row level security;
alter table campaign_runs enable row level security;
