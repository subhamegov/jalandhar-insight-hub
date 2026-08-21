// Domain model for Jalandhar City Intelligence.
// Data is kept separate from presentation. Unknown values are `null` and are
// rendered as "Not available" by the UI.

export type ProjectStatus =
  | "announced"
  | "proposed"
  | "sanctioned"
  | "tendered"
  | "awarded"
  | "under_construction"
  | "substantially_complete"
  | "completed"
  | "commissioned"
  | "operational"
  | "stalled"
  | "cancelled"
  | "unknown";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "announced",
  "proposed",
  "sanctioned",
  "tendered",
  "awarded",
  "under_construction",
  "substantially_complete",
  "completed",
  "commissioned",
  "operational",
  "stalled",
  "cancelled",
  "unknown",
];

export type EvidenceQuality =
  | "official_current"
  | "official_historical"
  | "parliamentary_record"
  | "government_tender"
  | "regulator_or_court"
  | "government_report"
  | "credible_media"
  | "secondary_source"
  | "unverified";

export const EVIDENCE_QUALITIES: EvidenceQuality[] = [
  "official_current",
  "official_historical",
  "parliamentary_record",
  "government_tender",
  "regulator_or_court",
  "government_report",
  "credible_media",
  "secondary_source",
  "unverified",
];

export type CitySystem =
  | "Water"
  | "Used Water"
  | "Solid Waste"
  | "Mobility"
  | "Roads"
  | "Air Quality"
  | "Public Realm"
  | "Environment"
  | "Health Infrastructure"
  | "Education"
  | "Energy & Environment"
  | "Digital Governance"
  | "Storm Water"
  | "Urban Resilience"
  | "Sanitation"
  | "Sports & Public Realm"
  | "Livelihoods & Public Realm"
  | "Health"
  | "Economic Infrastructure"
  | "Railways"
  | "Road Safety"
  | "Water & Public Realm"
  | "Housing";

export const CITY_SYSTEMS: CitySystem[] = [
  "Water",
  "Used Water",
  "Solid Waste",
  "Mobility",
  "Roads",
  "Air Quality",
  "Public Realm",
  "Environment",
  "Health Infrastructure",
  "Education",
  "Energy & Environment",
  "Digital Governance",
  "Storm Water",
  "Urban Resilience",
  "Sanitation",
  "Sports & Public Realm",
  "Livelihoods & Public Realm",
  "Health",
  "Economic Infrastructure",
  "Railways",
  "Road Safety",
  "Water & Public Realm",
  "Housing",
];

export type Nullable<T> = T | null;

export interface Project {
  project_id: string;
  project_name: string;
  short_description: Nullable<string>;
  sector: Nullable<CitySystem>;
  asset_type: Nullable<string>;
  scheme: Nullable<string>;
  funding_programme: Nullable<string>;
  central_ministry: Nullable<string>;
  state_department: Nullable<string>;
  implementing_agency: Nullable<string>;
  owning_agency: Nullable<string>;
  contractor: Nullable<string>;
  consultant: Nullable<string>;
  sanctioned_cost: Nullable<number>;
  contracted_cost: Nullable<number>;
  expenditure: Nullable<number>;
  funding_central: Nullable<number>;
  funding_state: Nullable<number>;
  funding_ulb: Nullable<number>;
  announcement_date: Nullable<string>;
  sanction_date: Nullable<string>;
  tender_date: Nullable<string>;
  award_date: Nullable<string>;
  planned_start_date: Nullable<string>;
  planned_end_date: Nullable<string>;
  actual_start_date: Nullable<string>;
  actual_completion_date: Nullable<string>;
  status: ProjectStatus;
  physical_progress_percentage: Nullable<number>;
  financial_progress_percentage: Nullable<number>;
  operational_status: Nullable<string>;
  delay_days: Nullable<number>;
  delay_reason: Nullable<string>;
  latitude: Nullable<number>;
  longitude: Nullable<number>;
  geometry: Nullable<string>;
  ward: Nullable<string>;
  locality: Nullable<string>;
  source_url: Nullable<string>;
  source_agency: Nullable<string>;
  source_date: Nullable<string>;
  evidence_quality: EvidenceQuality;
  last_verified: Nullable<string>;
  notes: Nullable<string>;
  /** Set when records from different sources disagree. */
  conflict_note?: Nullable<string>;
  /** Date the record was last changed in this system. */
  record_updated: Nullable<string>;

  // --- Register extensions (JALANDHAR_CITY_INTELLIGENCE_03) ---
  /** Whether the physical intervention is a site, a network, or both. */
  geography_type?: GeographyType;
  /** Attention priority for senior review. */
  priority?: Priority;
  /** Date the physical progress figure was reported. */
  progress_as_of?: Nullable<string>;
  /** Known physical attributes (capacity, fleet size and similar). */
  key_attributes?: KeyAttribute[];
  /** Cost figures as reported by different government sources. */
  cost_records?: ReportedValue[];
  /** Completion dates as reported by different government sources. */
  completion_date_records?: ReportedValue[];
  /** Status as reported by different government sources. */
  status_records?: ReportedValue[];

