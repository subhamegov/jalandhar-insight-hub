// Four-city cross-mission data layer.
//
// The supplied data products are used as delivered — nothing is regenerated,
// re-derived or renamed. Canonical identifiers are preserved exactly and every
// join uses those identifiers, never entity names.

import cityRegistryRaw from "./raw/01_city_registry.json";
import geographyRaw from "./raw/02_geography_registry.geojson.json";
import missionRegistryRaw from "./raw/03_mission_registry.json";
import projectsRaw from "./raw/04_projects.json";
import componentsRaw from "./raw/05_project_components.json";
import assetsRaw from "./raw/06_assets.geojson.json";
import serviceAreasRaw from "./raw/07_asset_service_areas.geojson.json";
import propertiesRaw from "./raw/08_property_service_aggregates.json";
import housingRaw from "./raw/09_housing.json";
import waterRaw from "./raw/10_water_and_sewerage.json";
import sanitationRaw from "./raw/11_sanitation.json";
import livelihoodsRaw from "./raw/12_livelihoods.json";
import vendorsRaw from "./raw/13_street_vendors.json";
import transportRaw from "./raw/14_transport.json";
import financeRaw from "./raw/15_municipal_finance.json";
import serviceRaw from "./raw/16_service_delivery.json";
import grievancesRaw from "./raw/17_grievances.json";
import relationshipsRaw from "./raw/18_cross_mission_relationships.json";
import signalsRaw from "./raw/19_decision_signals.json";
import interventionsRaw from "./raw/20_planning_interventions.json";
import sourcesRaw from "./raw/21_source_registry.json";
import dictionaryRaw from "./raw/22_data_dictionary.json";
import qualityRaw from "./raw/23_data_quality_report.json";
import comparisonRaw from "./raw/24_city_comparison.json";
import scenariosRaw from "./raw/25_executive_briefing_scenarios.json";
import manifestRaw from "./raw/dataset_manifest.json";
import validationRaw from "./raw/validation_report.json";

import type {
  AssetServiceArea,
  BriefingScenario,
  CityComparison,
  CityRecord,
  CrossMissionRelationship,
  DataQualityReport,
  DecisionSignal,
  EntityKind,
  GrievanceAggregate,
  HousingRecord,
  LivelihoodGroup,
  Locality,
  Mission,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  PlanningIntervention,
  ProjectComponent,
  PropertyAggregate,
  SanitationRecord,
  ServiceObservation,
  SourceRecord,
  StreetVendorAggregate,
  TransportRecord,
  WaterSewerageRecord,
} from "./types";

interface FeatureLike<P> {
  geometry: { type: string; coordinates: [number, number] } | null;
  properties: P;
}

function flatten<P extends object>(fc: unknown): Array<P & { coordinates: [number, number] }> {
  const features = (fc as { features: FeatureLike<P>[] }).features;
  return features.map((f) => ({
    ...f.properties,
    coordinates: (f.geometry?.coordinates ?? [0, 0]) as [number, number],
  }));
}

// ---------------------------------------------------------------- collections

