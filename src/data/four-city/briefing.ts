/**
 * Planning interventions and the executive briefing.
 *
 * Interventions are the supplied synthetic planning records. Nothing here is an
 * approved project, an approved budget, an engineering assessment or a
 * government decision: costs are illustrative placeholders and are always
 * labelled with the cost basis stated in the record.
 */
import { fourCityBundle, lookupEntity, provenanceOf } from "./dataset";
import { signalIntelligence, type ResolvedEvidence, type SignalView } from "./signals";
import type {
  BriefingScenario,
  Locality,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  PlanningIntervention,
} from "./types";

export interface InterventionView {
  intervention: PlanningIntervention;
  signal: SignalView | null;
  localities: Locality[];
  /** Geography ids named in the record with no locality record loaded. */
  unresolvedGeography: string[];
  projects: MissionProject[];
  assets: MunicipalAsset[];
  missions: string[];
  finance: MunicipalFinance[];
  releasedInrLakh: number | null;
  expenditureInrLakh: number | null;
  evidence: ResolvedEvidence[];
  unresolvedEvidence: ResolvedEvidence[];
  /** What the record says is not known, plus evidence named but not loaded. */
  missingEvidence: string[];
  decisionRequired: string | null;
}

export interface BriefingView {
  cityId: string;
  cityName: string;
  scenario: BriefingScenario | null;
  scenarioSignals: SignalView[];
  signals: SignalView[];
  interventions: InterventionView[];
  missions: string[];
  agencies: Array<{ name: string; asLead: number; asSupporting: number }>;
  totals: {
    signals: number;
    interventions: number;
    localities: number;
    indicativeCostInrLakh: number | null;
    populationInScope: number | null;
    releasedInrLakh: number | null;
    expenditureInrLakh: number | null;
  };
  decisions: Array<{ interventionId: string; problem: string; decision: string }>;
  followUp: string[];
}

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

function resolveEvidence(ids: string[]): ResolvedEvidence[] {
  return ids.map((id) => {
    const hit = lookupEntity(id);
    return {
      id,
      declaredEntity: hit?.kind ?? "unknown",
      kind: hit?.kind ?? null,
      resolved: Boolean(hit),
      summary: hit
        ? String(
            (hit.record as Record<string, unknown>)["asset_name"] ??
              (hit.record as Record<string, unknown>)["project_name"] ??
              (hit.record as Record<string, unknown>)["name"] ??
              hit.kind,
          )
        : "No record with this identifier is loaded",
    };
  });
}

function buildIntervention(cityId: string, rec: PlanningIntervention): InterventionView {
  const bundle = fourCityBundle(cityId);
  const signal = signalIntelligence(cityId)?.signals.find(
    (s) => s.signal.signal_id === rec.signal_id,
  ) ?? null;

  const geography = strArr(rec.target_geography);
  const localities = (bundle?.localities ?? []).filter((l) => geography.includes(l.id));
  const unresolvedGeography = geography.filter((g) => !localities.some((l) => l.id === g));

  const projects = (bundle?.projects ?? []).filter((p) =>
    strArr(rec.linked_projects).includes(p.project_id),
  );
  const assets = (bundle?.assets ?? []).filter((a) => strArr(rec.linked_assets).includes(a.asset_id));
  const missions = [...new Set(projects.map((p) => p.mission).filter(Boolean))];

  const finance = (bundle?.finance ?? []).filter((f) =>
    strArr(rec.linked_projects).includes(f.project_id ?? ""),
  );
  const released = finance.length
    ? Math.round(finance.reduce((a, f) => a + (f.fund_released_inr_lakh ?? 0), 0) * 100) / 100
    : null;
  const spent = finance.length
    ? Math.round(finance.reduce((a, f) => a + (f.expenditure_inr_lakh ?? 0), 0) * 100) / 100
    : null;

  const evidence = resolveEvidence(strArr(rec.supporting_evidence));
  const unresolvedEvidence = evidence.filter((e) => !e.resolved);

  const missingEvidence = [
    ...strArr(rec["assumptions"]).map((a) => `Stated assumption: ${a}`),
    ...unresolvedEvidence.map((e) => `Named as evidence but not loaded: ${e.id}`),
    ...unresolvedGeography.map((g) => `Target geography named but not loaded: ${g}`),
    ...strArr(signal?.signal.data_gaps as unknown).map((g) => `Signal data gap: ${g}`),
  ];

  return {
    intervention: rec,
    signal,
    localities,
    unresolvedGeography,
    projects,
    assets,
    missions,
    finance,
    releasedInrLakh: released,
    expenditureInrLakh: spent,
    evidence,
    unresolvedEvidence,
    missingEvidence,
    decisionRequired:
      typeof rec["decision_required_from_js"] === "string"
        ? (rec["decision_required_from_js"] as string)
        : null,
  };
}

