// Adapter from the four-city canonical dataset into the existing application
// domain model (Project, Asset, Scheme, Agency, Evidence).
//
// Nothing is invented. Values that the dataset does not carry stay null and the
// UI renders them as "Data not available". Amounts are supplied in INR lakh and
// converted to INR crore, the unit the application already uses, by dividing by
// 100 — no other transformation is applied. All records are synthetic and are
// labelled as such wherever they appear.

import type {
  Agency,
  Asset,
  CitySystem,
  Evidence,
  Project,
  ProjectStatus,
  Scheme,
} from "../types";
import { fourCityBundle, type FourCityBundle } from "./dataset";
import type { MissionProject, MunicipalAsset } from "./types";

const PROJECT_TYPE_SYSTEM: Record<string, CitySystem> = {
  "Water treatment": "Water",
  "Water distribution": "Water",
  "Water reuse": "Water",
  "Sewage treatment": "Used Water",
  "Sewerage network": "Used Water",
  "Solid waste collection": "Solid Waste",
  "Waste processing": "Solid Waste",
  "Public sanitation": "Sanitation",
  "Drainage resilience": "Storm Water",
  "Flood warning": "Urban Resilience",
  "Lake or public-space improvement": "Public Realm",
  "Road and streetscape": "Roads",
  "Smart mobility": "Mobility",
  "Bus interchange": "Mobility",
  "Affordable housing": "Housing",
  "Livelihood enterprise support": "Livelihoods & Public Realm",
  "Street-vendor infrastructure": "Livelihoods & Public Realm",
  "Digital municipal service": "Digital Governance",
  "Asset monitoring": "Digital Governance",
  "Urban construction facilitation": "Digital Governance",
};

const ASSET_TYPE_SYSTEM: Record<string, CitySystem> = {
  STP: "Used Water",
  SEWER_PIPE: "Used Water",
  PUMP_STATION: "Used Water",
  WATER_PIPE: "Water",
  WATER_TANK: "Water",
  MRF: "Solid Waste",
  COMPOST: "Solid Waste",
  PUBLIC_TOILET: "Sanitation",
  DRAIN: "Storm Water",
  ROAD: "Roads",
};

const ASSET_TYPE_LABEL: Record<string, string> = {
  STP: "Sewage treatment plant",
  SEWER_PIPE: "Sewer network",
  PUMP_STATION: "Pumping station",
  WATER_PIPE: "Water distribution network",
  WATER_TANK: "Water storage tank",
  MRF: "Material recovery facility",
  COMPOST: "Composting facility",
  PUBLIC_TOILET: "Public toilet",
  DRAIN: "Storm water drain",
  ROAD: "Road",
};

const STATUS_MAP: Record<string, ProjectStatus> = {
  in_progress: "under_construction",
  completed: "completed",
  delayed: "under_construction",
  cancelled: "cancelled",
};

const MISSION_LABEL: Record<string, string> = {
  AMRUT: "AMRUT",
  AMRUT_2: "AMRUT 2.0",
  SMART_CITIES: "Smart Cities Mission",
  LDO_CONTEXT: "Land and Development Office context",
  DAY_NULM: "DAY-NULM",
  PM_SVANIDHI: "PM SVANidhi",
  PMAY_U: "PMAY-U",
  PMAY_U_2: "PMAY-U 2.0",
  SBM_U: "Swachh Bharat Mission - Urban",
  SBM_U_2: "Swachh Bharat Mission - Urban 2.0",
  URBAN_TRANSPORT: "Urban Transport",
  NBO: "National Buildings Organisation",
  MUNICIPAL: "Municipal own works",
};

export function missionLabel(mission: string | null): string | null {
  if (!mission) return null;
  return MISSION_LABEL[mission] ?? mission;
}

