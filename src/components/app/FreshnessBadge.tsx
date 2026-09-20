import { FRESHNESS_LABEL, FRESHNESS_RANGE, ageInDays, freshnessOf } from "@/lib/freshness";
import { dateText } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  current: "border-positive/45 bg-positive/10 text-positive",
  ageing: "border-warning/45 bg-warning/10 text-warning",
  stale: "border-destructive/40 bg-destructive/10 text-destructive",
  very_stale: "border-destructive/50 bg-destructive/15 text-destructive",
  unknown: "border-dashed border-border bg-muted text-muted-foreground",
};

export function FreshnessBadge({
  date,
  showDate = false,
  className,
}: {
  date: string | null | undefined;
  showDate?: boolean;
  className?: string;
}) {
  const f = freshnessOf(date);
  const age = ageInDays(date);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px]",
        TONE[f],
        className,
      )}
      title={`${FRESHNESS_LABEL[f]}: ${FRESHNESS_RANGE[f]}${age === null ? "" : ` (${age} days old)`}`}
    >
      {FRESHNESS_LABEL[f]}
      {showDate ? <span className="num">· {dateText(date)}</span> : null}
    </span>
  );
}