const cache = new Map<string, BriefingView | null>();

export function briefingFor(cityId: string): BriefingView | null {
  if (cache.has(cityId)) return cache.get(cityId) ?? null;
  const bundle = fourCityBundle(cityId);
  if (!bundle || bundle.interventions.length === 0) {
    cache.set(cityId, null);
    return null;
  }
  const intel = signalIntelligence(cityId);
  const interventions = bundle.interventions.map((i) => buildIntervention(cityId, i));
  const scenario = bundle.briefing;
  const scenarioSignalIds = scenario ? strArr(scenario.signal_ids) : [];
  const signals = intel?.signals ?? [];

  const agencyMap = new Map<string, { name: string; asLead: number; asSupporting: number }>();
  for (const v of interventions) {
    const lead = v.intervention.lead_agency;
    if (lead) {
      const row = agencyMap.get(lead) ?? { name: lead, asLead: 0, asSupporting: 0 };
      row.asLead += 1;
      agencyMap.set(lead, row);
    }
    for (const s of strArr(v.intervention.supporting_agencies)) {
      const row = agencyMap.get(s) ?? { name: s, asLead: 0, asSupporting: 0 };
      row.asSupporting += 1;
      agencyMap.set(s, row);
    }
  }

  const costs = interventions
    .map((v) => num(v.intervention.indicative_cost_inr_lakh))
    .filter((v): v is number => v !== null);
  const population = interventions
    .map((v) => num(v.intervention.target_population))
    .filter((v): v is number => v !== null);
  const released = interventions
    .map((v) => v.releasedInrLakh)
    .filter((v): v is number => v !== null);
  const spent = interventions
    .map((v) => v.expenditureInrLakh)
    .filter((v): v is number => v !== null);

  const followUp = [
    ...new Set(
      interventions.flatMap((v) => [
        ...strArr(v.intervention.dependencies),
        ...strArr(v.intervention["monitoring_indicators"]).map((m) => `Track: ${m}`),
      ]),
    ),
  ];

  const view: BriefingView = {
    cityId,
    cityName: bundle.city.name,
    scenario,
    scenarioSignals: signals.filter((s) => scenarioSignalIds.includes(s.signal.signal_id)),
    signals,
    interventions,
    missions: [...new Set(interventions.flatMap((v) => v.missions))].sort(),
    agencies: [...agencyMap.values()].sort((a, b) => b.asLead + b.asSupporting - (a.asLead + a.asSupporting)),
    totals: {
      signals: signals.length,
      interventions: interventions.length,
      localities: new Set(interventions.flatMap((v) => v.localities.map((l) => l.id))).size,
      indicativeCostInrLakh: costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100 : null,
      populationInScope: population.length ? population.reduce((a, b) => a + b, 0) : null,
      releasedInrLakh: released.length ? Math.round(released.reduce((a, b) => a + b, 0) * 100) / 100 : null,
      expenditureInrLakh: spent.length ? Math.round(spent.reduce((a, b) => a + b, 0) * 100) / 100 : null,
    },
    decisions: interventions
      .filter((v) => v.decisionRequired)
      .map((v) => ({
        interventionId: v.intervention.intervention_id,
        problem: v.intervention.problem_statement,
        decision: v.decisionRequired!,
      })),
    followUp,
  };
  cache.set(cityId, view);
  return view;
}

export function interventionView(cityId: string, interventionId: string): InterventionView | null {
  return (
    briefingFor(cityId)?.interventions.find(
      (v) => v.intervention.intervention_id === interventionId,
    ) ?? null
  );
}

/** Interventions that name this signal, locality, project or asset. */
export function interventionsForEntity(cityId: string, id: string): InterventionView[] {
  const view = briefingFor(cityId);
  if (!view) return [];
  return view.interventions.filter(
    (v) =>
      v.intervention.intervention_id === id ||
      v.intervention.signal_id === id ||
      strArr(v.intervention.target_geography).includes(id) ||
      strArr(v.intervention.linked_projects).includes(id) ||
      strArr(v.intervention.linked_assets).includes(id) ||
      strArr(v.intervention.supporting_evidence).includes(id),
  );
}

export function interventionProvenance(rec: PlanningIntervention) {
  return provenanceOf(rec as unknown as Record<string, unknown>);
}
