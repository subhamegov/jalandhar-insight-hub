import {
  fourCityBundle,
  provenanceOf,
  relationshipsFor,
  type Edge,
  type Provenance,
} from "./dataset";
import type {
  AssetServiceArea,
  GrievanceAggregate,
  HousingRecord,
  LivelihoodGroup,
  Locality,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  PropertyAggregate,
  SanitationRecord,
  ServiceObservation,
  StreetVendorAggregate,
  TransportRecord,
  WaterSewerageRecord,
} from "./types";
import { projects as jalandharProjects } from "@/data/jalandhar";

export type PropertyRelationshipType =
  | "Directly linked"
  | "Served by"
  | "Falls within"
  | "Related through locality"
  | "Nearby"
  | "No known linkage"
  | "Not available";

export type PropertyMapPrecision =
  | "exact_synthetic_property_point"
  | "approximate_building_anchor"
  | "approximate_locality_context";

export interface PropertyEnrichmentRecord {
  synthetic: true;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: PropertyRelationshipType;
  cityId: string;
  localityId: string;
  geographicPrecision: PropertyMapPrecision | "project_coordinate_context";
  dataClassification: "SYNTHETIC_RELATIONSHIP";
  provenance: string;
}

export interface PropertyMissionRelationship {
  key: string;
  name: string;
  relationship: PropertyRelationshipType;
  recordIds: string[];
  meaning: string;
  evidenceBasis: string;
  syntheticEnrichment: boolean;
}

export interface PropertyEcosystemItem {
  id: string;
  name: string;
  kind: "livelihood" | "public-service" | "mobility";
  mission: string;
  relationship: PropertyRelationshipType;
  meaning: string;
  supportingRecordId: string;
  point: { lon: number; lat: number; verified: boolean } | null;
  enrichment: PropertyEnrichmentRecord | null;
}

export interface Property360View {
  property: PropertyAggregate;
  locality: Locality;
  provenance: Provenance;
  geography: {
    point: { lon: number; lat: number };
    precision: PropertyMapPrecision;
    label: "Approximate locality context";
    note: string;
  };
  serviceArea: AssetServiceArea | null;
  waterRecords: WaterSewerageRecord[];
  housing: HousingRecord[];
  sanitation: SanitationRecord[];
  grievances: GrievanceAggregate[];
  observations: ServiceObservation[];
  livelihoods: LivelihoodGroup[];
  vendors: StreetVendorAggregate[];
  transport: TransportRecord[];
  projects: MissionProject[];
  assets: MunicipalAsset[];
  finance: MunicipalFinance[];
  missions: PropertyMissionRelationship[];
  ecosystem: PropertyEcosystemItem[];
  enrichment: PropertyEnrichmentRecord[];
  graph: { out: Edge[]; in: Edge[] };
}

const MISSION_DEFINITIONS = [
  { key: "PMAY", name: "PMAY-U", projectKeys: ["PMAY_U", "PMAY_U_2"] },
  { key: "AMRUT", name: "AMRUT", projectKeys: ["AMRUT", "AMRUT_2"] },
  { key: "SBM", name: "SBM-U", projectKeys: ["SBM_U", "SBM_U_2"] },
  { key: "NUDM", name: "NUDM / UPYOG", projectKeys: ["NUDM", "UPYOG"] },
  { key: "SVANIDHI", name: "PM SVANidhi", projectKeys: ["PM_SVANIDHI"] },
  { key: "NULM", name: "DAY-NULM", projectKeys: ["DAY_NULM"] },
  { key: "SMART", name: "Smart Cities", projectKeys: ["SMART_CITIES"] },
  { key: "CITIIS", name: "CITIIS", projectKeys: ["CITIIS"] },
  { key: "UCF", name: "UCF", projectKeys: ["UCF"] },
  {
    key: "TRANSPORT",
    name: "Urban transport context",
    projectKeys: ["URBAN_TRANSPORT", "PM_EBUS_SEWA", "METRO"],
  },
] as const;

function uniqueById<T>(rows: T[], id: (row: T) => string): T[] {
  return [...new Map(rows.map((row) => [id(row), row])).values()];
}