export const cityRegistry = cityRegistryRaw as unknown as CityRecord[];
export const localities = flatten<Locality>(geographyRaw) as Locality[];
export const missions = missionRegistryRaw as unknown as Mission[];
export const missionProjects = projectsRaw as unknown as MissionProject[];
export const projectComponents = componentsRaw as unknown as ProjectComponent[];
export const municipalAssets = flatten<MunicipalAsset>(assetsRaw) as MunicipalAsset[];
export const serviceAreas = flatten<AssetServiceArea>(serviceAreasRaw) as AssetServiceArea[];
export const propertyAggregates = propertiesRaw as unknown as PropertyAggregate[];
export const housingRecords = housingRaw as unknown as HousingRecord[];
export const waterSewerage = waterRaw as unknown as WaterSewerageRecord[];
export const sanitationRecords = sanitationRaw as unknown as SanitationRecord[];
export const livelihoodGroups = livelihoodsRaw as unknown as LivelihoodGroup[];
export const streetVendorAggregates = vendorsRaw as unknown as StreetVendorAggregate[];
export const transportRecords = transportRaw as unknown as TransportRecord[];
export const municipalFinance = financeRaw as unknown as MunicipalFinance[];
export const serviceObservations = serviceRaw as unknown as ServiceObservation[];
export const grievances = grievancesRaw as unknown as GrievanceAggregate[];
export const declaredRelationships = relationshipsRaw as unknown as CrossMissionRelationship[];
export const decisionSignals = signalsRaw as unknown as DecisionSignal[];
export const planningInterventions = interventionsRaw as unknown as PlanningIntervention[];
export const sourceRegistry = sourcesRaw as unknown as SourceRecord[];
export const dataDictionary = dictionaryRaw as unknown as Record<string, unknown>;
export const dataQualityReport = qualityRaw as unknown as DataQualityReport;
export const cityComparison = comparisonRaw as unknown as CityComparison[];
export const briefingScenarios = scenariosRaw as unknown as BriefingScenario[];
export const datasetManifest = manifestRaw as unknown as {
  dataset_name: string;
  version: string;
  reference_date: string;
  cities: string[];
  synthetic_operational_data: boolean;
  file_count: number;
  files: Array<{ filename: string; bytes: number; sha256: string; record_count?: number }>;
  all_validation_checks_passed: boolean;
};
export const validationReport = validationRaw as unknown as DataQualityReport;

export const DATASET_REFERENCE_DATE = datasetManifest.reference_date;

/** The 25 numbered data products, with the record set each one resolves to. */
export const DATA_PRODUCTS: Array<{
  filename: string;
  entity: EntityKind | "reference";
  records: number;
  description: string;
}> = [
  { filename: "01_city_registry.json", entity: "city", records: cityRegistry.length, description: "City and urban local body registry" },
  { filename: "02_geography_registry.geojson", entity: "locality", records: localities.length, description: "Locality anchors (illustrative points, not boundaries)" },
  { filename: "03_mission_registry.json", entity: "mission", records: missions.length, description: "Mission coverage labels" },
  { filename: "04_projects.json", entity: "project", records: missionProjects.length, description: "Mission-linked projects" },
  { filename: "05_project_components.json", entity: "project_component", records: projectComponents.length, description: "Project components and milestones" },
  { filename: "06_assets.geojson", entity: "asset", records: municipalAssets.length, description: "Municipal assets with illustrative points" },
  { filename: "07_asset_service_areas.geojson", entity: "service_area", records: serviceAreas.length, description: "Asset service areas" },
  { filename: "08_property_service_aggregates.json", entity: "property_aggregate", records: propertyAggregates.length, description: "Property aggregates and tax position" },
  { filename: "09_housing.json", entity: "housing", records: housingRecords.length, description: "Housing delivery and service readiness" },
  { filename: "10_water_and_sewerage.json", entity: "water_sewerage", records: waterSewerage.length, description: "Water and sewerage service records" },
  { filename: "11_sanitation.json", entity: "sanitation", records: sanitationRecords.length, description: "Waste collection and processing" },
  { filename: "12_livelihoods.json", entity: "livelihood", records: livelihoodGroups.length, description: "Livelihood groups and loan funnel" },
  { filename: "13_street_vendors.json", entity: "street_vendor", records: streetVendorAggregates.length, description: "Street-vendor aggregates" },
  { filename: "14_transport.json", entity: "transport", records: transportRecords.length, description: "Transport stops and routes" },
  { filename: "15_municipal_finance.json", entity: "finance", records: municipalFinance.length, description: "Project finance by period" },
  { filename: "16_service_delivery.json", entity: "service_observation", records: serviceObservations.length, description: "Service-delivery observations" },
  { filename: "17_grievances.json", entity: "grievance", records: grievances.length, description: "Grievance aggregates" },
  { filename: "18_cross_mission_relationships.json", entity: "reference", records: declaredRelationships.length, description: "Declared project-to-asset relationships" },
  { filename: "19_decision_signals.json", entity: "decision_signal", records: decisionSignals.length, description: "Decision signals with supporting records" },
  { filename: "20_planning_interventions.json", entity: "planning_intervention", records: planningInterventions.length, description: "Planning interventions per signal" },
  { filename: "21_source_registry.json", entity: "reference", records: sourceRegistry.length, description: "Verified contextual sources" },
  { filename: "22_data_dictionary.json", entity: "reference", records: Object.keys(dataDictionary).length, description: "Field definitions" },
  { filename: "23_data_quality_report.json", entity: "reference", records: Object.keys(dataQualityReport.checks).length, description: "Supplied data quality checks" },
  { filename: "24_city_comparison.json", entity: "reference", records: cityComparison.length, description: "Sampled city comparison (not citywide totals)" },
  { filename: "25_executive_briefing_scenarios.json", entity: "reference", records: briefingScenarios.length, description: "Executive briefing scenarios" },
];

