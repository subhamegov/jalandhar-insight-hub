// Rule based conflict detection.
//
// Conflicts are derived from the records held in this system. Nothing is
// inferred about the world: a rule only fires when the recorded evidence is
// missing, stale, or when two government sources disagree.

import { projects } from "./jalandhar";
import { componentsFor, programmesFor } from "./programmes";
import type { Conflict, ConflictSeverity, Project, ReportedValue } from "./types";

const STALE_DAYS = 180;

function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function make(
  p: Project,
  rule: string,
  rule_label: string,
  severity: ConflictSeverity,
  summary: string,
  sources: ReportedValue[] = [],
): Conflict {
  return {
    conflict_id: `${p.project_id}-${rule}`,
    project_id: p.project_id,
    project_name: p.project_name,
    rule,
    rule_label,
    severity,
    summary,
    sources,
  };
}

export function conflictsForProject(p: Project): Conflict[] {
  const out: Conflict[] = [];

  const costs = p.cost_records ?? [];
  if (costs.length > 1) {
    out.push(
      make(
        p,
        "multiple_costs",
        "Same project has multiple costs",
        "material_conflict",
        "Government sources report different cost figures for this project.",
        costs,
      ),
    );
  }

  const dates = p.completion_date_records ?? [];
  if (dates.length > 1) {
    out.push(
      make(
        p,
        "multiple_completion_dates",
        "Same project has multiple completion dates",
        "material_conflict",
        "More than one completion date is on record.",
        dates,
      ),
    );
  }

  const statuses = p.status_records ?? [];
  if (statuses.length > 1) {
    out.push(
      make(
        p,
        "status_disagreement",
        "Government sources report different status",
        "material_conflict",
        "Recorded status differs between sources.",
        statuses,
      ),
    );
  }

  const age = daysSince(p.progress_as_of);
  if (p.physical_progress_percentage === null) {
    out.push(
      make(
        p,
        "progress_missing",
        "Physical progress not reported",
        "review_required",
        "No physical progress figure is held for this project.",
      ),
    );
  } else if (age === null || age > STALE_DAYS) {
    out.push(
      make(
        p,
        "progress_stale",
        "Physical progress older than 180 days",
        "review_required",
        age === null
          ? "The progress figure has no reporting date."
          : `The progress figure is ${age} days old.`,
      ),
    );
  }

  if (
    (p.status === "completed" || p.status === "substantially_complete") &&
    (p.operational_status === null || !/^operational$/i.test(p.operational_status))
  ) {
    out.push(
      make(
        p,
        "completed_not_operational",
        "Completed but operational status unknown",
        "material_conflict",
        "Construction is recorded as complete. Service delivery from the asset is not confirmed.",
      ),
    );
  }

  if (p.latitude === null || p.longitude === null) {
    out.push(
      make(
        p,
        "no_precise_location",
        "No precise location",
        "review_required",
        "The project has no recorded coordinates.",
      ),
    );
  } else if (!p.geometry && p.geography_type && p.geography_type !== "site") {
    out.push(
      make(
        p,
        "point_for_network",
        "Network project held as a single point",
        "informational",
        "This intervention is a network but only a single point is recorded.",
      ),
    );
  }

  const programmes = programmesFor(p.project_id, p.scheme);
  const componentProgrammes = new Set(componentsFor(p.project_id).map((c) => c.programme));
  if (p.scheme && !componentProgrammes.has(p.scheme)) {
    out.push(
      make(
        p,
        "scheme_count_differs",
        "Scheme count differs across sources",
        "informational",
        `The register lists ${programmes.length} funding programme(s); the primary scheme "${p.scheme}" has no matching funding component.`,
      ),
    );
  }

  if (p.conflict_note) {
    out.push(
      make(
        p,
        "recorded_note",
        "Recorded conflict note",
        "review_required",
        p.conflict_note,
      ),
    );
  }

  if (p.evidence_quality === "unverified") {
    out.push(
      make(
        p,
        "unverified_evidence",
        "Record not backed by verified evidence",
        "informational",
        "No verified government source is attached to this record.",
      ),
    );
  }

  return out;
}

export function allConflicts(): Conflict[] {
  return projects.flatMap(conflictsForProject);
}

export const SEVERITY_RANK: Record<ConflictSeverity, number> = {
  material_conflict: 0,
  review_required: 1,
  informational: 2,
};
