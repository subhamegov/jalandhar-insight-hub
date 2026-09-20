/**
 * Canonical indicator contract.
 *
 * One definition per indicator, computed once in comparison.ts and described
 * here with everything needed to reproduce it: unit, numerator, denominator,
 * calculation method, aggregation method, geographic scope, observation period,
 * the canonical ids of the records it was summed from, and the data
 * classifications those records carry.
 *
 * Views must read indicator values through this contract (or through
 * comparison.ts, which it wraps) rather than recomputing them locally, so the
 * same indicator means the same thing everywhere it appears.
 */
import { comparisonSet, type ComparisonIndicator } from "./comparison";
import { fourCityBundle, type FourCityBundle } from "./dataset";

export interface IndicatorContract {
  indicator_id: string;
  indicator_name: string;
  description: string;
  unit: string;
  /** Value as computed; null when the supplied records carry no basis for it. */
  value: number | null;
  numerator: number | null;
  numerator_label: string;
  denominator: number | null;
  denominator_label: string;
  calculation_method: string;
  aggregation_method: string;
  geographic_scope: string;
  observation_period: string;
  source_record_ids: string[];
  data_classification: string[];
  /** Section of the application where this indicator can be investigated. */
  drill: ComparisonIndicator["drill"];
}

type Bundle = FourCityBundle;

const ids = <T>(rows: T[], key: (r: T) => string) => rows.map(key);

/** Which supplied records each indicator is summed from, by canonical id. */
const SOURCES: Record<string, (b: Bundle) => string[]> = {
  housing_completion: (b) => ids(b.housing, (h) => h.housing_id),
  housing_service_readiness: (b) => ids(b.housing, (h) => h.housing_id),
  water_hours: (b) => ids(b.waterSewerage, (w) => w.connection_record_id),
  sewer_readiness: (b) => ids(b.housing, (h) => h.housing_id),
  waste_collection: (b) => ids(b.sanitation, (s) => s.sanitation_id),
  waste_processing: (b) => ids(b.sanitation, (s) => s.sanitation_id),
  grievance_resolution: (b) => ids(b.serviceObservations, (o) => o.service_observation_id),
  asset_commissioning: (b) => ids(b.assets, (a) => a.asset_id),
  asset_utilisation: (b) => ids(b.assets, (a) => a.asset_id),
  municipal_investment: (b) => ids(b.finance, (f) => f.finance_id),
  financial_progress: (b) => ids(b.projects, (p) => p.project_id),
  livelihood_delivery: (b) => ids(b.livelihoods, (l) => l.livelihood_id),
  vendor_support: (b) => ids(b.streetVendors, (v) => v.vendor_aggregate_id),
  transport_access: (b) => ids(b.housing, (h) => h.housing_id),
  decision_signals: (b) => ids(b.signals, (s) => s.signal_id),
};

const AGGREGATION: Record<ComparisonIndicator["kind"], string> = {
  percentage: "Numerator and denominator summed across sampled records, then divided. Percentages are never averaged or added.",
  absolute: "Sum of the recorded values in the sampled records. Not scaled to a citywide total.",
  average: "Mean of the records that carry a value. Records without a value are excluded, not read as zero.",
};

function classificationsOf(recordIds: string[], b: Bundle): string[] {
  const set = new Set<string>();
  const all: Array<{ id: string; record_type: string | null }> = [
    ...b.housing.map((h) => ({ id: h.housing_id, record_type: h.record_type })),
    ...b.waterSewerage.map((w) => ({ id: w.connection_record_id, record_type: w.record_type })),
    ...b.sanitation.map((s) => ({ id: s.sanitation_id, record_type: s.record_type })),
    ...b.serviceObservations.map((o) => ({
      id: o.service_observation_id,
      record_type: o.record_type,
    })),
    ...b.assets.map((a) => ({ id: a.asset_id, record_type: a.record_type })),
    ...b.finance.map((f) => ({ id: f.finance_id, record_type: f.record_type })),
    ...b.projects.map((p) => ({ id: p.project_id, record_type: p.record_type })),
    ...b.livelihoods.map((l) => ({ id: l.livelihood_id, record_type: l.record_type })),
    ...b.streetVendors.map((v) => ({ id: v.vendor_aggregate_id, record_type: v.record_type })),
    ...b.signals.map((s) => ({ id: s.signal_id, record_type: s.record_type })),
  ];
  const index = new Map(all.map((r) => [r.id, r.record_type]));
  for (const id of recordIds) {
    const type = index.get(id);
    if (type) set.add(type);
  }
  return [...set].sort();
}

const cache = new Map<string, IndicatorContract[]>();

export function indicatorContracts(cityId: string): IndicatorContract[] {
  const cached = cache.get(cityId);
  if (cached) return cached;
  const bundle = fourCityBundle(cityId);
  if (!bundle) return [];
  const view = comparisonSet().cities.find((c) => c.cityId === cityId);
  if (!view) return [];

  const out = view.indicators.map<IndicatorContract>((i) => {
    const recordIds = SOURCES[i.key]?.(bundle) ?? [];
    return {
      indicator_id: `IND-${i.key.toUpperCase().replace(/_/g, "-")}`,
      indicator_name: i.label,
      description: i.definition,
      unit: i.unit,
      value: i.value,
      numerator: i.numerator,
      numerator_label: i.numeratorLabel,
      denominator: i.denominator,
      denominator_label: i.denominatorLabel,
      calculation_method:
        i.kind === "percentage"
          ? `(${i.numeratorLabel} ÷ ${i.denominatorLabel}) × 100, rounded to one decimal place.`
          : i.kind === "average"
            ? `Mean of ${i.numeratorLabel.toLowerCase()} across ${i.denominatorLabel.toLowerCase()}.`
            : `${i.numeratorLabel} summed across ${i.denominatorLabel.toLowerCase()}.`,
      aggregation_method: AGGREGATION[i.kind],
      geographic_scope: `${view.cityName} sample. ${bundle.localities.length} supplied localities and ${i.records} records used. Not a citywide figure.`,
      observation_period: i.period,
      source_record_ids: recordIds,
      data_classification: classificationsOf(recordIds, bundle),
      drill: i.drill,
    };
  });
  cache.set(cityId, out);
  return out;
}

export function indicatorContract(cityId: string, indicatorId: string): IndicatorContract | null {
  return indicatorContracts(cityId).find((i) => i.indicator_id === indicatorId) ?? null;
}