// -------------------------------------------------------------- id indexing

function indexBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) map.set(key(row), row);
  return map;
}

function groupBy<T>(rows: T[], key: (row: T) => string | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export const byId = {
  city: indexBy(cityRegistry, (r) => r.city_id),
  locality: indexBy(localities, (r) => r.id),
  mission: indexBy(missions, (r) => r.mission_id),
  project: indexBy(missionProjects, (r) => r.project_id),
  project_component: indexBy(projectComponents, (r) => r.component_id),
  asset: indexBy(municipalAssets, (r) => r.asset_id),
  service_area: indexBy(serviceAreas, (r) => r.service_area_id),
  property_aggregate: indexBy(propertyAggregates, (r) => r.property_aggregate_id),
  housing: indexBy(housingRecords, (r) => r.housing_id),
  water_sewerage: indexBy(waterSewerage, (r) => r.connection_record_id),
  sanitation: indexBy(sanitationRecords, (r) => r.sanitation_id),
  livelihood: indexBy(livelihoodGroups, (r) => r.livelihood_id),
  street_vendor: indexBy(streetVendorAggregates, (r) => r.vendor_aggregate_id),
  transport: indexBy(transportRecords, (r) => r.transport_stop_id),
  finance: indexBy(municipalFinance, (r) => r.finance_id),
  service_observation: indexBy(serviceObservations, (r) => r.service_observation_id),
  grievance: indexBy(grievances, (r) => r.complaint_aggregate_id),
  decision_signal: indexBy(decisionSignals, (r) => r.signal_id),
  planning_intervention: indexBy(planningInterventions, (r) => r.intervention_id),
} satisfies Record<EntityKind, Map<string, unknown>>;

/** Entity lookup by canonical identifier, across every entity kind. */
export function lookupEntity(
  id: string,
): { kind: EntityKind; record: Record<string, unknown> } | null {
  for (const [kind, index] of Object.entries(byId) as Array<[EntityKind, Map<string, unknown>]>) {
    const record = index.get(id);
    if (record) return { kind, record: record as Record<string, unknown> };
  }
  return null;
}

export function entityKindOf(id: string): EntityKind | null {
  return lookupEntity(id)?.kind ?? null;
}

// ------------------------------------------------------------- relationships

export interface Edge {
  from_id: string;
  from_kind: EntityKind;
  to_id: string;
  to_kind: EntityKind;
  relationship_type: string;
  /** Where the relationship came from: the declared file, or a record field. */
  basis: string;
  allocation_pct?: number | null;
}

function kindOrNull(id: string | null | undefined): EntityKind | null {
  if (!id) return null;
  return entityKindOf(id);
}

function buildEdges(): Edge[] {
  const edges: Edge[] = [];
  const push = (
    from: string,
    to: string | null | undefined,
    relationship_type: string,
    basis: string,
    allocation_pct: number | null = null,
  ) => {
    if (!to) return;
    const from_kind = kindOrNull(from);
    const to_kind = kindOrNull(to);
    if (!from_kind || !to_kind) return;
    edges.push({ from_id: from, from_kind, to_id: to, to_kind, relationship_type, basis, allocation_pct });
  };

  // 1. Declared project-to-asset relationships (18_cross_mission_relationships).
  for (const rel of declaredRelationships) {
    push(rel.from_id, rel.to_id, rel.relationship_type, "18_cross_mission_relationships.json", rel.allocation_pct);
  }

  // 2. Missions to projects.
  for (const p of missionProjects) {
    push(p.mission, p.project_id, "mission_covers", "04_projects.json:mission");
    for (const h of p.housing_ids) push(p.project_id, h, "delivers_housing", "04_projects.json:housing_ids");
    for (const f of p.financial_record_ids) push(p.project_id, f, "funded_by_record", "04_projects.json:financial_record_ids");
    push(p.project_id, p.locality_id, "located_in", "04_projects.json:locality_id");
  }
  for (const c of projectComponents) push(c.project_id, c.component_id, "has_component", "05_project_components.json:project_id");

  // 3. Assets to service areas, service areas to localities.
  for (const a of municipalAssets) {
    for (const area of a.service_area_ids) push(a.asset_id, area, "serves_area", "06_assets.geojson:service_area_ids");
    push(a.asset_id, a.locality_id, "located_in", "06_assets.geojson:locality_id");
  }
  for (const area of serviceAreas) {
    for (const loc of area.locality_ids) push(area.service_area_id, loc, "covers_locality", "07_asset_service_areas.geojson:locality_ids");
    for (const w of area.water_asset_ids) push(area.service_area_id, w, "served_by_water_asset", "07_asset_service_areas.geojson:water_asset_ids");
    for (const s of area.sewer_asset_ids) push(area.service_area_id, s, "served_by_sewer_asset", "07_asset_service_areas.geojson:sewer_asset_ids");
  }

  // 4. Property aggregates to municipal services.
  for (const prop of propertyAggregates) {
    push(prop.property_aggregate_id, prop.water_service_area_id, "in_water_service_area", "08_property_service_aggregates.json:water_service_area_id");
    push(prop.property_aggregate_id, prop.locality_id, "located_in", "08_property_service_aggregates.json:locality_id");
  }
  for (const rec of waterSewerage) {
    push(rec.property_aggregate_id, rec.connection_record_id, "has_service_record", "10_water_and_sewerage.json:property_aggregate_id");
    push(rec.connection_record_id, rec.water_treatment_asset_id, "treated_by", "10_water_and_sewerage.json:water_treatment_asset_id");
    push(rec.connection_record_id, rec.sewer_treatment_asset_id, "sewage_treated_by", "10_water_and_sewerage.json:sewer_treatment_asset_id");
    push(rec.connection_record_id, rec.water_service_area_id, "in_water_service_area", "10_water_and_sewerage.json:water_service_area_id");
  }

  // 5. Housing to infrastructure.
  for (const h of housingRecords) {
    push(h.housing_id, h.project_id, "delivered_by_project", "09_housing.json:project_id");
    for (const p of h.linked_property_aggregate_ids) push(h.housing_id, p, "covers_property_aggregate", "09_housing.json:linked_property_aggregate_ids");
    push(h.housing_id, h.nearest_transport_stop_id, "served_by_transport", "09_housing.json:nearest_transport_stop_id");
    push(h.housing_id, h.locality_id, "located_in", "09_housing.json:locality_id");
  }

  // 6. Sanitation, livelihoods, vendors, transport.
  for (const s of sanitationRecords) {
    for (const a of s.linked_asset_ids) push(s.sanitation_id, a, "uses_asset", "11_sanitation.json:linked_asset_ids");
    push(s.sanitation_id, s.locality_id, "located_in", "11_sanitation.json:locality_id");
  }
  for (const l of livelihoodGroups) push(l.livelihood_id, l.linked_market_asset_id, "uses_market_asset", "12_livelihoods.json:linked_market_asset_id");
  for (const v of streetVendorAggregates) push(v.vendor_aggregate_id, v.market_asset_id, "vends_at_asset", "13_street_vendors.json:market_asset_id");
  for (const t of transportRecords) {
    push(t.transport_stop_id, t.linked_housing_id, "serves_housing", "14_transport.json:linked_housing_id");
    push(t.transport_stop_id, t.linked_market_asset_id, "serves_market_asset", "14_transport.json:linked_market_asset_id");
  }

  // 7. Finance to projects.
  for (const f of municipalFinance) push(f.finance_id, f.project_id, "funds_project", "15_municipal_finance.json:project_id");

  // 8. Service observations and grievances to service records.
  for (const o of serviceObservations) {
    for (const a of o.linked_asset_ids) push(o.service_observation_id, a, "observes_asset", "16_service_delivery.json:linked_asset_ids");
    for (const p of o.linked_property_aggregate_ids) push(o.service_observation_id, p, "observes_property_aggregate", "16_service_delivery.json:linked_property_aggregate_ids");
  }
  for (const g of grievances) {
    for (const a of g.linked_asset_ids) push(g.complaint_aggregate_id, a, "complaint_about_asset", "17_grievances.json:linked_asset_ids");
    for (const p of g.linked_property_aggregate_ids) push(g.complaint_aggregate_id, p, "complaint_about_property_aggregate", "17_grievances.json:linked_property_aggregate_ids");
    push(g.complaint_aggregate_id, g.locality_id, "located_in", "17_grievances.json:locality_id");
  }

  // 9. Decision signals to supporting evidence, interventions to signals.
  for (const s of decisionSignals) {
    for (const r of s.supporting_records) push(s.signal_id, r.id, "supported_by", "19_decision_signals.json:supporting_records");
    for (const p of s.related_projects) push(s.signal_id, p, "relates_to_project", "19_decision_signals.json:related_projects");
    for (const a of s.related_assets) push(s.signal_id, a, "relates_to_asset", "19_decision_signals.json:related_assets");
    for (const g of s.geography_ids) push(s.signal_id, g, "relates_to_locality", "19_decision_signals.json:geography_ids");
    for (const m of s.related_missions) push(s.signal_id, m, "relates_to_mission", "19_decision_signals.json:related_missions");
  }
  for (const i of planningInterventions) {
    push(i.intervention_id, i.signal_id, "responds_to_signal", "20_planning_interventions.json:signal_id");
    for (const e of i.supporting_evidence) push(i.intervention_id, e, "supported_by", "20_planning_interventions.json:supporting_evidence");
    for (const p of i.linked_projects) push(i.intervention_id, p, "relates_to_project", "20_planning_interventions.json:linked_projects");
    for (const a of i.linked_assets) push(i.intervention_id, a, "relates_to_asset", "20_planning_interventions.json:linked_assets");
  }

  return edges;
}

export const edges: Edge[] = buildEdges();

const outgoing = groupBy(edges, (e) => e.from_id);
const incoming = groupBy(edges, (e) => e.to_id);

/** Every relationship touching one identifier, in both directions. */
export function relationshipsFor(id: string): { out: Edge[]; in: Edge[] } {
  return { out: outgoing.get(id) ?? [], in: incoming.get(id) ?? [] };
}

/** Identifiers reachable from one identifier within `depth` relationship hops. */
export function traverse(id: string, depth = 1): Edge[] {
  const seen = new Set<string>([id]);
  const collected: Edge[] = [];
  let frontier = [id];
  for (let level = 0; level < depth; level += 1) {
    const next: string[] = [];
    for (const current of frontier) {
      const { out, in: inbound } = relationshipsFor(current);
      for (const edge of [...out, ...inbound]) {
        collected.push(edge);
        const other = edge.from_id === current ? edge.to_id : edge.from_id;
        if (!seen.has(other)) {
          seen.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  return collected;
}

// ------------------------------------------------------------- city bundles

export interface FourCityBundle {
  city: CityRecord;
  localities: Locality[];
  projects: MissionProject[];
  components: ProjectComponent[];
  assets: MunicipalAsset[];
  serviceAreas: AssetServiceArea[];
  properties: PropertyAggregate[];
  housing: HousingRecord[];
  waterSewerage: WaterSewerageRecord[];
  sanitation: SanitationRecord[];
  livelihoods: LivelihoodGroup[];
  streetVendors: StreetVendorAggregate[];
  transport: TransportRecord[];
  finance: MunicipalFinance[];
  serviceObservations: ServiceObservation[];
  grievances: GrievanceAggregate[];
  signals: DecisionSignal[];
  interventions: PlanningIntervention[];
  comparison: CityComparison | null;
  briefing: BriefingScenario | null;
}

const ofCity = <T extends { city_id: string }>(rows: T[], cityId: string) =>
  rows.filter((r) => r.city_id === cityId);

const bundles = new Map<string, FourCityBundle>();

export function fourCityBundle(cityId: string): FourCityBundle | null {
  const cached = bundles.get(cityId);
  if (cached) return cached;
  const city = byId.city.get(cityId);
  if (!city) return null;
  const bundle: FourCityBundle = {
    city,
    localities: ofCity(localities, cityId),
    projects: ofCity(missionProjects, cityId),
    components: ofCity(projectComponents, cityId),
    assets: ofCity(municipalAssets, cityId),
    serviceAreas: ofCity(serviceAreas, cityId),
    properties: ofCity(propertyAggregates, cityId),
    housing: ofCity(housingRecords, cityId),
    waterSewerage: ofCity(waterSewerage, cityId),
    sanitation: ofCity(sanitationRecords, cityId),
    livelihoods: ofCity(livelihoodGroups, cityId),
    streetVendors: ofCity(streetVendorAggregates, cityId),
    transport: ofCity(transportRecords, cityId),
    finance: ofCity(municipalFinance, cityId),
    serviceObservations: ofCity(serviceObservations, cityId),
    grievances: ofCity(grievances, cityId),
    signals: ofCity(decisionSignals, cityId),
    interventions: ofCity(planningInterventions, cityId),
    comparison: cityComparison.find((c) => c.city_id === cityId) ?? null,
    briefing: briefingScenarios.find((b) => b.city_id === cityId) ?? null,
  };
  bundles.set(cityId, bundle);
  return bundle;
}

export function hasFourCityData(cityId: string): boolean {
  return byId.city.has(cityId);
}

/** Every record in a city that belongs to one locality. */
export function localityRecords(cityId: string, localityId: string) {
  const bundle = fourCityBundle(cityId);
  if (!bundle) return null;
  const pick = <T extends { locality_id: string | null }>(rows: T[]) =>
    rows.filter((r) => r.locality_id === localityId);
  return {
    locality: bundle.localities.find((l) => l.id === localityId) ?? null,
    projects: pick(bundle.projects),
    assets: pick(bundle.assets),
    properties: pick(bundle.properties),
    housing: pick(bundle.housing),
    waterSewerage: pick(bundle.waterSewerage),
    sanitation: pick(bundle.sanitation),
    livelihoods: pick(bundle.livelihoods),
    streetVendors: pick(bundle.streetVendors),
    transport: pick(bundle.transport),
    finance: pick(bundle.finance),
    serviceObservations: pick(bundle.serviceObservations),
    grievances: pick(bundle.grievances),
    signals: pick(bundle.signals),
    interventions: pick(bundle.interventions),
  };
}

// ---------------------------------------------------------------- provenance

export interface Provenance {
  record_type: string | null;
  data_classification: string | null;
  verification_status: string | null;
  observation_date: string | null;
  source_record_id: string | null;
  source_url: string | null;
  source: SourceRecord | null;
}

export function provenanceOf(record: Record<string, unknown>): Provenance {
  const sourceId = (record["source_record_id"] as string | null) ?? null;
  return {
    record_type: (record["record_type"] as string | null) ?? null,
    data_classification: (record["data_classification"] as string | null) ?? null,
    verification_status: (record["verification_status"] as string | null) ?? null,
    observation_date: (record["observation_date"] as string | null) ?? null,
    source_record_id: sourceId,
    source_url: (record["source_url"] as string | null) ?? null,
    source: sourceId ? (sourceRegistry.find((s) => s.source_id === sourceId) ?? null) : null,
  };
}
