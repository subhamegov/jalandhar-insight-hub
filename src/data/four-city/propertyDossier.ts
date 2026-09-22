/**
 * Household 360 dossier enrichment.
 *
 * Every field here is deterministic synthetic enrichment of an existing
 * canonical property aggregate. Source-backed values (tax demand, collection,
 * arrears, connection identifiers, service area, waste route, supply hours,
 * water quality samples) are read from the supplied records and never
 * overwritten. Derived and generated values are labelled as such, and every
 * referenced identifier is a canonical identifier of the same city.
 *
 * Nothing here is a government statistic and nothing here is personal data:
 * household identifiers are anonymous counters, never names or addresses of
 * real people.
 */
import type {
  GrievanceAggregate,
  HousingRecord,
  Locality,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  PropertyAggregate,
  SanitationRecord,
  ServiceObservation,
  WaterSewerageRecord,
} from "./types";
import { fourCityBundle } from "./dataset";

export type DossierOrigin = "source_record" | "derived_from_source" | "synthetic_enrichment";

export interface DossierValue<T> {
  value: T;
  origin: DossierOrigin;
  basis: string;
}

export type ScenarioKey =
  | "fully_serviced"
  | "unreliable_water"
  | "housing_pending_sewerage"
  | "tax_outstanding"
  | "unresolved_grievance"
  | "interdepartmental"
  | "neighbourhood_investment"
  | "no_open_issues";

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  fully_serviced: "Fully serviced property",
  unreliable_water: "Connected, water supply unreliable",
  housing_pending_sewerage: "Completed housing, sewerage pending",
  tax_outstanding: "Municipal tax outstanding",
  unresolved_grievance: "Unresolved grievance",
  interdepartmental: "Needs interdepartmental action",
  neighbourhood_investment: "Affected by neighbourhood investment",
  no_open_issues: "No outstanding service issue",
};

export interface DossierProperty {
  propertyId: string;
  buildingId: string;
  dwellingId: string;
  cityId: string;
  wardId: string;
  localityId: string;
  syntheticAddress: string;
  propertyType: string;
  usageType: string;
  plotAreaSqm: number | null;
  builtUpAreaSqm: number | null;
  floors: number;
  constructionStatus: string;
  occupancyStatus: string;
  geographicReference: string;
  registrationStatus: string;
  lastUpdated: string | null;
}

export interface DossierHousehold {
  anonymousHouseholdId: string;
  occupancyType: string;
  householdSize: number | null;
  dwellingUnits: number | null;
  occupancyDate: string | null;
  housingAssistanceReference: string | null;
  occupancyEvidence: string;
}

export interface DossierTax {
  assessmentId: string;
  financialYear: string;
  assessmentStatus: string;
  demandInr: number | null;
  arrearsInr: number | null;
  adjustmentsInr: number;
  paymentsInr: number | null;
  outstandingInr: number | null;
  lastPaymentDate: string | null;
  paymentStatus: "Paid in full" | "Part paid" | "Unpaid" | "Not available";
  responsibleAgency: string;
  reconciles: boolean;
}

export interface DossierWater {
  connectionId: string | null;
  connectionStatus: string;
  connectionDate: string | null;
  meterId: string | null;
  supplySource: string | null;
  serviceAreaId: string | null;
  distributionAssetId: string | null;
  supplyFrequency: string;
  supplyHoursPerDay: number | null;
  reliability: string;
  waterQuality: string;
  billingStatus: string;
  grievanceIds: string[];
  responsibleAgency: string;
}

export interface DossierSanitation {
  connectionId: string | null;
  sanitationType: string;
  connectionStatus: string;
  networkId: string | null;
  serviceAreaId: string | null;
  treatmentAssetId: string | null;
  operationalStatus: string;
  grievanceIds: string[];
  responsibleAgency: string;
}

export interface DossierSolidWaste {
  collectionRouteId: string | null;
  collectionAgency: string;
  collectionMethod: string;
  collectionFrequency: string;
  lastCollection: string | null;
  segregationStatus: string;
  serviceStatus: string;
  grievanceIds: string[];
}

export interface DossierApproval {
  applicationId: string;
  approvalStatus: string;
  approvalDate: string | null;
  approvedUsage: string;
  completionStatus: string;
  occupancyCertificateStatus: string;
  responsibleAuthority: string;
}

