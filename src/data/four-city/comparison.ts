/**
 * Four-city comparison.
 *
 * Each indicator is computed the same way in every city, from the same fields,
 * over the same sampled records. Every indicator carries its numerator,
 * denominator, unit, definition and reporting period so two cities are only
 * ever compared on the same basis.
 *
 * There is no composite score and no ranking. Sample counts are sample counts:
 * they are never scaled to a citywide figure, and city institutional
 * arrangements are not assumed to be alike.
 */
import { fourCityBundle } from "./dataset";
import type { CityComparison } from "./types";

export type IndicatorKind = "percentage" | "absolute" | "average";

export interface ComparisonIndicator {
  key: string;
  label: string;
  /** How the value is computed, in the same words for every city. */
  definition: string;
  unit: string;
  kind: IndicatorKind;
  value: number | null;
  numerator: number | null;
  numeratorLabel: string;
  denominator: number | null;
  denominatorLabel: string;
  /** Reporting period covered by the records used, as recorded. */
  period: string;
  records: number;
  /** Where to look next for this indicator in the selected city. */
  drill: "housing" | "investment" | "livelihoods" | "signals" | "localities";
}

export interface LocalityRow {
  localityId: string;
  localityName: string;
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  records: number;
}

export interface CityComparisonView {
  cityId: string;
  cityName: string;
  state: string;
  supplied: CityComparison | null;
  indicators: ComparisonIndicator[];
}

export interface ComparisonSet {
  cities: CityComparisonView[];
  indicatorKeys: Array<{ key: string; label: string; unit: string; definition: string }>;
}

const sum = (rows: number[]) => rows.reduce((a, b) => a + b, 0);
const ratio = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);
const avg = (rows: number[]) =>
  rows.length ? Math.round((sum(rows) / rows.length) * 10) / 10 : null;

