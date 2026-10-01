-- Which ads a funnel page prompt was written for (display names), so a level
-- can list pages built from a chosen subset of its ads.
alter table public.landing_prompts add column if not exists source_labels text[] not null default '{}';
