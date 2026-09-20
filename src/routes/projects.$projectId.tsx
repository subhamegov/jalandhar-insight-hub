import { lazy, Suspense, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { GovPoint } from "@/components/map/MapCanvas";
import { EmptyNote, Field, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { lookupEntity } from "@/data/four-city/dataset";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { ConflictList } from "@/components/app/ConflictList";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import { SourceBadge } from "@/components/app/SourceBadge";
import { FreshnessBadge } from "@/components/app/FreshnessBadge";
import { AttentionBadge } from "@/components/app/AttentionBadge";
import { EvidenceLink } from "@/components/app/EvidenceDrawer";
import { assessProject } from "@/data/attentionLabel";
import { conflictsForProject } from "@/data/conflicts";
import { componentsFor, eventsFor, programmesFor } from "@/data/programmes";
import { assets, evidence, isDelayed, projects } from "@/data/selectors";
import {
  LOCATION_QUALITY_LABEL,
  attentionScore,
  relatedRecords,
  scopeGroupOf,
} from "@/data/registerLogic";
import { MAP_LOCATION_UI, resolveMapLocation } from "@/data/mapLocations";

import type { Conflict, TimelineEvent } from "@/data/types";
import { TIMELINE_EVENT_LABELS, TIMELINE_EVENT_ORDER } from "@/data/types";
import { crore, dateText, labelise, percent, text } from "@/lib/format";
import { cn } from "@/lib/utils";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

const TABS = [
  "Overview",
  "Map",
  "Timeline",
  "Delivery",
  "Funding",
  "Agencies",
  "Assets",
  "Outcomes",
  "Evidence",
  "Data Conflicts",
  "Reconciliation",
] as const;

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.project_id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Project not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.project.project_name} | Jalandhar City Intelligence`;
    const description =
      loaderData.project.short_description ??
      "Project record with status, funding, agencies, location and evidence.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project: p } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  const linkedEvidence = evidence.filter((e) => e.linked_entity === p.project_id);
  const linkedAssets = assets.filter((a) => a.related_projects.includes(p.project_id));
  const funding = componentsFor(p.project_id);
  const events = eventsFor(p.project_id);
  const conflicts = conflictsForProject(p);
  const programmes = programmesFor(p.project_id, p.scheme);

  return (
    <>
      <Breadcrumbs trail={[{ label: "Projects", to: "/projects" }, { label: p.project_name }]} />
      <div className="mb-2 text-xs text-muted-foreground">
        <Link to="/projects" search={{}} className="hover:underline">
          Project register
        </Link>
        <span className="px-1">/</span>
        <span className="num">{p.project_id}</span>
      </div>

      {lookupEntity(p.project_id) ? (
        <p className="mb-2 text-xs">
          <Link
            to="/records/$recordId"
            params={{ recordId: p.project_id }}
            className="underline underline-offset-2"
          >
            Connected records: assets, service areas, housing and finance for this project
          </Link>
        </p>
      ) : null}

      <PageHeader
        title={p.project_name}
        subtitle={p.short_description ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            <AttentionBadge
              label={assessProject(p).label}
              title={assessProject(p).reasons.join(" · ")}
            />
            <FreshnessBadge date={p.last_verified} showDate />
            <EvidenceLink
              request={{
                fact: "Project record",
                entityId: p.project_id,
                entityName: p.project_name,
                lastVerified: p.last_verified,
                conflictNote: p.conflict_note ?? null,
                reported: p.cost_records ?? [],
                fallback: {
                  source_agency: p.source_agency,
                  source_url: p.source_url,
                  source_date: p.source_date,
                  evidence_quality: p.evidence_quality,
                },
              }}
              className="rounded-sm border border-input px-2 py-1"
            >
              View evidence
            </EvidenceLink>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          Sector: <span className="text-foreground">{text(p.sector)}</span>
        </span>
        <span>
          Location: <span className="text-foreground">{text(p.locality)}</span>
        </span>
        <span>
          Implementing agency:{" "}
          <span className="text-foreground">{text(p.implementing_agency)}</span>
        </span>
        <span>
          Geographic scope:{" "}
          <span className="text-foreground">{text(p.geography_scope ?? null)}</span>
        </span>
        <span>
          Location quality:{" "}
          <span className="text-foreground">
            {LOCATION_QUALITY_LABEL[p.location_quality ?? "no_coordinate"]}
          </span>
        </span>
        <span>
          System prioritisation:{" "}
          <span className="text-foreground" title={attentionScore(p)
            .reasons.map((r) => `${r.reason} (+${r.weight})`)
            .join(" · ")}>
            {attentionScore(p).band} ({attentionScore(p).score})
          </span>
        </span>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
        <MetricCard label="Sanctioned cost" value={crore(p.sanctioned_cost)} />
        <MetricCard label="Contracted cost" value={crore(p.contracted_cost)} />
        <MetricCard label="Expenditure" value={crore(p.expenditure)} />
        <MetricCard label="Physical progress" value={percent(p.physical_progress_percentage)} />
        <MetricCard label="Financial progress" value={percent(p.financial_progress_percentage)} />
        <MetricCard label="Planned completion" value={dateText(p.planned_end_date)} />
        <MetricCard
          label="Delay (days)"
          value={p.delay_days ?? null}
          tone={isDelayed(p) ? "critical" : "default"}
          hint={
            isDelayed(p) && p.delay_days === null ? "Delayed, duration not on record" : undefined
          }
        />
      </div>

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.filter(
          (t) => t !== "Reconciliation" || p.dedupe_review_required || p.same_asset_group,
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === t
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {t === "Data Conflicts" && conflicts.length ? (
              <span className="num ml-1.5 rounded-sm bg-muted px-1 text-[11px]">
                {conflicts.length}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "Overview" ? <OverviewTab p={p} programmes={programmes} /> : null}
      {tab === "Map" ? <MapTab p={p} /> : null}
      {tab === "Timeline" ? <TimelineTab events={events} /> : null}
      {tab === "Funding" ? <FundingTab p={p} funding={funding} /> : null}
      {tab === "Agencies" ? <AgenciesTab p={p} /> : null}
      {tab === "Assets" ? <AssetsTab assets={linkedAssets} /> : null}
      {tab === "Outcomes" ? <OutcomesTab p={p} assets={linkedAssets} /> : null}
      {tab === "Evidence" ? <EvidenceTab items={linkedEvidence} p={p} /> : null}
      {tab === "Delivery" ? <DeliveryTab p={p} /> : null}
      {tab === "Data Conflicts" ? <ConflictsTab conflicts={conflicts} /> : null}
      {tab === "Reconciliation" ? <ReconciliationTab p={p} /> : null}
    </>
  );
}

type P = (typeof projects)[number];

function OverviewTab({ p, programmes }: { p: P; programmes: string[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Classification">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sector" value={text(p.sector)} />
          <Field label="Asset type" value={text(p.asset_type)} />
          <Field label="Geography type" value={labelise(p.geography_type ?? null)} />
          <Field label="Priority" value={labelise(p.priority ?? null)} />
          <Field label="Operational status" value={text(p.operational_status)} />
          <Field label="Progress reported on" value={dateText(p.progress_as_of ?? null)} mono />
        </div>
      </Panel>

      <Panel title="Funding programmes" description="Scheme is metadata, not identity.">
        {programmes.length === 0 ? (
          <EmptyNote>No funding programme recorded.</EmptyNote>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {programmes.map((s) => (
              <li key={s}>
                <Link
                  to="/schemes/$schemeName"
                  params={{ schemeName: s }}
                  className="text-primary hover:underline"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Known physical attributes">
        {p.key_attributes && p.key_attributes.length ? (
          <div className="grid grid-cols-2 gap-3">
            {p.key_attributes.map((a) => (
              <Field key={a.label} label={a.label} value={a.value} />
            ))}
          </div>
        ) : (
          <EmptyNote>No verified physical attributes recorded.</EmptyNote>
        )}
      </Panel>

      <Panel title="Notes and verification" className="xl:col-span-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Source agency" value={text(p.source_agency)} />
          <Field label="Source date" value={dateText(p.source_date)} mono />
          <Field label="Evidence quality" value={<SourceBadge quality={p.evidence_quality} />} />
          <Field
            label="Last verified"
            value={
              <span className="flex items-center gap-2">
                <span className="num">{dateText(p.last_verified)}</span>
                <FreshnessBadge date={p.last_verified} />
              </span>
            }
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Source record" value={text(p.source_record_id ?? null)} mono />
          <Field label="Status as published" value={text(p.source_status ?? null)} />
          <Field label="Cost as published" value={text(p.source_cost_text ?? null)} />
          <Field
            label="Official source"
            value={
              p.source_url ? (
                <a
                  href={p.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  Open official source
                </a>
              ) : (
                "Not available"
              )
            }
          />
        </div>
        {p.notes ? <p className="mt-3 text-sm text-muted-foreground">{p.notes}</p> : null}
      </Panel>
    </div>
  );
}

function DeliveryTab({ p }: { p: P }) {
  const score = attentionScore(p);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Delivery stage">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status" value={<StatusBadge status={p.status} />} />
          <Field label="Status as published" value={text(p.source_status ?? null)} />
          <Field label="Physical progress" value={percent(p.physical_progress_percentage)} />
          <Field label="Financial progress" value={percent(p.financial_progress_percentage)} />
          <Field label="Operational status" value={text(p.operational_status)} />
          <Field label="Delay (days)" value={p.delay_days ?? "Not available"} mono />
          <Field label="Delay reason" value={text(p.delay_reason)} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Construction being reported complete is not proof that the service is operating.
        </p>
      </Panel>
      <Panel
        title="System prioritisation"
        description="Generated by this system. It is not an official government assessment."
      >
        <p className="text-sm">
          {score.band} · score <span className="num">{score.score}</span>
        </p>
        {score.reasons.length ? (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {score.reasons.map((r) => (
              <li key={r.reason}>
                {r.reason} <span className="num">(+{r.weight})</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No prioritisation reason recorded.</EmptyNote>
        )}
      </Panel>
    </div>
  );
}

function ReconciliationTab({ p }: { p: P }) {
  const related = relatedRecords(p, projects);
  return (
    <div className="grid gap-4">
      <Panel
        title="Possible duplicate scope"
        description="Records are never merged automatically. Both source records are kept."
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Same asset group" value={text(p.same_asset_group ?? null)} />
          <Field
            label="Reconciliation required"
            value={p.dedupe_review_required ? "Yes" : "No"}
          />
          <Field label="Cost as published" value={text(p.source_cost_text ?? null)} />
          <Field label="Status as published" value={text(p.source_status ?? null)} />
        </div>
        {p.notes ? <p className="mt-3 text-sm text-muted-foreground">{p.notes}</p> : null}
      </Panel>
      <Panel title="Potentially related records">
        {related.length === 0 ? (
          <EmptyNote>No other record shares this asset group.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="field-label border-b border-border px-3 py-2 text-left">Record</th>
                  <th className="field-label border-b border-border px-3 py-2 text-left">
                    Source agency
                  </th>
                  <th className="field-label border-b border-border px-3 py-2 text-left">
                    Cost as published
                  </th>
                  <th className="field-label border-b border-border px-3 py-2 text-left">
                    Status as published
                  </th>
                </tr>
              </thead>
              <tbody>
                {related.map((r) => (
                  <tr key={r.project_id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: r.project_id }}
                        className="text-primary hover:underline"
                      >
                        {r.project_name}
                      </Link>
                      <span className="num block text-[11px] text-muted-foreground">
                        {r.project_id}
                      </span>
                    </td>
                    <td className="px-3 py-2">{text(r.source_agency)}</td>
                    <td className="px-3 py-2">{text(r.source_cost_text ?? null)}</td>
                    <td className="px-3 py-2">{text(r.source_status ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function MapTab({ p }: { p: P }) {
  const loc = resolveMapLocation(p);
  const point: GovPoint[] =
    loc.map_latitude !== null && loc.map_longitude !== null
      ? [
          {
            id: p.project_id,
            kind: "project",
            name: p.project_name,
            sub: `${text(p.sector)} · ${MAP_LOCATION_UI[loc.map_location_status].label}`,
            lat: loc.map_latitude,
            lon: loc.map_longitude,
            state: "active",
            path: loc.map_geometry,
          },
        ]
      : [];

  return (
    <Panel
      title="Location"
      description="OpenStreetMap is reference geography only. Official geometry overrides it when available."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Latitude" value={p.latitude ?? "Not available"} mono />
        <Field label="Longitude" value={p.longitude ?? "Not available"} mono />
        <Field label="Ward" value={text(p.ward)} />
        <Field label="Official geometry" value={text(p.geometry)} />
        <Field label="Locality" value={text(p.locality)} />
        <Field label="Geographic scope" value={text(p.geography_scope ?? null)} />
        <Field
          label="Location quality"
          value={LOCATION_QUALITY_LABEL[p.location_quality ?? "no_coordinate"]}
        />
        <Field label="Scope group" value={scopeGroupOf(p)} />
        <Field label="Map location status" value={MAP_LOCATION_UI[loc.map_location_status].label} />
        <Field label="Map location confidence" value={loc.map_location_confidence} />
        <Field label="How the position was set" value={loc.map_geocoding_method} />
        <Field label="Position source" value={loc.map_location_source} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{loc.map_reconciliation_note}</p>

      <div className="mt-3 h-[420px] overflow-hidden rounded-sm border border-border">
        {point.length === 0 ? (
          <EmptyNote>
            No position could be resolved for this record. It is listed for review rather than shown
            as a false exact point.
          </EmptyNote>
        ) : (
          <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
              <MapCanvas
                govPoints={point}
                osmFeatures={[]}
                layerColors={{}}
                selectedId={p.project_id}
                onSelectGov={() => {}}
                onSelectOsm={() => {}}
                fitSignal={0}
                focus={{
                  lat: loc.map_latitude as number,
                  lon: loc.map_longitude as number,
                  nonce: 1,
                }}
              />
            </Suspense>

          </ClientOnly>
        )}
      </div>
      <Link to="/map" className="mt-3 inline-block text-xs text-primary hover:underline">
        Open the city map
      </Link>
    </Panel>
  );
}

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  const ordered = [...events].sort(
    (a, b) =>
      TIMELINE_EVENT_ORDER.indexOf(a.event_type) - TIMELINE_EVENT_ORDER.indexOf(b.event_type),
  );
  return (
    <Panel
      title="Project timeline"
      description="Stages recorded for this project. A published tender is not evidence of implementation."
    >
      {ordered.length === 0 ? (
        <EmptyNote>No timeline events recorded.</EmptyNote>
      ) : (
        <ol className="relative border-l border-border pl-5">
          {ordered.map((e) => (
            <li key={e.event_id} className="pb-4 last:pb-0">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-sm font-medium">{TIMELINE_EVENT_LABELS[e.event_type]}</p>
              <p className="num text-xs text-muted-foreground">{dateText(e.event_date)}</p>
              {e.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{e.description}</p>
              ) : null}
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Source: {text(e.source)} · Evidence: {labelise(e.evidence_quality)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function FundingTab({ p, funding }: { p: P; funding: ReturnType<typeof componentsFor> }) {
  return (
    <div className="grid gap-4">
      <Panel
        title="Funding components"
        description="One project, many funding sources. Money is recorded per component so the project is never duplicated."
      >
        {funding.length === 0 ? (
          <EmptyNote>No funding components recorded.</EmptyNote>
        ) : (
          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0"><table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="field-label px-3 py-2">Programme</th>
                <th className="field-label px-3 py-2">Level</th>
                <th className="field-label px-3 py-2">Ministry or department</th>
                <th className="field-label px-3 py-2 text-right">Sanctioned</th>
                <th className="field-label px-3 py-2 text-right">Released</th>
                <th className="field-label px-3 py-2 text-right">Expenditure</th>
                <th className="field-label px-3 py-2">Financial year</th>
                <th className="field-label px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {funding.map((c) => (
                <tr key={c.funding_component_id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{c.programme}</td>
                  <td className="px-3 py-2">{labelise(c.government_level)}</td>
                  <td className="px-3 py-2">{text(c.ministry_or_department)}</td>
                  <td className="num px-3 py-2 text-right">{crore(c.sanctioned_amount)}</td>
                  <td className="num px-3 py-2 text-right">{crore(c.released_amount)}</td>
                  <td className="num px-3 py-2 text-right">{crore(c.expenditure)}</td>
                  <td className="num px-3 py-2">{text(c.financial_year)}</td>
                  <td className="px-3 py-2">{text(c.source)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Panel>

      <Panel title="Project level finance">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Sanctioned cost" value={crore(p.sanctioned_cost)} mono />
          <Field label="Contracted cost" value={crore(p.contracted_cost)} mono />
          <Field label="Expenditure" value={crore(p.expenditure)} mono />
          <Field label="Central share" value={crore(p.funding_central)} mono />
          <Field label="State share" value={crore(p.funding_state)} mono />
          <Field label="City share" value={crore(p.funding_ulb)} mono />
        </div>
      </Panel>
    </div>
  );
}

function AgenciesTab({ p }: { p: P }) {
  const rows: [string, string | null][] = [
    ["Central ministry", p.central_ministry],
    ["State department", p.state_department],
    ["Owning agency", p.owning_agency],
    ["Implementing agency", p.implementing_agency],
    ["Contractor", p.contractor],
    ["Consultant", p.consultant],
  ];
  return (
    <Panel title="Responsibility">
      <ul className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="field-label">{label}</span>
            {value ? (
              <Link
                to="/agencies/$agencyName"
                params={{ agencyName: value }}
                className="text-primary hover:underline"
              >
                {value}
              </Link>
            ) : (
              <span className="italic text-muted-foreground">Not available</span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function AssetsTab({ assets: linked }: { assets: typeof assets }) {
  return (
    <Panel
      title="Assets created or affected"
      description="Completion of construction is not evidence that an asset is operational."
    >
      {linked.length === 0 ? (
        <EmptyNote>No linked assets recorded.</EmptyNote>
      ) : (
        <ul className="divide-y divide-border">
          {linked.map((a) => (
            <li key={a.asset_id} className="py-2.5">
              <p className="text-sm font-medium">{a.asset_name}</p>
              <p className="text-xs text-muted-foreground">
                {text(a.asset_type)} · Operational status: {text(a.operational_status)} · Operator:{" "}
                {text(a.operating_agency)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OutcomesTab({ p, assets: linked }: { p: P; assets: typeof assets }) {
  const operational = linked.filter((a) => /^operational$/i.test(a.operational_status ?? ""));
  return (
    <Panel title="Service outcome">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Project status" value={labelise(p.status)} />
        <Field label="Operational status" value={text(p.operational_status)} />
        <Field
          label="Assets operational"
          value={`${operational.length} of ${linked.length}`}
          mono
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Expenditure and construction progress are inputs. This system records a service outcome only
        where an operational record exists.
      </p>
    </Panel>
  );
}

function EvidenceTab({ items, p }: { items: typeof evidence; p: P }) {
  return (
    <Panel title="Evidence">
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Source agency" value={text(p.source_agency)} />
        <Field label="Source URL" value={text(p.source_url)} />
        <Field label="Evidence quality" value={<SourceBadge quality={p.evidence_quality} />} />
        <Field label="Last verified" value={dateText(p.last_verified)} mono />
      </div>
      {items.length === 0 ? (
        <EmptyNote>No evidence records attached.</EmptyNote>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((e) => (
            <li key={e.evidence_id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {text(e.publishing_agency)} · {dateText(e.publication_date)}
                </p>
                {e.notes ? <p className="mt-0.5 text-xs text-muted-foreground">{e.notes}</p> : null}
              </div>
              <EvidenceBadge quality={e.evidence_quality} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ConflictsTab({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <Panel
      title="Data conflicts"
      description="Detected from the records held in this system. Nothing is inferred beyond the evidence."
    >
      <ConflictList conflicts={conflicts} />
    </Panel>
  );
}
