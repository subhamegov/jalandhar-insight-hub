import { useState } from "react";
import { EmptyNote } from "@/components/app/Primitives";
import type { Conflict } from "@/data/types";
import { dateText, labelise, text } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<string, string> = {
  material_conflict: "border-destructive/40 bg-destructive/10 text-destructive",
  review_required: "border-warning/40 bg-warning/10 text-warning",
  informational: "border-border bg-muted/50 text-muted-foreground",
};

export function ConflictList({
  conflicts,
  showProject = false,
}: {
  conflicts: Conflict[];
  showProject?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (conflicts.length === 0) {
    return <EmptyNote>No conflicts detected against the current records.</EmptyNote>;
  }
  return (
    <ul className="space-y-2">
      {conflicts.map((c) => (
        <li key={c.conflict_id} className="rounded-sm border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">
              {showProject ? (
                <span className="text-muted-foreground">{c.project_name}: </span>
              ) : null}
              {c.rule_label}
            </p>
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-[11px]",
                SEVERITY_STYLE[c.severity],
              )}
            >
              {labelise(c.severity)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>
          <button
            type="button"
            onClick={() => setOpen(open === c.conflict_id ? null : c.conflict_id)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            View conflicting sources
          </button>
          {open === c.conflict_id ? (
            <div className="mt-2 rounded-sm border border-border bg-muted/40 p-2">
              {c.sources.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No source document is attached to this record yet.
                </p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {c.sources.map((s, i) => (
                    <li key={i}>
                      <span className="font-medium">{s.label}:</span> {text(s.value)} ·{" "}
                      {text(s.source)} · {dateText(s.source_date)} · {labelise(s.evidence_quality)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
