import type { ReactNode } from "react";
import { NA } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  note,
  actions,
}: {
  title: string;
  /** One sentence. Longer explanation belongs in Evidence or Data quality. */
  subtitle?: string | undefined;
  /** Compact status line, e.g. prototype or source caveats. */
  note?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-border pb-4">
      <div className="digit-rule mb-3 w-16" aria-hidden="true" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {note ? <div className="mt-2 text-xs text-muted-foreground">{note}</div> : null}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** Compact prototype-data status. Detail stays in Evidence and Data quality. */
export function PrototypeNote({ text }: { text?: string }) {
  return (
    <span>
      <span className="font-medium text-foreground">Prototype data</span> ·{" "}
      {text ?? "Synthetic observations, not official statistics"}
    </span>
  );
}

export function Panel({
  title,
  description,
  right,
  children,
  className,
}: {
  title?: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("digit-card min-w-0", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {right}
        </div>
      ) : null}
      <div className="min-w-0 p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number | null;
  hint?: string | undefined;
  tone?: "default" | "warning" | "critical" | undefined;
}) {
  const display = value === null || value === undefined ? NA : value;
  return (
    <div className="digit-card p-3">
      <p className="field-label">{label}</p>
      <p
        className={cn(
          "num mt-1.5 text-xl font-semibold break-words sm:text-2xl",
          value === null && "text-base font-normal text-muted-foreground",
          tone === "warning" && value !== null && "text-warning",
          tone === "critical" && value !== null && "text-destructive",
        )}
      >
        {display}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  const empty = value === NA || value === null || value === undefined || value === "";
  return (
    <div className="min-w-0">
      <p className="field-label">{label}</p>
      <p
        className={cn(
          "mt-0.5 break-words text-sm",
          mono && "num",
          empty ? "text-muted-foreground italic" : "text-foreground",
        )}
      >
        {empty ? NA : value}
      </p>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function BarRow({
  label,
  value,
  max,
  valueLabel,
}: {
  label: ReactNode;
  value: number;
  max: number;
  valueLabel?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-32 shrink-0 truncate text-sm text-foreground sm:w-56">{label}</div>
      <div className="h-2 flex-1 rounded-sm bg-muted">
        <div className="h-2 rounded-sm bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div
        className={cn(
          "num shrink-0 text-right text-sm text-muted-foreground",
          valueLabel ? "w-24" : "w-8",
        )}
      >
        {valueLabel ?? value}
      </div>
    </div>
  );
}
