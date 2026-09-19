/**
 * Application-wide data integrity checks.
 *
 * Every check runs against the records the application actually reads, and
 * reports what it finds — including failures in the supplied data. Nothing here
 * corrects, fills or hides a source value: a failed check names the affected
 * canonical ids and the parts of the application that read them.
 */
import {
  byId,
  DATASET_REFERENCE_DATE,
  decisionSignals,
  fourCityBundle,
  lookupEntity,
  localities,
  planningInterventions,
  type FourCityBundle,
} from "./dataset";
import { indicatorContracts } from "./indicators";
import { runValidation } from "./validation";

export type IntegrityGroup =
  | "referential"
  | "geographic"
  | "numerical"
  | "temporal"
  | "financial"
  | "housing_funnel"
  | "livelihood_funnel"
  | "provenance"
  | "reconciliation"
  | "city_filtering";

export interface IntegrityCheck {
  id: string;
  label: string;
  group: IntegrityGroup;
  /** Which city the check covers, or null when it covers the whole dataset. */
  cityId: string | null;
  passed: boolean;
  /** What the check compares, in the same words whatever the result. */
  method: string;
  /** Canonical ids of the records that failed. Empty when the check passed. */
  affected: string[];
  /** Parts of the application that read the records this check covers. */
  components: string[];
}

export interface IntegritySummary {
  total: number;
  passed: number;
  failed: number;
  checks: IntegrityCheck[];
  limitations: string[];
  referenceDate: string;
}

export const GROUP_LABELS: Record<IntegrityGroup, string> = {
  referential: "Referential integrity",
  geographic: "Geographic consistency",
  numerical: "Numerical consistency",
  temporal: "Temporal consistency",
  financial: "Financial reconciliation",
  housing_funnel: "Housing funnel",
  livelihood_funnel: "Livelihood funnel",
  provenance: "Provenance",
  reconciliation: "Dashboard to source reconciliation",
  city_filtering: "Cross-city filtering",
};

const CITY_IDS = ["CITY-THANE", "CITY-SURAT", "CITY-AHMEDABAD", "CITY-GUWAHATI"];

const MAX_AFFECTED = 25;

function make(
  id: string,
  label: string,
  group: IntegrityGroup,
  cityId: string | null,
  method: string,
  affected: string[],
  components: string[],
): IntegrityCheck {
  return {
    id,
    label,
    group,
    cityId,
    passed: affected.length === 0,
    method,
    affected: affected.slice(0, MAX_AFFECTED),
    components,
  };
}

/** a must not exceed b, when both are recorded. Nulls are skipped, never zeroed. */
function notExceeding(
  rows: Array<{ id: string; a: number | null; b: number | null }>,
): string[] {
  return rows
    .filter((r) => typeof r.a === "number" && typeof r.b === "number" && r.a > r.b)
    .map((r) => `${r.id} (${r.a} > ${r.b})`);
}

function inRange(rows: Array<{ id: string; v: number | null }>, lo: number, hi: number): string[] {
  return rows
    .filter((r) => typeof r.v === "number" && (r.v < lo || r.v > hi))
    .map((r) => `${r.id} (${r.v})`);
}

const isDate = (v: string | null | undefined) => Boolean(v) && !Number.isNaN(Date.parse(v!));

