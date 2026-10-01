-- Prompt writing takes about a minute, longer than a Netlify web request may
-- run. A request now just queues a job here; a background function does the
-- Claude call, saves the prompt, and records the outcome for the page to read.
create table if not exists public.prompt_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'landing')),
  params jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error')),
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);
alter table public.prompt_jobs enable row level security;
revoke all on public.prompt_jobs from anon, authenticated;
grant all on public.prompt_jobs to service_role;
