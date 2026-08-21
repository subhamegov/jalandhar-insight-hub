import type { AttentionLabel } from "@/data/attentionLabel";
import { cn } from "@/lib/utils";

const TONE: Record<AttentionLabel, { tone: string; mark: string }> = {
  Critical: { tone: "border-destructive/45 bg-destructive/12 text-destructive", mark: "▲" },
  Attention: { tone: "border-warning/45 bg-warning/12 text-warning", mark: "●" },
  "Data incomplete": { tone: "border-dashed border-border bg-muted text-muted-foreground", mark: "?" },
  "On track": { tone: "border-positive/45 bg-positive/10 text-positive", mark: "✔" },
};

export function AttentionBadge({
  label,
  title,
  className,
}: {
  label: AttentionLabel;
  title?: string;
  className?: string;
}) {
  const t = TONE[label];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px] font-medium",
        t.tone,
        className,
      )}
      title={title ?? label}
    >
      <span aria-hidden="true">{t.mark}</span>
      {label}
    </span>
  );
}
