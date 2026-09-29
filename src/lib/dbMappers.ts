import type { Style } from "./styleLibrary";
import type { SavedRun } from "./types";

// snake_case DB rows <-> camelCase app types.

export interface StyleRow {
  id: string;
  category: string;
  name: string;
  description: string;
  built_in: boolean;
  examples: unknown;
}

export function styleRowToStyle(row: StyleRow): Style {
  return {
    id: row.id,
    category: row.category as Style["category"],
    name: row.name,
    description: row.description,
    builtIn: row.built_in,
    examples: Array.isArray(row.examples) ? (row.examples as Style["examples"]) : [],
  };
}

export function styleToRow(style: Style): StyleRow {
  return {
    id: style.id,
    category: style.category,
    name: style.name,
    description: style.description,
    built_in: style.builtIn,
    examples: style.examples,
  };
}

export interface RunRow {
  id: string;
  label: string;
  created_at: string;
  intake: string;
  fields: unknown;
  ad_angle_names: string[];
  funnel_style_name: string;
  vsl_style_name: string;
  kit: unknown;
  original_kit: unknown;
  edit_ledger: unknown;
}

export function runRowToSavedRun(row: RunRow): SavedRun {
  return {
    id: row.id,
    label: row.label,
    createdAt: row.created_at,
    intake: row.intake,
    fields: (row.fields as Record<string, string>) ?? {},
    adAngleNames: row.ad_angle_names ?? [],
    funnelStyleName: row.funnel_style_name ?? "",
    vslStyleName: row.vsl_style_name ?? "",
    kit: row.kit as SavedRun["kit"],
    // Older rows saved before edit tracking existed have no original_kit —
    // fall back to kit itself so the UI still has something to compare against.
    originalKit: (row.original_kit as SavedRun["originalKit"]) ?? (row.kit as SavedRun["originalKit"]),
    editLedger: Array.isArray(row.edit_ledger) ? (row.edit_ledger as SavedRun["editLedger"]) : [],
  };
}