export interface DossierHousing {
  schemeId: string | null;
  projectId: string | null;
  allotmentId: string | null;
  sanctionStatus: string;
  assistanceAmountInrLakh: number | null;
  completionStatus: string;
  occupancyStatus: string;
  supportingInfrastructureIds: string[];
}

export interface DossierInfrastructure {
  assetId: string;
  assetType: string;
  projectId: string | null;
  serviceAreaId: string | null;
  relationshipType: "Directly linked" | "Served by" | "Related through locality";
  operationalStatus: string;
  implementingAgency: string;
  evidenceReference: string;
}

export interface DossierComplaint {
  complaintId: string;
  serviceCategory: string;
  createdAt: string;
  status: "Open" | "In progress" | "Resolved";
  assignedAgency: string;
  slaStatus: "Within service standard" | "Beyond service standard";
  resolvedAt: string | null;
  relatedAssetId: string | null;
  resolutionEvidence: string;
  aggregateRecordId: string | null;
}

export interface DossierInvestment {
  missionId: string;
  projectId: string;
  relationshipType: "Directly linked" | "Served by" | "Related through locality";
  investmentAmountInrLakh: number | null;
  financialPeriod: string | null;
  deliveryStatus: string;
  implementingAgency: string;
  evidenceReference: string;
  attributedToProperty: false;
}

export interface DossierProvenance {
  sourceId: string;
  sourceType: string;
  syntheticClassification: string;
  recordUpdatedAt: string | null;
  relationshipEvidence: string;
}

export interface DossierSignal {
  headline: string;
  condition: string;
  requiredIntervention: string;
  responsibleAgencies: string[];
  supportingRecordIds: string[];
}

export interface PropertyDossier {
  scenario: ScenarioKey;
  scenarioLabel: string;
  property: DossierProperty;
  household: DossierHousehold;
  tax: DossierTax;
  water: DossierWater;
  sanitation: DossierSanitation;
  solidWaste: DossierSolidWaste;
  approval: DossierApproval;
  housing: DossierHousing;
  infrastructure: DossierInfrastructure[];
  complaints: DossierComplaint[];
  investments: DossierInvestment[];
  provenance: DossierProvenance;
  signal: DossierSignal;
}

/* ---------- deterministic helpers ---------- */

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash32(seed) || 1;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(next: () => number, options: readonly T[]): T {
  return options[Math.floor(next() * options.length) % options.length] as T;
}

function between(next: () => number, lo: number, hi: number): number {
  return lo + Math.floor(next() * (hi - lo + 1));
}

/** Reference date of the supplied dataset. Every generated date stays behind it. */
const REFERENCE = new Date("2026-09-19T00:00:00Z");

