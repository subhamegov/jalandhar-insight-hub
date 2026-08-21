import type { EvidenceQuality } from "@/data/types";
import { cn } from "@/lib/utils";

const BADGE: Record<EvidenceQuality, { label: string; tone: string; mark: string }> = {
  official_current: {
    label: "Official",
    tone: "border-positive/45 bg-positive/10 text-positive",
    mark: "✔",
  },
  official_historical: {
    label: "Official (historical)",
    tone: "border-border bg-muted text-muted-foreground",
    mark: "✔",
  },
  government_report: {
    label: "Official",
    tone: "border-positive/45 bg-positive/10 text-positive",
    mark: "✔",
  },
  parliamentary_record: {
    label: "Parliament",
    tone: "border-primary/45 bg-primary/10 text-primary",
    mark: "§",
  },
  regulator_or_court: {
    label: "Regulatory",
    tone: "border-primary/45 bg-primary/10 text-primary",
    mark: "§",
  },
  government_tender: {
    label: "Procurement",
    tone: "border-primary/35 bg-primary/8 text-primary",
    mark: "₹",
  },
  credible_media: {
    label: "Media",
    tone: "border-warning/45 bg-warning/10 text-warning",
    mark: "◐",
  },
  secondary_source: {
    label: "Secondary",
    tone: "border-warning/45 bg-warning/10 text-warning",
    mark: "◐",
  },
  unverified: {
    label: "Not independently verified",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    mark: "!",
  },
};

export function sourceLabel(quality: EvidenceQuality): string {
  return BADGE[quality].label;
}

/**
 * Source badge. The mark is included so status is never conveyed by colour
 * alone.
 */
export function SourceBadge({
  quality,
  className,
}: {
  quality: EvidenceQuality;
  className?: string;
}) {
  const b = BADGE[quality];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
        b.tone,
        className,
      )}
      title={`Source type: ${b.label}`}
    >
      <span aria-hidden="true">{b.mark}</span>
      {b.label}
    </span>
  );
}
