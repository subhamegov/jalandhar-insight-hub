/**
 * Decision signals.
 *
 * The 40 supplied signals are used exactly as given. Nothing here invents a
 * signal, a confidence percentage or an urgency score. Every pattern noted
 * against a signal is read from the records the signal itself names, and each
 * pattern carries the record values that produced it, so the observation stays
 * separate from the interpretation.
 *
 * Joins use canonical identifiers only.
 */
import { fourCityBundle, lookupEntity } from "./dataset";
import type {
  DecisionSignal,
  EntityKind,
  GrievanceAggregate,
  HousingRecord,
  Locality,
  MissionProject,
  MunicipalAsset,
  PlanningIntervention,
  SanitationRecord,
  ServiceObservation,
} from "./types";

export interface ResolvedEvidence {
  id: string;
  declaredEntity: string;
  kind: EntityKind | null;
  resolved: boolean;
  summary: string;
}

export interface SignalPattern {
  key: string;
  label: string;
  /** The record values that produced this pattern. Nothing else. */
  basis: string[];
}

export interface CoordinationContext {
  level: string;
  detail: string;
  /** Which field in the supplied record states this. */
  basis: string;
}

export interface SignalView {
  signal: DecisionSignal;
  locality: Locality | null;
  localities: Locality[];
  projects: MissionProject[];
  assets: MunicipalAsset[];
  housing: HousingRecord[];
  sanitation: SanitationRecord[];
  observations: ServiceObservation[];
  grievances: GrievanceAggregate[];
  interventions: PlanningIntervention[];
  evidence: ResolvedEvidence[];
  /** Named in the signal but with no matching record in the dataset. */
  unresolvedEvidence: ResolvedEvidence[];
  /** Ids named in related_projects / related_assets with no record. */
  missingLinks: string[];
  patterns: SignalPattern[];
  coordination: CoordinationContext[];
}

export interface SignalIntelligence {
  cityId: string;
  signals: SignalView[];
  patternCounts: Array<{ key: string; label: string; signals: number }>;
  totals: {
    signals: number;
    withIntervention: number;
    withUnresolvedEvidence: number;
    withDataGaps: number;
    localitiesCovered: number;
  };
}

const summarise = (kind: EntityKind, r: Record<string, unknown>): string => {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return null;
  };
  const name = pick("asset_name", "project_name", "name", "service_type", "problem_statement");
  return name ? `${kind.replace(/_/g, " ")} · ${name}` : kind.replace(/_/g, " ");
};

function evidenceOf(signal: DecisionSignal): ResolvedEvidence[] {
  return signal.supporting_records.map((sr) => {
    const hit = lookupEntity(sr.id);
    return {
      id: sr.id,
      declaredEntity: sr.entity,
      kind: hit?.kind ?? null,
      resolved: Boolean(hit),
      summary: hit ? summarise(hit.kind, hit.record) : "No record with this identifier is loaded",
    };
  });
}

const notOperational = (a: MunicipalAsset) =>
  /not_operational|under_construction|maintenance_required|decommission/i.test(
    a.commissioning_status ?? "",
  );