function localityEnrichment(
  property: PropertyAggregate,
  relatedEntityId: string,
  relationshipType: "Related through locality" | "Nearby" = "Related through locality",
): PropertyEnrichmentRecord {
  return {
    synthetic: true,
    sourceEntityId: property.property_aggregate_id,
    targetEntityId: relatedEntityId,
    relationshipType,
    cityId: property.city_id,
    localityId: property.locality_id ?? "",
    geographicPrecision: "approximate_locality_context",
    dataClassification: "SYNTHETIC_RELATIONSHIP",
    provenance:
      relationshipType === "Nearby"
        ? "Deterministic proximity within the synthetic city dataset. This is context, not beneficiary evidence."
        : "Shares the supplied locality identifier with this property. This is context, not beneficiary evidence.",
  };
}

function relationshipRecord(
  property: PropertyAggregate,
  targetEntityId: string,
  relationshipType: PropertyRelationshipType,
  provenance: string,
  geographicPrecision: PropertyEnrichmentRecord["geographicPrecision"] = "approximate_locality_context",
): PropertyEnrichmentRecord {
  return {
    synthetic: true,
    sourceEntityId: property.property_aggregate_id,
    targetEntityId,
    relationshipType,
    cityId: property.city_id,
    localityId: property.locality_id ?? "",
    geographicPrecision,
    dataClassification: "SYNTHETIC_RELATIONSHIP",
    provenance,
  };
}

function jalandharProperty360(propertyId: string): Property360View | null {
  if (propertyId !== "DEMO-PROP-JALANDHAR-001") return null;
  const project = jalandharProjects.find((row) => row.project_id === "PRJ-JAL-001");
  if (!project || project.latitude === null || project.longitude === null) return null;
  const projectLatitude = project.latitude;
  const projectLongitude = project.longitude;
  const localityId = "DEMO-LOC-JALANDHAR-WATER-001";
  const property: PropertyAggregate = {
    city_id: "CITY-JALANDHAR", record_type: "SYNTHETIC", verification_status: "demonstration_only",
    source_record_id: "PRJ-JAL-001", source_url: project.source_url, observation_date: null,
    data_classification: "SYNTHETIC_DEMONSTRATION", locality_id: localityId,
    property_aggregate_id: propertyId, building_id: "Not available", synthetic_assessment_id: "DEMO-ASSESS-JALANDHAR-001",
    official_tenement_number: null, households: null, land_use: null, built_up_area_sqm: null,
    assessment_status: "demonstration_only", occupancy_category: null, property_tax_demand_inr: null,
    property_tax_collection_inr: null, property_tax_arrears_inr: null, water_connection_id: null,
    sewer_connection_id: null, water_service_area_id: null, waste_collection_route_id: null,
    individual_owner_data_present: false,
  };
  const locality: Locality = {
    city_id: "CITY-JALANDHAR", record_type: "SYNTHETIC", verification_status: "demonstration_only",
    source_record_id: "PRJ-JAL-001", source_url: project.source_url, observation_date: project.record_updated,
    data_classification: "SYNTHETIC_DEMONSTRATION", locality_id: localityId, id: localityId,
    name: project.locality ?? "Jalandhar project area", geometry_type: "Point", official_ward_id: null,
    ward_boundary_version: null, municipal_zone_id: null, property_assessment_ward_id: null,
    geocoding_precision: "project_coordinate_context", is_official_boundary: false,
    coordinates: [projectLongitude, projectLatitude],
  };
  const adaptedProject: MissionProject = {
    city_id: "CITY-JALANDHAR", record_type: "VERIFIED", verification_status: project.evidence_quality,
    source_record_id: project.project_id, source_url: project.source_url, observation_date: project.record_updated,
    data_classification: "JALANDHAR_PROJECT_REGISTER", locality_id: localityId,
    project_id: project.project_id, mission: project.scheme ?? "MUNICIPAL", project_name: project.project_name,
    project_type: project.asset_type ?? "Urban infrastructure", implementing_agency: project.implementing_agency ?? "Not available",
    project_status: project.status, physical_progress_pct: project.physical_progress_percentage,
    financial_progress_pct: project.financial_progress_percentage, estimated_cost_inr_lakh: null,
    awarded_cost_inr_lakh: null, start_date: project.actual_start_date, scheduled_completion_date: project.planned_end_date,
    actual_completion_date: project.actual_completion_date, asset_ids: [], housing_ids: [], financial_record_ids: [],
    official_project_id: null,
  };
  const enrichment = [relationshipRecord(
    property,
    project.project_id,
    "Related through locality",
    "Synthetic demonstration relationship to an existing Jalandhar project record. No property service or beneficiary link is claimed.",
    "project_coordinate_context",
  )];
  return {
    property, locality, provenance: provenanceOf(property as unknown as Record<string, unknown>),
    geography: {
      point: { lon: projectLongitude, lat: projectLatitude }, precision: "approximate_locality_context",
      label: "Approximate locality context",
      note: "No property coordinate exists. The map reuses the existing project coordinate as broad context, not an exact property location.",
    },
    serviceArea: null, waterRecords: [], housing: [], sanitation: [], grievances: [], observations: [],
    livelihoods: [], vendors: [], transport: [], projects: [adaptedProject], assets: [], finance: [],
    missions: MISSION_DEFINITIONS.map((definition) => definition.key === "AMRUT" ? ({
      key: definition.key, name: definition.name, relationship: "Related through locality", recordIds: [project.project_id],
      meaning: "An existing water project provides project-area context. It does not prove service to this demonstration property.",
      evidenceBasis: "Jalandhar project register: PRJ-JAL-001", syntheticEnrichment: true,
    }) : ({ key: definition.key, name: definition.name, relationship: "No known linkage", recordIds: [],
      meaning: "No property or locality relationship is available in the current Jalandhar records.",
      evidenceBasis: "No canonical relationship resolved", syntheticEnrichment: false })),
    ecosystem: [], enrichment, graph: { out: [], in: [] },
  };
}

