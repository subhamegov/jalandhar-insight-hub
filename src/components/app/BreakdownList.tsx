import { useState } from "react";
import { crore } from "@/lib/format";

export interface BreakdownRow {
  key: string;
  /** Category, status or agency name. Wraps to two lines before truncating. */
  label: string;
  /** Project count shown under the label where relevant. */
  count?: number | null;
  /** Amount in INR crore. Null stays null and is never converted to zero. */
  value: number | null;
}

/**
 * Shared amount breakdown used by every investment panel.
 * Label wraps on the left, amount stays whole on the right, and long lists
 * collapse to the first five entries without changing any total.
 */
export function BreakdownList({
  rows,
  expandLabel,
  limit = 5,
  emptyNote = "No records match these filters",
}: {
  rows: BreakdownRow[];
  expandLabel: string;
  limit?: number;
  emptyNote?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!rows.length) return <p className="text-sm text-muted-foreground">{emptyNote}</p>;

  const max = Math.max(...rows.map((r) => r.value ?? 0), 1);
  const shown = expanded ? rows : rows.slice(0, limit);
  const hidden = rows.length - shown.length;

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-border">
        {shown.map((row) => {
          const pct = row.value === null ? 0 : Math.round((row.value / max) * 100);
          return (
            <li key={row.key} className="min-w-0 py-2">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5">
                <span className="min-w-0 text-sm break-words text-foreground" title={row.label}>
                  {row.label}
                </span>
                {row.value === null ? (
                  <span className="shrink-0 text-right text-xs text-muted-foreground italic">
                    Not available
                  </span>
                ) : (
                  <span className="num shrink-0 text-right text-sm font-medium whitespace-nowrap tabular-nums">
                    {crore(row.value)}
                  </span>
                )}
                {typeof row.count === "number" ? (
                  <span className="col-start-1 text-xs text-muted-foreground">
                    {row.count} {row.count === 1 ? "project" : "projects"}
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-sm bg-muted">
                <div className="h-1.5 rounded-sm bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 min-h-9 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {expanded ? "Show top 5" : `${expandLabel} (${hidden} more)`}
        </button>
      ) : null}
    </div>
  );
}
