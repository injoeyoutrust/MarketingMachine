-- Edit tracking: a frozen snapshot of exactly what Claude generated
-- (original_kit, set once at creation, never touched again) plus a
-- chronological log of every field edit made after that (edit_ledger).
-- `kit` itself remains the live/current content, mutated by edits.

alter table campaign_runs
  add column if not exists original_kit jsonb,
  add column if not exists edit_ledger jsonb not null default '[]'::jsonb;

-- Backfill existing rows: treat their current kit as the original snapshot
-- since no prior edits could have happened before this migration existed.
update campaign_runs set original_kit = kit where original_kit is null;
