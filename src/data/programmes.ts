// Funding components and timeline events.
//
// A project is a physical intervention. Money arrives through one or more
// funding components, so a project funded by several programmes is recorded
// once, with several components. No amount is invented: every unverified
// figure is `null` and renders as "Not available".

import type { FundingComponent, TimelineEvent } from "./types";

const MOHUA = "Ministry of Housing and Urban Affairs";
const LG = "Department of Local Government, Punjab";

function component(
  id: string,
  project_id: string,
  programme: string,
  government_level: FundingComponent["government_level"],
  ministry_or_department: string | null,
): FundingComponent {
  return {
    funding_component_id: id,
    project_id,
    programme,
    government_level,
    ministry_or_department,
    sanctioned_amount: null,
    released_amount: null,
    expenditure: null,
    financial_year: null,
    source: null,
  };
}

export const fundingComponents: FundingComponent[] = [
  component("FC-001", "PRJ-JAL-001", "AMRUT 2.0", "central", MOHUA),
  component("FC-002", "PRJ-JAL-001", "Punjab Urban Environment Improvement Programme", "state", LG),
  component("FC-003", "PRJ-JAL-001", "Municipal Corporation Jalandhar own funds", "city", "Municipal Corporation Jalandhar"),
  component("FC-004", "PRJ-JAL-002", "Swachh Bharat Mission - Urban", "central", MOHUA),
  component("FC-005", "PRJ-JAL-002", "Punjab Local Government projects", "state", LG),
  component("FC-006", "PRJ-JAL-003", "AMRUT", "central", MOHUA),
  component("FC-007", "PRJ-JAL-003", "Punjab Municipal Services", "state", LG),
  component("FC-008", "PRJ-JAL-004", "PM-eBus Sewa", "central", MOHUA),
  component("FC-009", "PRJ-JAL-004", "Punjab Municipal Services", "state", LG),
  component("FC-010", "PRJ-JAL-006", "Amrit Bharat Station Scheme", "central", "Ministry of Railways"),
  component("FC-011", "PRJ-JAL-007", "National Clean Air Programme", "central", "Ministry of Environment, Forest and Climate Change"),
];

function event(
  id: string,
  project_id: string,
  event_type: TimelineEvent["event_type"],
  description: string | null,
): TimelineEvent {
  return {
    event_id: id,
    project_id,
    event_type,
    event_date: null,
    description,
    source: null,
    evidence_quality: "unverified",
  };
}

// Events recorded as expected stages for each project. Dates stay null until a
// sanction order, tender document or completion certificate is attached.
export const timelineEvents: TimelineEvent[] = [
  event("TE-001", "PRJ-JAL-001", "announced", "Surface water supply scheme announced for the city."),
  event("TE-002", "PRJ-JAL-001", "sanctioned", null),
  event("TE-003", "PRJ-JAL-001", "tender_published", "Tender publication does not by itself confirm implementation."),
  event("TE-004", "PRJ-JAL-001", "contract_awarded", "Contractor recorded as Larsen and Toubro."),
  event("TE-005", "PRJ-JAL-001", "work_started", null),

  event("TE-006", "PRJ-JAL-002", "announced", "Legacy waste remediation at the Wariana dumpsite."),
  event("TE-007", "PRJ-JAL-002", "sanctioned", null),
  event("TE-008", "PRJ-JAL-002", "work_started", null),
  event("TE-009", "PRJ-JAL-002", "revised_deadline", "Remediation deadline reported as extended."),

  event("TE-010", "PRJ-JAL-003", "sanctioned", null),
  event("TE-011", "PRJ-JAL-003", "work_started", null),
  event("TE-012", "PRJ-JAL-003", "substantial_completion", null),
  event("TE-013", "PRJ-JAL-003", "commissioned", "Commissioning record not located."),
  event("TE-014", "PRJ-JAL-003", "operational", "Operational status of the plant is not confirmed."),

  event("TE-015", "PRJ-JAL-004", "announced", "Buses allocated to Jalandhar under the central bus programme."),
  event("TE-016", "PRJ-JAL-004", "sanctioned", "97 buses recorded as sanctioned."),

  event("TE-017", "PRJ-JAL-005", "announced", "Redevelopment of the sports complex announced."),
  event("TE-018", "PRJ-JAL-005", "work_started", "Work reported as stalled after start."),

  event("TE-019", "PRJ-JAL-006", "sanctioned", "Station taken up under the station redevelopment programme."),
  event("TE-020", "PRJ-JAL-006", "work_started", null),

  event("TE-021", "PRJ-JAL-007", "announced", "Intervention for dairy complex waste and effluent."),
];

export function componentsFor(projectId: string): FundingComponent[] {
  return fundingComponents.filter((c) => c.project_id === projectId);
}

export function eventsFor(projectId: string): TimelineEvent[] {
  return timelineEvents.filter((e) => e.project_id === projectId);
}

/** Programmes funding a project, from its funding components plus its primary scheme. */
export function programmesFor(projectId: string, primaryScheme: string | null): string[] {
  const set = new Set<string>();
  if (primaryScheme) set.add(primaryScheme);
  for (const c of componentsFor(projectId)) set.add(c.programme);
  return [...set];
}

export function projectIdsForProgramme(programme: string): string[] {
  return [...new Set(fundingComponents.filter((c) => c.programme === programme).map((c) => c.project_id))];
}
