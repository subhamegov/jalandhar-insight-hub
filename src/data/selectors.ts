import { agencies, assets, evidence, projects, schemes } from "./jalandhar";
import type { Project, ProjectStatus } from "./types";

export const IN_EXECUTION: ProjectStatus[] = [
  "tendered",
  "awarded",
  "under_construction",
  "substantially_complete",
];

export const COMPLETED_STATES: ProjectStatus[] = ["completed", "commissioned", "operational"];

export function isDelayed(p: Project): boolean {
  if (p.status === "stalled") return true;
  if (p.delay_days !== null && p.delay_days > 0) return true;
  return false;
}

export function isCompletedNotOperational(p: Project): boolean {
  if (p.status !== "completed" && p.status !== "substantially_complete") return false;
  return p.operational_status !== "Operational";
}

export function hasConflict(p: Project): boolean {
  return Boolean(p.conflict_note);
}

export function overviewMetrics() {
  return [
    { label: "Total identified projects", value: projects.length, hint: "Records in system" },
    {
      label: "Total sanctioned investment",
      value: null as number | null,
      hint: "No sanction values verified yet",
    },
    {
      label: "Projects under execution",
      value: projects.filter((p) => IN_EXECUTION.includes(p.status)).length,
      hint: "Tendered to substantially complete",
    },
    {
      label: "Delayed projects",
      value: projects.filter(isDelayed).length,
      hint: "Stalled or past planned end date",
    },
    {
      label: "Completed but not operational",
      value: projects.filter(isCompletedNotOperational).length,
      hint: "Built, service delivery unconfirmed",
    },
    {
      label: "Data conflicts requiring review",
      value: projects.filter(hasConflict).length,
      hint: "Sources disagree",
    },
  ];
}

export function projectsByStatus() {
  const map = new Map<ProjectStatus, number>();
  for (const p of projects) map.set(p.status, (map.get(p.status) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function projectsByAgency() {
  const map = new Map<string, number>();
  for (const p of projects) {
    const key = p.implementing_agency ?? "Not available";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function projectsBySystem() {
  const map = new Map<string, number>();
  for (const p of projects) {
    if (!p.sector) continue;
    map.set(p.sector, (map.get(p.sector) ?? 0) + 1);
  }
  return map;
}

export function fieldCompleteness() {
  const first = projects[0];
  if (!first) return [];
  const fields = Object.keys(first) as (keyof Project)[];
  return fields
    .map((field) => {
      const filled = projects.filter((p) => {
        const v = p[field];
        return v !== null && v !== undefined && v !== "";
      }).length;
      return { field: String(field), filled, total: projects.length };
    })
    .sort((a, b) => a.filled - b.filled);
}

export function projectYear(p: Project): string {
  const d = p.sanction_date ?? p.award_date ?? p.announcement_date ?? p.planned_end_date ?? null;
  if (!d) return "Not available";
  const y = d.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "Not available";
}

export function costBand(p: Project): string {
  const v = p.sanctioned_cost;
  if (v === null || v === undefined) return "Not available";
  if (v < 10) return "Under 10 cr";
  if (v < 100) return "10 to 100 cr";
  if (v < 500) return "100 to 500 cr";
  return "Over 500 cr";
}

export const COST_BANDS = [
  "Under 10 cr",
  "10 to 100 cr",
  "100 to 500 cr",
  "Over 500 cr",
  "Not available",
];

export function governmentLevelOf(p: Project): string {
  if (p.central_ministry && p.state_department) return "Central and state";
  if (p.central_ministry) return "Central";
  if (p.state_department) return "State";
  return "Not available";
}

export function projectsForAgency(agencyName: string) {
  return {
    owned: projects.filter((p) => p.owning_agency === agencyName),
    implemented: projects.filter((p) => p.implementing_agency === agencyName),
  };
}

export { agencies, assets, evidence, projects, schemes };
