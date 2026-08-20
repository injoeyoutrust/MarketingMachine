-- Adds the "emotionalTone" style category (Hawkins Map of Consciousness
-- states, used as a per-ad-angle voice/tone reference) alongside the
-- original three (adAngle, funnelStyle, vslStyle).

alter table styles drop constraint styles_category_check;

alter table styles add constraint styles_category_check
  check (category in ('adAngle', 'funnelStyle', 'vslStyle', 'emotionalTone'));
