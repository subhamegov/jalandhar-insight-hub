// Runtime validation of the four-city data layer.
//
// These checks run against the data as loaded by the application, independently
// of the supplied validation report, so the application can show whether what
// it is using actually holds together.

import {
  byId,
  cityRegistry,
  declaredRelationships,
  decisionSignals,
  edges,
  grievances,
  housingRecords,
  localities,
  missionProjects,
  municipalAssets,
  municipalFinance,
  planningInterventions,
  propertyAggregates,
  sanitationRecords,
  serviceAreas,
  serviceObservations,
  waterSewerage,
  type Edge,
} from "./dataset";
import type { EntityKind } from "./types";

export interface ValidationCheck {
  id: string;
  label: string;
  group: "identifiers" | "references" | "units" | "periods" | "completeness";
  passed: boolean;
  detail: string;
  failures: string[];
}

function uniqueIds(rows: Array<Record<string, unknown>>, key: string): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const row of rows) {
    const id = row[key] as string;
    if (seen.has(id)) dupes.push(id);
    else seen.add(id);
  }
  return dupes;
}

function missingRefs(
  rows: Array<Record<string, unknown>>,
  idKey: string,
  refKey: string,
  index: Map<string, unknown>,
  many = false,
): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const refs = many ? ((row[refKey] as string[]) ?? []) : [row[refKey] as string | null];
    for (const ref of refs) {
      if (!ref) continue;
      if (!index.has(ref)) out.push(`${String(row[idKey])} → ${ref}`);
    }
  }
  return out;
}

function check(
  id: string,
  label: string,
  group: ValidationCheck["group"],
  failures: string[],
  detail: string,
): ValidationCheck {
  return { id, label, group, passed: failures.length === 0, detail, failures: failures.slice(0, 20) };
}

