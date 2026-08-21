import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadge";
import { CITY_SYSTEMS } from "@/data/types";
import {
  hasConflict,
  isCompletedNotOperational,
  isDelayed,
  overviewMetrics,
  projects,
  projectsByAgency,
  projectsBySystem,
  projectsByStatus,
} from "@/data/selectors";
import { crore, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Single view of Jalandhar projects, investment, assets and service outcomes across central, state and municipal government.",
      },
      { property: "og:title", content: "Jalandhar City Intelligence — Overview" },
      {
        property: "og:description",
        content:
          "Projects, infrastructure, investment and outcomes across government in Jalandhar.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const metrics = overviewMetrics();
  const bySystem = projectsBySystem();
  const attention = projects.filter((p) => isDelayed(p) || isCompletedNotOperational(p));
  const conflicts = projects.filter(hasConflict);
  const recent = [...projects].sort((a, b) =>
    String(b.record_updated).localeCompare(String(a.record_updated)),
  );
  const largest = [...projects].sort(
    (a, b) => (b.sanctioned_cost ?? -1) - (a.sanctioned_cost ?? -1),
  );
  const statusRows = projectsByStatus();
  const agencyRows = projectsByAgency();
  const maxStatus = Math.max(...statusRows.map((r) => r[1]), 1);
  const maxAgency = Math.max(...agencyRows.map((r) => r[1]), 1);

  return (
    <>
      <PageHeader
        title="Jalandhar City Intelligence"
        subtitle="Projects, infrastructure, investment and outcomes across government"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            hint={m.hint}
            tone={i === 3 ? "warning" : i === 4 || i === 5 ? "critical" : "default"}
          />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="field-label mb-2">Priority city systems</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {CITY_SYSTEMS.map((s) => (
            <Link
              key={s}
              to="/projects"
              search={{ sector: s }}
              className="rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <p className="text-sm font-medium text-foreground">{s}</p>
              <p className="num mt-1 text-lg font-semibold">{bySystem.get(s) ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">projects</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Major projects requiring attention"
          description="Stalled, delayed, or built but not delivering service"
        >
          <ul className="divide-y divide-border">
            {attention.map((p) => (
              <li key={p.project_id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.project_id }}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.project_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {text(p.sector)} · {text(p.implementing_agency)}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent project changes" description="Most recently updated records">
          <ul className="divide-y divide-border">
            {recent.slice(0, 6).map((p) => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.project_id }}
                  className="truncate text-sm hover:underline"
                >
                  {p.project_name}
                </Link>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {text(p.record_updated)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Largest investments" description="Ranked by sanctioned cost">
          <ul className="divide-y divide-border">
            {largest.slice(0, 6).map((p) => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.project_id }}
                  className="truncate text-sm hover:underline"
                >
                  {p.project_name}
                </Link>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {crore(p.sanctioned_cost)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Projects by status">
          {statusRows.map(([status, n]) => (
            <BarRow key={status} label={<StatusBadge status={status} />} value={n} max={maxStatus} />
          ))}
        </Panel>

        <Panel title="Projects by agency" description="Implementing agency">
          {agencyRows.map(([agency, n]) => (
            <BarRow key={agency} label={labelise(agency)} value={n} max={maxAgency} />
          ))}
        </Panel>

        <Panel
          title="Projects with conflicting information"
          description="Records where sources disagree"
        >
          <ul className="divide-y divide-border">
            {conflicts.map((p) => (
              <li key={p.project_id} className="py-2">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.project_id }}
                  className="text-sm font-medium hover:underline"
                >
                  {p.project_name}
                </Link>
                <p className="text-xs text-destructive">{text(p.conflict_note)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
