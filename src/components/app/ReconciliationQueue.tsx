// Side-by-side review of records that may describe the same physical work.
// Records are never merged. A decision is recorded against the group only as a
// review note held in this browser; the original source records are untouched.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/app/Primitives";
import { SourceBadge } from "@/components/app/SourceBadge";
import { assetGroups } from "@/data/registerLogic";
import { projects } from "@/data/selectors";
import { dateText, text } from "@/lib/format";

type Decision = "same" | "separate";

const KEY = "jci.reconciliation.decisions";

function readDecisions(): Record<string, Decision> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Decision>;
  } catch {
    return {};
  }
}

export function ReconciliationQueue() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => readDecisions());

  const groups = [...assetGroups(projects).entries()].filter(([, list]) =>
    list.some((p) => p.dedupe_review_required || list.length > 1),
  );

  function decide(group: string, value: Decision) {
    const next = { ...decisions, [group]: value };
    setDecisions(next);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <Panel
      title="Reconciliation queue"
      description="Records that may describe the same physical work. Nothing is merged automatically."
      className="mt-4"
    >
      <div className="space-y-4">
        {groups.map(([group, list]) => {
          const costs = new Set(list.map((p) => p.source_cost_text ?? "Not available"));
          const statuses = new Set(list.map((p) => p.source_status ?? "Not available"));
          const decision = decisions[group];
          return (
            <div key={group} className="rounded-sm border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2">
                <div>
                  <span className="num text-xs text-muted-foreground">Asset group</span>
                  <p className="text-sm font-medium">{group}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {costs.size > 1 ? (
                    <span className="rounded-sm border border-destructive px-1.5 py-0.5 text-destructive">
                      Cost conflict
                    </span>
                  ) : null}
                  {statuses.size > 1 ? (
                    <span className="rounded-sm border border-destructive px-1.5 py-0.5 text-destructive">
                      Status conflict
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => decide(group, "same")}
                    aria-pressed={decision === "same"}
                    className={
                      decision === "same"
                        ? "rounded-sm border border-primary bg-primary px-2 py-1 text-primary-foreground"
                        : "rounded-sm border border-input px-2 py-1 hover:bg-muted"
                    }
                  >
                    Mark as same physical project
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(group, "separate")}
                    aria-pressed={decision === "separate"}
                    className={
                      decision === "separate"
                        ? "rounded-sm border border-primary bg-primary px-2 py-1 text-primary-foreground"
                        : "rounded-sm border border-input px-2 py-1 hover:bg-muted"
                    }
                  >
                    Keep as separate projects
                  </button>
                </div>
              </div>
              <div className="w-full min-w-0 max-w-full overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      {[
                        "Project",
                        "Source agency",
                        "Source record",
                        "Cost as published",
                        "Status as published",
                        "Evidence",
                        "Last verified",
                        "Notes",
                      ].map((h) => (
                        <th
                          key={h}
                          className="field-label border-b border-border px-3 py-2 text-left"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.project_id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 align-top">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: p.project_id }}
                            className="text-primary hover:underline"
                          >
                            {p.project_name}
                          </Link>
                          <span className="num block text-[11px] text-muted-foreground">
                            {p.project_id}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">{text(p.source_agency)}</td>
                        <td className="num px-3 py-2 align-top">
                          {text(p.source_record_id ?? null)}
                        </td>
                        <td className="px-3 py-2 align-top">{text(p.source_cost_text ?? null)}</td>
                        <td className="px-3 py-2 align-top">{text(p.source_status ?? null)}</td>
                        <td className="px-3 py-2 align-top">
                          <SourceBadge quality={p.evidence_quality} />
                        </td>
                        <td className="num px-3 py-2 align-top">{dateText(p.last_verified)}</td>
                        <td className="max-w-80 px-3 py-2 align-top text-xs text-muted-foreground">
                          {text(p.notes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {decision === "same"
                  ? "Reviewer marked these as one physical project. Both source records are still stored separately."
                  : decision === "separate"
                    ? "Reviewer kept these as separate projects."
                    : "No reconciliation decision recorded."}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
