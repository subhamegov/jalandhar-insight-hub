// Data freshness rules. Age is measured from the last verified date.

export type Freshness = "current" | "ageing" | "stale" | "very_stale" | "unknown";

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  current: "Current",
  ageing: "Ageing",
  stale: "Stale",
  very_stale: "Very stale",
  unknown: "Not verified",
};

export const FRESHNESS_RANGE: Record<Freshness, string> = {
  current: "0 to 90 days",
  ageing: "91 to 180 days",
  stale: "181 to 365 days",
  very_stale: "366 days or more",
  unknown: "No verification date recorded",
};

/** Fixed reference date so the view is reproducible across sessions. */
export const AS_OF = "2026-08-21";

export function ageInDays(
  date: string | null | undefined,
  asOf: string = AS_OF,
): number | null {
  if (!date) return null;
  const then = Date.parse(date);
  const now = Date.parse(asOf);
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.round((now - then) / 86_400_000));
}

export function freshnessOf(date: string | null | undefined): Freshness {
  const age = ageInDays(date);
  if (age === null) return "unknown";
  if (age <= 90) return "current";
  if (age <= 180) return "ageing";
  if (age <= 365) return "stale";
  return "very_stale";
}

export function isStale(date: string | null | undefined): boolean {
  const f = freshnessOf(date);
  return f === "stale" || f === "very_stale" || f === "unknown";
}

/** Most recent verification date across the record set. */
export function latestDate(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => Boolean(d) && !Number.isNaN(Date.parse(d!)));
  if (!valid.length) return null;
  return valid.sort().at(-1) ?? null;
}