function assetPoint(asset: MunicipalAsset | null) {
  if (!asset) return null;
  return {
    lon: asset.coordinates[0],
    lat: asset.coordinates[1],
    verified: asset.actual_asset_location,
  };
}

function missionRelationships(args: {
  property: PropertyAggregate;
  housing: HousingRecord[];
  waterRecords: WaterSewerageRecord[];
  sanitation: SanitationRecord[];
  vendors: StreetVendorAggregate[];
  livelihoods: LivelihoodGroup[];
  projects: MissionProject[];
  transport: TransportRecord[];
}): PropertyMissionRelationship[] {
  const { property, housing, waterRecords, sanitation, vendors, livelihoods, projects, transport } = args;
  return MISSION_DEFINITIONS.map((definition) => {
    const missionProjects = projects.filter((project) =>
      definition.projectKeys.some((key) => project.mission === key),
    );
    if (definition.key === "PMAY" && housing.length) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Directly linked" as const,
        recordIds: housing.map((row) => row.housing_id),
        meaning: "A housing record explicitly lists this property aggregate.",
        evidenceBasis: "09_housing.json:linked_property_aggregate_ids",
        syntheticEnrichment: false,
      };
    }
    if (definition.key === "AMRUT" && (property.water_service_area_id || waterRecords.length)) {
      const ids = [property.water_service_area_id, ...waterRecords.map((row) => row.connection_record_id)].filter(
        (id): id is string => Boolean(id),
      );
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Served by" as const,
        recordIds: ids,
        meaning: "The property has a water service-area or utility service record.",
        evidenceBasis: "08_property_service_aggregates.json and 10_water_and_sewerage.json",
        syntheticEnrichment: false,
      };
    }
    if (definition.key === "SBM" && property.waste_collection_route_id) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Served by" as const,
        recordIds: sanitation.map((row) => row.sanitation_id),
        meaning: "A waste collection route is assigned. Local sanitation records provide context.",
        evidenceBasis: "08_property_service_aggregates.json:waste_collection_route_id",
        syntheticEnrichment: false,
      };
    }
    if (definition.key === "SVANIDHI" && vendors.length) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Related through locality" as const,
        recordIds: vendors.map((row) => row.vendor_aggregate_id),
        meaning: "Street-vendor activity is recorded in the same locality.",
        evidenceBasis: "Shared canonical locality_id",
        syntheticEnrichment: true,
      };
    }
    if (definition.key === "NULM" && livelihoods.length) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Related through locality" as const,
        recordIds: livelihoods.map((row) => row.livelihood_id),
        meaning: "Livelihood activity is recorded in the same locality.",
        evidenceBasis: "Shared canonical locality_id",
        syntheticEnrichment: true,
      };
    }
    if (definition.key === "TRANSPORT" && transport.length) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Related through locality" as const,
        recordIds: transport.map((row) => row.transport_stop_id),
        meaning: "A transport record is present in the same locality. Access is not inferred.",
        evidenceBasis: "Shared canonical locality_id",
        syntheticEnrichment: true,
      };
    }
    if (missionProjects.length) {
      return {
        key: definition.key,
        name: definition.name,
        relationship: "Related through locality" as const,
        recordIds: missionProjects.map((row) => row.project_id),
        meaning: "A project under this mission is recorded in the same locality.",
        evidenceBasis: "Shared canonical locality_id",
        syntheticEnrichment: true,
      };
    }
    return {
      key: definition.key,
      name: definition.name,
      relationship: "No known linkage" as const,
      recordIds: [],
      meaning: "No property, service, project, or locality relationship is present in this prototype record set.",
      evidenceBasis: "No canonical relationship resolved",
      syntheticEnrichment: false,
    };
  });
}

