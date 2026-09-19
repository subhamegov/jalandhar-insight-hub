// Ranking of projects that need senior government attention.
//
// The score is value weighted. A project is never ranked highly simply because
// there are many of them in a sector. Risk classifications below are editorial
// judgements about consequence, recorded openly with a reason; no financial or
// progress figure is invented here. All money and delay inputs come from the
// project record and are treated as zero contribution when not verified.

import { conflictsForProject } from "./conflicts";
import { projects } from "./selectors";
import type { Project } from "./types";

export interface RiskProfile {
  project_id: string;
  /** 1 low to 5 high: how central the project is to a basic city service. */
  service_criticality: number;
  public_health_risk: number;
  environmental_risk: number;
  /** Other projects or works that cannot deliver until this one does. */
  depends_on_this: string[];
  why_it_matters: string;
  problem: string;
  decision_required: string;
}

export const riskProfiles: RiskProfile[] = [
  {
    project_id: "PRJ-JAL-001",
    service_criticality: 5,
    public_health_risk: 5,
    environmental_risk: 4,
    depends_on_this: [
      "City wide reduction in tube well extraction",
      "Reliable piped supply hours in all wards",
    ],
    why_it_matters:
      "The city depends almost entirely on groundwater. This is the only intervention that changes the source of supply.",
    problem:
      "Sanctioned cost, contract value and physical progress are reported differently by different sources and no current progress figure is verified.",
    decision_required:
      "Obtain one signed progress and expenditure statement from the implementing agency and confirm the revised commissioning date.",
  },
  {
    project_id: "PRJ-JAL-002",
    service_criticality: 4,
    public_health_risk: 5,
    environmental_risk: 5,
    depends_on_this: [
      "Land reclamation at Wariana",
      "Reduction in air pollution from open burning",
      "Closure of fresh tipping at the site",
    ],
    why_it_matters:
      "Legacy waste at Wariana drives fires, leachate into groundwater and particulate pollution for nearby wards.",
    problem:
      "There is no verified monthly figure for remaining legacy stock, so it cannot be shown that the stock is falling.",
    decision_required:
      "Direct monthly reporting of legacy stock, waste remediated and fresh waste tipped, certified by the corporation.",
  },
  {
    project_id: "PRJ-JAL-003",
    service_criticality: 4,
    public_health_risk: 4,
    environmental_risk: 5,
    depends_on_this: ["Treated water reuse for irrigation and industry"],
    why_it_matters:
      "Untreated sewage discharge is the main pollution load on local drains and downstream water bodies.",
    problem:
      "Treatment capacity, volume actually treated and volume reused are all unverified, so compliance cannot be assessed.",
    decision_required:
      "Require plant wise inflow, treated volume, reuse volume and outlet sample compliance from the pollution control board.",
  },
  {
    project_id: "PRJ-JAL-004",
    service_criticality: 4,
    public_health_risk: 2,
    environmental_risk: 3,
    depends_on_this: ["Depot readiness", "Charging infrastructure", "Route notification"],
    why_it_matters:
      "Sanctioned buses only improve access to jobs and hospitals once depots, chargers and routes are ready.",
    problem:
      "Buses are sanctioned but depot readiness, charging readiness and operational bus numbers are not recorded.",
    decision_required:
      "Fix a dated readiness plan for depot, charging and route notification before further bus deployment.",
  },
  {
    project_id: "PRJ-JAL-005",
    service_criticality: 2,
    public_health_risk: 1,
    environmental_risk: 1,
    depends_on_this: [],
    why_it_matters: "Public realm investment with a visible completion commitment.",
    problem: "Completion and operational handover status are not confirmed.",
    decision_required: "Confirm handover, operator and opening date for public use.",
  },
  {
    project_id: "PRJ-JAL-006",
    service_criticality: 3,
    public_health_risk: 1,
    environmental_risk: 1,
    depends_on_this: ["Station area access and circulation works"],
    why_it_matters:
      "Station redevelopment affects intercity access and the surrounding road network.",
    problem: "Progress and cost are held by the railway administration and are not verified here.",
    decision_required: "Seek a status note from the railway administration for the city record.",
  },
  {
    project_id: "PRJ-JAL-007",
    service_criticality: 3,
    public_health_risk: 4,
    environmental_risk: 5,
    depends_on_this: ["Dairy effluent load reduction in local drains"],
    why_it_matters:
      "Dairy waste is a concentrated pollution source affecting drains, groundwater and nearby residents.",
    problem: "No verified operational status for waste handling or biogas capacity.",
    decision_required:
      "Confirm effluent handling arrangement, responsible agency and compliance monitoring frequency.",
  },
];

