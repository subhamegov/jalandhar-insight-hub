import { createFileRoute, Link } from "@tanstack/react-router";
import { MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { EvidenceBadge } from "@/components/app/StatusBadge";
import { evidence, fieldCompleteness, hasConflict, projects } from "@/data/selectors";
import { allConflicts, SEVERITY_RANK } from "@/data/conflicts";
import { ConflictList } from "./projects.$projectId";
import { labelise, text } from "@/lib/format";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Where government data on Jalandhar is missing, unverified or in conflict between sources.",
      },
      { property: "og:title", content: "Data Quality — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Gaps, conflicts and verification status across the Jalandhar record set.",
      },
    ],
  }),
  component: DataQualityPage,
});

function DataQualityPage() {
  const detected = [...allConflicts()].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  const completeness = fieldCompleteness();
  const conflicts = projects.filter(hasConflict);
  const unverified = projects.filter((p) => p.evidence_quality === "unverified");
  const noSource = projects.filter((p) => !p.source_url);
  const totalCells = completeness.reduce((a, f) => a + f.total, 0);
  const filledCells = completeness.reduce((a, f) => a + f.filled, 0);
  const pct = totalCells ? Math.round((filledCells / totalCells) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Data Quality"
        subtitle="What is missing, unverified or contradictory. This page is the honest view of how much can be relied on."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Field completeness" value={`${pct}%`} hint="Across project records" />
        <MetricCard
          label="Records with conflicts"
          value={conflicts.length}
          tone="critical"
          hint="Sources disagree"
        />
        <MetricCard
          label="Unverified records"
          value={unverified.length}
          tone="warning"
          hint="No evidence grade above unverified"
        />
        <MetricCard
          label="Records without a source link"
          value={noSource.length}
          tone="warning"
          hint="No traceable URL attached"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Conflicting information" description="Requires reconciliation before use">
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

        <Panel title="Evidence grade by record">
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate text-sm">{p.project_name}</span>
                <EvidenceBadge quality={p.evidence_quality} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Field completeness"
          description="Least complete fields first"
          className="xl:col-span-2"
        >
          <div className="grid gap-x-6 md:grid-cols-2">
            {completeness.map((f) => {
              const p = Math.round((f.filled / f.total) * 100);
              return (
                <div key={f.field} className="flex items-center gap-3 py-1">
                  <span className="w-56 shrink-0 truncate text-sm">{labelise(f.field)}</span>
                  <span className="h-2 flex-1 rounded-sm bg-muted">
                    <span
                      className="block h-2 rounded-sm bg-primary"
                      style={{ width: `${p}%` }}
                    />
                  </span>
                  <span className="num w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {f.filled}/{f.total}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Evidence records flagged as conflicting" className="xl:col-span-2">
          <ul className="divide-y divide-border">
            {evidence
              .filter((e) => e.conflicting_evidence)
              .map((e) => (
                <li key={e.evidence_id} className="py-2">
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{text(e.notes)}</p>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
      <Panel
        title="Detected conflicts"
        description="Rule based checks across every project record. Severity is informational, review required or material conflict."
        className="mt-4"
      >
        <ConflictList conflicts={detected} />
      </Panel>
    </>
  );
}
