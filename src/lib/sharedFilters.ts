// Filters that persist when moving between the project register and the map.
// Stored in sessionStorage so a review session keeps its context, and reset on
// a new browser session.

export interface SharedFilters {
  sector: string;
  status: string;
  agency: string;
  scheme: string;
  ward: string;
  query: string;
}

export const DEFAULT_SHARED_FILTERS: SharedFilters = {
  sector: "all",
  status: "all",
  agency: "all",
  scheme: "all",
  ward: "all",
  query: "",
};

const KEY = "jci.filters.v1";

export function readSharedFilters(): SharedFilters {
  if (typeof window === "undefined") return DEFAULT_SHARED_FILTERS;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return DEFAULT_SHARED_FILTERS;
    return { ...DEFAULT_SHARED_FILTERS, ...(JSON.parse(raw) as Partial<SharedFilters>) };
  } catch {
    return DEFAULT_SHARED_FILTERS;
  }
}

export function writeSharedFilters(patch: Partial<SharedFilters>) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readSharedFilters(), ...patch };
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable; filters simply do not persist */
  }
}