function patternsFor(
  signal: DecisionSignal,
  ctx: {
    projects: MissionProject[];
    assets: MunicipalAsset[];
    housing: HousingRecord[];
    sanitation: SanitationRecord[];
    observations: ServiceObservation[];
    grievances: GrievanceAggregate[];
    interventions: PlanningIntervention[];
  },
): SignalPattern[] {
  const out: SignalPattern[] = [];
  const add = (key: string, label: string, basis: string[]) => {
    if (basis.length) out.push({ key, label, basis });
  };

  add(
    "housing_service_gap",
    "Completed housing with incomplete recorded services",
    ctx.housing
      .filter(
        (h) =>
          (h.completed_houses ?? 0) > 0 &&
          [h.water_ready_houses, h.sewer_ready_houses, h.waste_collection_ready_houses].some(
            (v) => v !== null && v !== undefined && v < (h.completed_houses ?? 0),
          ),
      )
      .map(
        (h) =>
          `${h.housing_id}: ${h.completed_houses} completed. Water ${h.water_ready_houses ?? "not recorded"}, sewer ${h.sewer_ready_houses ?? "not recorded"}, waste ${h.waste_collection_ready_houses ?? "not recorded"}`,
      ),
  );

  const completedProjects = ctx.projects.filter((p) => /completed/i.test(p.project_status ?? ""));
  add(
    "completed_project_non_operational_asset",
    "Completed project with an asset not recorded as operational",
    completedProjects.flatMap((p) =>
      ctx.assets
        .filter((a) => notOperational(a) && (a.project_ids ?? []).includes(p.project_id))
        .map((a) => `${p.project_id} completed. ${a.asset_id} is ${a.commissioning_status}`),
    ),
  );

  add(
    "expenditure_ahead_of_progress",
    "Financial progress ahead of physical progress",
    ctx.projects
      .filter(
        (p) =>
          p.financial_progress_pct !== null &&
          p.physical_progress_pct !== null &&
          p.financial_progress_pct - p.physical_progress_pct >= 20,
      )
      .map(
        (p) =>
          `${p.project_id}: financial ${p.financial_progress_pct}%, physical ${p.physical_progress_pct}%`,
      ),
  );

  add(
    "repeat_complaints",
    "Repeat complaints recorded against linked infrastructure",
    ctx.grievances
      .filter((g) => (g.repeat_complaints ?? 0) > 0)
      .map(
        (g) =>
          `${g.complaint_aggregate_id} (${g.service_type}, ${g.period}): ${g.complaint_count} complaints, ${g.repeat_complaints} repeat`,
      ),
  );

  add(
    "underutilised_asset",
    "Asset recorded below half its stated utilisation",
    ctx.assets
      .filter((a) => a.utilisation_pct !== null && a.utilisation_pct < 50)
      .map((a) => `${a.asset_id}: utilisation ${a.utilisation_pct}%`),
  );

  add(
    "sanitation_gap",
    "Sanitation coverage or processing gap in the same area",
    ctx.sanitation
      .filter(
        (s) =>
          (s.door_to_door_coverage_pct ?? 100) < 90 ||
          (s.waste_processed_tpd ?? 0) < (s.waste_collected_tpd ?? 0),
      )
      .map(
        (s) =>
          `${s.sanitation_id}: door-to-door ${s.door_to_door_coverage_pct ?? "not recorded"}%, collected ${s.waste_collected_tpd ?? "not recorded"} tpd, processed ${s.waste_processed_tpd ?? "not recorded"} tpd`,
      ),
  );

  const observedAssets = new Set(ctx.observations.flatMap((o) => o.linked_asset_ids ?? []));
  add(
    "completion_without_service_record",
    "Infrastructure in place with no service observation recorded against it",
    ctx.assets
      .filter((a) => !notOperational(a) && !observedAssets.has(a.asset_id))
      .map((a) => `${a.asset_id} (${a.commissioning_status}) has no service observation in the sample`),
  );

  const agencies = new Set<string>([
    ...(signal["responsible_agencies"] as string[] | undefined ?? []),
    ...ctx.interventions.flatMap((i) => [i.lead_agency ?? "", ...i.supporting_agencies]),
  ]);
  agencies.delete("");
  const deps = ctx.interventions.flatMap((i) => i.dependencies ?? []);
  const coordination = (signal["coordination_required"] as string[] | undefined) ?? [];
  add(
    "agency_dependencies",
    "Dependency between more than one agency or function",
    [
      agencies.size > 1 ? `Agencies named: ${[...agencies].join(", ")}` : "",
      coordination.length > 1 ? `Coordination stated: ${coordination.join(", ")}` : "",
      ...deps.map((d) => `Intervention dependency: ${d}`),
    ].filter(Boolean),
  );

  return out;
}

function coordinationFor(
  signal: DecisionSignal,
  interventions: PlanningIntervention[],
): CoordinationContext[] {
  const out: CoordinationContext[] = [];
  const agencies = (signal["responsible_agencies"] as string[] | undefined) ?? [];
  const coordination = (signal["coordination_required"] as string[] | undefined) ?? [];
  const missions = signal.related_missions ?? [];

  const municipal = agencies.filter((a) => /municipal|corporation|nagar|council/i.test(a));
  if (municipal.length)
    out.push({
      level: "City operations",
      detail: municipal.join(", "),
      basis: "responsible_agencies in the signal record",
    });

  const state = agencies.filter((a) => /state|directorate/i.test(a));
  if (state.length)
    out.push({
      level: "State coordination",
      detail: state.join(", "),
      basis: "responsible_agencies in the signal record",
    });

  if (missions.length)
    out.push({
      level: "Mission",
      detail: `${missions.length} mission${missions.length > 1 ? "s" : ""} named: ${missions.join(", ")}`,
      basis: "related_missions in the signal record",
    });

  if (missions.length > 1 && state.length)
    out.push({
      level: "Ministry — to consider only",
      detail:
        "More than one mission and a state-level body are named against the same condition. Whether this needs ministry action is a judgement, not something the record states.",
      basis: "related_missions and responsible_agencies read together",
    });

  for (const c of coordination)
    out.push({
      level: "Function to involve",
      detail: c,
      basis: "coordination_required in the signal record",
    });

  for (const i of interventions)
    if (i.lead_agency)
      out.push({
        level: "Intervention lead",
        detail: `${i.intervention_id}: ${i.lead_agency}`,
        basis: "lead_agency in the planning intervention record",
      });

  return out;
}

const cache = new Map<string, SignalIntelligence | null>();

