import { lazy, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { BreakdownList } from "@/components/app/BreakdownList";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AttentionBadge } from "@/components/app/AttentionBadge";
import { FreshnessBadge } from "@/components/app/FreshnessBadge";
import { SourceBadge } from "@/components/app/SourceBadge";
import { EvidenceLink } from "@/components/app/EvidenceDrawer";
import { CityBanner } from "@/components/app/CityBanner";
import { MunicipalIdentity } from "@/components/app/MunicipalIdentity";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { GovPoint, MarkerState } from "@/components/map/MapCanvas";
import { assessProject } from "@/data/attentionLabel";
import { attentionRows } from "@/data/attention";
import { allConflicts, SEVERITY_RANK } from "@/data/conflicts";
import { outcomeDomains } from "@/data/outcomes";
import { priorityLocations } from "@/data/mapFeatures";
import {
  evidence,
  isCompletedNotOperational,
  isDelayed,
  projects,
  projectsByAgency,
} from "@/data/selectors";
import { EMPTY, crore, dateText, labelise, percent, text } from "@/lib/format";
import { sortByOrder, usePriorityOrder } from "@/lib/priorityOrder";
import { PriorityHandle, PriorityNotice, usePriorityDrag } from "@/components/app/PriorityControl";
import { isStale } from "@/lib/freshness";
import { attentionScore, knownInrValue } from "@/data/registerLogic";
import { useCity } from "@/lib/cityContext";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "City at a glance | MoHUA Urban Intelligence Prototype" },
      {
        name: "description",
        content:
          "City geography, delivery records, service observations and evidence for senior review.",
      },
      { property: "og:title", content: "City at a glance: MoHUA Urban Intelligence Prototype" },
      {
        property: "og:description",
        content:
          "Explore city geography, projects, assets, services and decision signals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Overview,
});

function markerState(status: string, operational: string | null): MarkerState {
  if (status === "stalled" || status === "cancelled") return "critical";
  if (operational === "Operational") return "operational";
  if (status === "completed" || status === "substantially_complete") return "completed";
  if (status === "announced" || status === "proposed") return "announced";
  return "active";
}

function sum(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
}

