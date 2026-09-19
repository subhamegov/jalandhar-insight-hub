/**
 * Livelihood and mobility intelligence.
 *
 * Connects DAY-NULM livelihood groups, PM SVANidhi street-vendor aggregates,
 * municipal market assets, housing and transport records for one city.
 *
 * Every link uses canonical identifiers supplied in the data: vending_zone_id,
 * market_asset_id, linked_market_asset_id, transport_stop_id, route_id,
 * linked_housing_id and locality_id. Nothing is matched by name, no travel time
 * or distance is computed, no employment outcome is claimed, and loan
 * sanctions are never merged with disbursements.
 */
import { fourCityBundle } from "./dataset";
import type {
  DecisionSignal,
  HousingRecord,
  LivelihoodGroup,
  Locality,
  MunicipalAsset,
  StreetVendorAggregate,
  TransportRecord,
} from "./types";

const nz = (v: number | null | undefined) => (typeof v === "number" ? v : 0);

export interface VendorRow {
  record: StreetVendorAggregate;
  locality: Locality | null;
  /** Market asset named by market_asset_id, when that asset exists. */
  market: MunicipalAsset | null;
  /** Transport records attached to the market asset. */
  marketTransport: TransportRecord[];
  notes: string[];
}

export interface LivelihoodRow {
  record: LivelihoodGroup;
  locality: Locality | null;
  market: MunicipalAsset | null;
  /** Transport records attached to that market asset. */
  transport: TransportRecord[];
  notes: string[];
}

export interface MobilityRow {
  housing: HousingRecord;
  locality: Locality | null;
  stop: TransportRecord | null;
  /** All records sharing the stop's route identifier. */
  routeRecords: TransportRecord[];
  note: string;
}

export interface NeighbourhoodRow {
  locality: Locality;
  completedHouses: number;
  occupiedHouses: number;
  shgCount: number;
  enterpriseCount: number;
  surveyedVendors: number;
  marketAssets: number;
  transportStops: number;
  /** Observable absences in the records for this locality. */
  gaps: string[];
}

export interface LivelihoodMobility {
  vendors: VendorRow[];
  livelihoods: LivelihoodRow[];
  mobility: MobilityRow[];
  neighbourhoods: NeighbourhoodRow[];
  signals: DecisionSignal[];
  totals: {
    surveyedVendors: number;
    eligibleApplications: number;
    sanctioned: number;
    disbursed: number;
    bankReturns: number;
    digitalActive: number;
    shgCount: number;
    alfCount: number;
    clfCount: number;
    enterpriseCount: number;
    loanApplications: number;
    loanSanctions: number;
    loanDisbursements: number;
    trainingParticipants: number;
    housingWithStop: number;
    housingRecords: number;
    marketAssets: number;
  };
  period: string;
  personalDataPresent: boolean;
}

/** Market-like municipal assets, identified by asset_type only. */
const isMarket = (a: MunicipalAsset) =>
  /market|vending|haat|bazaar/i.test(a.asset_type) || /market|vending/i.test(a.asset_name);

