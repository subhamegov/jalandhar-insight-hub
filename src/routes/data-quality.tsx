import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { SourceBadge } from "@/components/app/SourceBadge";
import { FreshnessBadge } from "@/components/app/FreshnessBadge";
import { ConflictList } from "@/components/app/ConflictList";
import { EvidenceLink } from "@/components/app/EvidenceDrawer";
import { allConflicts, SEVERITY_RANK } from "@/data/conflicts";
import { assets, evidence, fieldCompleteness, projects } from "@/data/selectors";
import type { Conflict } from "@/data/types";
import { CONFLICT_SEVERITIES } from "@/data/types";
import { EMPTY, dateText, labelise, text } from "@/lib/format";
import { FRESHNESS_LABEL, FRESHNESS_RANGE, ageInDays } from "@/lib/freshness";
import { downloadCsv, toCsv } from "@/lib/exportData";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality and Reconciliation | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Where Jalandhar government data is missing, ageing or contradictory, with the reconciliation each conflict requires.",
      },
      {
        property: "og:title",
        content: "Data Quality and Reconciliation — Jalandhar City Intelligence",
      },
      {
        property: "og:description",
        content: "Gaps, freshness and source conflicts across the Jalandhar record set.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/data-quality" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/data-quality" }],
  }),
  component: DataQualityPage,
});

function differenceOf(c: Conflict): string {
  const values = c.sources.map((s) => s.value).filter(Boolean) as string[];
  const unique = [...new Set(values)];
  if (unique.length < 2) return "Single value recorded";
  const nums = unique.map((v) => Number(String(v).replace(/[^0-9.]/g, ""))).filter((n) => n > 0);
  if (nums.length >= 2) {
    const gap = Math.max(...nums) - Math.min(...nums);
    return `${gap.toLocaleString("en-IN", { maximumFractionDigits: 2 })} apart`;
  }
  return `${unique.length} different values`;
}

const RECOMMENDED: Record<string, string> = {
  material_conflict: "Obtain a signed reconciliation from the implementing agency before use",
  review_required: "Ask the owning agency to confirm which figure is current",
  informational: "Refresh the record at the next reporting cycle",
};

