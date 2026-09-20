// Return context for pages that are opened from somewhere else (data
// provenance, data quality, evidence). The originating path travels in the URL
// as `from`, so a direct link, a refresh and browser history all behave the
// same way. Browser history alone is not used.

const SAFE_PATH = /^\/[A-Za-z0-9\-._~/$%?&=,+]*$/;

/** Accept only internal application paths. Anything else is discarded. */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  if (path.includes("://")) return null;
  if (!SAFE_PATH.test(path)) return null;
  return path;
}

const LABELS: Array<[string, string]> = [
  ["/national", "National overview"],
  ["/states", "States"],
  ["/compare", "Compare cities"],
  ["/attention", "Attention"],
  ["/signals", "Decision signals"],
  ["/interventions", "Planning interventions"],
  ["/briefing", "Executive briefing"],
  ["/housing", "Housing"],
  ["/livelihoods", "Livelihoods and mobility"],
  ["/investment", "Investment"],
  ["/projects", "Projects"],
  ["/assets", "Assets"],
  ["/schemes", "Schemes"],
  ["/agencies", "Agencies"],
  ["/outcomes", "Outcomes"],
  ["/evidence", "Evidence"],
  ["/data-quality", "Data quality"],
  ["/data-layer", "Data layer"],
  ["/data-integrity", "Data integrity"],
  ["/localities", "Localities"],
  ["/wards", "Ward view"],
  ["/records", "Record"],
  ["/map", "City map"],
  ["/brief", "City brief"],
];

/** Human label for a return path, matched on the most specific prefix. */
export function returnLabel(path: string): string {
  if (path === "/" || path.startsWith("/?")) return "City overview";
  const hit = LABELS.filter(([prefix]) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (!hit) return "the previous page";
  if (hit[0] === "/projects" && path.length > "/projects".length) return "project";
  return hit[1];
}