function Overview() {
  const { city } = useCity();
  const rows = useMemo(() => attentionRows(), []);
  const conflicts = useMemo(
    () => [...allConflicts()].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [],
  );
  const [fitSignal] = useState(0);
  const [includeReconciliation, setIncludeReconciliation] = useState(false);

  // The computed ranking is the default; the reviewer can reorder it.
  const attentionPriority = usePriorityOrder(
    "attention",
    rows.map((r) => r.project.project_id),
  );
  const attentionDrag = usePriorityDrag(attentionPriority);
  const orderedRows = useMemo(
    () => sortByOrder(rows, attentionPriority.order, (r) => r.project.project_id),
    [rows, attentionPriority.order],
  );

  const systemDomains = useMemo(
    () =>
      outcomeDomains.filter((d) =>
        ["water", "used_water", "solid_waste", "mobility", "air_quality"].includes(d.id),
      ),
    [],
  );
  const systemPriority = usePriorityOrder(
    "city-systems",
    systemDomains.map((d) => d.id),
  );
  const systemDrag = usePriorityDrag(systemPriority);
  const orderedSystems = useMemo(
    () => sortByOrder(systemDomains, systemPriority.order, (d) => d.id),
    [systemDomains, systemPriority.order],
  );

  const assessed = projects.map((p) => ({ project: p, assessment: assessProject(p) }));
  const critical = assessed.filter((a) => a.assessment.label === "Critical");
  const sanctioned = sum(projects.map((p) => p.sanctioned_cost));
  const spent = sum(projects.map((p) => p.expenditure));
  const inExecution = projects.filter((p) =>
    ["tendered", "awarded", "under_construction", "substantially_complete"].includes(p.status),
  );
  const operational = projects.filter((p) => p.operational_status === "Operational");
  const staleCount = projects.filter((p) => isStale(p.last_verified)).length;
  const underConstruction = projects.filter((p) => p.status === "under_construction");
  const completed = projects.filter((p) => p.status === "completed");
  const reconciliation = projects.filter((p) => p.dedupe_review_required);
  const officialCurrent = projects.filter((p) => p.evidence_quality === "official_current");
  const knownInr = knownInrValue(projects, includeReconciliation);
  const usdOnly = projects.filter(
    (p) => p.source_cost_text && /USD/i.test(p.source_cost_text) && !p.sanctioned_cost_cr,
  );
  const sourceAgencyCounts = [
    ...projects
      .reduce((m, p) => {
        const k = p.source_agency ?? "Source agency not recorded";
        return m.set(k, (m.get(k) ?? 0) + 1);
      }, new Map<string, number>())
      .entries(),
  ].sort((a, b) => b[1] - a[1]);

  const govPoints: GovPoint[] = [
    ...projects
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => ({
        id: p.project_id,
        kind: "project" as const,
        name: p.project_name,
        sub: text(p.sector),
        lat: p.latitude as number,
        lon: p.longitude as number,
        state: markerState(p.status, p.operational_status),
      })),
    ...priorityLocations.map((l) => ({
      id: l.location_id,
      kind: "location" as const,
      name: l.name,
      sub: labelise(l.category),
      lat: l.latitude,
      lon: l.longitude,
      state: "location" as MarkerState,
    })),
  ];

  const sectorInvestment = groupSum(projects, (p) => p.sector ?? "Sector not recorded");
  const statusInvestment = groupSum(projects, (p) => labelise(p.status));
  const agencyInvestment = groupSum(
    projects,
    (p) => p.implementing_agency ?? "Agency not recorded",
  );

  const recentEvidence = [...evidence].sort((a, b) =>
    String(b.retrieved_date ?? b.publication_date).localeCompare(
      String(a.retrieved_date ?? a.publication_date),
    ),
  );
  const recentChanges = [...projects].sort((a, b) =>
    String(b.record_updated).localeCompare(String(a.record_updated)),
  );

  return (
    <>
      <PageHeader
        title="City at a glance"
        subtitle="Government investment, project status, and evidence reliability."
        identity={
          <MunicipalIdentity
            cityId={city.city_id}
            cityName={city.name}
            stateName={city.state}
          />
        }
      />

      <CityBanner city={city} />

      {/* 1. City at a glance */}
      <section aria-labelledby="glance">
        <h2 id="glance" className="sr-only">
          City at a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricCard
            label="Identified projects"
            value={projects.length}
            hint="One record per official source record"
          />
          <MetricCard
            label="Under construction"
            value={underConstruction.length}
            hint="Work reported in progress"
          />
          <MetricCard
            label="Completed projects"
            value={completed.length}
            hint="Construction reported complete, not proof of operation"
          />
          <MetricCard
            label="Requiring reconciliation"
            value={reconciliation.length}
            tone="warning"
            hint="Scope may overlap another record"
          />
          <MetricCard
            label="Current official evidence"
            value={officialCurrent.length}
            hint="Source is current, not historical"
          />
          <MetricCard
            label="Stale evidence"
            value={staleCount}
            tone="warning"
            hint="Not verified in the last 180 days"
          />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <MetricCard
            label="Known INR project value"
            value={crore(knownInr)}
            hint="Based only on identified records with a published INR value"
          />
          <MetricCard
            label="Records with USD values only"
            value={usdOnly.length}
            hint="Never converted and never added to the INR total"
          />
          <MetricCard
            label="Under execution"
            value={inExecution.length}
            hint="Tendered to substantially complete"
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeReconciliation}
              onChange={(e) => setIncludeReconciliation(e.target.checked)}
            />
            Include records flagged for reconciliation in the INR total
          </label>
          <span>
            This is not the total of all investment in Jalandhar. It is the value of the records
            identified so far. Reported expenditure on record: {spent === null ? EMPTY.unavailable : crore(spent)}. Sanctioned values
            recorded: {sanctioned === null ? EMPTY.unavailable : crore(sanctioned)}. Critical
            projects: {critical.length}.
          </span>
        </p>
      </section>

      {/* 1b. Source coverage and reconciliation */}
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Projects by source agency"
          description="Which government source each record comes from"
        >
          <div className="space-y-1.5">
            {sourceAgencyCounts.slice(0, 8).map(([name, n]) => (
              <BarRow
                key={name}
                label={name}
                value={n}
                max={sourceAgencyCounts[0]?.[1] ?? 1}
                valueLabel={String(n)}
              />
            ))}
          </div>
        </Panel>
        <Panel
          title="Data requiring reconciliation"
          description="Records that may describe the same physical work. They are kept separate."
          right={
            <Link to="/data-quality" className="text-xs text-primary underline underline-offset-2">
              Reconciliation queue
            </Link>
          }
        >
          {reconciliation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No record is flagged for reconciliation.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {reconciliation.map((p) => (
                <li key={p.project_id} className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.project_id }}
                    className="text-primary hover:underline"
                  >
                    {p.project_name}
                  </Link>
                  <span className="num text-xs text-muted-foreground">
                    {p.same_asset_group} · {text(p.source_cost_text ?? null)} ·{" "}
                    {attentionScore(p).band}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* 2. What requires attention now */}
      <section aria-labelledby="attention-now" className="mt-6">
        <Panel
          title="What requires attention now"
          description="Value weighted ranking across delay, risk, dependency and evidence conflict"
          right={
            <span className="flex flex-wrap items-center gap-3">
              <PriorityNotice priority={attentionPriority} />
              <Link to="/attention" className="text-xs text-primary underline underline-offset-2">
                Full attention register
              </Link>
            </span>
          }
        >
          <h2 id="attention-now" className="sr-only">
            What requires attention now
          </h2>
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Projects requiring senior attention</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Order
                    </th>
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Project
                    </th>
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Assessment
                    </th>
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Status
                    </th>
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Value
                    </th>
                    <th scope="col" className="field-label py-1.5 pr-3">
                      Why it matters
                    </th>
                    <th scope="col" className="field-label py-1.5">
                      Verified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderedRows.slice(0, 6).map(({ project }) => {
                    const a = assessProject(project);
                    const drag = attentionDrag.rowProps(project.project_id);
                    return (
                      <tr
                        key={project.project_id}
                        {...drag}
                        className={`border-b border-border/70 align-top ${drag.className}`}
                      >
                        <td className="py-2 pr-3">
                          <PriorityHandle
                            id={project.project_id}
                            label={project.project_name}
                            priority={attentionPriority}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: project.project_id }}
                            className="font-medium break-words hover:underline"
                          >
                            {project.project_name}
                          </Link>
                        </td>
                        <td className="py-2 pr-3">
                          <AttentionBadge label={a.label} title={a.reasons.join(" · ")} />
                        </td>
                        <td className="py-2 pr-3">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="num py-2 pr-3 whitespace-nowrap">
                          {crore(project.sanctioned_cost)}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {a.reasons[0] ?? EMPTY.unavailable}
                        </td>
                        <td className="py-2">
                          <FreshnessBadge date={project.last_verified} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{EMPTY.noProjects}</p>
          )}
        </Panel>
      </section>

      {/* 3. Jalandhar operating map */}
      <section aria-labelledby="operating-map" className="mt-6">
        <Panel
          title="Jalandhar operating map"
          description="Government records plotted on OpenStreetMap reference geography"
          right={
            <Link to="/map" className="text-xs text-primary underline underline-offset-2">
              Open full map
            </Link>
          }
        >
          <h2 id="operating-map" className="sr-only">
            Jalandhar operating map
          </h2>
          <div className="h-80 overflow-hidden rounded-sm border border-border">
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading map
                </div>
              }
            >
              <MapCanvas
                govPoints={govPoints}
                osmFeatures={[]}
                layerColors={{}}
                selectedId={null}
                onSelectGov={() => {}}
                onSelectOsm={() => {}}
                fitSignal={fitSignal}
                focus={null}
              />
            </ClientOnly>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {govPoints.length} located records. {projects.filter((p) => p.latitude === null).length}{" "}
            projects have no precise location and cannot be shown.
          </p>
        </Panel>
      </section>

      {/* 4. Major city systems */}
      <section aria-labelledby="systems" className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="systems" className="field-label">
            Major city systems
          </h2>
          <PriorityNotice priority={systemPriority} computedLabel="standard order" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {orderedSystems.map((d) => {
            const linked = projects.filter((p) => p.sector && d.sectors.includes(p.sector));
            const service = d.indicators.filter((i) => i.measure_type === "service");
            const measured = service.filter((i) => i.value !== null).length;
            const drag = systemDrag.rowProps(d.id);
            return (
              <div
                key={d.id}
                {...drag}
                className={`flex flex-col rounded-sm border border-border bg-card p-3 ${drag.className}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <PriorityHandle id={d.id} label={d.label} priority={systemPriority} />
                </div>
                <Link
                  to="/outcomes"
                  className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <p className="text-sm font-medium hover:underline">{d.label}</p>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{d.headline_question}</p>
                <dl className="mt-2 space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Projects</dt>
                    <dd className="num">{linked.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sanctioned</dt>
                    <dd className="num">{crore(sum(linked.map((p) => p.sanctioned_cost)))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Service measures</dt>
                    <dd className="num">
                      {measured}/{service.length} reported
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Government investment */}
      <section aria-labelledby="investment" className="mt-6">
        <h2 id="investment" className="field-label mb-2">
          Government investment
        </h2>
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Investment by sector" description="Sanctioned cost, INR crore">
            <Bars rows={sectorInvestment} expandLabel="View all sectors" />
          </Panel>
          <Panel title="Investment by status" description="Sanctioned cost, INR crore">
            <Bars rows={statusInvestment} expandLabel="View all statuses" />
          </Panel>
          <Panel title="Investment by agency" description="Implementing agency, INR crore">
            <Bars rows={agencyInvestment} expandLabel="View all agencies" />
          </Panel>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Projects funded by more than one programme appear once. Where a sanction value is not
          verified the project is counted but contributes no amount.
        </p>
      </section>

      {/* 6. Recent evidence and changes */}
      <section aria-labelledby="recent" className="mt-6 grid gap-4 xl:grid-cols-2">
        <h2 id="recent" className="sr-only">
          Recent evidence and changes
        </h2>
        <Panel title="Recent evidence" description="Most recently retrieved source documents">
          <ul className="divide-y divide-border">
            {recentEvidence.slice(0, 6).map((e) => (
              <li key={e.evidence_id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm break-words">{e.title}</p>
                  <SourceBadge quality={e.evidence_quality} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {text(e.publishing_agency)} · published {dateText(e.publication_date)} · retrieved{" "}
                  {dateText(e.retrieved_date)}
                </p>
                <EvidenceLink
                  request={{
                    fact: e.title,
                    entityId: e.linked_entity,
                    evidenceIds: [e.evidence_id],
                    lastVerified: e.retrieved_date,
                  }}
                  className="mt-1"
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent record changes" description="Latest updates to project records">
          <ul className="divide-y divide-border">
            {recentChanges.slice(0, 6).map((p) => (
              <li key={p.project_id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.project_id }}
                    className="text-sm break-words hover:underline"
                  >
                    {p.project_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Progress {percent(p.physical_progress_percentage)} · {labelise(p.status)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="num block text-xs text-muted-foreground">
                    {dateText(p.record_updated)}
                  </span>
                  <FreshnessBadge date={p.last_verified} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* 7. Data requiring reconciliation */}
      <section aria-labelledby="reconcile" className="mt-6">
        <Panel
          title="Data requiring reconciliation"
          description="Where government sources disagree or a claim cannot be supported"
          right={
            <Link to="/data-quality" className="text-xs text-primary underline underline-offset-2">
              Data quality and reconciliation
            </Link>
          }
        >
          <h2 id="reconcile" className="sr-only">
            Data requiring reconciliation
          </h2>
          <ul className="divide-y divide-border">
            {conflicts.slice(0, 6).map((c) => (
              <li key={c.conflict_id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: c.project_id }}
                    className="text-sm font-medium hover:underline"
                  >
                    {c.project_name}
                  </Link>
                  <AttentionBadge
                    label={c.severity === "material_conflict" ? "Critical" : "Attention"}
                    title={labelise(c.severity)}
                  />
                  <span className="field-label">{c.rule_label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.summary}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {projects.filter(isDelayed).length} projects are behind schedule;{" "}
            {projects.filter(isCompletedNotOperational).length} are reported complete without
            confirmed service; {operational.length} are confirmed operational.
          </p>
        </Panel>
      </section>
    </>
  );
}

function groupSum(
  rows: typeof projects,
  key: (p: (typeof projects)[number]) => string,
): [string, number, number][] {
  const map = new Map<string, { value: number; count: number }>();
  for (const p of rows) {
    const k = key(p);
    const entry = map.get(k) ?? { value: 0, count: 0 };
    entry.value += p.sanctioned_cost ?? 0;
    entry.count += 1;
    map.set(k, entry);
  }
  return [...map.entries()]
    .map(([k, v]) => [k, v.value, v.count] as [string, number, number])
    .sort((a, b) => b[1] - a[1] || b[2] - a[2]);
}

function Bars({ rows, expandLabel }: { rows: [string, number, number][]; expandLabel: string }) {
  return (
    <BreakdownList
      expandLabel={expandLabel}
      emptyNote={EMPTY.noProjects}
      rows={rows.map(([label, value, n]) => ({
        key: label,
        label,
        count: n,
        value: value > 0 ? value : null,
      }))}
    />
  );
}