function DataQualityPage() {
  const detected = useMemo(
    () => [...allConflicts()].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [],
  );
  const [severity, setSeverity] = useState("all");
  const completeness = fieldCompleteness();

  const noCoords = projects.filter((p) => p.latitude === null || p.longitude === null);
  const noStatus = projects.filter((p) => p.status === "unknown");
  const notVerified180 = projects.filter((p) => {
    const age = ageInDays(p.last_verified);
    return age === null || age > 180;
  });
  const costConflicts = projects.filter((p) => {
    const values = new Set((p.cost_records ?? []).map((r) => r.value));
    return values.size > 1;
  });
  const deadlineConflicts = projects.filter((p) => {
    const values = new Set((p.completion_date_records ?? []).map((r) => r.value));
    return values.size > 1;
  });
  const completedNotOperational = projects.filter(
    (p) =>
      (p.status === "completed" || p.status === "substantially_complete") &&
      p.operational_status !== "Operational",
  );
  const noAgency = projects.filter((p) => !p.implementing_agency);
  const assetsNoOwner = assets.filter((a) => !a.owning_agency);

  const rows = detected.filter((c) => severity === "all" || c.severity === severity);

  const totalCells = completeness.reduce((a, f) => a + f.total, 0);
  const filledCells = completeness.reduce((a, f) => a + f.filled, 0);
  const pct = totalCells ? Math.round((filledCells / totalCells) * 100) : 0;

  const exportConflicts = () => {
    const csv = toCsv(
      ["Entity", "Field", "Source A", "Source B", "Difference", "Severity", "Recommended review"],
      rows.map((c) => [
        c.project_name,
        c.rule_label,
        sourceText(c, 0),
        sourceText(c, 1),
        differenceOf(c),
        labelise(c.severity),
        RECOMMENDED[c.severity],
      ]),
    );
    downloadCsv("jalandhar-data-conflicts", csv);
  };

  return (
    <>
      <PageHeader
        title="Data quality and reconciliation"
        subtitle="The honest view of the record set: what is missing, what is ageing and where government sources disagree."
        actions={
          <button
            type="button"
            onClick={exportConflicts}
            className="rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Export conflicts (CSV)
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Projects without coordinates" value={noCoords.length} tone="warning" hint="Cannot be placed on the map" />
        <MetricCard label="Projects without current status" value={noStatus.length} tone="warning" hint="Status recorded as unknown" />
        <MetricCard label="Not verified in 180 days" value={notVerified180.length} tone="critical" hint={EMPTY.stale} />
        <MetricCard label="Conflicting costs" value={costConflicts.length} tone="critical" hint="More than one sanctioned or contract value" />
        <MetricCard label="Conflicting deadlines" value={deadlineConflicts.length} tone="critical" hint="More than one completion date reported" />
        <MetricCard label="Completed without operational confirmation" value={completedNotOperational.length} tone="critical" hint="Built, service unproven" />
        <MetricCard label="Projects without an implementing agency" value={noAgency.length} tone="warning" hint="No accountable body recorded" />
        <MetricCard label="Assets without owning agency" value={assetsNoOwner.length} tone="warning" hint="Ownership unclear" />
      </div>

      <Panel
        title="Conflicts requiring reconciliation"
        description="Rule based checks across every project record"
        className="mt-4"
        right={
          <div className="flex items-center gap-2">
            <label htmlFor="severity" className="field-label">
              Severity
            </label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="rounded-sm border border-input bg-card px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="all">All</option>
              {CONFLICT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {labelise(s)}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Conflicting government records</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  {["Entity", "Field", "Source A", "Source B", "Difference", "Severity", "Recommended review", "Evidence"].map(
                    (h) => (
                      <th key={h} scope="col" className="field-label py-1.5 pr-3">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.conflict_id} className="border-b border-border/70 align-top">
                    <td className="py-2 pr-3">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: c.project_id }}
                        className="font-medium break-words hover:underline"
                      >
                        {c.project_name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-xs">{c.rule_label}</td>
                    <td className="py-2 pr-3 text-xs break-words">{sourceText(c, 0)}</td>
                    <td className="py-2 pr-3 text-xs break-words">{sourceText(c, 1)}</td>
                    <td className="num py-2 pr-3 text-xs whitespace-nowrap">{differenceOf(c)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          c.severity === "material_conflict"
                            ? "rounded-sm border border-destructive/45 bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive"
                            : c.severity === "review_required"
                              ? "rounded-sm border border-warning/45 bg-warning/10 px-1.5 py-0.5 text-[11px] text-warning"
                              : "rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        }
                      >
                        {labelise(c.severity)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {RECOMMENDED[c.severity]}
                    </td>
                    <td className="py-2">
                      <EvidenceLink
                        request={{
                          fact: `${c.rule_label} — ${c.project_name}`,
                          entityId: c.project_id,
                          entityName: c.project_name,
                          reported: c.sources,
                          conflictNote: c.summary,
                        }}
                      >
                        View sources
                      </EvidenceLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No conflicts match this severity.</p>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Record freshness" description="Age measured from the last verification date">
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-sm" title={p.project_name}>
                  {p.project_name}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="num text-xs text-muted-foreground">
                    {dateText(p.last_verified)}
                  </span>
                  <FreshnessBadge date={p.last_verified} />
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
            {(["current", "ageing", "stale", "very_stale"] as const).map((f) => (
              <div key={f} className="flex gap-2">
                <dt>{FRESHNESS_LABEL[f]}</dt>
                <dd>{FRESHNESS_RANGE[f]}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Evidence grade by record">
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-sm">{p.project_name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <SourceBadge quality={p.evidence_quality} />
                  <EvidenceLink
                    request={{
                      fact: "Project record",
                      entityId: p.project_id,
                      entityName: p.project_name,
                      lastVerified: p.last_verified,
                      conflictNote: p.conflict_note ?? null,
                      fallback: {
                        source_agency: p.source_agency,
                        source_url: p.source_url,
                        source_date: p.source_date,
                        evidence_quality: p.evidence_quality,
                      },
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Field completeness"
          description="Least complete fields first"
          className="xl:col-span-2"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Overall completeness across project records: <span className="num">{pct}%</span>
          </p>
          <div className="grid gap-x-6 md:grid-cols-2">
            {completeness.map((f) => {
              const p = Math.round((f.filled / f.total) * 100);
              return (
                <div key={f.field} className="flex items-center gap-3 py-1">
                  <span className="w-56 shrink-0 truncate text-sm">{labelise(f.field)}</span>
                  <span className="h-2 flex-1 rounded-sm bg-muted">
                    <span className="block h-2 rounded-sm bg-primary" style={{ width: `${p}%` }} />
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
            {evidence.filter((e) => e.conflicting_evidence).length ? (
              evidence
                .filter((e) => e.conflicting_evidence)
                .map((e) => (
                  <li key={e.evidence_id} className="py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium break-words">{e.title}</p>
                      <SourceBadge quality={e.evidence_quality} />
                    </div>
                    <p className="text-xs text-muted-foreground">{text(e.notes)}</p>
                  </li>
                ))
            ) : (
              <li className="py-2 text-sm text-muted-foreground">
                No source document is currently flagged as conflicting.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title="Detected conflicts in detail" className="mt-4">
        <ConflictList conflicts={detected} showProject />
      </Panel>
    </>
  );
}

function sourceText(c: Conflict, i: number): string {
  const s = c.sources[i];
  if (!s) return EMPTY.unavailable;
  const parts = [text(s.value), s.source ?? "Source not recorded", dateText(s.source_date)];
  return parts.join(" — ");
}