/**
 * Resolves one property only within its canonical city. Locality context is
 * deterministic and separately labelled; it never becomes beneficiary proof.
 */
export function property360(cityId: string, propertyId: string): Property360View | null {
  if (cityId === "CITY-JALANDHAR") return jalandharProperty360(propertyId);
  const bundle = fourCityBundle(cityId);
  if (!bundle) return null;
  const property = bundle.properties.find((row) => row.property_aggregate_id === propertyId);
  if (!property || !property.locality_id) return null;
  const locality = bundle.localities.find((row) => row.id === property.locality_id);
  if (!locality) return null;

  const serviceArea = property.water_service_area_id
    ? (bundle.serviceAreas.find((row) => row.service_area_id === property.water_service_area_id) ?? null)
    : null;
  const waterRecords = bundle.waterSewerage.filter(
    (row) => row.property_aggregate_id === property.property_aggregate_id,
  );
  const housing = bundle.housing.filter((row) =>
    row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
  );
  const grievances = bundle.grievances.filter((row) =>
    row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
  );
  const observations = bundle.serviceObservations.filter((row) =>
    row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
  );
  const sanitation = bundle.sanitation.filter((row) => row.locality_id === property.locality_id);
  const livelihoods = bundle.livelihoods.filter((row) => row.locality_id === property.locality_id);
  const vendors = bundle.streetVendors.filter((row) => row.locality_id === property.locality_id);
  const transport = bundle.transport.filter((row) => row.locality_id === property.locality_id);
  const projects = bundle.projects.filter((row) => row.locality_id === property.locality_id);

  const directAssetIds = new Set<string>();
  if (serviceArea) {
    for (const id of [...serviceArea.water_asset_ids, ...serviceArea.sewer_asset_ids]) directAssetIds.add(id);
  }
  for (const row of waterRecords) {
    if (row.water_treatment_asset_id) directAssetIds.add(row.water_treatment_asset_id);
    if (row.sewer_treatment_asset_id) directAssetIds.add(row.sewer_treatment_asset_id);
  }
  const projectAssetIds = new Set(projects.flatMap((row) => row.asset_ids));
  const localityAssets = bundle.assets.filter((row) => row.locality_id === property.locality_id);
  const assets = uniqueById(
    bundle.assets.filter(
      (row) => directAssetIds.has(row.asset_id) || projectAssetIds.has(row.asset_id) || row.locality_id === property.locality_id,
    ),
    (row) => row.asset_id,
  );
  const projectIds = new Set(projects.map((row) => row.project_id));
  const finance = bundle.finance.filter((row) => row.project_id && projectIds.has(row.project_id));

  const enrichmentIds = uniqueById(
    [
      ...waterRecords.map((row) => relationshipRecord(property, row.connection_record_id, "Directly linked", "10_water_and_sewerage.json:property_aggregate_id")),
      ...housing.map((row) => relationshipRecord(property, row.housing_id, "Directly linked", "09_housing.json:linked_property_aggregate_ids")),
      ...observations.map((row) => relationshipRecord(property, row.service_observation_id, "Directly linked", "16_service_delivery.json:linked_property_aggregate_ids")),
      ...grievances.map((row) => relationshipRecord(property, row.complaint_aggregate_id, "Directly linked", "17_grievances.json:linked_property_aggregate_ids")),
      ...(serviceArea ? [relationshipRecord(property, serviceArea.service_area_id, "Falls within", "08_property_service_aggregates.json:water_service_area_id")] : []),
      ...sanitation.map((row) => localityEnrichment(property, row.sanitation_id)),
      ...livelihoods.map((row) => localityEnrichment(property, row.livelihood_id)),
      ...vendors.map((row) => localityEnrichment(property, row.vendor_aggregate_id)),
      ...transport.map((row) => localityEnrichment(property, row.transport_stop_id)),
      ...projects.map((row) => localityEnrichment(property, row.project_id)),
      ...localityAssets
        .filter((row) => !directAssetIds.has(row.asset_id))
        .map((row) => localityEnrichment(property, row.asset_id)),
    ],
    (row) => `${row.relationshipType}-${row.targetEntityId}`,
  );

  const marketAsset = (id: string | null) => (id ? (bundle.assets.find((a) => a.asset_id === id) ?? null) : null);
  const ecosystem: PropertyEcosystemItem[] = [
    ...vendors.map((row) => {
      const market = marketAsset(row.market_asset_id);
      return {
        id: row.vendor_aggregate_id,
        name: market?.asset_name ?? `Street-vendor aggregate ${row.vendor_aggregate_id}`,
        kind: "livelihood" as const,
        mission: "PM SVANidhi",
        relationship: "Related through locality" as const,
        meaning: "Vendor activity is recorded in the same locality. This does not establish a beneficiary relationship.",
        supportingRecordId: row.vendor_aggregate_id,
        point: assetPoint(market),
        enrichment: localityEnrichment(property, row.vendor_aggregate_id),
      };
    }),
    ...livelihoods.map((row) => {
      const market = marketAsset(row.linked_market_asset_id);
      return {
        id: row.livelihood_id,
        name: market?.asset_name ?? `Livelihood aggregate ${row.livelihood_id}`,
        kind: "livelihood" as const,
        mission: "DAY-NULM",
        relationship: "Related through locality" as const,
        meaning: "Livelihood activity is recorded in the same locality. Employment outcomes are not inferred.",
        supportingRecordId: row.livelihood_id,
        point: assetPoint(market),
        enrichment: localityEnrichment(property, row.livelihood_id),
      };
    }),
    ...sanitation.map((row) => ({
      id: row.sanitation_id,
      name: row.collection_route_id ? `Waste route ${row.collection_route_id}` : `Sanitation record ${row.sanitation_id}`,
      kind: "public-service" as const,
      mission: "SBM-U",
      relationship: property.waste_collection_route_id === row.collection_route_id ? ("Served by" as const) : ("Related through locality" as const),
      meaning: property.waste_collection_route_id === row.collection_route_id
        ? "The route identifier matches the property record."
        : "Sanitation conditions are recorded for the same locality.",
      supportingRecordId: row.sanitation_id,
      point: null,
      enrichment: property.waste_collection_route_id === row.collection_route_id ? null : localityEnrichment(property, row.sanitation_id),
    })),
    ...transport.map((row) => ({
      id: row.transport_stop_id,
      name: `${row.mode ? row.mode.replace(/_/g, " ") : "Transport"} record ${row.transport_stop_id}`,
      kind: "mobility" as const,
      mission: "Urban transport",
      relationship: "Related through locality" as const,
      meaning: "The transport record shares this locality. Property access and travel time are not inferred.",
      supportingRecordId: row.transport_stop_id,
      point: null,
      enrichment: localityEnrichment(property, row.transport_stop_id),
    })),
  ];

  return {
    property,
    locality,
    provenance: provenanceOf(property as unknown as Record<string, unknown>),
    geography: {
      point: { lon: locality.coordinates[0], lat: locality.coordinates[1] },
      precision: "approximate_locality_context",
      label: "Approximate locality context",
      note: "The property record has no coordinate. The map uses its supplied locality anchor, not a surveyed property point or boundary.",
    },
    serviceArea,
    waterRecords,
    housing,
    sanitation,
    grievances,
    observations,
    livelihoods,
    vendors,
    transport,
    projects,
    assets,
    finance,
    missions: missionRelationships({ property, housing, waterRecords, sanitation, vendors, livelihoods, projects, transport }),
    ecosystem,
    enrichment: enrichmentIds,
    graph: relationshipsFor(property.property_aggregate_id),
  };
}