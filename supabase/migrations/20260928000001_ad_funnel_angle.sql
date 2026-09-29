-- Which one of an ad's angles (index into kit.adSets) its funnel level uses.
-- Null means no angle picked yet (the ad shows all angles until one is chosen).
alter table public.campaign_runs
  add column if not exists funnel_angle_index integer check (funnel_angle_index >= 0);
