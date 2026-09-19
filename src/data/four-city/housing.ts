/**
 * Housing service readiness.
 *
 * The progression is sanctioned → grounded → completed → occupied → serviced.
 * Each step is read from the supplied record fields; none is inferred from the
 * step before it. Occupancy is never derived from completion, and readiness
 * counts are the dataset's own water / sewer / waste ready figures, which state
 * that a connection is recorded — not that the service runs reliably.
 *
 * Every connection made here uses canonical identifiers only: project_id,
 * asset_ids, linked_property_aggregate_ids, collection_route_id,
 * nearest_transport_stop_id, service_area locality_ids and the supporting
 * records declared by decision signals. Nothing is joined by name.
 */
import { fourCityBundle } from "./dataset";
import type {
  AssetServiceArea,
  DecisionSignal,
  GrievanceAggregate,
  HousingRecord,
  Locality,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  PropertyAggregate,
  SanitationRecord,
  ServiceObservation,
  TransportRecord,
  WaterSewerageRecord,
} from "./types";

export interface ReadinessStep {
  key: string;
  label: string;
  value: number | null;
  /** Denominator this step should be read against, and its label. */
  ofValue: number | null;
  ofLabel: string;
  note: string;
}

export interface HousingIntelligence {
  record: HousingRecord;
  locality: Locality | null;
  project: MissionProject | null;
  mission: string | null;
  progression: ReadinessStep[];
  /** Completed houses without a recorded water / sewer / waste connection. */
  gaps: Array<{ label: string; shortfall: number; of: number }>;
  properties: PropertyAggregate[];
  waterSewerage: WaterSewerageRecord[];
  sanitation: SanitationRecord[];
  serviceAreas: AssetServiceArea[];
  assets: MunicipalAsset[];
  waterAssets: MunicipalAsset[];
  sewerAssets: MunicipalAsset[];
  notOperational: MunicipalAsset[];
  transport: TransportRecord[];
  serviceObservations: ServiceObservation[];
  grievances: GrievanceAggregate[];
  finance: MunicipalFinance[];
  signals: DecisionSignal[];
  agencies: string[];
  /** Connections named in the records but with no matching record present. */
  missingLinks: string[];
}

const nz = (v: number | null | undefined) => (typeof v === "number" ? v : 0);

function step(
  key: string,
  label: string,
  value: number | null,
  ofValue: number | null,
  ofLabel: string,
  note: string,
): ReadinessStep {
  return { key, label, value, ofValue, ofLabel, note };
}

