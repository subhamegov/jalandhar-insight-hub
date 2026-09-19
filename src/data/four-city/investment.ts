/**
 * Investment-outcome intelligence.
 *
 * Follows one chain per project: mission → project → funding → expenditure →
 * infrastructure created → operational service → observed citizen outcome.
 *
 * Rules held in this module:
 *  - every join uses canonical identifiers supplied in the data;
 *  - each project and each asset appears once in every total (sets, not sums
 *    over links), so nothing is double counted;
 *  - finance rows are grouped by financial year and only summed inside a year,
 *    and every amount stays in the unit it was supplied in (INR lakh);
 *  - co-location of two projects is reported as something to investigate, never
 *    as duplication;
 *  - completion is never read as citizen impact, and no return on investment is
 *    computed.
 */
import { fourCityBundle } from "./dataset";
import type {
  AssetServiceArea,
  DecisionSignal,
  GrievanceAggregate,
  Locality,
  MissionProject,
  MunicipalAsset,
  MunicipalFinance,
  ProjectComponent,
  ServiceObservation,
} from "./types";

const nz = (v: number | null | undefined) => (typeof v === "number" ? v : 0);

/** One financial year of records for a project, summed only within the year. */
export interface FinanceYear {
  financial_year: string;
  records: MunicipalFinance[];
  budget_inr_lakh: number;
  released_inr_lakh: number;
  expenditure_inr_lakh: number;
  /** Released minus expenditure, computed only when both are present. */
  unspent_inr_lakh: number | null;
  /** Accounting period ends present in the group. */
  periodEnds: string[];
  fundingSources: string[];
}

export interface InvestmentChain {
  project: MissionProject;
  locality: Locality | null;
  components: ProjectComponent[];
  assets: MunicipalAsset[];
  serviceAreas: AssetServiceArea[];
  /** Localities named by the project's service areas. */
  servedLocalities: Locality[];
  finance: FinanceYear[];
  financeRecords: MunicipalFinance[];
  observations: ServiceObservation[];
  grievances: GrievanceAggregate[];
  signals: DecisionSignal[];
  housingIds: string[];
  /** Assets that are not operational yet, by commissioning status. */
  notOperational: MunicipalAsset[];
  /** Assets recorded below half their capacity use. */
  underutilised: MunicipalAsset[];
  /** Named links with no matching record in the dataset. */
  missingLinks: string[];
  flags: string[];
}

export interface ConvergenceGroup {
  locality: Locality;
  chains: InvestmentChain[];
  missions: string[];
  /** Different missions investing in the same locality. */
  complementary: string[];
  /** Same project type more than once here: to investigate, not duplication. */
  toInvestigate: string[];
  /** Housing or service records present with no supporting asset recorded. */
  missingDependencies: string[];
  incompleteProjects: MissionProject[];
  underutilisedAssets: MunicipalAsset[];
  bottlenecks: string[];
}

export interface InvestmentIntelligence {
  chains: InvestmentChain[];
  convergence: ConvergenceGroup[];
  totals: {
    projects: number;
    completedProjects: number;
    inProgressProjects: number;
    delayedProjects: number;
    assets: number;
    operationalAssets: number;
    financeRecords: number;
    /** Distinct financial years present, so periods are never mixed. */
    financialYears: string[];
  };
  /** City finance grouped by year, each year summed on its own. */
  byYear: FinanceYear[];
  unit: "INR lakh";
}

function groupFinance(rows: MunicipalFinance[]): FinanceYear[] {
  const map = new Map<string, MunicipalFinance[]>();
  for (const r of rows) {
    const key = r.financial_year ?? "Year not recorded";
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }
  return [...map.entries()]
    .map(([financial_year, records]) => {
      const released = records.reduce((s, r) => s + nz(r.fund_released_inr_lakh), 0);
      const spent = records.reduce((s, r) => s + nz(r.expenditure_inr_lakh), 0);
      const bothPresent = records.some(
        (r) => r.fund_released_inr_lakh !== null && r.expenditure_inr_lakh !== null,
      );
      return {
        financial_year,
        records,
        budget_inr_lakh: records.reduce((s, r) => s + nz(r.budget_inr_lakh), 0),
        released_inr_lakh: released,
        expenditure_inr_lakh: spent,
        unspent_inr_lakh: bothPresent ? released - spent : null,
        periodEnds: [
          ...new Set(records.map((r) => r.accounting_period_end).filter(Boolean) as string[]),
        ],
        fundingSources: [
          ...new Set(records.map((r) => r.funding_source).filter(Boolean) as string[]),
        ],
      };
    })
    .sort((a, b) => a.financial_year.localeCompare(b.financial_year));
}