export function signalIntelligence(cityId: string): SignalIntelligence | null {
  if (cache.has(cityId)) return cache.get(cityId) ?? null;
  const bundle = fourCityBundle(cityId);
  if (!bundle || bundle.signals.length === 0) {
    cache.set(cityId, null);
    return null;
  }

  const views: SignalView[] = bundle.signals.map((signal) => {
    const projectIds = new Set(signal.related_projects ?? []);
    const assetIds = new Set(signal.related_assets ?? []);
    const geographyIds = new Set([
      ...(signal.geography_ids ?? []),
      ...(signal.locality_id ? [signal.locality_id] : []),
    ]);
    const evidenceIds = new Set(signal.supporting_records.map((s) => s.id));

    const projects = bundle.projects.filter((p) => projectIds.has(p.project_id));
    const assets = bundle.assets.filter(
      (a) => assetIds.has(a.asset_id) || evidenceIds.has(a.asset_id),
    );
    const assetIdSet = new Set(assets.map((a) => a.asset_id));

    const housing = bundle.housing.filter(
      (h) =>
        evidenceIds.has(h.housing_id) ||
        (h.locality_id !== null && geographyIds.has(h.locality_id)) ||
        (h.project_id !== null && projectIds.has(h.project_id)),
    );
    const sanitation = bundle.sanitation.filter(
      (s) =>
        evidenceIds.has(s.sanitation_id) ||
        (s.locality_id !== null && geographyIds.has(s.locality_id)),
    );
    const linked = <T extends { linked_asset_ids?: string[] | null }>(rows: T[]) =>
      rows.filter((r) => (r.linked_asset_ids ?? []).some((id) => assetIdSet.has(id)));
    const observations = bundle.serviceObservations.filter(
      (o) => evidenceIds.has(o.service_observation_id) || linked([o]).length > 0,
    );
    const grievances = bundle.grievances.filter(
      (g) => evidenceIds.has(g.complaint_aggregate_id) || linked([g]).length > 0,
    );
    const interventions = bundle.interventions.filter(
      (i) =>
        i.signal_id === signal.signal_id ||
        (signal["possible_interventions"] as string[] | undefined ?? []).includes(i.intervention_id),
    );

    const evidence = evidenceOf(signal);
    const missingLinks = [
      ...[...projectIds].filter((id) => !projects.some((p) => p.project_id === id)),
      ...[...assetIds].filter((id) => !assetIdSet.has(id)),
      ...((signal["possible_interventions"] as string[] | undefined) ?? []).filter(
        (id) => !interventions.some((i) => i.intervention_id === id),
      ),
    ];

    return {
      signal,
      locality: bundle.localities.find((l) => l.id === signal.locality_id) ?? null,
      localities: bundle.localities.filter((l) => geographyIds.has(l.id)),
      projects,
      assets,
      housing,
      sanitation,
      observations,
      grievances,
      interventions,
      evidence,
      unresolvedEvidence: evidence.filter((e) => !e.resolved),
      missingLinks,
      patterns: patternsFor(signal, {
        projects,
        assets,
        housing,
        sanitation,
        observations,
        grievances,
        interventions,
      }),
      coordination: coordinationFor(signal, interventions),
    };
  });

  const counts = new Map<string, { label: string; signals: number }>();
  for (const v of views)
    for (const p of v.patterns) {
      const entry = counts.get(p.key) ?? { label: p.label, signals: 0 };
      entry.signals += 1;
      counts.set(p.key, entry);
    }

  const result: SignalIntelligence = {
    cityId,
    signals: views,
    patternCounts: [...counts.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.signals - a.signals),
    totals: {
      signals: views.length,
      withIntervention: views.filter((v) => v.interventions.length > 0).length,
      withUnresolvedEvidence: views.filter(
        (v) => v.unresolvedEvidence.length > 0 || v.missingLinks.length > 0,
      ).length,
      withDataGaps: views.filter((v) => (v.signal.data_gaps ?? []).length > 0).length,
      localitiesCovered: new Set(views.flatMap((v) => v.localities.map((l) => l.id))).size,
    },
  };
  cache.set(cityId, result);
  return result;
}

export function signalView(cityId: string, signalId: string): SignalView | null {
  return signalIntelligence(cityId)?.signals.find((s) => s.signal.signal_id === signalId) ?? null;
}

/** Signals in a city that name a given locality, project, asset or record id. */
export function signalsForEntity(cityId: string, id: string): SignalView[] {
  const data = signalIntelligence(cityId);
  if (!data) return [];
  return data.signals.filter(
    (v) =>
      v.signal.signal_id === id ||
      v.signal.locality_id === id ||
      (v.signal.geography_ids ?? []).includes(id) ||
      (v.signal.related_projects ?? []).includes(id) ||
      (v.signal.related_assets ?? []).includes(id) ||
      v.signal.supporting_records.some((s) => s.id === id),
  );
}
