// Canonical entity model for the MoHUA four-city cross-mission dataset.
//
// Field names and identifiers mirror the supplied data products exactly. The
// dataset is synthetic: every operational record carries its own record_type,
// data_classification, verification_status and observation_date, and those are
// preserved rather than flattened away.

export type RecordType = "VERIFIED" | "DERIVED" | "SYNTHETIC" | "ASSUMED";

/** Provenance carried by every operational record in the dataset. */
export interface ProvenanceFields {
  city_id: string;
  record_type: RecordType;
  verification_status: string | null;
  source_record_id: string | null;
  source_url: string | null;
  observation_date: string | null;
  data_classification: string | null;
  locality_id: string | null;
}

export interface CityRecord {
  city_id: string;
  name: string;
  state: string;
  ulb_name: string;
  country: string;
  record_type: RecordType;
  source_id: string | null;
  verified_scope: string | null;
  city_center_approximate: [number, number];
  center_record_type: RecordType;
  geography_caveat: string | null;
  reference_date: string;
  locality_count_sampled: number;
  issue_context_synthetic: string[];
  source_record_id: string | null;
}

export interface Locality extends ProvenanceFields {
  id: string;
  name: string;
  geometry_type: string;
  official_ward_id: string | null;
  ward_boundary_version: string | null;
  municipal_zone_id: string | null;
  property_assessment_ward_id: string | null;
  geocoding_precision: string | null;
  is_official_boundary: boolean;
  /** Illustrative anchor [longitude, latitude]. Not an official boundary. */
  coordinates: [number, number];
}

export interface Mission {
  mission_id: string;
  name: string;
  record_type: RecordType;
  description: string | null;
}

export interface MissionProject extends ProvenanceFields {
  project_id: string;
  mission: string;
  project_name: string;
  project_type: string;
  implementing_agency: string;
  project_status: "in_progress" | "completed" | "delayed" | string;
  physical_progress_pct: number | null;
  financial_progress_pct: number | null;
  estimated_cost_inr_lakh: number | null;
  awarded_cost_inr_lakh: number | null;
  start_date: string | null;
  scheduled_completion_date: string | null;
  actual_completion_date: string | null;
  asset_ids: string[];
  housing_ids: string[];
  financial_record_ids: string[];
  official_project_id: string | null;
}

export interface ProjectComponent extends ProvenanceFields {
  component_id: string;
  project_id: string;
  component_type: string;
  target_quantity: number | null;
  achieved_quantity: number | null;
  unit: string | null;
  milestone: string | null;
  milestone_status: string | null;
}

export interface MunicipalAsset extends ProvenanceFields {
  asset_id: string;
  asset_type: string;
  asset_name: string;
  project_ids: string[];
  service_area_ids: string[];
  owner_agency: string | null;
  operator_agency: string | null;
  commissioning_status: string;
  condition: string | null;
  capacity_value: number | null;
  capacity_unit: string | null;
  utilisation_pct: number | null;
  geometry_precision: string | null;
  actual_asset_location: boolean;
  coordinates: [number, number];
}

export interface AssetServiceArea extends ProvenanceFields {
  service_area_id: string;
  locality_ids: string[];
  area_type: string;
  geometry_precision: string | null;
  water_asset_ids: string[];
  sewer_asset_ids: string[];
  coordinates: [number, number];
}

export interface PropertyAggregate extends ProvenanceFields {
  property_aggregate_id: string;
  building_id: string;
  synthetic_assessment_id: string;
  official_tenement_number: string | null;
  households: number | null;
  land_use: string | null;
  built_up_area_sqm: number | null;
  assessment_status: string | null;
  occupancy_category: string | null;
  property_tax_demand_inr: number | null;
  property_tax_collection_inr: number | null;
  property_tax_arrears_inr: number | null;
  water_connection_id: string | null;
  sewer_connection_id: string | null;
  water_service_area_id: string | null;
  waste_collection_route_id: string | null;
  individual_owner_data_present: boolean;
}

export interface HousingRecord extends ProvenanceFields {
  housing_id: string;
  project_id: string | null;
  mission: string | null;
  vertical: string | null;
  sanctioned_houses: number | null;
  grounded_houses: number | null;
  completed_houses: number | null;
  occupied_houses: number | null;
  water_ready_houses: number | null;
  sewer_ready_houses: number | null;
  waste_collection_ready_houses: number | null;
  linked_property_aggregate_ids: string[];
  nearest_transport_stop_id: string | null;
}

export interface WaterSewerageRecord extends ProvenanceFields {
  connection_record_id: string;
  property_aggregate_id: string | null;
  water_connection_id: string | null;
  sewer_connection_id: string | null;
  water_service_area_id: string | null;
  water_supply_hours_per_day: number | null;
  water_quality_samples_passed: number | null;
  water_quality_samples_total: number | null;
  water_treatment_asset_id: string | null;
  sewer_treatment_asset_id: string | null;
  water_source_category: string | null;
  service_status: string | null;
}

export interface SanitationRecord extends ProvenanceFields {
  sanitation_id: string;
  ward_id: string | null;
  collection_route_id: string | null;
  households_in_sample: number | null;
  door_to_door_coverage_pct: number | null;
  segregation_pct: number | null;
  waste_generated_tpd: number | null;
  waste_collected_tpd: number | null;
  waste_processed_tpd: number | null;
  public_toilets: number | null;
  drain_flood_incidents: number | null;
  linked_asset_ids: string[];
}

