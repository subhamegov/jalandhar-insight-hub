export const NA = "Data not available";

/** Standard wording for empty and weak states. */
export const EMPTY = {
  unavailable: "Data not available",
  notVerified: "Not independently verified",
  stale: "Source requires refresh",
  noProjects: "No projects match these filters",
} as const;

export function text(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return NA;
  return value;
}

export function labelise(value: string | null | undefined): string {
  if (!value) return NA;
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Values are stored in INR crore. */
export function crore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NA;
  if (value >= 100_000) {
    return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh cr`;
  }
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} cr`;
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA;
  return `${value}%`;
}

export function count(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA;
  return value.toLocaleString("en-IN");
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Dates are displayed as DD MMM YYYY everywhere. */
export function dateText(value: string | null | undefined): string {
  if (!value) return NA;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const [, y, m, d] = iso;
    const month = MONTHS[Number(m) - 1];
    if (month) return `${d} ${month} ${y}`;
  }
  const ym = /^(\d{4})-(\d{2})$/.exec(value);
  if (ym) {
    const month = MONTHS[Number(ym[2]) - 1];
    if (month) return `${month} ${ym[1]}`;
  }
  return value;
}