  // --- National register extensions (JALANDHAR_CITY_INTELLIGENCE_06) ---
  /** Identifier used by the publishing portal or document. */
  source_record_id?: Nullable<string>;
  /** Status wording exactly as published by the source. */
  source_status?: Nullable<string>;
  /** Cost exactly as published, including currency. Never converted. */
  source_cost_text?: Nullable<string>;
  /** Cost in INR crore where the source publishes an INR figure. */
  sanctioned_cost_cr?: Nullable<number>;
  /** True when the record may describe the same physical work as another record. */
  dedupe_review_required?: boolean;
  /** Group key shared by records that may describe the same physical work. */
  same_asset_group?: Nullable<string>;
  /** Geographic scope as published, e.g. "Jalandhar city" or a corridor. */
  geography_scope?: Nullable<string>;
  /** How trustworthy the plotted position is. */
  location_quality?: LocationQuality;
}

export type LocationQuality =
  | "official_coordinate"
  | "approximate"
  | "corridor"
  | "city_wide"
  | "no_coordinate";

export const GEOGRAPHY_SCOPE_GROUPS = [
  "Jalandhar city",
  "Jalandhar Cantt",
  "District and regional corridors",
  "Central institutions in Jalandhar",
  "All relevant projects",
] as const;

export type GeographyScopeGroup = (typeof GEOGRAPHY_SCOPE_GROUPS)[number];

export type GeographyType = "site" | "network" | "site_and_network" | "city_wide";

export type Priority = "critical" | "high" | "medium" | "low";

export const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

export interface KeyAttribute {
  label: string;
  value: string;
  source: Nullable<string>;
}

/** A single value as reported by one government source. */
export interface ReportedValue {
  label: string;
  value: Nullable<string>;
  source: Nullable<string>;
  source_date: Nullable<string>;
  evidence_quality: EvidenceQuality;
}

export type GovernmentLevel = "central" | "state" | "city";

export const GOVERNMENT_LEVELS: GovernmentLevel[] = ["central", "state", "city"];

export type TimelineEventType =
  | "announced"
  | "sanctioned"
  | "dpr_approved"
  | "tender_published"
  | "contract_awarded"
  | "work_started"
  | "revised_deadline"
  | "substantial_completion"
  | "commissioned"
  | "operational";

export const TIMELINE_EVENT_ORDER: TimelineEventType[] = [
  "announced",
  "sanctioned",
  "dpr_approved",
  "tender_published",
  "contract_awarded",
  "work_started",
  "revised_deadline",
  "substantial_completion",
  "commissioned",
  "operational",
];

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  announced: "Announced",
  sanctioned: "Sanctioned",
  dpr_approved: "DPR approved",
  tender_published: "Tender published",
  contract_awarded: "Contract awarded",
  work_started: "Work started",
  revised_deadline: "Revised deadline",
  substantial_completion: "Substantial completion",
  commissioned: "Commissioned",
  operational: "Operational",
};

export interface TimelineEvent {
  event_id: string;
  project_id: string;
  event_type: TimelineEventType;
  event_date: Nullable<string>;
  description: Nullable<string>;
  source: Nullable<string>;
  evidence_quality: EvidenceQuality;
}

/**
 * A project may be funded by more than one programme. Funding components carry
 * the money, so a project is never duplicated per scheme.
 */
export interface FundingComponent {
  funding_component_id: string;
  project_id: string;
  programme: string;
  government_level: GovernmentLevel;
  ministry_or_department: Nullable<string>;
  sanctioned_amount: Nullable<number>;
  released_amount: Nullable<number>;
  expenditure: Nullable<number>;
  financial_year: Nullable<string>;
  source: Nullable<string>;
}

export type ConflictSeverity = "informational" | "review_required" | "material_conflict";

export const CONFLICT_SEVERITIES: ConflictSeverity[] = [
  "informational",
  "review_required",
  "material_conflict",
];

export interface Conflict {
  conflict_id: string;
  project_id: string;
  project_name: string;
  rule: string;
  rule_label: string;
  severity: ConflictSeverity;
  summary: string;
  sources: ReportedValue[];
}

export interface Asset {
  asset_id: string;
  asset_name: string;
  asset_type: Nullable<string>;
  sector: Nullable<CitySystem>;
  owning_agency: Nullable<string>;
  operating_agency: Nullable<string>;
  commissioning_date: Nullable<string>;
  operational_status: Nullable<string>;
  capacity: Nullable<number>;
  capacity_unit: Nullable<string>;
  latitude: Nullable<number>;
  longitude: Nullable<number>;
  geometry: Nullable<string>;
  ward: Nullable<string>;
  related_projects: string[];
  data_source: Nullable<string>;
  last_verified: Nullable<string>;
}

export interface Scheme {
  scheme_id: string;
  scheme_name: string;
  ministry: Nullable<string>;
  state_or_central: Nullable<"central" | "state" | "joint">;
  objective: Nullable<string>;
  start_year: Nullable<number>;
  end_year: Nullable<number>;
  total_jalandhar_projects: Nullable<number>;
  jalandhar_sanctioned_value: Nullable<number>;
  source_url: Nullable<string>;
}

export interface Agency {
  agency_id: string;
  agency_name: string;
  agency_type: Nullable<string>;
  parent_department: Nullable<string>;
  jurisdiction: Nullable<string>;
  projects_owned: number;
  projects_implemented: number;
}

export interface Evidence {
  evidence_id: string;
  linked_entity: string;
  title: string;
  source_type: Nullable<string>;
  publishing_agency: Nullable<string>;
  publication_date: Nullable<string>;
  url: Nullable<string>;
  retrieved_date: Nullable<string>;
  evidence_quality: EvidenceQuality;
  conflicting_evidence: boolean;
  notes: Nullable<string>;
}
