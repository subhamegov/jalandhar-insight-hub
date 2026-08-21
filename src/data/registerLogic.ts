// Logic for the national government register: geographic scope grouping,
// system prioritisation (attention score) and known INR value totals.
//
// Nothing here invents data. Every rule reads published fields only.

import { ageInDays } from "@/lib/freshness";
import type { Project } from "./types";

export const SCOPE_GROUPS = [
  "Jalandhar city",
  "Jalandhar Cantt",
  "District and regional corridors",
  "Central institutions in Jalandhar",
  "All relevant projects",
] as const;

export type ScopeGroup = (typeof SCOPE_GROUPS)[number];

/** Group a published geography scope into the selector options. */
export function scopeGroupOf(p: Project): Exclude<ScopeGroup, "All relevant projects"> | "Other" {
  const scope = p.geography_scope ?? (p.locality ? "Jalandhar city" : null);
  if (!scope) return "Other";
  if (scope === "Jalandhar Cantt") return "Jalandhar Cantt";
  if (scope.startsWith("Central institution")) return "Central institutions in Jalandhar";
  if (/corridor|NH-44|bypass|district/i.test(scope)) return "District and regional corridors";
  if (scope.startsWith("Jalandhar city")) return "Jalandhar city";
  return "Other";
}

export function matchesScopeGroup(p: Project, group: string): boolean {
  if (group === "All relevant projects") return true;
  return scopeGroupOf(p) === group;
}

/** A project record is only a Municipal Corporation Jalandhar record if it says so. */
export function isCityRecord(p: Project): boolean {
  return scopeGroupOf(p) === "Jalandhar city";
}

// --- System prioritisation -------------------------------------------------

const MAJOR_VALUE_CRORE = 100;
const STALE_DAYS = 180;

const ENVIRONMENT_SECTORS = [
  "Environment",
  "Energy & Environment",
  "Solid Waste",
  "Used Water",
  "Water",
  "Sanitation",
  "Health",
  "Health Infrastructure",
  "Air Quality",
];

export type AttentionBand = "Routine" | "Monitor" | "Attention" | "Priority Review";

export interface AttentionScore {
  score: number;
  band: AttentionBand;
  reasons: { reason: string; weight: number }[];
}

export function attentionScore(p: Project, asOf = "2026-08-21"): AttentionScore {
  const reasons: { reason: string; weight: number }[] = [];
  const value = p.sanctioned_cost_cr ?? p.sanctioned_cost ?? null;

  if (value !== null && value >= MAJOR_VALUE_CRORE) {
    reasons.push({ reason: `Major known value of ₹${value} crore`, weight: 25 });
  }
  if (p.status === "under_construction") {
    reasons.push({ reason: "Work is under construction", weight: 10 });
  }
  if (p.planned_end_date && Date.parse(p.planned_end_date) < Date.parse(asOf)) {
    reasons.push({ reason: "Planned completion date has passed", weight: 20 });
  }
  if (
    (p.status === "completed" || p.status === "substantially_complete") &&
    !p.operational_status?.toLowerCase().startsWith("operational")
  ) {
    reasons.push({ reason: "Reported complete but operation not confirmed", weight: 20 });
  }
  if (p.dedupe_review_required) {
    reasons.push({ reason: "Record may duplicate another project record", weight: 10 });
  }
  if (p.evidence_quality === "official_historical") {
    reasons.push({ reason: "Only historical official evidence is available", weight: 10 });
  }
  if (p.sector && ENVIRONMENT_SECTORS.includes(p.sector)) {
    reasons.push({ reason: "Environment or public health sector", weight: 5 });
  }

  const score = reasons.reduce((t, r) => t + r.weight, 0);
  const band: AttentionBand =
    score >= 60 ? "Priority Review" : score >= 40 ? "Attention" : score >= 20 ? "Monitor" : "Routine";
  return { score, band, reasons };
}

export const ATTENTION_BANDS: AttentionBand[] = [
  "Priority Review",
  "Attention",
  "Monitor",
  "Routine",
];

// --- Money -----------------------------------------------------------------

/**
 * Total of published INR values only. USD source costs are never converted or
 * added. Records flagged for reconciliation are excluded unless asked for.
 */
export function knownInrValue(list: Project[], includeReconciliation = false): number {
  return list
    .filter((p) => includeReconciliation || !p.dedupe_review_required)
    .reduce((t, p) => t + (p.sanctioned_cost_cr ?? 0), 0);
}

export function hasUsdOnlyCost(p: Project): boolean {
  return Boolean(p.source_cost_text && /USD/i.test(p.source_cost_text) && !p.sanctioned_cost_cr);
}

export function isStaleEvidence(p: Project): boolean {
  const age = ageInDays(p.last_verified);
  if (age === null) return true;
  return age > STALE_DAYS || p.evidence_quality === "official_historical";
}

// --- Reconciliation --------------------------------------------------------

export function assetGroups(list: Project[]): Map<string, Project[]> {
  const map = new Map<string, Project[]>();
  for (const p of list) {
    if (!p.same_asset_group) continue;
    const arr = map.get(p.same_asset_group) ?? [];
    arr.push(p);
    map.set(p.same_asset_group, arr);
  }
  return map;
}

export function relatedRecords(p: Project, list: Project[]): Project[] {
  if (!p.same_asset_group) return [];
  return list.filter((o) => o.same_asset_group === p.same_asset_group && o.project_id !== p.project_id);
}

export const LOCATION_QUALITY_LABEL: Record<string, string> = {
  official_coordinate: "Official coordinate",
  approximate: "Approximate location",
  corridor: "Corridor, no single point",
  city_wide: "City-wide, no single point",
  no_coordinate: "No coordinate published",
};
