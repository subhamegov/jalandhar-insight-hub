export const NA = "Not available";

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

export function dateText(value: string | null | undefined): string {
  if (!value) return NA;
  return value;
}
