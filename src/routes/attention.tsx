import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyNote, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import type { AttentionRow } from "@/data/attention";
import { attentionRows } from "@/data/attention";
import { crore, dateText, text } from "@/lib/format";

export const Route = createFileRoute("/attention")({
  head: () => ({
    meta: [
      { title: "Projects Requiring Attention | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Value weighted ranking of Jalandhar projects needing senior government intervention, with the problem, responsible agency and decision required.",
      },
      { property: "og:title", content: "Projects Requiring Attention — Jalandhar" },
      {
        property: "og:description",
        content: "Where senior intervention is required across Jalandhar city investments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttentionPage,
});

function AttentionPage() {
  const rows = attentionRows();
  const top = rows.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Projects Requiring Attention"
        subtitle="Ranked by consequence, not by count. The score combines project value, delay, service criticality, public health and environmental risk, dependency on other work, evidence conflict and operational readiness."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Projects reviewed" value={rows.length} />
        <MetricCard
          label="Requiring intervention"
          value={rows.filter((r) => r.score >= 45).length}
          hint="Score 45 or above"
          tone="critical"
        />
        <MetricCard
          label="With material conflicts"
          value={rows.filter((r) => r.materialConflicts > 0).length}
          tone="warning"
        />
        <MetricCard
          label="Value not verified"
          value={rows.filter((r) => r.project.sanctioned_cost === null).length}
          hint="Value weighting cannot be applied"
        />
      </div>

      <Panel title="The five issues needing decisions now" className="mt-4">
        <ol className="space-y-3">
          {top.map((r, index) => (
            <li key={r.project.project_id} className="flex gap-3">
              <span className="num mt-0.5 h-6 w-6 shrink-0 rounded-sm bg-primary text-center text-sm leading-6 font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: r.project.project_id }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {r.project.project_name}
                </Link>
                <p className="text-sm text-foreground">
                  {r.profile?.why_it_matters ?? "Not classified."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Decision required: {r.profile?.decision_required ?? "Not available"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Full ranking" className="mt-4">
        {rows.length === 0 ? (
          <EmptyNote>No projects recorded.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="field-label px-3 py-2 text-right">Score</th>
                  <th className="field-label px-3 py-2 text-left">Project</th>
                  <th className="field-label px-3 py-2 text-left">Why it matters</th>
                  <th className="field-label px-3 py-2 text-right">Value</th>
                  <th className="field-label px-3 py-2 text-left">Status</th>
                  <th className="field-label px-3 py-2 text-right">Delay</th>
                  <th className="field-label px-3 py-2 text-left">Problem</th>
                  <th className="field-label px-3 py-2 text-left">Responsible agency</th>
                  <th className="field-label px-3 py-2 text-left">Decision required</th>
                  <th className="field-label px-3 py-2 text-left">Last verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.project.project_id} className="border-b border-border align-top last:border-0">
                    <td className="num px-3 py-2 text-right font-semibold">{r.score}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: r.project.project_id }}
                        className="text-primary hover:underline"
                      >
                        {r.project.project_name}
                      </Link>
                      <div className="mt-1">
                        <EvidenceBadge quality={r.project.evidence_quality} />
                      </div>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2 text-xs">
                      {r.profile?.why_it_matters ?? "Not classified"}
                    </td>
                    <td className="num px-3 py-2 text-right whitespace-nowrap">
                      {crore(r.project.sanctioned_cost)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.project.status} />
                    </td>
                    <td className="num px-3 py-2 text-right">
                      {r.project.delay_days === null ? (
                        <span className="text-xs text-muted-foreground italic">Not available</span>
                      ) : (
                        `${r.project.delay_days} days`
                      )}
                    </td>
                    <td className="max-w-[16rem] px-3 py-2 text-xs">
                      {r.profile?.problem ?? "Not classified"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.project.implementing_agency ? (
                        <Link
                          to="/agencies/$agencyName"
                          params={{ agencyName: r.project.implementing_agency }}
                          className="text-primary hover:underline"
                        >
                          {r.project.implementing_agency}
                        </Link>
                      ) : (
                        text(null)
                      )}
                    </td>
                    <td className="max-w-[16rem] px-3 py-2 text-xs">
                      {r.profile?.decision_required ?? "Not available"}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {dateText(r.project.last_verified)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="How the score is built" className="mt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <ScoreCard key={r.project.project_id} row={r} />
          ))}
        </div>
      </Panel>
    </>
  );
}

function ScoreCard({ row }: { row: AttentionRow }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium">{row.project.project_name}</p>
        <span className="num text-sm font-semibold">{row.score}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {row.breakdown.map((b) => (
          <li key={b.label} className="flex justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              {b.label}
              <span className="block text-[11px] opacity-80">{b.note}</span>
            </span>
            <span className="num">{b.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
