// Consistent attention labelling used across the register, map and dashboards.

import { conflictsForProject } from "./conflicts";
import { profileFor } from "./attention";
import type { Project } from "./types";

export type AttentionLabel = "On track" | "Attention" | "Critical" | "Data incomplete";

export interface AttentionAssessment {
  label: AttentionLabel;
  reasons: string[];
}

const MAJOR_PROJECT_CRORE = 100;

export function assessProject(p: Project): AttentionAssessment {
  const reasons: string[] = [];
  const profile = profileFor(p.project_id);
  const material = conflictsForProject(p).filter(
    (c) => c.severity === "material_conflict",
  ).length;

  const major = (p.sanctioned_cost ?? p.contracted_cost ?? 0) >= MAJOR_PROJECT_CRORE;
  const built = p.status === "completed" || p.status === "substantially_complete";

  if (p.status === "stalled") reasons.push("Recorded as stalled");
  if (profile && (profile.public_health_risk >= 4 || profile.environmental_risk >= 4)) {
    reasons.push("Major public health or environmental risk");
  }
  if (major && (p.delay_days ?? 0) > 365) {
    reasons.push("Delay of more than one year on a major project");
  }
  if (built && p.operational_status !== "Operational") {
    reasons.push("Construction reported complete but service not confirmed operational");
  }
  if (material > 0) {
    reasons.push(`${material} material conflict between government sources`);
  }
  if (reasons.length) return { label: "Critical", reasons };

  const incomplete: string[] = [];
  if (p.status === "unknown") incomplete.push("Current status not recorded");
  if (p.physical_progress_percentage === null) incomplete.push("Physical progress not reported");
  if (p.latitude === null || p.longitude === null) incomplete.push("No precise location");
  if (!p.last_verified) incomplete.push("Never independently verified");

  if ((p.delay_days ?? 0) > 0) {
    return {
      label: "Attention",
      reasons: [`${p.delay_days} days behind the approved date`, ...incomplete],
    };
  }
  if (incomplete.length >= 2) return { label: "Data incomplete", reasons: incomplete };
  if (incomplete.length === 1) return { label: "Attention", reasons: incomplete };
  return { label: "On track", reasons: ["No delay, conflict or readiness gap recorded"] };
}

export const ATTENTION_LABELS: AttentionLabel[] = [
  "Critical",
  "Attention",
  "Data incomplete",
  "On track",
];