const NOT_OPERATIONAL = /not_operational|under_construction|maintenance_required|decommission/i;

export function investmentIntelligence(cityId: string): InvestmentIntelligence | null {
  const b = fourCityBundle(cityId);
  if (!b) return null;

  const localityOf = (id: string | null) =>
    id ? (b.localities.find((l) => l.id === id) ?? null) : null;

  const chains: InvestmentChain[] = b.projects.map((p) => {
    const missingLinks: string[] = [];

    const assets = p.asset_ids
      .map((id) => {
        const a = b.assets.find((x) => x.asset_id === id);
        if (!a) missingLinks.push(`Asset ${id} has no record`);
        return a;
      })
      .filter(Boolean) as MunicipalAsset[];

    const areaIds = [...new Set(assets.flatMap((a) => a.service_area_ids))];
    const serviceAreas = areaIds
      .map((id) => {
        const s = b.serviceAreas.find((x) => x.service_area_id === id);
        if (!s) missingLinks.push(`Service area ${id} has no record`);
        return s;
      })
      .filter(Boolean) as AssetServiceArea[];

    const servedLocalityIds = [...new Set(serviceAreas.flatMap((s) => s.locality_ids))];
    const servedLocalities = servedLocalityIds
      .map((id) => b.localities.find((l) => l.id === id))
      .filter(Boolean) as Locality[];

    const financeRecords = b.finance.filter(
      (f) => f.project_id === p.project_id || p.financial_record_ids.includes(f.finance_id),
    );
    for (const id of p.financial_record_ids) {
      if (!b.finance.some((f) => f.finance_id === id))
        missingLinks.push(`Finance record ${id} has no record`);
    }
    for (const id of p.housing_ids) {
      if (!b.housing.some((h) => h.housing_id === id))
        missingLinks.push(`Housing record ${id} has no record`);
    }

    const assetIds = new Set(assets.map((a) => a.asset_id));
    const observations = b.serviceObservations.filter((o) =>
      o.linked_asset_ids.some((id) => assetIds.has(id)),
    );
    const grievances = b.grievances.filter((g) =>
      g.linked_asset_ids.some((id) => assetIds.has(id)),
    );
    const signals = b.signals.filter(
      (s) =>
        s.related_projects.includes(p.project_id) ||
        s.related_assets.some((id) => assetIds.has(id)) ||
        s.supporting_records.some((r) => r.id === p.project_id || assetIds.has(r.id)),
    );

    const notOperational = assets.filter((a) => NOT_OPERATIONAL.test(a.commissioning_status));
    const underutilised = assets.filter(
      (a) => typeof a.utilisation_pct === "number" && a.utilisation_pct < 50,
    );

    const flags: string[] = [];
    if (p.project_status !== "completed") flags.push("Project not complete");
    if (
      p.actual_completion_date === null &&
      p.scheduled_completion_date &&
      p.scheduled_completion_date < (p.observation_date ?? "")
    )
      flags.push("Scheduled completion date passed, no completion date recorded");
    if (assets.length === 0) flags.push("No infrastructure asset recorded against this project");
    if (notOperational.length) flags.push(`${notOperational.length} asset(s) not operational`);
    if (underutilised.length) flags.push(`${underutilised.length} asset(s) below 50% utilisation`);
    if (financeRecords.length === 0) flags.push("No finance record linked");
    if (observations.length === 0 && assets.length > 0)
      flags.push("No service observation against the assets created");
    if (
      typeof p.physical_progress_pct === "number" &&
      typeof p.financial_progress_pct === "number" &&
      Math.abs(p.physical_progress_pct - p.financial_progress_pct) >= 20
    )
      flags.push("Physical and financial progress differ by 20 points or more");

    return {
      project: p,
      locality: localityOf(p.locality_id),
      components: b.components.filter((c) => c.project_id === p.project_id),
      assets,
      serviceAreas,
      servedLocalities,
      finance: groupFinance(financeRecords),
      financeRecords,
      observations,
      grievances,
      signals,
      housingIds: p.housing_ids,
      notOperational,
      underutilised,
      missingLinks,
      flags,
    };
  });

  // Convergence: one group per locality, each project counted once.
  const convergence: ConvergenceGroup[] = b.localities
    .map((locality) => {
      const here = chains.filter(
        (c) =>
          c.project.locality_id === locality.id ||
          c.servedLocalities.some((l) => l.id === locality.id),
      );
      const missions = [...new Set(here.map((c) => c.project.mission))].sort();

      const typeCount = new Map<string, string[]>();
      for (const c of here) {
        const list = typeCount.get(c.project.project_type) ?? [];
        list.push(c.project.project_id);
        typeCount.set(c.project.project_type, list);
      }
      const toInvestigate = [...typeCount.entries()]
        .filter(([, ids]) => ids.length > 1)
        .map(
          ([type, ids]) =>
            `${ids.length} ${type.replace(/_/g, " ")} projects recorded here (${ids.join(", ")}). Same type in the same locality is a reason to check the scope of each, not evidence of duplication.`,
        );

      const complementary =
        missions.length > 1
          ? [
              `${missions.length} missions investing here: ${missions.join(", ")}. Their outputs may support one another.`,
            ]
          : [];

      const assetIdsHere = new Set(here.flatMap((c) => c.assets.map((a) => a.asset_id)));
      const housingHere = b.housing.filter((h) => h.locality_id === locality.id);
      const missingDependencies: string[] = [];
      if (housingHere.length > 0 && assetIdsHere.size === 0)
        missingDependencies.push(
          "Housing recorded in this locality with no project asset recorded here",
        );
      const waterAssets = b.assets.filter(
        (a) => a.locality_id === locality.id && /water|sewer|stp|wtp/i.test(a.asset_type),
      );
      if (housingHere.length > 0 && waterAssets.length === 0)
        missingDependencies.push("No water or sewerage asset recorded in this locality");

      const incompleteProjects = here
        .filter((c) => c.project.project_status !== "completed")
        .map((c) => c.project);

      const underutilisedAssets = [
        ...new Map(
          here.flatMap((c) => c.underutilised).map((a) => [a.asset_id, a]),
        ).values(),
      ];

      const bottlenecks: string[] = [];
      const notOp = [
        ...new Map(here.flatMap((c) => c.notOperational).map((a) => [a.asset_id, a])).values(),
      ];
      for (const a of notOp)
        bottlenecks.push(
          `${a.asset_name} (${a.asset_id}) is recorded as ${a.commissioning_status.replace(/_/g, " ")}`,
        );
      const lowSla = b.serviceObservations.filter(
        (o) =>
          o.locality_id === locality.id &&
          typeof o.sla_compliance_pct === "number" &&
          o.sla_compliance_pct < 70,
      );
      for (const o of lowSla)
        bottlenecks.push(
          `${o.service_type.replace(/_/g, " ")} service compliance ${o.sla_compliance_pct}% in ${o.period ?? "period not recorded"} (${o.service_observation_id})`,
        );

      return {
        locality,
        chains: here,
        missions,
        complementary,
        toInvestigate,
        missingDependencies,
        incompleteProjects,
        underutilisedAssets,
        bottlenecks,
      };
    })
    .sort((a, b2) => b2.chains.length - a.chains.length);

  const distinctAssets = new Set(b.assets.map((a) => a.asset_id));

  return {
    chains,
    convergence,
    totals: {
      projects: b.projects.length,
      completedProjects: b.projects.filter((p) => p.project_status === "completed").length,
      inProgressProjects: b.projects.filter((p) => p.project_status === "in_progress").length,
      delayedProjects: b.projects.filter((p) => p.project_status === "delayed").length,
      assets: distinctAssets.size,
      operationalAssets: b.assets.filter((a) => !NOT_OPERATIONAL.test(a.commissioning_status))
        .length,
      financeRecords: b.finance.length,
      financialYears: [
        ...new Set(b.finance.map((f) => f.financial_year).filter(Boolean) as string[]),
      ].sort(),
    },
    byYear: groupFinance(b.finance),
    unit: "INR lakh",
  };
}

export function investmentChain(cityId: string, projectId: string): InvestmentChain | null {
  const data = investmentIntelligence(cityId);
  if (!data) return null;
  return data.chains.find((c) => c.project.project_id === projectId) ?? null;
}