export function housingIntelligence(cityId: string): HousingIntelligence[] {
  const b = fourCityBundle(cityId);
  if (!b) return [];

  return b.housing.map((h) => {
    const project = b.projects.find((p) => p.project_id === h.project_id) ?? null;
    const locality = b.localities.find((l) => l.id === h.locality_id) ?? null;
    const propIds = new Set(h.linked_property_aggregate_ids);
    const properties = b.properties.filter((p) => propIds.has(p.property_aggregate_id));

    const waterSewerage = b.waterSewerage.filter(
      (w) => w.property_aggregate_id && propIds.has(w.property_aggregate_id),
    );

    const routeIds = new Set(
      properties.map((p) => p.waste_collection_route_id).filter(Boolean) as string[],
    );
    const sanitation = b.sanitation.filter(
      (s) => s.collection_route_id && routeIds.has(s.collection_route_id),
    );

    const areaIds = new Set(
      [
        ...properties.map((p) => p.water_service_area_id),
        ...waterSewerage.map((w) => w.water_service_area_id),
      ].filter(Boolean) as string[],
    );
    const serviceAreas = b.serviceAreas.filter(
      (a) =>
        areaIds.has(a.service_area_id) ||
        (h.locality_id ? a.locality_ids.includes(h.locality_id) : false),
    );

    const projectAssetIds = new Set(project?.asset_ids ?? []);
    const treatmentIds = new Set(
      [
        ...waterSewerage.map((w) => w.water_treatment_asset_id),
        ...waterSewerage.map((w) => w.sewer_treatment_asset_id),
      ].filter(Boolean) as string[],
    );
    const areaWaterIds = new Set(serviceAreas.flatMap((a) => a.water_asset_ids));
    const areaSewerIds = new Set(serviceAreas.flatMap((a) => a.sewer_asset_ids));
    const sanitationAssetIds = new Set(sanitation.flatMap((s) => s.linked_asset_ids));

    const relevant = new Set<string>([
      ...projectAssetIds,
      ...treatmentIds,
      ...areaWaterIds,
      ...areaSewerIds,
      ...sanitationAssetIds,
    ]);
    const assets = b.assets.filter(
      (a) => relevant.has(a.asset_id) || a.project_ids.some((p) => p === h.project_id),
    );
    const waterAssets = assets.filter((a) => areaWaterIds.has(a.asset_id) || treatmentIds.has(a.asset_id));
    const sewerAssets = assets.filter((a) => areaSewerIds.has(a.asset_id));
    const notOperational = assets.filter(
      (a) =>
        a.commissioning_status === "commissioned_not_operational" ||
        a.commissioning_status === "under_construction" ||
        a.commissioning_status === "maintenance_required",
    );

    const transport = b.transport.filter(
      (t) =>
        t.transport_stop_id === h.nearest_transport_stop_id ||
        t.linked_housing_id === h.housing_id,
    );

    const assetIdSet = new Set(assets.map((a) => a.asset_id));
    const touchesHousing = (linkedAssets: string[], linkedProps: string[]) =>
      linkedAssets.some((a) => assetIdSet.has(a)) || linkedProps.some((p) => propIds.has(p));

    const serviceObservations = b.serviceObservations.filter((s) =>
      touchesHousing(s.linked_asset_ids, s.linked_property_aggregate_ids),
    );
    const grievances = b.grievances.filter((g) =>
      touchesHousing(g.linked_asset_ids, g.linked_property_aggregate_ids),
    );

    const finance = b.finance.filter((f) => f.project_id && f.project_id === h.project_id);

    const signals = b.signals.filter(
      (s) =>
        s.supporting_records.some((r) => r.id === h.housing_id || r.id === h.project_id) ||
        (h.project_id ? s.related_projects.includes(h.project_id) : false) ||
        s.related_assets.some((a) => assetIdSet.has(a)),
    );

    const agencies = [
      ...new Set(
        [
          project?.implementing_agency ?? null,
          ...assets.map((a) => a.owner_agency),
          ...assets.map((a) => a.operator_agency),
        ].filter(Boolean) as string[],
      ),
    ];

    const missingLinks: string[] = [];
    if (!h.project_id) missingLinks.push("No housing project identifier recorded");
    else if (!project) missingLinks.push(`Project ${h.project_id} is not present in the register`);
    if (!h.nearest_transport_stop_id) missingLinks.push("No nearest transport stop recorded");
    else if (transport.length === 0)
      missingLinks.push(`Transport stop ${h.nearest_transport_stop_id} has no stop record`);
    if (h.linked_property_aggregate_ids.length === 0)
      missingLinks.push("No property aggregates linked to this housing record");
    if (properties.length < h.linked_property_aggregate_ids.length)
      missingLinks.push(
        `${h.linked_property_aggregate_ids.length - properties.length} linked property aggregates are not present`,
      );
    if (waterSewerage.length === 0)
      missingLinks.push("No water or sewerage connection records for the linked properties");
    if (sanitation.length === 0)
      missingLinks.push("No waste collection route record for the linked properties");

    const completed = h.completed_houses;
    const progression: ReadinessStep[] = [
      step("sanctioned", "Sanctioned", h.sanctioned_houses, null, "", "Approved under the mission"),
      step(
        "grounded",
        "Grounded",
        h.grounded_houses,
        h.sanctioned_houses,
        "sanctioned",
        "Construction started",
      ),
      step(
        "completed",
        "Completed",
        completed,
        h.grounded_houses,
        "grounded",
        "Construction finished. Not evidence that anyone lives there.",
      ),
      step(
        "occupied",
        "Occupied",
        h.occupied_houses,
        completed,
        "completed",
        "Recorded as occupied. Read from the record, not inferred from completion.",
      ),
      step(
        "water",
        "Water ready",
        h.water_ready_houses,
        completed,
        "completed",
        "A water connection is recorded. It does not show supply hours or reliability.",
      ),
      step(
        "sewer",
        "Sewerage ready",
        h.sewer_ready_houses,
        completed,
        "completed",
        "A sewer connection is recorded, not that treatment capacity is operational.",
      ),
      step(
        "waste",
        "Waste collection ready",
        h.waste_collection_ready_houses,
        completed,
        "completed",
        "A collection route covers the house, not that collection happened.",
      ),
    ];

    const gaps = [
      { label: "Completed without a water connection", value: h.water_ready_houses },
      { label: "Completed without a sewer connection", value: h.sewer_ready_houses },
      { label: "Completed without waste collection", value: h.waste_collection_ready_houses },
      { label: "Completed but not recorded as occupied", value: h.occupied_houses },
    ]
      .filter((g) => typeof g.value === "number" && typeof completed === "number")
      .map((g) => ({
        label: g.label,
        shortfall: Math.max(0, nz(completed) - nz(g.value)),
        of: nz(completed),
      }))
      .filter((g) => g.shortfall > 0);

    return {
      record: h,
      locality,
      project,
      mission: h.mission,
      progression,
      gaps,
      properties,
      waterSewerage,
      sanitation,
      serviceAreas,
      assets,
      waterAssets,
      sewerAssets,
      notOperational,
      transport,
      serviceObservations,
      grievances,
      finance,
      signals,
      agencies,
      missingLinks,
    };
  });
}

