import { lazy, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { attentionRows } from "@/data/attention";
import { assessProject } from "@/data/attentionLabel";
import { allConflicts, SEVERITY_RANK } from "@/data/conflicts";
import { outcomeDomains } from "@/data/outcomes";
import { priorityLocations } from "@/data/mapFeatures";
import { projects } from "@/data/selectors";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { GovPoint, MarkerState } from "@/components/map/MapCanvas";
import { EMPTY, crore, dateText, labelise, percent, text } from "@/lib/format";
import { AS_OF, latestDate } from "@/lib/freshness";
import { downloadCsv, toCsv } from "@/lib/exportData";
import { projectCsv } from "@/lib/projectCsv";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

export const Route = createFileRoute("/brief")({
  head: () => ({
    meta: [
      { title: "Jalandhar City Brief | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Printable Secretary-level brief on Jalandhar: outcomes, projects requiring attention, largest investments, delays, dependencies and data conflicts.",
      },
      { property: "og:title", content: "Jalandhar City Brief" },
      {
        property: "og:description",
        content: "One page briefing on Jalandhar government investment and service delivery.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/brief" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/brief" }],
  }),
  component: BriefPage,
});

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="mb-2 border-b border-border pb-1 text-sm font-semibold">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{EMPTY.noProjects}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="field-label py-1 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/70 align-top">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BriefPage() {
  const ranked = useMemo(() => attentionRows(), []);
  const conflicts = useMemo(
    () => [...allConflicts()].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [],
  );
  const lastRefresh = latestDate(projects.map((p) => p.record_updated));

  const active = [...projects]
    .filter((p) => !["cancelled", "completed", "operational"].includes(p.status))
    .sort((a, b) => (b.sanctioned_cost ?? -1) - (a.sanctioned_cost ?? -1))
    .slice(0, 6);
  const delayed = projects
    .filter((p) => p.status === "stalled" || (p.delay_days ?? 0) > 0)
    .sort((a, b) => (b.delay_days ?? 0) - (a.delay_days ?? 0));

  const dependencies = ranked
    .filter((r) => (r.profile?.depends_on_this.length ?? 0) > 0)
    .slice(0, 5);

  const govPoints: GovPoint[] = [
    ...ranked
      .slice(0, 6)
      .filter((r) => r.project.latitude !== null && r.project.longitude !== null)
      .map((r) => ({
        id: r.project.project_id,
        kind: "project" as const,
        name: r.project.project_name,
        sub: text(r.project.sector),
        lat: r.project.latitude as number,
        lon: r.project.longitude as number,
        state: (r.project.status === "stalled" ? "critical" : "active") as MarkerState,
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

  return (
    <article className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-semibold">Jalandhar City Brief</h1>
          <p className="text-sm text-muted-foreground">
            Government projects, infrastructure and service outcomes. Prepared as of{" "}
            <span className="num">{dateText(AS_OF)}</span>. Records last changed{" "}
            <span className="num">{dateText(lastRefresh)}</span>.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Print brief
          </button>
          <button
            type="button"
            onClick={() => {
              const { headers, rows } = projectCsv();
              downloadCsv(`jalandhar-projects-${AS_OF}`, toCsv(headers, rows));
            }}
            className="rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Export CSV
          </button>
        </div>
      </header>

      <Section n={1} title="Key city outcomes">
        <Table
          head={["Domain", "Question for government", "Service measures reported", "Projects"]}
          rows={outcomeDomains.map((d) => {
            const service = d.indicators.filter((i) => i.measure_type === "service");
            const measured = service.filter((i) => i.value !== null).length;
            const linked = projects.filter((p) => p.sector && d.sectors.includes(p.sector));
            return [
              d.label,
              <span className="text-xs text-muted-foreground">{d.headline_question}</span>,
              <span className="num">
                {measured}/{service.length}
              </span>,
              <span className="num">{linked.length}</span>,
            ];
          })}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Where a service measure is not reported, no figure is shown. Construction progress is
          not treated as service delivery.
        </p>
      </Section>

      <Section n={2} title="Projects requiring attention">
        <Table
          head={["Project", "Assessment", "Status", "Sanctioned", "Decision required"]}
          rows={ranked.slice(0, 6).map((r) => [
            <Link
              to="/projects/$projectId"
              params={{ projectId: r.project.project_id }}
              className="font-medium hover:underline"
            >
              {r.project.project_name}
            </Link>,
            assessProject(r.project).label,
            labelise(r.project.status),
            <span className="num">{crore(r.project.sanctioned_cost)}</span>,
            <span className="text-xs text-muted-foreground">
              {text(r.profile?.decision_required ?? null)}
            </span>,
          ])}
        />
      </Section>

      <Section n={3} title="Largest active investments">
        <Table
          head={["Project", "Sector", "Sanctioned", "Expenditure", "Physical progress", "Agency"]}
          rows={active.map((p) => [
            p.project_name,
            text(p.sector),
            <span className="num">{crore(p.sanctioned_cost)}</span>,
            <span className="num">{crore(p.expenditure)}</span>,
            <span className="num">{percent(p.physical_progress_percentage)}</span>,
            text(p.implementing_agency),
          ])}
        />
      </Section>

      <Section n={4} title="Major project delays">
        <Table
          head={["Project", "Status", "Planned completion", "Delay", "Reason recorded"]}
          rows={delayed.map((p) => [
            p.project_name,
            labelise(p.status),
            <span className="num">{dateText(p.planned_end_date)}</span>,
            <span className="num">
              {p.delay_days === null ? EMPTY.unavailable : `${p.delay_days} days`}
            </span>,
            <span className="text-xs text-muted-foreground">{text(p.delay_reason)}</span>,
          ])}
        />
      </Section>

      <Section n={5} title="Cross-government dependencies">
        {dependencies.length ? (
          <ul className="space-y-2">
            {dependencies.map((r) => (
              <li key={r.project.project_id}>
                <p className="text-sm font-medium">{r.project.project_name}</p>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">
                  {r.profile?.depends_on_this.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{EMPTY.unavailable}</p>
        )}
      </Section>

      <Section n={6} title="Data conflicts">
        <Table
          head={["Project", "Field", "Severity", "Summary"]}
          rows={conflicts
            .slice(0, 10)
            .map((c) => [
              c.project_name,
              c.rule_label,
              labelise(c.severity),
              <span className="text-xs text-muted-foreground">{c.summary}</span>,
            ])}
        />
      </Section>

      <Section n={7} title="Map of priority interventions">
        <div className="h-96 overflow-hidden rounded-sm border border-border">
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Map available on screen only
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
              fitSignal={0}
              focus={null}
            />
          </ClientOnly>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Base map © OpenStreetMap contributors, used as reference geography only. Government
          records are the authoritative source for project location.
        </p>
      </Section>
    </article>
  );
}
