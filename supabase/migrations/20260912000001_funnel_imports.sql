alter table public.funnel_contributions drop constraint funnel_contributions_mode_check;
alter table public.funnel_contributions add constraint funnel_contributions_mode_check check (mode in ('base', 'quick', 'push', 'import'));
