-- Follow-up pages written after a funnel page: a thank-you page for people who
-- are not the dream client, and a pixel page for the ideal client (the page the
-- tracking pixel fires on). They live in landing_prompts beside the funnel page
-- they follow, so they are listed, edited and deleted the same way.
alter table public.landing_prompts
  add column if not exists page_type text not null default 'funnel' check (page_type in ('funnel', 'thank_you', 'pixel')),
  add column if not exists parent_id uuid references public.landing_prompts(id) on delete cascade;
create index if not exists landing_prompts_parent_idx on public.landing_prompts (parent_id);

alter table public.prompt_jobs drop constraint if exists prompt_jobs_kind_check;
alter table public.prompt_jobs add constraint prompt_jobs_kind_check check (kind in ('image', 'video', 'landing', 'followup'));