function dateBefore(next: () => number, minDaysAgo: number, maxDaysAgo: number): string {
  const days = between(next, minDaysAgo, maxDaysAgo);
  const d = new Date(REFERENCE.getTime() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86400000).toISOString().slice(0, 10);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------- context ---------- */

export interface DossierContext {
  locality: Locality | undefined;
  water: WaterSewerageRecord | undefined;
  housing: HousingRecord[];
  sanitation: SanitationRecord[];
  grievances: GrievanceAggregate[];
  observations: ServiceObservation[];
  projects: MissionProject[];
  assets: MunicipalAsset[];
  finance: MunicipalFinance[];
  ulbName: string;
}

const PROPERTY_TYPES = ["Independent house", "Row housing", "Walk-up apartment", "Apartment block"] as const;

function agencyFor(context: DossierContext, service: string): string {
  const project = context.projects.find((row) => row.implementing_agency);
  if (project?.implementing_agency) return project.implementing_agency;
  return `${context.ulbName} (${service})`;
}

function buildDossier(property: PropertyAggregate, context: DossierContext): PropertyDossier {
  const next = rng(property.property_aggregate_id);
  const id = property.property_aggregate_id;
  const serial = id.slice(-4);
  const cityKey = property.city_id.replace("CITY-", "");
  const water = context.water;
  const locality = context.locality;
  const sanitationRow = context.sanitation[0];

  const demand = property.property_tax_demand_inr;
  const payments = property.property_tax_collection_inr;
  const arrears = property.property_tax_arrears_inr;
  const adjustments = 0;
  const outstanding =
    demand === null || payments === null ? arrears : round2(demand - payments - adjustments);
  const reconciles =
    outstanding === null || arrears === null ? false : Math.abs(outstanding - arrears) < 0.05;

  const supplyHours = water?.water_supply_hours_per_day ?? null;
  const samplesPassed = water?.water_quality_samples_passed ?? null;
  const samplesTotal = water?.water_quality_samples_total ?? null;
  const connected = (water?.service_status ?? "").toLowerCase().includes("connect");
  const unreliableSupply = supplyHours !== null && supplyHours < 8;
  const sewerConnected = Boolean(property.sewer_connection_id);
  const housingRow = context.housing[0];
  const housingCompletedNotOccupied =
    Boolean(housingRow) &&
    (housingRow?.completed_houses ?? 0) > (housingRow?.occupied_houses ?? 0);

  /* Scenario: canonical facts decide which storylines are possible, and a
     seeded roll spreads the remaining choices across the inventory. */
  const eligible: ScenarioKey[] = [];
  if (unreliableSupply) eligible.push("unreliable_water", "unreliable_water");
  if (housingRow && !sewerConnected) eligible.push("housing_pending_sewerage", "housing_pending_sewerage");
  if ((arrears ?? 0) > 0) eligible.push("tax_outstanding");
  if (context.grievances.length > 0) eligible.push("unresolved_grievance", "unresolved_grievance");
  if (!sewerConnected || !property.waste_collection_route_id) eligible.push("interdepartmental");
  if (context.projects.length > 0) eligible.push("neighbourhood_investment");
  if (connected && sewerConnected && property.waste_collection_route_id && (arrears ?? 1) === 0)
    eligible.push("fully_serviced", "fully_serviced");
  if (connected && sewerConnected && property.waste_collection_route_id) eligible.push("no_open_issues");
  const scenario: ScenarioKey = eligible.length ? pick(next, eligible) : "no_open_issues";

  const households = property.households;
  const usage = property.land_use ?? "residential";
  const floors = between(next, 1, usage === "residential" ? 4 : 6);
  const builtUp = property.built_up_area_sqm;
  const plot = builtUp === null ? null : Math.round(builtUp / (0.6 + next() * 0.3));
  const approvalDaysAgo = between(next, 2000, 5200);
  const approvalDate = dateBefore(() => 0, approvalDaysAgo, approvalDaysAgo);
  const occupancyDaysAgo = between(next, 300, approvalDaysAgo - 300);
  const occupancyDate = dateBefore(() => 0, occupancyDaysAgo, occupancyDaysAgo);

  const dossierProperty: DossierProperty = {
    propertyId: id,
    buildingId: property.building_id,
    dwellingId: `DW-${cityKey}-${serial}`,
    cityId: property.city_id,
    wardId:
      locality?.property_assessment_ward_id ??
      locality?.official_ward_id ??
      `WARD-${cityKey}-${(locality?.id ?? "").slice(-2) || "00"}`,
    localityId: property.locality_id ?? "",
    syntheticAddress: `Block ${serial}, ${locality?.name ?? "locality not available"}, ${cityKey
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase())}`,
    propertyType: pick(next, PROPERTY_TYPES),
    usageType: usage,
    plotAreaSqm: plot,
    builtUpAreaSqm: builtUp,
    floors,
    constructionStatus: housingCompletedNotOccupied ? "Completed, awaiting occupancy" : "Completed",
    occupancyStatus:
      property.occupancy_category === "aggregate_occupied"
        ? "Occupied"
        : property.occupancy_category
          ? property.occupancy_category.replace(/_/g, " ")
          : "Not available",
    geographicReference: `Locality anchor ${property.locality_id ?? "not available"}. Approximate locality context, not a surveyed property point.`,
    registrationStatus:
      property.assessment_status === "assessed" ? "Assessed and on the register" : "On the register, assessment under revision",
    lastUpdated: property.observation_date,
  };

  const household: DossierHousehold = {
    anonymousHouseholdId: `HH-${cityKey}-${serial}`,
    occupancyType: pick(next, ["Owner occupied", "Tenant occupied", "Mixed owner and tenant"]),
    householdSize: households === null ? null : between(next, 3, 6),
    dwellingUnits: households,
    occupancyDate,
    housingAssistanceReference: housingRow?.housing_id ?? null,
    occupancyEvidence: housingRow
      ? "Aggregate housing record lists this property. Occupancy of individual dwellings is not evidenced."
      : "Aggregate occupancy category only. No household level evidence is held.",
  };

  const tax: DossierTax = {
    assessmentId: property.synthetic_assessment_id,
    financialYear: "2026-27",
    assessmentStatus: property.assessment_status ?? "Not available",
    demandInr: demand,
    arrearsInr: arrears,
    adjustmentsInr: adjustments,
    paymentsInr: payments,
    outstandingInr: outstanding,
    lastPaymentDate: payments && payments > 0 ? dateBefore(next, 20, 300) : null,
    paymentStatus:
      demand === null || payments === null
        ? "Not available"
        : payments <= 0
          ? "Unpaid"
          : (outstanding ?? 0) > 0.05
            ? "Part paid"
            : "Paid in full",
    responsibleAgency: `${context.ulbName} revenue department`,
    reconciles,
  };

  const waterGrievances = context.grievances
    .filter((row) => (row.service_type ?? "").includes("water"))
    .map((row) => row.complaint_aggregate_id);
  const sewerGrievances = context.grievances
    .filter((row) => (row.service_type ?? "").includes("sewer"))
    .map((row) => row.complaint_aggregate_id);
  const wasteGrievances = context.grievances
    .filter((row) => (row.service_type ?? "").includes("waste") || (row.service_type ?? "").includes("sanit"))
    .map((row) => row.complaint_aggregate_id);

  const reliability =
    supplyHours === null
      ? "Not available"
      : supplyHours >= 18
        ? "Continuous supply recorded"
        : supplyHours >= 8
          ? "Intermittent supply recorded"
          : "Low supply hours recorded";

  const dossierWater: DossierWater = {
    connectionId: property.water_connection_id,
    connectionStatus: water?.service_status ? water.service_status.replace(/_/g, " ") : "Not available",
    connectionDate: property.water_connection_id ? dateBefore(next, 500, 4000) : null,
    meterId: property.water_connection_id ? `MTR-${cityKey}-${serial}` : null,
    supplySource: water?.water_source_category ?? null,
    serviceAreaId: property.water_service_area_id,
    distributionAssetId: water?.water_treatment_asset_id ?? null,
    supplyFrequency:
      supplyHours === null ? "Not available" : supplyHours >= 18 ? "Daily, extended hours" : "Daily, limited hours",
    supplyHoursPerDay: supplyHours,
    reliability,
    waterQuality:
      samplesPassed === null || samplesTotal === null
        ? "Not available"
        : `${samplesPassed} of ${samplesTotal} samples passed`,
    billingStatus: tax.paymentStatus === "Unpaid" ? "Billed, payment pending" : "Billed and collected",
    grievanceIds: waterGrievances,
    responsibleAgency: agencyFor(context, "water supply"),
  };

  const dossierSanitation: DossierSanitation = {
    connectionId: property.sewer_connection_id,
    sanitationType: sewerConnected ? "Piped sewer connection" : "On site containment, no piped sewer recorded",
    connectionStatus: sewerConnected ? "Connected" : "Not connected",
    networkId: water?.sewer_treatment_asset_id ? `NET-${cityKey}-${serial}` : null,
    serviceAreaId: property.water_service_area_id,
    treatmentAssetId: water?.sewer_treatment_asset_id ?? null,
    operationalStatus: sewerConnected
      ? water?.sewer_treatment_asset_id
        ? "Connected to a recorded treatment asset"
        : "Connected, treatment asset not recorded"
      : "No piped service recorded",
    grievanceIds: sewerGrievances,
    responsibleAgency: agencyFor(context, "sewerage"),
  };

  const segregation = sanitationRow?.segregation_pct ?? null;
  const solidWaste: DossierSolidWaste = {
    collectionRouteId: property.waste_collection_route_id,
    collectionAgency: `${context.ulbName} solid waste department`,
    collectionMethod: property.waste_collection_route_id ? "Door to door collection" : "Not available",
    collectionFrequency: property.waste_collection_route_id ? pick(next, ["Daily", "Daily, twice", "Six days a week"]) : "Not available",
    lastCollection: property.waste_collection_route_id ? dateBefore(next, 0, 3) : null,
    segregationStatus:
      segregation === null
        ? "Not available"
        : segregation >= 75
          ? `Segregation recorded at ${segregation}% in this locality`
          : `Partial segregation, ${segregation}% in this locality`,
    serviceStatus: property.waste_collection_route_id ? "Route assigned and collection recorded" : "No route assigned",
    grievanceIds: wasteGrievances,
  };

  const approval: DossierApproval = {
    applicationId: `BPA-${cityKey}-${serial}`,
    approvalStatus: "Approved",
    approvalDate: approvalDate,
    approvedUsage: usage,
    completionStatus: "Completion recorded",
    occupancyCertificateStatus: housingCompletedNotOccupied
      ? "Applied, decision pending"
      : pick(next, ["Issued", "Issued", "Applied, decision pending"]),
    responsibleAuthority: `${context.ulbName} building permission cell`,
  };

  const housingProject = housingRow?.project_id
    ? context.projects.find((row) => row.project_id === housingRow.project_id)
    : undefined;
  const housing: DossierHousing = housingRow
    ? {
        schemeId: housingRow.mission,
        projectId: housingRow.project_id,
        allotmentId: `ALT-${cityKey}-${serial}`,
        sanctionStatus:
          housingRow.sanctioned_houses === null ? "Not available" : `${housingRow.sanctioned_houses} houses sanctioned`,
        assistanceAmountInrLakh: housingProject?.awarded_cost_inr_lakh ?? housingProject?.estimated_cost_inr_lakh ?? null,
        completionStatus:
          housingRow.completed_houses === null ? "Not available" : `${housingRow.completed_houses} completed`,
        occupancyStatus:
          housingRow.occupied_houses === null ? "Not available" : `${housingRow.occupied_houses} occupied`,
        supportingInfrastructureIds: (housingProject?.asset_ids ?? []).slice(0, 4),
      }
    : {
        schemeId: null,
        projectId: null,
        allotmentId: null,
        sanctionStatus: "Not applicable",
        assistanceAmountInrLakh: null,
        completionStatus: "Not applicable",
        occupancyStatus: "Not applicable",
        supportingInfrastructureIds: [],
      };

  const serviceAssetIds = new Set(
    [water?.water_treatment_asset_id, water?.sewer_treatment_asset_id].filter((v): v is string => Boolean(v)),
  );
  const infrastructure: DossierInfrastructure[] = context.assets.slice(0, 8).map((asset) => ({
    assetId: asset.asset_id,
    assetType: asset.asset_type,
    projectId: asset.project_ids[0] ?? null,
    serviceAreaId: asset.service_area_ids[0] ?? property.water_service_area_id,
    relationshipType: serviceAssetIds.has(asset.asset_id) ? "Served by" : "Related through locality",
    operationalStatus: asset.commissioning_status.replace(/_/g, " "),
    implementingAgency: asset.operator_agency ?? asset.owner_agency ?? agencyFor(context, "infrastructure"),
    evidenceReference: serviceAssetIds.has(asset.asset_id)
      ? "10_water_and_sewerage.json treatment asset reference"
      : "06_assets.geojson.json shared locality identifier",
  }));

  /* Property level complaints. Held inside this dossier, deterministic, and
     tied to the canonical grievance aggregate they belong to. */
  const complaintSource = context.grievances.slice(0, 3);
  const complaints: DossierComplaint[] = complaintSource.map((row, index) => {
    const seed = rng(`${id}-${row.complaint_aggregate_id}`);
    const createdAt = dateBefore(seed, 5, 90);
    const open = scenario === "unresolved_grievance" ? index === 0 : seed() < 0.25;
    const slaHours = row.average_resolution_hours ?? 48;
    const resolvedAt = open ? null : addDays(createdAt, Math.max(1, Math.round(slaHours / 24)));
    return {
      complaintId: `CMP-${cityKey}-${serial}-${index + 1}`,
      serviceCategory: (row.service_type ?? "service").replace(/_/g, " "),
      createdAt,
      status: open ? (index === 0 && scenario === "unresolved_grievance" ? "Open" : "In progress") : "Resolved",
      assignedAgency: agencyFor(context, row.service_type ?? "service"),
      slaStatus: open && Date.parse(createdAt) < REFERENCE.getTime() - 7 * 86400000
        ? "Beyond service standard"
        : "Within service standard",
      resolvedAt,
      relatedAssetId: row.linked_asset_ids[0] ?? null,
      resolutionEvidence: open
        ? "No resolution recorded against this complaint."
        : `Closed against grievance aggregate ${row.complaint_aggregate_id}.`,
      aggregateRecordId: row.complaint_aggregate_id,
    };
  });

  const investments: DossierInvestment[] = context.projects.slice(0, 6).map((project) => {
    const financeRow = context.finance.find((row) => row.project_id === project.project_id);
    const servesProperty =
      project.asset_ids.some((assetId) => serviceAssetIds.has(assetId)) ||
      (housingRow?.project_id ?? null) === project.project_id;
    return {
      missionId: project.mission,
      projectId: project.project_id,
      relationshipType: servesProperty ? "Served by" : "Related through locality",
      investmentAmountInrLakh:
        financeRow?.expenditure_inr_lakh ?? project.awarded_cost_inr_lakh ?? project.estimated_cost_inr_lakh ?? null,
      financialPeriod: financeRow?.financial_year ?? null,
      deliveryStatus: project.project_status.replace(/_/g, " "),
      implementingAgency: project.implementing_agency,
      evidenceReference: financeRow
        ? `15_municipal_finance.json ${financeRow.finance_id}`
        : "04_projects.json cost fields",
      attributedToProperty: false,
    };
  });

  const provenance: DossierProvenance = {
    sourceId: property.source_record_id ?? property.property_aggregate_id,
    sourceType: property.record_type,
    syntheticClassification: property.data_classification ?? "PUBLIC_SYNTHETIC",
    recordUpdatedAt: property.observation_date,
    relationshipEvidence:
      "Source fields are read from the supplied property, water, housing, grievance and project records. Remaining fields are deterministic synthetic enrichment of this prototype property.",
  };

  const signal = buildSignal(scenario, {
    property,
    water: dossierWater,
    sanitation: dossierSanitation,
    solidWaste,
    tax,
    complaints,
    investments,
  });

  return {
    scenario,
    scenarioLabel: SCENARIO_LABELS[scenario],
    property: dossierProperty,
    household,
    tax,
    water: dossierWater,
    sanitation: dossierSanitation,
    solidWaste,
    approval,
    housing,
    infrastructure,
    complaints,
    investments,
    provenance,
    signal,
  };
}

function buildSignal(
  scenario: ScenarioKey,
  parts: {
    property: PropertyAggregate;
    water: DossierWater;
    sanitation: DossierSanitation;
    solidWaste: DossierSolidWaste;
    tax: DossierTax;
    complaints: DossierComplaint[];
    investments: DossierInvestment[];
  },
): DossierSignal {
  const open = parts.complaints.filter((row) => row.status !== "Resolved");
  const agencies = new Set<string>();
  const records: string[] = [];
  let headline = "No intervention is indicated by the linked records.";
  let condition = "Connections are recorded and no open complaint is held against this property.";
  let intervention = "Routine monitoring only.";

  if (scenario === "unreliable_water") {
    headline = "Water supply hours are low against a recorded connection.";
    condition = `A connection is recorded, and supply is ${parts.water.supplyHoursPerDay ?? "not available"} hours a day.`;
    intervention = "Review distribution pressure and scheduling for the serving water asset.";
    agencies.add(parts.water.responsibleAgency);
    if (parts.water.distributionAssetId) records.push(parts.water.distributionAssetId);
  } else if (scenario === "housing_pending_sewerage") {
    headline = "Housing is recorded, piped sewerage is not.";
    condition = "A housing record lists this property and no sewer connection is recorded.";
    intervention = "Sequence the sewer connection against the housing delivery programme.";
    agencies.add(parts.sanitation.responsibleAgency);
  } else if (scenario === "tax_outstanding") {
    headline = "Property tax is outstanding for the current year.";
    condition = `Outstanding amount recorded against assessment ${parts.tax.assessmentId}.`;
    intervention = "Issue a demand follow up through the revenue department.";
    agencies.add(parts.tax.responsibleAgency);
  } else if (scenario === "unresolved_grievance") {
    headline = "A complaint is open against this property.";
    condition = `${open.length} complaint records are open or in progress.`;
    intervention = "Assign the open complaint and record a resolution.";
    for (const row of open) {
      agencies.add(row.assignedAgency);
      if (row.relatedAssetId) records.push(row.relatedAssetId);
    }
  } else if (scenario === "interdepartmental") {
    headline = "Service records are incomplete across more than one department.";
    condition = `${parts.sanitation.connectionStatus} sewerage, ${parts.solidWaste.serviceStatus.toLowerCase()}.`;
    intervention = "Reconcile water, sewerage and waste records for this property together.";
    agencies.add(parts.sanitation.responsibleAgency);
    agencies.add(parts.solidWaste.collectionAgency);
  } else if (scenario === "neighbourhood_investment") {
    headline = "Investment is under way in this locality.";
    condition = `${parts.investments.length} project records are recorded in the same locality.`;
    intervention = "Track delivery, then check whether service conditions change here.";
    for (const row of parts.investments) {
      agencies.add(row.implementingAgency);
      records.push(row.projectId);
    }
  } else if (scenario === "fully_serviced") {
    headline = "All recorded services are in place.";
    condition = "Water, sewerage and waste records are present and tax is settled.";
    intervention = "No action indicated.";
  }

  return {
    headline,
    condition,
    requiredIntervention: intervention,
    responsibleAgencies: [...agencies],
    supportingRecordIds: [...new Set(records)].slice(0, 6),
  };
}

/* ---------- public API ---------- */

const cache = new Map<string, PropertyDossier>();

export function dossierFor(cityId: string, property: PropertyAggregate): PropertyDossier | null {
  const key = `${cityId}:${property.property_aggregate_id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bundle = fourCityBundle(cityId);
  if (!bundle) return null;
  const context: DossierContext = {
    locality: bundle.localities.find((row) => row.id === property.locality_id),
    water: bundle.waterSewerage.find((row) => row.property_aggregate_id === property.property_aggregate_id),
    housing: bundle.housing.filter((row) =>
      row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
    ),
    sanitation: bundle.sanitation.filter((row) => row.locality_id === property.locality_id),
    grievances: bundle.grievances.filter((row) =>
      row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
    ),
    observations: bundle.serviceObservations.filter((row) =>
      row.linked_property_aggregate_ids.includes(property.property_aggregate_id),
    ),
    projects: bundle.projects.filter((row) => row.locality_id === property.locality_id),
    assets: bundle.assets.filter(
      (row) =>
        row.locality_id === property.locality_id ||
        row.asset_id === bundle.waterSewerage.find((w) => w.property_aggregate_id === property.property_aggregate_id)?.water_treatment_asset_id,
    ),
    finance: bundle.finance,
    ulbName: bundle.city?.ulb_name ?? "Municipal corporation",
  };
  const built = buildDossier(property, context);
  cache.set(key, built);
  return built;
}

/* ---------- validation ---------- */

export interface DossierCheck {
  id: string;
  label: string;
  cityId: string | null;
  method: string;
  affected: string[];
}

const CITY_IDS = ["CITY-THANE", "CITY-SURAT", "CITY-AHMEDABAD", "CITY-GUWAHATI", "CITY-KARNAL"];

export function validateDossiers(): DossierCheck[] {
  const checks: DossierCheck[] = [];
  const missing: string[] = [];
  const brokenRefs: string[] = [];
  const crossCity: string[] = [];
  const badFinance: string[] = [];
  const badDates: string[] = [];
  const contradictions: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  let covered = 0;

  for (const cityId of CITY_IDS) {
    const bundle = fourCityBundle(cityId);
    if (!bundle) continue;
    const ids = new Set<string>([
      ...bundle.assets.map((r) => r.asset_id),
      ...bundle.projects.map((r) => r.project_id),
      ...bundle.grievances.map((r) => r.complaint_aggregate_id),
      ...bundle.housing.map((r) => r.housing_id),
      ...bundle.serviceAreas.map((r) => r.service_area_id),
      ...bundle.localities.map((r) => r.id),
    ]);
    for (const property of bundle.properties) {
      const dossier = dossierFor(cityId, property);
      if (!dossier) {
        missing.push(property.property_aggregate_id);
        continue;
      }
      covered += 1;

      for (const candidate of [dossier.property.dwellingId, dossier.household.anonymousHouseholdId]) {
        if (seen.has(candidate)) duplicates.push(candidate);
        seen.add(candidate);
      }

      const refs: Array<[string, string | null]> = [
        ["service area", dossier.water.serviceAreaId],
        ["treatment asset", dossier.water.distributionAssetId],
        ["sewer treatment asset", dossier.sanitation.treatmentAssetId],
        ["housing", dossier.housing.projectId],
        ["locality", dossier.property.localityId],
        ...dossier.infrastructure.map((row) => ["asset", row.assetId] as [string, string | null]),
        ...dossier.investments.map((row) => ["project", row.projectId] as [string, string | null]),
        ...dossier.complaints.map((row) => ["grievance", row.aggregateRecordId] as [string, string | null]),
      ];
      for (const [label, ref] of refs) {
        if (!ref) continue;
        if (!ids.has(ref)) brokenRefs.push(`${property.property_aggregate_id} → ${label} ${ref}`);
        else if (!ref.includes(cityId.replace("CITY-", ""))) crossCity.push(`${property.property_aggregate_id} → ${ref}`);
      }

      if (!dossier.tax.reconciles && dossier.tax.demandInr !== null) {
        badFinance.push(
          `${property.property_aggregate_id} (demand ${dossier.tax.demandInr}, payments ${dossier.tax.paymentsInr}, arrears ${dossier.tax.arrearsInr})`,
        );
      }

      const dates = [
        dossier.property.lastUpdated,
        dossier.household.occupancyDate,
        dossier.approval.approvalDate,
        dossier.tax.lastPaymentDate,
        dossier.water.connectionDate,
        dossier.solidWaste.lastCollection,
      ].filter((v): v is string => Boolean(v));
      for (const value of dates) {
        if (Number.isNaN(Date.parse(value)) || Date.parse(value) > REFERENCE.getTime()) {
          badDates.push(`${property.property_aggregate_id} (${value})`);
        }
      }
      if (
        dossier.approval.approvalDate &&
        dossier.household.occupancyDate &&
        Date.parse(dossier.approval.approvalDate) > Date.parse(dossier.household.occupancyDate)
      ) {
        badDates.push(`${property.property_aggregate_id} (occupancy before approval)`);
      }
      for (const row of dossier.complaints) {
        if (row.resolvedAt && Date.parse(row.resolvedAt) < Date.parse(row.createdAt)) {
          badDates.push(`${row.complaintId} (resolved before created)`);
        }
        if (row.status === "Resolved" && !row.resolvedAt) contradictions.push(`${row.complaintId} (resolved without a date)`);
        if (row.status !== "Resolved" && row.resolvedAt) contradictions.push(`${row.complaintId} (open with a resolution date)`);
      }

      if (dossier.sanitation.connectionStatus === "Connected" && !dossier.sanitation.connectionId) {
        contradictions.push(`${property.property_aggregate_id} (sewer connected without an identifier)`);
      }
      if (dossier.water.connectionId && dossier.water.connectionStatus === "Not available") {
        contradictions.push(`${property.property_aggregate_id} (water connection without a status)`);
      }
      if (dossier.solidWaste.serviceStatus.startsWith("Route assigned") && !dossier.solidWaste.collectionRouteId) {
        contradictions.push(`${property.property_aggregate_id} (waste service without a route)`);
      }
    }
  }

  checks.push(
    { id: "dossier-coverage", label: "Every prototype property has a complete Household 360 dossier", cityId: null, method: `${covered} property dossiers were built from the canonical records.`, affected: missing },
    { id: "dossier-refs", label: "Every dossier reference resolves to a canonical record", cityId: null, method: "Service area, asset, project, housing, locality and grievance references are resolved.", affected: brokenRefs },
    { id: "dossier-city", label: "No dossier reference crosses a city boundary", cityId: null, method: "Each referenced identifier is checked against the city of the property.", affected: crossCity },
    { id: "dossier-finance", label: "Property tax reconciles to the supplied demand, payments and arrears", cityId: null, method: "Demand less payments less adjustments is compared with the supplied arrears.", affected: badFinance },
    { id: "dossier-dates", label: "Dossier dates are valid and in sequence", cityId: null, method: "Approval, occupancy, payment, connection, collection and complaint dates are compared.", affected: badDates },
    { id: "dossier-status", label: "Service and complaint statuses do not contradict their records", cityId: null, method: "Connection identifiers, route assignment and complaint resolution are compared.", affected: contradictions },
    { id: "dossier-unique", label: "Generated dwelling and household identifiers are unique", cityId: null, method: "Every generated identifier is compared across the whole inventory.", affected: duplicates },
  );
  return checks;
}
