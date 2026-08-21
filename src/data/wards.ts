// Ward view.
//
// Official ward boundaries have not been loaded into this system. Rather than
// invent ward numbers, records are grouped by the ward field where an agency
// has recorded one, otherwise by recorded locality, otherwise into a single
// "Ward not recorded" group so that the gap stays visible.

import { assets, projects } from "./jalandhar";
import type { Asset, Project } from "./types";

export const WARD_BOUNDARIES_LOADED = false;
export const UNASSIGNED = "not-recorded";

export interface WardArea {
  id: string;
  label: string;
  /** How the grouping was derived. */
  basis: "official ward" | "recorded locality" | "not recorded";
  population: number | null;
  projects: Project[];
  assets: Asset[];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function keyForProject(p: Project): { id: string; label: string; basis: WardArea["basis"] } {
  if (p.ward) return { id: slug(p.ward), label: p.ward, basis: "official ward" };
  if (p.locality) return { id: slug(p.locality), label: p.locality, basis: "recorded locality" };
  return { id: UNASSIGNED, label: "Ward not recorded", basis: "not recorded" };
}

function keyForAsset(a: Asset): { id: string; label: string; basis: WardArea["basis"] } {
  if (a.ward) return { id: slug(a.ward), label: a.ward, basis: "official ward" };
  return { id: UNASSIGNED, label: "Ward not recorded", basis: "not recorded" };
}

export function wardAreas(): WardArea[] {
  const map = new Map<string, WardArea>();
  const ensure = (k: { id: string; label: string; basis: WardArea["basis"] }) => {
    let area = map.get(k.id);
    if (!area) {
      area = {
        id: k.id,
        label: k.label,
        basis: k.basis,
        population: null,
        projects: [],
        assets: [],
      };
      map.set(k.id, area);
    }
    return area;
  };
  for (const p of projects) ensure(keyForProject(p)).projects.push(p);
  for (const a of assets) ensure(keyForAsset(a)).assets.push(a);
  return [...map.values()].sort((a, b) => {
    if (a.id === UNASSIGNED) return 1;
    if (b.id === UNASSIGNED) return -1;
    return b.projects.length - a.projects.length;
  });
}

export function wardArea(id: string): WardArea | undefined {
  return wardAreas().find((w) => w.id === id);
}

/** Investment recorded for an area. Null when no project has a verified value. */
export function areaInvestment(area: WardArea): number | null {
  return area.projects.reduce<number | null>(
    (acc, p) => (p.sanctioned_cost === null ? acc : (acc ?? 0) + p.sanctioned_cost),
    null,
  );
}

/** Service gaps: assets not confirmed operational, plus built-but-not-running projects. */
export function serviceGaps(area: WardArea): string[] {
  const gaps: string[] = [];
  for (const a of area.assets) {
    if (a.operational_status !== "Operational") {
      gaps.push(`${a.asset_name}: ${a.operational_status ?? "operational status not recorded"}`);
    }
  }
  for (const p of area.projects) {
    if (
      (p.status === "completed" || p.status === "substantially_complete") &&
      p.operational_status !== "Operational"
    ) {
      gaps.push(`${p.project_name}: construction reported complete, service not confirmed`);
    }
  }
  return gaps;
}