export function runValidation(): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // 1. Unique canonical identifiers, per entity kind.
  const idKeys: Array<[EntityKind, Array<Record<string, unknown>>, string]> = [
    ["city", cityRegistry as unknown as Array<Record<string, unknown>>, "city_id"],
    ["locality", localities as unknown as Array<Record<string, unknown>>, "id"],
    ["project", missionProjects as unknown as Array<Record<string, unknown>>, "project_id"],
    ["asset", municipalAssets as unknown as Array<Record<string, unknown>>, "asset_id"],
    ["service_area", serviceAreas as unknown as Array<Record<string, unknown>>, "service_area_id"],
    ["property_aggregate", propertyAggregates as unknown as Array<Record<string, unknown>>, "property_aggregate_id"],
    ["housing", housingRecords as unknown as Array<Record<string, unknown>>, "housing_id"],
    ["finance", municipalFinance as unknown as Array<Record<string, unknown>>, "finance_id"],
    ["grievance", grievances as unknown as Array<Record<string, unknown>>, "complaint_aggregate_id"],
    ["decision_signal", decisionSignals as unknown as Array<Record<string, unknown>>, "signal_id"],
  ];
  const duplicates = idKeys.flatMap(([kind, rows, key]) =>
    uniqueIds(rows, key).map((d) => `${kind}: ${d}`),
  );
  checks.push(
    check(
      "unique_ids",
      "Canonical identifiers are unique",
      "identifiers",
      duplicates,
      `${idKeys.reduce((n, [, rows]) => n + rows.length, 0)} identifiers checked across 10 entity kinds`,
    ),
  );

  // 2. Foreign keys resolve.
  const fkFailures = [
    ...missingRefs(missionProjects as never, "project_id", "locality_id", byId.locality),
    ...missingRefs(missionProjects as never, "project_id", "asset_ids", byId.asset, true),
    ...missingRefs(missionProjects as never, "project_id", "housing_ids", byId.housing, true),
    ...missingRefs(missionProjects as never, "project_id", "financial_record_ids", byId.finance, true),
    ...missingRefs(municipalAssets as never, "asset_id", "service_area_ids", byId.service_area, true),
    ...missingRefs(serviceAreas as never, "service_area_id", "locality_ids", byId.locality, true),
    ...missingRefs(waterSewerage as never, "connection_record_id", "property_aggregate_id", byId.property_aggregate),
    ...missingRefs(housingRecords as never, "housing_id", "project_id", byId.project),
    ...missingRefs(municipalFinance as never, "finance_id", "project_id", byId.project),
    ...missingRefs(sanitationRecords as never, "sanitation_id", "linked_asset_ids", byId.asset, true),
    ...missingRefs(serviceObservations as never, "service_observation_id", "linked_asset_ids", byId.asset, true),
    ...missingRefs(grievances as never, "complaint_aggregate_id", "linked_asset_ids", byId.asset, true),
    ...missingRefs(planningInterventions as never, "intervention_id", "signal_id", byId.decision_signal),
    ...missingRefs(declaredRelationships as never, "relationship_id", "from_id", byId.project),
    ...missingRefs(declaredRelationships as never, "relationship_id", "to_id", byId.asset),
  ];
  checks.push(
    check("foreign_keys", "Every reference resolves to a loaded record", "references", fkFailures, `${edges.length} relationships built`),
  );

  // 3. Decision signals resolve to supporting records.
  const signalFailures: string[] = [];
  for (const s of decisionSignals) {
    if (s.supporting_records.length === 0) signalFailures.push(`${s.signal_id}: no supporting records`);
    for (const r of s.supporting_records) {
      const found = Object.values(byId).some((index) => index.has(r.id));
      if (!found) signalFailures.push(`${s.signal_id} → ${r.id}`);
    }
  }
  checks.push(
    check("signal_evidence", "Decision signals link to supporting records", "references", signalFailures, `${decisionSignals.length} signals checked`),
  );

  // 4. No relationship crosses a city boundary.
  const crossCity: string[] = [];
  const cityOf = (id: string): string | null => {
    for (const index of Object.values(byId)) {
      const row = index.get(id) as { city_id?: string } | undefined;
      if (row) return row.city_id ?? null;
    }
    return null;
  };
  const cityCache = new Map<string, string | null>();
  const cachedCityOf = (id: string) => {
    if (!cityCache.has(id)) cityCache.set(id, cityOf(id));
    return cityCache.get(id) ?? null;
  };
  for (const edge of edges as Edge[]) {
    if (edge.from_kind === "mission" || edge.to_kind === "mission") continue;
    const a = cachedCityOf(edge.from_id);
    const b = cachedCityOf(edge.to_id);
    if (a && b && a !== b) crossCity.push(`${edge.from_id} → ${edge.to_id}`);
  }
  checks.push(
    check("city_boundary", "Relationships stay within one city", "references", crossCity, "Mission links are intentionally city-independent"),
  );

  // 5. Financial units.
  const unitFailures: string[] = [];
  for (const p of missionProjects) {
    if ((p.estimated_cost_inr_lakh ?? 0) < 0) unitFailures.push(`${p.project_id}: negative estimated cost`);
    if (p.awarded_cost_inr_lakh !== null && p.estimated_cost_inr_lakh !== null && p.awarded_cost_inr_lakh > p.estimated_cost_inr_lakh * 3)
      unitFailures.push(`${p.project_id}: awarded cost implausible against estimate`);
  }
  for (const f of municipalFinance) {
    if ((f.expenditure_inr_lakh ?? 0) < 0 || (f.fund_released_inr_lakh ?? 0) < 0)
      unitFailures.push(`${f.finance_id}: negative amount`);
    if (
      f.expenditure_inr_lakh !== null &&
      f.fund_released_inr_lakh !== null &&
      f.expenditure_inr_lakh > f.fund_released_inr_lakh
    )
      unitFailures.push(`${f.finance_id}: expenditure above funds released`);
  }
  checks.push(
    check("financial_units", "Financial values are in INR lakh and internally consistent", "units", unitFailures, `${missionProjects.length + municipalFinance.length} financial records checked`),
  );

  // 6. Reporting periods present.
  const periodFailures: string[] = [];
  for (const f of municipalFinance) if (!f.financial_year) periodFailures.push(`${f.finance_id}: no financial year`);
  for (const o of serviceObservations) if (!o.period) periodFailures.push(`${o.service_observation_id}: no period`);
  for (const g of grievances) if (!g.period) periodFailures.push(`${g.complaint_aggregate_id}: no period`);
  checks.push(
    check("reporting_periods", "Reporting periods are present", "periods", periodFailures, "Finance, service and grievance records"),
  );

  // 7. Projects and assets are related.
  const unlinkedProjects = missionProjects
    .filter((p) => p.asset_ids.length === 0 && !declaredRelationships.some((r) => r.from_id === p.project_id))
    .map((p) => `${p.project_id}: no asset relationship`);
  checks.push(
    check("project_asset", "Projects resolve to at least one asset", "references", unlinkedProjects, `${missionProjects.length} projects checked`),
  );

  // 8. Missing values are explicit nulls, never blanks or placeholders.
  const blankFailures: string[] = [];
  const scanRows: Array<Record<string, unknown>> = [
    ...(missionProjects as unknown as Array<Record<string, unknown>>),
    ...(municipalAssets as unknown as Array<Record<string, unknown>>),
    ...(propertyAggregates as unknown as Array<Record<string, unknown>>),
  ];
  for (const row of scanRows) {
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string" && (value.trim() === "" || value === "NA" || value === "N/A" || value === "null")) {
        blankFailures.push(`${String(row["project_id"] ?? row["asset_id"] ?? row["property_aggregate_id"])}: ${key}`);
      }
    }
  }
  checks.push(
    check("missing_values", "Missing values are explicit nulls, not placeholders", "completeness", blankFailures, `${scanRows.length} records scanned`),
  );

  return checks;
}

export function validationSummary() {
  const checks = runValidation();
  return {
    checks,
    passed: checks.filter((c) => c.passed).length,
    total: checks.length,
    allPassed: checks.every((c) => c.passed),
  };
}
