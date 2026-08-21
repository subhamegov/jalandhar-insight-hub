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
  | "Health Infrastructure";

export const CITY_SYSTEMS: CitySystem[] = [
  "Water",
  "Used Water",
  "Solid Waste",
  "Mobility",
  "Roads",
  "Air Quality",
  "Public Realm",
  "Health Infrastructure",
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