export function profileFor(projectId: string): RiskProfile | undefined {
  return riskProfiles.find((r) => r.project_id === projectId);
}

export interface ScoreBreakdown {
  label: string;
  points: number;
  note: string;
}

export interface AttentionRow {
  project: Project;
  profile: RiskProfile | undefined;
  score: number;
  breakdown: ScoreBreakdown[];
  materialConflicts: number;
}

const MAX_VALUE_POINTS = 25;

function valuePoints(p: Project): ScoreBreakdown {
  const v = p.sanctioned_cost ?? p.contracted_cost;
  if (v === null || v === undefined) {
    return {
      label: "Project value",
      points: 0,
      note: "No verified value. Value weighting cannot be applied.",
    };
  }
  const points = Math.min(MAX_VALUE_POINTS, Math.round((v / 1000) * MAX_VALUE_POINTS));
  return { label: "Project value", points, note: `${v} crore recorded` };
}

function delayPoints(p: Project): ScoreBreakdown {
  if (p.status === "stalled") {
    return { label: "Delay", points: 20, note: "Recorded as stalled" };
  }
  if (p.delay_days === null || p.delay_days === undefined) {
    return { label: "Delay", points: 0, note: "Delay not verified" };
  }
  return {
    label: "Delay",
    points: Math.min(20, Math.round(p.delay_days / 36)),
    note: `${p.delay_days} days behind the approved date`,
  };
}

function readinessPoints(p: Project): ScoreBreakdown {
  const built = p.status === "completed" || p.status === "substantially_complete";
  if (built && p.operational_status !== "Operational") {
    return {
      label: "Operational readiness",
      points: 15,
      note: "Construction reported complete but the asset is not confirmed operational",
    };
  }
  if (p.operational_status === "Operational") {
    return { label: "Operational readiness", points: 0, note: "Service confirmed operational" };
  }
  return {
    label: "Operational readiness",
    points: 5,
    note: "Operational status not confirmed",
  };
}

export function attentionRows(): AttentionRow[] {
  return projects
    .map((project) => {
      const profile = profileFor(project.project_id);
      const conflicts = conflictsForProject(project);
      const material = conflicts.filter((c) => c.severity === "material_conflict").length;
      const breakdown: ScoreBreakdown[] = [
        valuePoints(project),
        delayPoints(project),
        {
          label: "Service criticality",
          points: (profile?.service_criticality ?? 0) * 3,
          note: profile ? `Rated ${profile.service_criticality} of 5` : "Not classified",
        },
        {
          label: "Public health risk",
          points: (profile?.public_health_risk ?? 0) * 3,
          note: profile ? `Rated ${profile.public_health_risk} of 5` : "Not classified",
        },
        {
          label: "Environmental risk",
          points: (profile?.environmental_risk ?? 0) * 3,
          note: profile ? `Rated ${profile.environmental_risk} of 5` : "Not classified",
        },
        {
          label: "Dependency on other work",
          points: Math.min(9, (profile?.depends_on_this.length ?? 0) * 3),
          note: profile?.depends_on_this.length
            ? `${profile.depends_on_this.length} dependent outcomes`
            : "No dependencies recorded",
        },
        {
          label: "Evidence conflict",
          points: Math.min(12, material * 6 + (conflicts.length - material) * 2),
          note: `${conflicts.length} open items, ${material} material`,
        },
        readinessPoints(project),
      ];
      const score = breakdown.reduce((sum, b) => sum + b.points, 0);
      return { project, profile, score, breakdown, materialConflicts: material };
    })
    .sort((a, b) => b.score - a.score);
}
