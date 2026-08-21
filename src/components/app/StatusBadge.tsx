import { labelise } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EvidenceQuality, ProjectStatus } from "@/data/types";

const STATUS_TONE: Record<ProjectStatus, string> = {
  announced: "bg-muted text-muted-foreground border-border",
  proposed: "bg-muted text-muted-foreground border-border",
  sanctioned: "bg-accent text-accent-foreground border-border",
  tendered: "bg-accent text-accent-foreground border-border",
  awarded: "bg-accent text-accent-foreground border-border",
  under_construction: "bg-warning/15 text-warning-foreground border-warning/40",
  substantially_complete: "bg-warning/10 text-warning-foreground border-warning/30",
  completed: "bg-positive/12 text-positive border-positive/40",
  commissioned: "bg-positive/12 text-positive border-positive/40",
  operational: "bg-positive/18 text-positive border-positive/50",
  stalled: "bg-destructive/12 text-destructive border-destructive/40",
  cancelled: "bg-destructive/12 text-destructive border-destructive/40",
  unknown: "bg-muted text-muted-foreground border-dashed border-border",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
        STATUS_TONE[status],
        className,
      )}
    >
      {labelise(status)}
    </span>
  );
}

export function EvidenceBadge({ quality }: { quality: EvidenceQuality }) {
  const strong =
    quality === "official_current" ||
    quality === "parliamentary_record" ||
    quality === "regulator_or_court" ||
    quality === "government_tender";
  const weak = quality === "unverified" || quality === "secondary_source";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px]",
        strong && "bg-positive/12 text-positive border-positive/40",
        weak && "bg-destructive/10 text-destructive border-destructive/30",
        !strong && !weak && "bg-muted text-muted-foreground border-border",
      )}
    >
      {labelise(quality)}
    </span>
  );
}