function cityChecks(cityId: string, b: FourCityBundle): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];
  const cityName = b.city.name;
  const localityIds = new Set(b.localities.map((l) => l.id));
  const allLocalityCity = new Map(localities.map((l) => [l.id, l.city_id]));

  // ---------------------------------------------------------- city filtering
  const foreign: string[] = [];
  const scan = <T extends { city_id: string }>(rows: T[], key: (r: T) => string) => {
    for (const r of rows) if (r.city_id !== cityId) foreign.push(key(r));
  };
  scan(b.projects, (p) => p.project_id);
  scan(b.assets, (a) => a.asset_id);
  scan(b.housing, (h) => h.housing_id);
  scan(b.finance, (f) => f.finance_id);
  scan(b.signals, (s) => s.signal_id);
  checks.push(
    make(
      `${cityId}-filter`,
      `${cityName}: every record carries this city's identifier`,
      "city_filtering",
      cityId,
      "Each record in the city bundle is checked for city_id equal to the selected city.",
      foreign,
      ["All city dashboards", "Compare cities", "Search"],
    ),
  );

  // ------------------------------------------------------------- geographic
  const strayLocality: string[] = [];
  const geoScan = <T extends { locality_id: string | null }>(rows: T[], key: (r: T) => string) => {
    for (const r of rows) {
      if (!r.locality_id) continue;
      if (!localityIds.has(r.locality_id) || allLocalityCity.get(r.locality_id) !== cityId) {
        strayLocality.push(`${key(r)} → ${r.locality_id}`);
      }
    }
  };
  geoScan(b.projects, (p) => p.project_id);
  geoScan(b.assets, (a) => a.asset_id);
  geoScan(b.housing, (h) => h.housing_id);
  geoScan(b.serviceObservations, (o) => o.service_observation_id);
  geoScan(b.grievances, (g) => g.complaint_aggregate_id);
  checks.push(
    make(
      `${cityId}-geo-parent`,
      `${cityName}: every locality reference belongs to this city`,
      "geographic",
      cityId,
      "Each record's locality_id is resolved in the supplied geography and its parent city compared.",
      strayLocality,
      ["Localities", "Locality detail", "Maps", "Convergence"],
    ),
  );

  const strayAreas = b.serviceAreas
    .flatMap((a) =>
      a.locality_ids
        .filter((l) => allLocalityCity.get(l) !== cityId)
        .map((l) => `${a.service_area_id} → ${l}`),
    );
  checks.push(
    make(
      `${cityId}-geo-service-area`,
      `${cityName}: service areas serve localities in this city only`,
      "geographic",
      cityId,
      "Many-to-many service-area to locality links are resolved and their parent city compared.",
      strayAreas,
      ["Asset detail", "Service areas", "Locality detail"],
    ),
  );

  // -------------------------------------------------------------- numerical
  checks.push(
    make(
      `${cityId}-progress-range`,
      `${cityName}: physical and financial progress stay within 0 to 100 per cent`,
      "numerical",
      cityId,
      "Recorded progress percentages are checked against the 0 to 100 range. Missing values are left missing.",
      [
        ...inRange(
          b.projects.map((p) => ({ id: `${p.project_id} physical`, v: p.physical_progress_pct })),
          0,
          100,
        ),
        ...inRange(
          b.projects.map((p) => ({ id: `${p.project_id} financial`, v: p.financial_progress_pct })),
          0,
          100,
        ),
      ],
      ["Investment", "Project detail", "Compare cities"],
    ),
  );

  checks.push(
    make(
      `${cityId}-utilisation-range`,
      `${cityName}: asset utilisation stays within 0 to 100 per cent`,
      "numerical",
      cityId,
      "Recorded asset utilisation is checked against the 0 to 100 range.",
      inRange(
        b.assets.map((a) => ({ id: a.asset_id, v: a.utilisation_pct })),
        0,
        100,
      ),
      ["Infrastructure", "Asset detail", "Decision signals"],
    ),
  );

  checks.push(
    make(
      `${cityId}-waste-chain`,
      `${cityName}: waste collected and processed do not exceed waste generated`,
      "numerical",
      cityId,
      "Within each sanitation record, collected is compared with generated and processed with collected, in tonnes per day.",
      [
        ...notExceeding(
          b.sanitation.map((s) => ({
            id: `${s.sanitation_id} collected`,
            a: s.waste_collected_tpd,
            b: s.waste_generated_tpd,
          })),
        ),
        ...notExceeding(
          b.sanitation.map((s) => ({
            id: `${s.sanitation_id} processed`,
            a: s.waste_processed_tpd,
            b: s.waste_collected_tpd,
          })),
        ),
      ],
      ["City overview", "Compare cities", "Service delivery"],
    ),
  );

  checks.push(
    make(
      `${cityId}-grievance-chain`,
      `${cityName}: applications resolved do not exceed applications received`,
      "numerical",
      cityId,
      "Within each service observation, resolved is compared with received. Received and resolved stay separate figures.",
      notExceeding(
        b.serviceObservations.map((o) => ({
          id: o.service_observation_id,
          a: o.applications_resolved,
          b: o.applications_received,
        })),
      ),
      ["City overview", "Service delivery", "Compare cities"],
    ),
  );

  // --------------------------------------------------------------- temporal
  const badDates: string[] = [];
  for (const p of b.projects) {
    for (const [name, value] of [
      ["start_date", p.start_date],
      ["scheduled_completion_date", p.scheduled_completion_date],
      ["actual_completion_date", p.actual_completion_date],
      ["observation_date", p.observation_date],
    ] as const) {
      if (value && !isDate(value)) badDates.push(`${p.project_id} ${name}=${value}`);
    }
    if (isDate(p.start_date) && isDate(p.scheduled_completion_date)) {
      if (Date.parse(p.start_date!) > Date.parse(p.scheduled_completion_date!)) {
        badDates.push(`${p.project_id} starts after scheduled completion`);
      }
    }
  }
  checks.push(
    make(
      `${cityId}-dates`,
      `${cityName}: project dates are valid and in sequence`,
      "temporal",
      cityId,
      "Each recorded date is parsed, and start is compared with scheduled completion.",
      badDates,
      ["Investment", "Project detail", "Decision signals"],
    ),
  );

  const futureObs = [...b.housing, ...b.assets, ...b.serviceObservations]
    .filter(
      (r) =>
        isDate(r.observation_date) &&
        Date.parse(r.observation_date!) > Date.parse(DATASET_REFERENCE_DATE),
    )
    .map((r) => `${r.observation_date}`);
  checks.push(
    make(
      `${cityId}-obs-window`,
      `${cityName}: no observation is dated after the dataset reference date`,
      "temporal",
      cityId,
      `Observation dates are compared with the supplied reference date ${DATASET_REFERENCE_DATE}.`,
      [...new Set(futureObs)],
      ["All dashboards"],
    ),
  );

  // -------------------------------------------------------------- financial
  checks.push(
    make(
      `${cityId}-expenditure`,
      `${cityName}: expenditure does not exceed funds released`,
      "financial",
      cityId,
      "Within each finance record, expenditure in INR lakh is compared with funds released in INR lakh for the same financial year.",
      notExceeding(
        b.finance.map((f) => ({
          id: `${f.finance_id} (${f.financial_year ?? "year not recorded"})`,
          a: f.expenditure_inr_lakh,
          b: f.fund_released_inr_lakh,
        })),
      ),
      ["Investment", "Municipal finance", "Project detail"],
    ),
  );

  const unspentMismatch = b.finance
    .filter(
      (f) =>
        typeof f.fund_released_inr_lakh === "number" &&
        typeof f.expenditure_inr_lakh === "number" &&
        typeof f.unspent_released_inr_lakh === "number" &&
        Math.abs(
          f.fund_released_inr_lakh - f.expenditure_inr_lakh - f.unspent_released_inr_lakh,
        ) > 0.01,
    )
    .map((f) => f.finance_id);
  checks.push(
    make(
      `${cityId}-unspent`,
      `${cityName}: unspent released funds equal released minus expenditure`,
      "financial",
      cityId,
      "Where all three figures are recorded for the same period, released minus expenditure is compared with the recorded unspent amount, in INR lakh.",
      unspentMismatch,
      ["Investment", "Municipal finance"],
    ),
  );

  const financeStray = b.finance
    .filter((f) => f.project_id && byId.project.get(f.project_id)?.city_id !== cityId)
    .map((f) => `${f.finance_id} → ${f.project_id}`);
  checks.push(
    make(
      `${cityId}-finance-project`,
      `${cityName}: every finance record points at a project in this city`,
      "financial",
      cityId,
      "Each finance record's project_id is resolved and its city compared.",
      financeStray,
      ["Investment", "Project detail"],
    ),
  );

  const capexOpex = b.finance.filter((f) => !f.capex_opex).map((f) => f.finance_id);
  checks.push(
    make(
      `${cityId}-capex-opex`,
      `${cityName}: every finance record states whether it is capital or operating spend`,
      "financial",
      cityId,
      "Each finance record is checked for a recorded capex or opex classification, so the two are never added together unlabelled.",
      capexOpex,
      ["Investment", "Municipal finance"],
    ),
  );

  // ---------------------------------------------------------- housing funnel
  checks.push(
    make(
      `${cityId}-housing-funnel`,
      `${cityName}: housing stages do not exceed the stage before them`,
      "housing_funnel",
      cityId,
      "Within each housing record: grounded against sanctioned, completed against grounded, occupied against completed. Each stage is read from its own field, never inferred from another.",
      [
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} grounded`,
            a: h.grounded_houses,
            b: h.sanctioned_houses,
          })),
        ),
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} completed`,
            a: h.completed_houses,
            b: h.grounded_houses,
          })),
        ),
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} occupied`,
            a: h.occupied_houses,
            b: h.completed_houses,
          })),
        ),
      ],
      ["Housing", "Housing record detail", "City overview", "Compare cities"],
    ),
  );

  checks.push(
    make(
      `${cityId}-housing-readiness`,
      `${cityName}: service-ready houses do not exceed completed houses`,
      "housing_funnel",
      cityId,
      "Water, sewer and waste-collection readiness counts are compared with completed houses in the same record. A recorded connection is not read as reliable supply.",
      [
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} water ready`,
            a: h.water_ready_houses,
            b: h.completed_houses,
          })),
        ),
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} sewer ready`,
            a: h.sewer_ready_houses,
            b: h.completed_houses,
          })),
        ),
        ...notExceeding(
          b.housing.map((h) => ({
            id: `${h.housing_id} waste ready`,
            a: h.waste_collection_ready_houses,
            b: h.completed_houses,
          })),
        ),
      ],
      ["Housing", "City overview", "Compare cities"],
    ),
  );

  // ------------------------------------------------------- livelihood funnel
  checks.push(
    make(
      `${cityId}-livelihood-funnel`,
      `${cityName}: loan sanctions and disbursements stay within applications`,
      "livelihood_funnel",
      cityId,
      "Within each livelihood record: sanctions against applications, disbursements against sanctions. Sanction is never read as disbursement.",
      [
        ...notExceeding(
          b.livelihoods.map((l) => ({
            id: `${l.livelihood_id} sanctions`,
            a: l.loan_sanctions,
            b: l.loan_applications,
          })),
        ),
        ...notExceeding(
          b.livelihoods.map((l) => ({
            id: `${l.livelihood_id} disbursements`,
            a: l.loan_disbursements,
            b: l.loan_sanctions,
          })),
        ),
      ],
      ["Livelihoods & mobility", "Compare cities"],
    ),
  );

  checks.push(
    make(
      `${cityId}-vendor-funnel`,
      `${cityName}: street-vendor stages stay within the stage before them`,
      "livelihood_funnel",
      cityId,
      "Within each vendor aggregate: eligible against surveyed, sanctioned against eligible, disbursed against sanctioned.",
      [
        ...notExceeding(
          b.streetVendors.map((v) => ({
            id: `${v.vendor_aggregate_id} eligible`,
            a: v.eligible_applications,
            b: v.surveyed_vendors,
          })),
        ),
        ...notExceeding(
          b.streetVendors.map((v) => ({
            id: `${v.vendor_aggregate_id} sanctioned`,
            a: v.sanctioned,
            b: v.eligible_applications,
          })),
        ),
        ...notExceeding(
          b.streetVendors.map((v) => ({
            id: `${v.vendor_aggregate_id} disbursed`,
            a: v.disbursed,
            b: v.sanctioned,
          })),
        ),
      ],
      ["Livelihoods & mobility", "Compare cities"],
    ),
  );

  // -------------------------------------------------------------- provenance
  const missingProvenance = [
    ...b.projects.map((p) => ({ id: p.project_id, r: p })),
    ...b.assets.map((a) => ({ id: a.asset_id, r: a })),
    ...b.housing.map((h) => ({ id: h.housing_id, r: h })),
    ...b.finance.map((f) => ({ id: f.finance_id, r: f })),
    ...b.serviceObservations.map((o) => ({ id: o.service_observation_id, r: o })),
  ]
    .filter(({ r }) => !r.record_type || !r.observation_date)
    .map(({ id }) => id);
  checks.push(
    make(
      `${cityId}-provenance`,
      `${cityName}: every operational record carries a classification and observation date`,
      "provenance",
      cityId,
      "Each record is checked for record_type (VERIFIED, DERIVED, SYNTHETIC or ASSUMED) and an observation date.",
      missingProvenance,
      ["All record pages", "Evidence drawer"],
    ),
  );

  const verifiedClaims = [
    ...b.projects.filter((p) => p.record_type === "VERIFIED").map((p) => p.project_id),
    ...b.assets.filter((a) => a.record_type === "VERIFIED").map((a) => a.asset_id),
    ...b.housing.filter((h) => h.record_type === "VERIFIED").map((h) => h.housing_id),
    ...b.finance.filter((f) => f.record_type === "VERIFIED").map((f) => f.finance_id),
  ];
  checks.push(
    make(
      `${cityId}-no-verified-claim`,
      `${cityName}: no prototype operational value is labelled as government-verified`,
      "provenance",
      cityId,
      "Operational records in this prototype city are checked for a VERIFIED classification, which would attribute a synthetic value to a government source.",
      verifiedClaims,
      ["All dashboards", "Evidence drawer"],
    ),
  );

  // --------------------------------------------------- dashboard to source
  const contracts = indicatorContracts(cityId);
  const recomputeMismatch: string[] = [];
  const sum = (rows: Array<number | null | undefined>) =>
    rows.reduce<number>((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const expect = (indicatorId: string, numerator: number, denominator: number | null) => {
    const c = contracts.find((x) => x.indicator_id === indicatorId);
    if (!c) {
      recomputeMismatch.push(`${indicatorId} not published`);
      return;
    }
    // Published values are rounded for display; compare within that rounding.
    const near = (a: number, b: number) => Math.abs(a - b) <= 0.051;
    if (!near(c.numerator ?? 0, numerator)) {
      recomputeMismatch.push(`${indicatorId} numerator ${c.numerator} ≠ ${numerator}`);
    }
    if (denominator !== null && !near(c.denominator ?? 0, denominator)) {
      recomputeMismatch.push(`${indicatorId} denominator ${c.denominator} ≠ ${denominator}`);
    }
  };
  expect(
    "IND-HOUSING-COMPLETION",
    sum(b.housing.map((h) => h.completed_houses)),
    sum(b.housing.map((h) => h.sanctioned_houses)),
  );
  expect(
    "IND-WASTE-COLLECTION",
    sum(b.sanitation.map((s) => s.waste_collected_tpd)),
    sum(b.sanitation.map((s) => s.waste_generated_tpd)),
  );
  expect(
    "IND-GRIEVANCE-RESOLUTION",
    sum(b.serviceObservations.map((o) => o.applications_resolved)),
    sum(b.serviceObservations.map((o) => o.applications_received)),
  );
  // Municipal investment publishes funds released, kept separate from expenditure.
  expect("IND-MUNICIPAL-INVESTMENT", sum(b.finance.map((f) => f.fund_released_inr_lakh)), null);
  expect(
    "IND-FINANCIAL-PROGRESS",
    sum(b.finance.map((f) => f.expenditure_inr_lakh)),
    sum(b.finance.map((f) => f.fund_released_inr_lakh)),
  );
  checks.push(
    make(
      `${cityId}-reconcile`,
      `${cityName}: published indicators match a fresh sum of their source records`,
      "reconciliation",
      cityId,
      "Housing completion, waste collection, grievance resolution and municipal investment are re-summed here from the supplied records and compared with the values the dashboards publish.",
      recomputeMismatch,
      ["City overview", "Compare cities", "Housing", "Investment"],
    ),
  );

  const noDenominator = contracts
    .filter((c) => c.unit === "%" && !c.denominator)
    .map((c) => c.indicator_id);
  checks.push(
    make(
      `${cityId}-denominators`,
      `${cityName}: every percentage has a denominator greater than zero`,
      "numerical",
      cityId,
      "Each published percentage indicator is checked for a non-zero denominator. Where there is none, the value is shown as not available rather than as zero.",
      noDenominator,
      ["City overview", "Compare cities"],
    ),
  );

  const noSources = contracts.filter((c) => c.source_record_ids.length === 0).map((c) => c.indicator_id);
  checks.push(
    make(
      `${cityId}-indicator-sources`,
      `${cityName}: every published indicator names the records behind it`,
      "provenance",
      cityId,
      "Each indicator contract is checked for at least one canonical source record id.",
      noSources,
      ["Data integrity", "Compare cities"],
    ),
  );

  return checks;
}

function datasetChecks(): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];

  for (const v of runValidation()) {
    checks.push(
      make(
        `base-${v.id}`,
        v.label,
        v.group === "identifiers" || v.group === "references" ? "referential" : "provenance",
        null,
        v.detail,
        v.failures,
        ["Data layer", "Record pages"],
      ),
    );
  }

  const signalEvidence = decisionSignals
    .filter((s) => (s.supporting_records ?? []).length === 0)
    .map((s) => s.signal_id);
  checks.push(
    make(
      "signals-evidence",
      "Every decision signal names at least one supporting record",
      "referential",
      null,
      "Each supplied decision signal is checked for supporting records.",
      signalEvidence,
      ["Decision signals", "Executive briefing"],
    ),
  );

  const unresolvedEvidence: string[] = [];
  for (const s of decisionSignals) {
    for (const r of s.supporting_records ?? []) {
      if (!lookupEntity(r.id)) unresolvedEvidence.push(`${s.signal_id} → ${r.id}`);
    }
  }
  checks.push(
    make(
      "signals-evidence-resolves",
      "Every supporting record referenced by a signal exists in the dataset",
      "referential",
      null,
      "Each supporting record id on a decision signal is resolved against the supplied records.",
      unresolvedEvidence,
      ["Decision signals", "Executive briefing"],
    ),
  );

  const orphanInterventions = planningInterventions
    .filter((i) => !decisionSignals.some((s) => s.signal_id === i.signal_id))
    .map((i) => `${i.intervention_id} → ${i.signal_id}`);
  checks.push(
    make(
      "interventions-signal",
      "Every planning intervention points at an existing decision signal",
      "referential",
      null,
      "Each intervention's signal_id is resolved against the supplied decision signals.",
      orphanInterventions,
      ["Planning interventions", "Executive briefing"],
    ),
  );

  const localityParents = localities
    .filter((l) => !byId.city.has(l.city_id))
    .map((l) => `${l.id} → ${l.city_id}`);
  checks.push(
    make(
      "locality-parent",
      "Every locality resolves to a city in the registry",
      "geographic",
      null,
      "Each locality's city_id is resolved against the supplied city registry.",
      localityParents,
      ["Localities", "National view", "Maps"],
    ),
  );

  const boundaryClaims = localities
    .filter((l) => l.is_official_boundary)
    .map((l) => l.id);
  checks.push(
    make(
      "no-official-boundary",
      "No prototype locality is presented as an official ward boundary",
      "geographic",
      null,
      "Each supplied locality is checked for an official-boundary claim. Prototype localities are illustrative points, not statutory geography.",
      boundaryClaims,
      ["Maps", "Locality detail"],
    ),
  );

  return checks;
}

let cached: IntegritySummary | null = null;

export function runIntegrity(): IntegritySummary {
  if (cached) return cached;
  const checks: IntegrityCheck[] = [...datasetChecks()];
  for (const cityId of CITY_IDS) {
    const bundle = fourCityBundle(cityId);
    if (!bundle) continue;
    checks.push(...cityChecks(cityId, bundle));
  }

  const limitations = [
    "The four prototype cities are synthetic. No figure here is a government statistic, and no sampled figure is scaled to a citywide total.",
    "Locality records are illustrative points. They carry no ward identity and imply no official boundary.",
    "Recorded service connections are not evidence of reliable supply, and commissioning is not evidence of operational service.",
    "Financial figures are held in INR lakh as supplied, and are only combined within the same financial year.",
    "Jalandhar is held separately as government-sourced records and is not part of these prototype checks.",
    "Where a value is missing it stays missing: it is shown as not available and is never read as zero.",
  ];

  const passed = checks.filter((c) => c.passed).length;
  cached = {
    total: checks.length,
    passed,
    failed: checks.length - passed,
    checks,
    limitations,
    referenceDate: DATASET_REFERENCE_DATE,
  };
  return cached;
}

export function integrityForCity(cityId: string): IntegrityCheck[] {
  return runIntegrity().checks.filter((c) => c.cityId === cityId || c.cityId === null);
}