const lakhToCrore = (value: number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number((value / 100).toFixed(4));

const SYNTHETIC_NOTE =
  "Synthetic prototype record from the MoHUA four-city dataset. Not a government statistic.";

function toProject(row: MissionProject, bundle: FourCityBundle): Project {
  const locality = bundle.localities.find((l) => l.id === row.locality_id) ?? null;
  const finance = bundle.finance.filter((f) => f.project_id === row.project_id);
  const expenditure = finance.length
    ? finance.reduce((sum, f) => sum + (f.expenditure_inr_lakh ?? 0), 0)
    : null;

  return {
    project_id: row.project_id,
    project_name: row.project_name,
    short_description: `${row.project_type} under ${missionLabel(row.mission)} in ${locality?.name ?? "an unnamed locality"}.`,
    sector: PROJECT_TYPE_SYSTEM[row.project_type] ?? null,
    asset_type: row.project_type,
    scheme: missionLabel(row.mission),
    funding_programme: missionLabel(row.mission),
    central_ministry: "Ministry of Housing and Urban Affairs",
    state_department: null,
    implementing_agency: row.implementing_agency,
    owning_agency: row.implementing_agency,
    contractor: null,
    consultant: null,
    sanctioned_cost: lakhToCrore(row.estimated_cost_inr_lakh),
    contracted_cost: lakhToCrore(row.awarded_cost_inr_lakh),
    expenditure: lakhToCrore(expenditure),
    funding_central: null,
    funding_state: null,
    funding_ulb: null,
    announcement_date: null,
    sanction_date: null,
    tender_date: null,
    award_date: null,
    planned_start_date: row.start_date,
    planned_end_date: row.scheduled_completion_date,
    actual_start_date: row.start_date,
    actual_completion_date: row.actual_completion_date,
    status: STATUS_MAP[row.project_status] ?? "unknown",
    physical_progress_percentage: row.physical_progress_pct,
    financial_progress_percentage: row.financial_progress_pct,
    operational_status: row.project_status === "completed" ? "Completed" : null,
    delay_days: null,
    delay_reason: row.project_status === "delayed" ? "Reported as delayed in the source record" : null,
    latitude: locality ? locality.coordinates[1] : null,
    longitude: locality ? locality.coordinates[0] : null,
    geometry: null,
    ward: null,
    locality: locality?.name ?? null,
    source_url: row.source_url,
    source_agency: row.implementing_agency,
    source_date: row.observation_date,
    evidence_quality: "unverified",
    last_verified: null,
    notes: SYNTHETIC_NOTE,
    record_updated: row.observation_date,
    geography_type: "site",
    progress_as_of: row.observation_date,
    source_record_id: row.official_project_id ?? row.source_record_id,
    source_status: row.project_status,
    sanctioned_cost_cr: lakhToCrore(row.estimated_cost_inr_lakh),
    geography_scope: locality?.name ?? null,
    location_quality: locality ? "approximate" : "no_coordinate",
  };
}

function toAsset(row: MunicipalAsset, bundle: FourCityBundle): Asset {
  const locality = bundle.localities.find((l) => l.id === row.locality_id) ?? null;
  return {
    asset_id: row.asset_id,
    asset_name: row.asset_name,
    asset_type: ASSET_TYPE_LABEL[row.asset_type] ?? row.asset_type,
    sector: ASSET_TYPE_SYSTEM[row.asset_type] ?? null,
    owning_agency: row.owner_agency,
    operating_agency: row.operator_agency,
    commissioning_date: null,
    operational_status: row.commissioning_status,
    capacity: row.capacity_value,
    capacity_unit: row.capacity_unit,
    latitude: row.actual_asset_location ? row.coordinates[1] : (locality?.coordinates[1] ?? null),
    longitude: row.actual_asset_location ? row.coordinates[0] : (locality?.coordinates[0] ?? null),
    geometry: null,
    ward: locality?.name ?? null,
    related_projects: row.project_ids,
    data_source: "MoHUA four-city synthetic dataset",
    last_verified: null,
  };
}

function toSchemes(bundle: FourCityBundle): Scheme[] {
  const byMission = new Map<string, MissionProject[]>();
  for (const p of bundle.projects) {
    const list = byMission.get(p.mission);
    if (list) list.push(p);
    else byMission.set(p.mission, [p]);
  }
  return [...byMission.entries()].map(([mission, rows]) => ({
    scheme_id: `${bundle.city.city_id}-${mission}`,
    scheme_name: missionLabel(mission) ?? mission,
    ministry: "Ministry of Housing and Urban Affairs",
    state_or_central: "central" as const,
    objective: null,
    start_year: null,
    end_year: null,
    total_jalandhar_projects: rows.length,
    jalandhar_sanctioned_value: lakhToCrore(
      rows.reduce((sum, r) => sum + (r.estimated_cost_inr_lakh ?? 0), 0),
    ),
    source_url: null,
  }));
}

function toAgencies(bundle: FourCityBundle): Agency[] {
  const names = new Set<string>();
  for (const p of bundle.projects) names.add(p.implementing_agency);
  for (const a of bundle.assets) {
    if (a.owner_agency) names.add(a.owner_agency);
    if (a.operator_agency) names.add(a.operator_agency);
  }
  return [...names].map((name) => ({
    agency_id: `${bundle.city.city_id}-${name.replace(/\s+/g, "-").toUpperCase()}`,
    agency_name: name,
    agency_type: null,
    parent_department: null,
    jurisdiction: bundle.city.name,
    projects_owned: bundle.assets.filter((a) => a.owner_agency === name).length,
    projects_implemented: bundle.projects.filter((p) => p.implementing_agency === name).length,
  }));
}

function toEvidence(bundle: FourCityBundle): Evidence[] {
  // Decision signals are the evidence-bearing records in this dataset: each one
  // names the records that support it.
  return bundle.signals.map((s) => ({
    evidence_id: s.signal_id,
    linked_entity: s.related_projects[0] ?? s.related_assets[0] ?? s.geography_ids[0] ?? s.city_id,
    title: s.observed_condition,
    source_type: "Decision signal (synthetic)",
    publishing_agency: null,
    publication_date: s.observation_date,
    url: s.source_url,
    retrieved_date: s.observation_date,
    evidence_quality: "unverified" as const,
    conflicting_evidence: false,
    notes: `${s.supporting_records.length} supporting records. ${SYNTHETIC_NOTE}`,
  }));
}

export interface AdaptedCityRecords {
  projects: Project[];
  assets: Asset[];
  schemes: Scheme[];
  agencies: Agency[];
  evidence: Evidence[];
}

const cache = new Map<string, AdaptedCityRecords>();

/** Application-model records for a four-city dataset city, or null if absent. */
export function adaptedRecords(cityId: string): AdaptedCityRecords | null {
  const cached = cache.get(cityId);
  if (cached) return cached;
  const bundle = fourCityBundle(cityId);
  if (!bundle) return null;
  const adapted: AdaptedCityRecords = {
    projects: bundle.projects.map((p) => toProject(p, bundle)),
    assets: bundle.assets.map((a) => toAsset(a, bundle)),
    schemes: toSchemes(bundle),
    agencies: toAgencies(bundle),
    evidence: toEvidence(bundle),
  };
  cache.set(cityId, adapted);
  return adapted;
}
