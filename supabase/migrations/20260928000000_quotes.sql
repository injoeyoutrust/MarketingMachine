-- Quote bank: great lines captured as they come to mind, for reuse in hooks,
-- ads, and scripts. Access is through server routes using the service role,
-- consistent with campaign_runs.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
alter table public.quotes enable row level security;
revoke all on public.quotes from anon, authenticated;
grant all on public.quotes to service_role;