function periodOf(values: Array<string | null | undefined>): string {
  const set = [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
  if (set.length === 0) return "Period not recorded";
  if (set.length === 1) return set[0]!;
  return `${set[0]} to ${set[set.length - 1]}`;
}

type Bundle = NonNullable<ReturnType<typeof fourCityBundle>>;

function indicatorsFor(b: Bundle): ComparisonIndicator[] {
  const obsPeriod = periodOf(b.serviceObservations.map((o) => o.period));
  const grvPeriod = periodOf(b.grievances.map((g) => g.period));
  const recordDate = periodOf(b.projects.map((p) => p.observation_date));

  const housingCompleted = sum(b.housing.map((h) => h.completed_houses ?? 0));
  const housingSanctioned = sum(b.housing.map((h) => h.sanctioned_houses ?? 0));
  const waterReady = sum(b.housing.map((h) => h.water_ready_houses ?? 0));
  const sewerReady = sum(b.housing.map((h) => h.sewer_ready_houses ?? 0));
  const wasteReady = sum(b.housing.map((h) => h.waste_collection_ready_houses ?? 0));

  const wasteGenerated = sum(b.sanitation.map((s) => s.waste_generated_tpd ?? 0));
  const wasteCollected = sum(b.sanitation.map((s) => s.waste_collected_tpd ?? 0));
  const wasteProcessed = sum(b.sanitation.map((s) => s.waste_processed_tpd ?? 0));

  const applications = sum(b.serviceObservations.map((o) => o.applications_received ?? 0));
  const resolved = sum(b.serviceObservations.map((o) => o.applications_resolved ?? 0));

  const assetsOperational = b.assets.filter((a) =>
    /^operational$/i.test(a.commissioning_status ?? ""),
  ).length;

  const released = sum(b.finance.map((f) => f.fund_released_inr_lakh ?? 0));
  const expenditure = sum(b.finance.map((f) => f.expenditure_inr_lakh ?? 0));
  const financeYears = periodOf(b.finance.map((f) => f.financial_year));

  const loanSanctions = sum(b.livelihoods.map((l) => l.loan_sanctions ?? 0));
  const loanApplications = sum(b.livelihoods.map((l) => l.loan_applications ?? 0));
  const vendorSanctioned = sum(b.streetVendors.map((v) => v.sanctioned ?? 0));
  const vendorDisbursed = sum(b.streetVendors.map((v) => v.disbursed ?? 0));

  const housingWithStop = b.housing.filter((h) => h.nearest_transport_stop_id).length;

  return [
    {
      key: "housing_completion",
      label: "Housing completion",
      definition: "Completed houses divided by sanctioned houses, in the sampled housing records.",
      unit: "%",
      kind: "percentage",
      value: ratio(housingCompleted, housingSanctioned),
      numerator: housingCompleted,
      numeratorLabel: "Completed houses",
      denominator: housingSanctioned,
      denominatorLabel: "Sanctioned houses",
      period: recordDate,
      records: b.housing.length,
      drill: "housing",
    },
    {
      key: "housing_service_readiness",
      label: "Housing service readiness",
      definition:
        "Completed houses with water, sewer and waste collection all recorded, counted as the lowest of the three readiness figures, divided by completed houses. A recorded connection is not proof of reliable supply.",
      unit: "%",
      kind: "percentage",
      value: ratio(Math.min(waterReady, sewerReady, wasteReady), housingCompleted),
      numerator: Math.min(waterReady, sewerReady, wasteReady),
      numeratorLabel: "Houses with all three connections recorded (highest possible count)",
      denominator: housingCompleted,
      denominatorLabel: "Completed houses",
      period: recordDate,
      records: b.housing.length,
      drill: "housing",
    },
    {
      key: "water_hours",
      label: "Water availability",
      definition: "Average recorded water supply hours per day across sampled connection records.",
      unit: "hours per day",
      kind: "average",
      value: avg(
        b.waterSewerage
          .map((w) => w.water_supply_hours_per_day)
          .filter((v): v is number => v !== null && v !== undefined),
      ),
      numerator: null,
      numeratorLabel: "Average of recorded values",
      denominator: b.waterSewerage.length,
      denominatorLabel: "Connection records sampled",
      period: recordDate,
      records: b.waterSewerage.length,
      drill: "localities",
    },
    {
      key: "sewer_readiness",
      label: "Sewerage readiness",
      definition:
        "Completed houses with a sewer connection recorded, divided by completed houses.",
      unit: "%",
      kind: "percentage",
      value: ratio(sewerReady, housingCompleted),
      numerator: sewerReady,
      numeratorLabel: "Houses with sewer recorded",
      denominator: housingCompleted,
      denominatorLabel: "Completed houses",
      period: recordDate,
      records: b.housing.length,
      drill: "housing",
    },
    {
      key: "waste_collection",
      label: "Waste collection",
      definition: "Waste collected divided by waste generated, in tonnes per day, sampled areas.",
      unit: "%",
      kind: "percentage",
      value: ratio(wasteCollected, wasteGenerated),
      numerator: Math.round(wasteCollected * 10) / 10,
      numeratorLabel: "Waste collected (tpd)",
      denominator: Math.round(wasteGenerated * 10) / 10,
      denominatorLabel: "Waste generated (tpd)",
      period: recordDate,
      records: b.sanitation.length,
      drill: "localities",
    },
    {
      key: "waste_processing",
      label: "Waste processing",
      definition: "Waste processed divided by waste collected, in tonnes per day, sampled areas.",
      unit: "%",
      kind: "percentage",
      value: ratio(wasteProcessed, wasteCollected),
      numerator: Math.round(wasteProcessed * 10) / 10,
      numeratorLabel: "Waste processed (tpd)",
      denominator: Math.round(wasteCollected * 10) / 10,
      denominatorLabel: "Waste collected (tpd)",
      period: recordDate,
      records: b.sanitation.length,
      drill: "localities",
    },
    {
      key: "grievance_resolution",
      label: "Grievance resolution",
      definition:
        "Applications resolved divided by applications received in sampled service observations. Complaint aggregates are counted separately and are not resolution rates.",
      unit: "%",
      kind: "percentage",
      value: ratio(resolved, applications),
      numerator: resolved,
      numeratorLabel: "Applications resolved",
      denominator: applications,
      denominatorLabel: "Applications received",
      period: `${obsPeriod} (complaints: ${grvPeriod})`,
      records: b.serviceObservations.length,
      drill: "signals",
    },
    {
      key: "asset_commissioning",
      label: "Infrastructure commissioning",
      definition: "Assets recorded as operational, divided by all sampled assets.",
      unit: "%",
      kind: "percentage",
      value: ratio(assetsOperational, b.assets.length),
      numerator: assetsOperational,
      numeratorLabel: "Assets recorded operational",
      denominator: b.assets.length,
      denominatorLabel: "Assets sampled",
      period: recordDate,
      records: b.assets.length,
      drill: "investment",
    },
    {
      key: "asset_utilisation",
      label: "Infrastructure utilisation",
      definition: "Average recorded utilisation across sampled assets that state a figure.",
      unit: "%",
      kind: "average",
      value: avg(
        b.assets.map((a) => a.utilisation_pct).filter((v): v is number => v !== null && v !== undefined),
      ),
      numerator: null,
      numeratorLabel: "Average of recorded values",
      denominator: b.assets.filter((a) => a.utilisation_pct !== null).length,
      denominatorLabel: "Assets stating utilisation",
      period: recordDate,
      records: b.assets.length,
      drill: "investment",
    },
    {
      key: "municipal_investment",
      label: "Municipal investment",
      definition:
        "Funds released across sampled municipal finance records, in INR lakh, as supplied. Not a citywide budget.",
      unit: "INR lakh",
      kind: "absolute",
      value: Math.round(released * 100) / 100,
      numerator: Math.round(released * 100) / 100,
      numeratorLabel: "Funds released (INR lakh)",
      denominator: null,
      denominatorLabel: "Absolute sampled value, no denominator",
      period: financeYears,
      records: b.finance.length,
      drill: "investment",
    },
    {
      key: "financial_progress",
      label: "Financial progress",
      definition:
        "Expenditure divided by funds released across sampled finance records within the same financial years.",
      unit: "%",
      kind: "percentage",
      value: ratio(expenditure, released),
      numerator: Math.round(expenditure * 100) / 100,
      numeratorLabel: "Expenditure (INR lakh)",
      denominator: Math.round(released * 100) / 100,
      denominatorLabel: "Funds released (INR lakh)",
      period: financeYears,
      records: b.finance.length,
      drill: "investment",
    },
    {
      key: "livelihood_delivery",
      label: "Livelihood scheme delivery",
      definition:
        "DAY-NULM loan sanctions divided by loan applications in sampled livelihood records. A sanction is not income.",
      unit: "%",
      kind: "percentage",
      value: ratio(loanSanctions, loanApplications),
      numerator: loanSanctions,
      numeratorLabel: "Loan sanctions",
      denominator: loanApplications,
      denominatorLabel: "Loan applications",
      period: recordDate,
      records: b.livelihoods.length,
      drill: "livelihoods",
    },
    {
      key: "vendor_support",
      label: "Street-vendor support",
      definition:
        "PM SVANidhi loans disbursed divided by loans sanctioned in sampled vendor aggregates. Sanction and disbursement stay separate.",
      unit: "%",
      kind: "percentage",
      value: ratio(vendorDisbursed, vendorSanctioned),
      numerator: vendorDisbursed,
      numeratorLabel: "Loans disbursed",
      denominator: vendorSanctioned,
      denominatorLabel: "Loans sanctioned",
      period: recordDate,
      records: b.streetVendors.length,
      drill: "livelihoods",
    },
    {
      key: "transport_access",
      label: "Transport accessibility",
      definition:
        "Housing records naming a nearest transport stop, divided by housing records. Proximity is recorded, not travel time or usable access.",
      unit: "%",
      kind: "percentage",
      value: ratio(housingWithStop, b.housing.length),
      numerator: housingWithStop,
      numeratorLabel: "Housing records naming a stop",
      denominator: b.housing.length,
      denominatorLabel: "Housing records sampled",
      period: recordDate,
      records: b.transport.length,
      drill: "livelihoods",
    },
    {
      key: "decision_signals",
      label: "Decision signals",
      definition: "Count of supplied decision signals for the city. A count, not a severity measure.",
      unit: "signals",
      kind: "absolute",
      value: b.signals.length,
      numerator: b.signals.length,
      numeratorLabel: "Signals supplied",
      denominator: null,
      denominatorLabel: "Absolute count, no denominator",
      period: recordDate,
      records: b.signals.length,
      drill: "signals",
    },
  ];
}

const CITY_IDS = ["CITY-THANE", "CITY-SURAT", "CITY-AHMEDABAD", "CITY-GUWAHATI"];

let cached: ComparisonSet | null = null;

export function comparisonSet(): ComparisonSet {
  if (cached) return cached;
  const cities: CityComparisonView[] = [];
  for (const id of CITY_IDS) {
    const b = fourCityBundle(id);
    if (!b) continue;
    cities.push({
      cityId: id,
      cityName: b.city.name,
      state: b.city.state,
      supplied: b.comparison,
      indicators: indicatorsFor(b),
    });
  }
  const first = cities[0]?.indicators ?? [];
  cached = {
    cities,
    indicatorKeys: first.map((i) => ({
      key: i.key,
      label: i.label,
      unit: i.unit,
      definition: i.definition,
    })),
  };
  return cached;
}

/** The same indicator computed locality by locality inside one city. */
export function localityBreakdown(cityId: string, indicatorKey: string): LocalityRow[] {
  const b = fourCityBundle(cityId);
  if (!b) return [];
  return b.localities
    .map((l) => {
      const housing = b.housing.filter((h) => h.locality_id === l.id);
      const sanitation = b.sanitation.filter((s) => s.locality_id === l.id);
      const water = b.waterSewerage.filter((w) => w.locality_id === l.id);
      const assets = b.assets.filter((a) => a.locality_id === l.id);
      const obs = b.serviceObservations.filter((o) => o.locality_id === l.id);
      const finance = b.finance.filter((f) => f.locality_id === l.id);
      const liv = b.livelihoods.filter((x) => x.locality_id === l.id);
      const vend = b.streetVendors.filter((v) => v.locality_id === l.id);
      const signals = b.signals.filter((s) => s.locality_id === l.id);

      const make = (
        n: number | null,
        d: number | null,
        records: number,
        kind: IndicatorKind = "percentage",
      ): LocalityRow => ({
        localityId: l.id,
        localityName: l.name,
        value:
          kind === "percentage"
            ? n !== null && d !== null
              ? ratio(n, d)
              : null
            : (n ?? null),
        numerator: n,
        denominator: d,
        records,
      });

      const completed = sum(housing.map((h) => h.completed_houses ?? 0));
      switch (indicatorKey) {
        case "housing_completion":
          return make(completed, sum(housing.map((h) => h.sanctioned_houses ?? 0)), housing.length);
        case "housing_service_readiness":
          return make(
            Math.min(
              sum(housing.map((h) => h.water_ready_houses ?? 0)),
              sum(housing.map((h) => h.sewer_ready_houses ?? 0)),
              sum(housing.map((h) => h.waste_collection_ready_houses ?? 0)),
            ),
            completed,
            housing.length,
          );
        case "sewer_readiness":
          return make(sum(housing.map((h) => h.sewer_ready_houses ?? 0)), completed, housing.length);
        case "water_hours":
          return make(
            avg(
              water
                .map((w) => w.water_supply_hours_per_day)
                .filter((v): v is number => v !== null && v !== undefined),
            ),
            water.length,
            water.length,
            "average",
          );
        case "waste_collection":
          return make(
            Math.round(sum(sanitation.map((s) => s.waste_collected_tpd ?? 0)) * 10) / 10,
            Math.round(sum(sanitation.map((s) => s.waste_generated_tpd ?? 0)) * 10) / 10,
            sanitation.length,
          );
        case "waste_processing":
          return make(
            Math.round(sum(sanitation.map((s) => s.waste_processed_tpd ?? 0)) * 10) / 10,
            Math.round(sum(sanitation.map((s) => s.waste_collected_tpd ?? 0)) * 10) / 10,
            sanitation.length,
          );
        case "grievance_resolution":
          return make(
            sum(obs.map((o) => o.applications_resolved ?? 0)),
            sum(obs.map((o) => o.applications_received ?? 0)),
            obs.length,
          );
        case "asset_commissioning":
          return make(
            assets.filter((a) => /^operational$/i.test(a.commissioning_status ?? "")).length,
            assets.length,
            assets.length,
          );
        case "asset_utilisation":
          return make(
            avg(
              assets
                .map((a) => a.utilisation_pct)
                .filter((v): v is number => v !== null && v !== undefined),
            ),
            assets.filter((a) => a.utilisation_pct !== null).length,
            assets.length,
            "average",
          );
        case "municipal_investment":
          return make(
            Math.round(sum(finance.map((f) => f.fund_released_inr_lakh ?? 0)) * 100) / 100,
            null,
            finance.length,
            "absolute",
          );
        case "financial_progress":
          return make(
            Math.round(sum(finance.map((f) => f.expenditure_inr_lakh ?? 0)) * 100) / 100,
            Math.round(sum(finance.map((f) => f.fund_released_inr_lakh ?? 0)) * 100) / 100,
            finance.length,
          );
        case "livelihood_delivery":
          return make(
            sum(liv.map((x) => x.loan_sanctions ?? 0)),
            sum(liv.map((x) => x.loan_applications ?? 0)),
            liv.length,
          );
        case "vendor_support":
          return make(
            sum(vend.map((v) => v.disbursed ?? 0)),
            sum(vend.map((v) => v.sanctioned ?? 0)),
            vend.length,
          );
        case "transport_access":
          return make(
            housing.filter((h) => h.nearest_transport_stop_id).length,
            housing.length,
            housing.length,
          );
        case "decision_signals":
          return make(signals.length, null, signals.length, "absolute");
        default:
          return make(null, null, 0, "absolute");
      }
    })
    .sort((a, b2) => (b2.value ?? -1) - (a.value ?? -1));
}