export interface LivelihoodGroup extends ProvenanceFields {
  livelihood_id: string;
  mission: string | null;
  shg_count: number | null;
  alf_count: number | null;
  clf_count: number | null;
  enterprise_count: number | null;
  loan_applications: number | null;
  loan_sanctions: number | null;
  loan_disbursements: number | null;
  training_participants: number | null;
  municipal_service_link: string | null;
  linked_market_asset_id: string | null;
}

export interface StreetVendorAggregate extends ProvenanceFields {
  vendor_aggregate_id: string;
  mission: string | null;
  surveyed_vendors: number | null;
  eligible_applications: number | null;
  sanctioned: number | null;
  disbursed: number | null;
  bank_returns: number | null;
  digital_active: number | null;
  vending_zone_id: string | null;
  market_asset_id: string | null;
}

export interface TransportRecord extends ProvenanceFields {
  transport_stop_id: string;
  route_id: string;
  mode: string | null;
  service_headway_minutes: number | null;
  daily_trips: number | null;
  linked_housing_id: string | null;
  linked_market_asset_id: string | null;
  actual_stop_or_route: boolean;
}

export interface MunicipalFinance extends ProvenanceFields {
  finance_id: string;
  project_id: string | null;
  financial_year: string | null;
  accounting_period_end: string | null;
  budget_inr_lakh: number | null;
  fund_released_inr_lakh: number | null;
  expenditure_inr_lakh: number | null;
  unspent_released_inr_lakh: number | null;
  funding_source: string | null;
  capex_opex: string | null;
}

export interface ServiceObservation extends ProvenanceFields {
  service_observation_id: string;
  service_type: string;
  period: string | null;
  applications_received: number | null;
  applications_resolved: number | null;
  sla_compliance_pct: number | null;
  average_resolution_hours: number | null;
  linked_asset_ids: string[];
  linked_property_aggregate_ids: string[];
}

export interface GrievanceAggregate extends ProvenanceFields {
  complaint_aggregate_id: string;
  service_type: string;
  complaint_count: number | null;
  repeat_complaints: number | null;
  average_resolution_hours: number | null;
  linked_asset_ids: string[];
  linked_property_aggregate_ids: string[];
  period: string | null;
  personal_data_present: boolean;
}

export interface CrossMissionRelationship extends ProvenanceFields {
  relationship_id: string;
  from_entity_type: string;
  from_id: string;
  to_entity_type: string;
  to_id: string;
  relationship_type: string;
  allocation_pct: number | null;
}

export interface SupportingRecord {
  entity: string;
  id: string;
}

export interface DecisionSignal extends ProvenanceFields {
  signal_id: string;
  geography_ids: string[];
  related_missions: string[];
  related_projects: string[];
  related_assets: string[];
  observed_condition: string;
  supporting_records: SupportingRecord[];
  potential_implications: string | null;
  data_gaps: string[];
  affected_population_estimate: number | null;
  affected_population_method: string | null;
  [key: string]: unknown;
}

export interface PlanningIntervention extends ProvenanceFields {
  intervention_id: string;
  signal_id: string;
  problem_statement: string;
  supporting_evidence: string[];
  target_geography: string[];
  target_population: number | null;
  linked_assets: string[];
  linked_projects: string[];
  lead_agency: string | null;
  supporting_agencies: string[];
  indicative_cost_inr_lakh: number | null;
  cost_basis: string | null;
  funding_options: string[];
  dependencies: string[];
  implementation_sequence: string[];
  [key: string]: unknown;
}

export interface SourceRecord {
  source_id: string;
  title: string;
  url: string;
  publication_date: string | null;
  accessed_date: string | null;
  verified_context: string | null;
}

export interface CityComparison {
  city_id: string;
  record_type: RecordType;
  derived_from: string;
  project_sample_count: number;
  asset_sample_count: number;
  property_aggregate_sample_count: number;
  housing_units_completed_sample: number;
  housing_units_occupied_sample: number;
  grievance_count_sample: number;
  waste_generated_tpd_sample: number;
  waste_processed_tpd_sample: number;
  warning: string;
}

export interface BriefingScenario {
  scenario_id: string;
  city_id: string;
  record_type: RecordType;
  title: string;
  signal_ids: string[];
  decision_question: string;
  required_validation: string[];
  not_a_real_government_finding: boolean;
}

export interface DataQualityReport {
  reference_date: string;
  all_passed: boolean;
  checks: Record<string, boolean>;
  known_limitations: string[];
  counts: Record<string, number>;
}

/** Entity kinds used by the relationship graph and entity lookup. */
export type EntityKind =
  | "city"
  | "locality"
  | "mission"
  | "project"
  | "project_component"
  | "asset"
  | "service_area"
  | "property_aggregate"
  | "housing"
  | "water_sewerage"
  | "sanitation"
  | "livelihood"
  | "street_vendor"
  | "transport"
  | "finance"
  | "service_observation"
  | "grievance"
  | "decision_signal"
  | "planning_intervention";

export const ENTITY_LABELS: Record<EntityKind, string> = {
  city: "City",
  locality: "Locality",
  mission: "Mission",
  project: "Project",
  project_component: "Project component",
  asset: "Municipal asset",
  service_area: "Asset service area",
  property_aggregate: "Property aggregate",
  housing: "Housing project",
  water_sewerage: "Water and sewerage service",
  sanitation: "Sanitation service",
  livelihood: "Livelihood group",
  street_vendor: "Street-vendor aggregate",
  transport: "Transport route",
  finance: "Municipal finance",
  service_observation: "Service-delivery observation",
  grievance: "Grievance",
  decision_signal: "Decision signal",
  planning_intervention: "Planning intervention",
};