export function livelihoodMobility(cityId: string): LivelihoodMobility | null {
  const b = fourCityBundle(cityId);
  if (!b) return null;

  const localityOf = (id: string | null) =>
    id ? (b.localities.find((l) => l.id === id) ?? null) : null;
  const assetOf = (id: string | null) =>
    id ? (b.assets.find((a) => a.asset_id === id) ?? null) : null;
  const transportForAsset = (assetId: string | null) =>
    assetId ? b.transport.filter((t) => t.linked_market_asset_id === assetId) : [];

  const vendors: VendorRow[] = b.streetVendors.map((v) => {
    const market = assetOf(v.market_asset_id);
    const notes: string[] = [];
    if (!v.vending_zone_id) notes.push("No vending zone recorded");
    if (v.market_asset_id && !market)
      notes.push(`Market asset ${v.market_asset_id} is not present in the asset register`);
    if (!v.market_asset_id) notes.push("No municipal market asset linked");
    return {
      record: v,
      locality: localityOf(v.locality_id),
      market,
      marketTransport: transportForAsset(v.market_asset_id),
      notes,
    };
  });

  const livelihoods: LivelihoodRow[] = b.livelihoods.map((g) => {
    const market = assetOf(g.linked_market_asset_id);
    const notes: string[] = [];
    if (!g.locality_id) notes.push("No locality recorded");
    if (g.linked_market_asset_id && !market)
      notes.push(`Market asset ${g.linked_market_asset_id} is not present in the asset register`);
    if (!g.linked_market_asset_id) notes.push("No market infrastructure linked");
    return {
      record: g,
      locality: localityOf(g.locality_id),
      market,
      transport: transportForAsset(g.linked_market_asset_id),
      notes,
    };
  });

  const mobility: MobilityRow[] = b.housing.map((h) => {
    const stop =
      b.transport.find(
        (t) =>
          (h.nearest_transport_stop_id && t.transport_stop_id === h.nearest_transport_stop_id) ||
          t.linked_housing_id === h.housing_id,
      ) ?? null;
    const routeRecords = stop ? b.transport.filter((t) => t.route_id === stop.route_id) : [];
    const note = !h.nearest_transport_stop_id
      ? "No transport stop recorded against this housing record"
      : stop
        ? "A stop is recorded near this housing record. Distance and travel time are not in the data."
        : `Stop ${h.nearest_transport_stop_id} has no transport record`;
    return { housing: h, locality: localityOf(h.locality_id), stop, routeRecords, note };
  });

  const neighbourhoods: NeighbourhoodRow[] = b.localities.map((l) => {
    const housing = b.housing.filter((h) => h.locality_id === l.id);
    const groups = b.livelihoods.filter((g) => g.locality_id === l.id);
    const vend = b.streetVendors.filter((v) => v.locality_id === l.id);
    const markets = b.assets.filter((a) => a.locality_id === l.id && isMarket(a));
    const stops = b.transport.filter((t) => t.locality_id === l.id);

    const gaps: string[] = [];
    if (stops.length === 0) gaps.push("No transport stop records in this locality");
    if (markets.length === 0) gaps.push("No municipal market asset recorded");
    if (groups.length === 0) gaps.push("No livelihood group records");
    if (vend.length === 0) gaps.push("No street-vendor aggregate recorded");
    if (housing.length > 0 && stops.length === 0)
      gaps.push("Housing recorded here with no transport stop record");

    return {
      locality: l,
      completedHouses: housing.reduce((s, h) => s + nz(h.completed_houses), 0),
      occupiedHouses: housing.reduce((s, h) => s + nz(h.occupied_houses), 0),
      shgCount: groups.reduce((s, g) => s + nz(g.shg_count), 0),
      enterpriseCount: groups.reduce((s, g) => s + nz(g.enterprise_count), 0),
      surveyedVendors: vend.reduce((s, v) => s + nz(v.surveyed_vendors), 0),
      marketAssets: markets.length,
      transportStops: stops.length,
      gaps,
    };
  });

  const relevantIds = new Set<string>([
    ...b.livelihoods.map((g) => g.livelihood_id),
    ...b.streetVendors.map((v) => v.vendor_aggregate_id),
    ...b.transport.map((t) => t.transport_stop_id),
    ...b.assets.filter(isMarket).map((a) => a.asset_id),
  ]);
  const signals = b.signals.filter(
    (s) =>
      s.supporting_records.some((r) => relevantIds.has(r.id)) ||
      s.related_assets.some((a) => relevantIds.has(a)) ||
      s.related_missions.some((m) => /NULM|SVANIDHI|TRANSPORT/i.test(m)),
  );

  const sum = <T>(rows: T[], pick: (r: T) => number | null) =>
    rows.reduce((s, r) => s + nz(pick(r)), 0);

  const periods = [
    ...new Set(
      [...b.livelihoods, ...b.streetVendors, ...b.transport]
        .map((r) => r.observation_date)
        .filter(Boolean) as string[],
    ),
  ].sort();

  return {
    vendors,
    livelihoods,
    mobility,
    neighbourhoods,
    signals,
    totals: {
      surveyedVendors: sum(b.streetVendors, (v) => v.surveyed_vendors),
      eligibleApplications: sum(b.streetVendors, (v) => v.eligible_applications),
      sanctioned: sum(b.streetVendors, (v) => v.sanctioned),
      disbursed: sum(b.streetVendors, (v) => v.disbursed),
      bankReturns: sum(b.streetVendors, (v) => v.bank_returns),
      digitalActive: sum(b.streetVendors, (v) => v.digital_active),
      shgCount: sum(b.livelihoods, (g) => g.shg_count),
      alfCount: sum(b.livelihoods, (g) => g.alf_count),
      clfCount: sum(b.livelihoods, (g) => g.clf_count),
      enterpriseCount: sum(b.livelihoods, (g) => g.enterprise_count),
      loanApplications: sum(b.livelihoods, (g) => g.loan_applications),
      loanSanctions: sum(b.livelihoods, (g) => g.loan_sanctions),
      loanDisbursements: sum(b.livelihoods, (g) => g.loan_disbursements),
      trainingParticipants: sum(b.livelihoods, (g) => g.training_participants),
      housingWithStop: mobility.filter((m) => m.stop).length,
      housingRecords: b.housing.length,
      marketAssets: b.assets.filter(isMarket).length,
    },
    period: periods.length ? `${periods[0]} to ${periods[periods.length - 1]}` : "Not available",
    // Aggregates only. No beneficiary identity or personal financial record is held.
    personalDataPresent: false,
  };
}