export interface HousingCitySummary {
  sanctioned: number;
  grounded: number;
  completed: number;
  occupied: number;
  waterReady: number;
  sewerReady: number;
  wasteReady: number;
  /** Completed houses with water, sewer and waste all recorded ready. */
  fullyServiceReady: number;
  /** Denominator for fullyServiceReady: the minimum of the three readiness counts per record. */
  records: number;
  withTransportStop: number;
  notOperationalAssets: number;
}

/**
 * City totals over the sampled housing records. fullyServiceReady takes the
 * lowest of the three readiness counts in each record: it is the largest number
 * of houses that could hold all three connections, not a verified count.
 */
export function housingSummary(rows: HousingIntelligence[]): HousingCitySummary {
  const s: HousingCitySummary = {
    sanctioned: 0,
    grounded: 0,
    completed: 0,
    occupied: 0,
    waterReady: 0,
    sewerReady: 0,
    wasteReady: 0,
    fullyServiceReady: 0,
    records: rows.length,
    withTransportStop: 0,
    notOperationalAssets: 0,
  };
  const assetIds = new Set<string>();
  for (const r of rows) {
    const h = r.record;
    s.sanctioned += nz(h.sanctioned_houses);
    s.grounded += nz(h.grounded_houses);
    s.completed += nz(h.completed_houses);
    s.occupied += nz(h.occupied_houses);
    s.waterReady += nz(h.water_ready_houses);
    s.sewerReady += nz(h.sewer_ready_houses);
    s.wasteReady += nz(h.waste_collection_ready_houses);
    s.fullyServiceReady += Math.min(
      nz(h.water_ready_houses),
      nz(h.sewer_ready_houses),
      nz(h.waste_collection_ready_houses),
    );
    if (r.transport.length > 0) s.withTransportStop += 1;
    for (const a of r.notOperational) assetIds.add(a.asset_id);
  }
  s.notOperationalAssets = assetIds.size;
  return s;
}

export function housingRecord(cityId: string, housingId: string): HousingIntelligence | null {
  return housingIntelligence(cityId).find((r) => r.record.housing_id === housingId) ?? null;
}
