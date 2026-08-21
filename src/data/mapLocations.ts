// Map location resolution layer.
//
// Every project in the register is eligible for the City Map. Geography quality
// decides HOW a project is shown, never WHETHER it is shown.
//
// This is an enrichment layer only. Original latitude/longitude from the
// government source are never modified; resolved positions are kept separately
// in map_latitude / map_longitude.

import type { Project } from "./types";

export type MapLocationStatus =
  | "exact"
  | "geocoded_locality"
  | "geocoded_named_asset"
  | "approximate_area"
  | "corridor"
  | "citywide"
  | "cantonment"
  | "institutional"
  | "unresolved";

export type MapLocationConfidence = "high" | "medium" | "low";

export interface MapLocation {
  map_location_status: MapLocationStatus;
  map_location_confidence: MapLocationConfidence;
  map_latitude: number | null;
  map_longitude: number | null;
  /** Representative corridor geometry, when a corridor can be described. */
  map_geometry: [number, number][] | null;
  map_location_label: string;
  map_location_source: string;
  map_geocoding_method: string;
  map_reconciliation_status: "reconciled" | "needs_review";
  map_reconciliation_note: string;
  /** Key used to group projects that share one map representation. */
  group_key: string;
}

export const MAP_LOCATION_UI: Record<
  MapLocationStatus,
  { label: string; explanation: string; marker: string }
> = {
  exact: {
    label: "Exact location",
    explanation: "Location supplied by an official source.",
    marker: "●",
  },
  geocoded_named_asset: {
    label: "Matched location",
    explanation:
      "Physical site matched against OpenStreetMap using the project's named asset.",
    marker: "◍",
  },
  geocoded_locality: {
    label: "Approximate locality",
    explanation:
      "The project source identifies the locality but does not provide exact coordinates.",
    marker: "◌",
  },
  approximate_area: {
    label: "Approximate area",
    explanation: "The project source records an area rather than a site.",
    marker: "◌",
  },
  corridor: {
    label: "Corridor project",
    explanation:
      "Project applies to a road, rail or regional infrastructure corridor.",
    marker: "▬",
  },
  citywide: {
    label: "Citywide",
    explanation: "Project applies across Jalandhar rather than one physical site.",
    marker: "◆",
  },
  cantonment: {
    label: "Cantonment area",
    explanation: "Project sits within the Jalandhar Cantonment area.",
    marker: "◌",
  },
  institutional: {
    label: "Institutional location",
    explanation: "Project associated with the named institution.",
    marker: "◍",
  },
  unresolved: {
    label: "Location requires review",
    explanation:
      "Project is included in the register but a more precise geographic location has not yet been established.",
    marker: "△",
  },
};

/** Shared anchor for interventions that apply across the whole city. */
export const CITYWIDE_ANCHOR: [number, number] = [31.326, 75.5762];
export const CANTONMENT_ANCHOR: [number, number] = [31.296, 75.618];

interface Anchor {
  match: string[];
  lat: number;
  lon: number;
  label: string;
  status: MapLocationStatus;
  confidence: MapLocationConfidence;
  path?: [number, number][];
}

// Approximate OpenStreetMap positions for named Jalandhar places. These are
// enrichment values only and are always presented as approximate.
const ANCHORS: Anchor[] = [
  { match: ["wariana", "kala singhian"], lat: 31.3439, lon: 75.5834, label: "Wariana", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["pholriwal"], lat: 31.3097, lon: 75.5402, label: "Pholriwal", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["jamsher"], lat: 31.3618, lon: 75.6162, label: "Jamsher", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["burlton park"], lat: 31.3204, lon: 75.5716, label: "Burlton Park", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["jalandhar cantt railway station", "cantt railway"], lat: 31.2932, lon: 75.6114, label: "Jalandhar Cantt Railway Station", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["jalandhar city railway station", "city railway station"], lat: 31.3256, lon: 75.5792, label: "Jalandhar City Railway Station", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["lamba pind"], lat: 31.3312, lon: 75.6014, label: "Lamba Pind", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["nit jalandhar", "ambedkar nit", "national institute of technology"], lat: 31.396, lon: 75.535, label: "Dr B R Ambedkar NIT Jalandhar campus", status: "institutional", confidence: "medium" },
  { match: ["bist doab canal", "bist doab"], lat: 31.366, lon: 75.549, label: "Bist Doab Canal", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["urban estate phase ii"], lat: 31.3425, lon: 75.588, label: "Urban Estate Phase II", status: "geocoded_locality", confidence: "medium" },
  { match: ["urban estate"], lat: 31.3388, lon: 75.582, label: "Urban Estate", status: "geocoded_locality", confidence: "medium" },
  { match: ["industrial area"], lat: 31.335, lon: 75.558, label: "Industrial Area", status: "geocoded_locality", confidence: "medium" },
  { match: ["rainak bazar"], lat: 31.326, lon: 75.573, label: "Rainak Bazar", status: "geocoded_locality", confidence: "medium" },
  { match: ["model town"], lat: 31.3116, lon: 75.576, label: "Model Town", status: "geocoded_locality", confidence: "medium" },
  { match: ["lajpat nagar"], lat: 31.3247, lon: 75.5866, label: "Lajpat Nagar", status: "geocoded_locality", confidence: "medium" },
  { match: ["kabir vihar"], lat: 31.3405, lon: 75.5651, label: "Kabir Vihar", status: "geocoded_locality", confidence: "medium" },
  { match: ["chokan kalan"], lat: 31.3708, lon: 75.5459, label: "Chokan Kalan", status: "geocoded_locality", confidence: "medium" },
  { match: ["tobri mohalla"], lat: 31.3216, lon: 75.5641, label: "Tobri Mohalla", status: "geocoded_locality", confidence: "medium" },
  { match: ["dakoha"], lat: 31.3556, lon: 75.627, label: "Dakoha", status: "geocoded_locality", confidence: "medium" },
  { match: ["suchi pind"], lat: 31.306, lon: 75.605, label: "Suchi Pind", status: "geocoded_locality", confidence: "medium" },
  { match: ["guru nanak dev library", "guru nanak park"], lat: 31.3229, lon: 75.5789, label: "Guru Nanak civic complex", status: "geocoded_named_asset", confidence: "medium" },
  { match: ["b.r. ambedkar park", "ambedkar park"], lat: 31.3271, lon: 75.5698, label: "B.R. Ambedkar Park", status: "geocoded_named_asset", confidence: "medium" },
];

const CORRIDORS: Anchor[] = [
  {
    match: ["panipat-jalandhar", "panipat–jalandhar", "nh-44", "nh 44"],
    lat: 31.2905,
    lon: 75.5305,
    label: "NH-44 (Panipat–Jalandhar) corridor",
    status: "corridor",
    confidence: "medium",
    path: [
      [31.4025, 75.6805],
      [31.3352, 75.5905],
      [31.2905, 75.5305],
      [31.2205, 75.4405],
    ],
  },
  {
    match: ["jalandhar-moga", "moga"],
    lat: 31.2545,
    lon: 75.4835,
    label: "Jalandhar–Moga corridor",
    status: "corridor",
    confidence: "low",
    path: [
      [31.3132, 75.5602],
      [31.2545, 75.4835],
      [31.1905, 75.4005],
    ],
  },
  {
    match: ["jalandhar-kapurthala", "kapurthala"],
    lat: 31.3565,
    lon: 75.4805,
    label: "Jalandhar–Kapurthala corridor",
    status: "corridor",
    confidence: "low",
    path: [
      [31.3288, 75.5502],
      [31.3565, 75.4805],
      [31.379, 75.4205],
    ],
  },
  {
    match: ["bypass"],
    lat: 31.305,
    lon: 75.545,
    label: "Jalandhar bypass corridor",
    status: "corridor",
    confidence: "low",
    path: [
      [31.2792, 75.5905],
      [31.305, 75.545],
      [31.3502, 75.5305],
    ],
  },
  {
    match: ["cantt - suchi pind", "cantt-suchi pind", "railway corridor"],
    lat: 31.3,
    lon: 75.608,
    label: "Jalandhar Cantt – Suchi Pind rail corridor",
    status: "corridor",
    confidence: "medium",
    path: [
      [31.2932, 75.6114],
      [31.306, 75.605],
    ],
  },
];

const CITYWIDE_HINTS = [
  "pan-city",
  "pancity",
  "various locations",
  "city level",
  "citywide",
  "city-wide",
  "multiple locations",
  "jalandhar",
  "jalandhar, punjab",
  "jalandhar abd",
  "government buildings",
  "under flyovers",
  "11 junctions",
  "4 locations",
];

function hay(p: Project) {
  return [p.project_name, p.locality, p.geography_scope, p.short_description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function find(list: Anchor[], text: string): Anchor | null {
  for (const a of list) if (a.match.some((m) => text.includes(m))) return a;
  return null;
}

function isCorridorProject(p: Project, text: string) {
  const scope = (p.geography_scope ?? "").toLowerCase();
  if (scope.includes("corridor") || scope.includes("bypass")) return true;
  return /\b(highway|expressway|bypass|nh-\d+|road section|rail corridor|railway line)\b/.test(text);
}

export function resolveMapLocation(p: Project): MapLocation {
  const text = hay(p);
  const locality = (p.locality ?? "").toLowerCase().trim();
  const scope = p.geography_scope ?? "";

  // Priority 1 — official coordinates.
  if (p.latitude !== null && p.longitude !== null) {
    return {
      map_location_status: "exact",
      map_location_confidence: "high",
      map_latitude: p.latitude,
      map_longitude: p.longitude,
      map_geometry: null,
      map_location_label: p.locality ?? "Official project coordinate",
      map_location_source: "Official project source",
      map_geocoding_method: "official_coordinates",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note: "Coordinate published by the government source.",
      group_key: `exact:${p.project_id}`,
    };
  }

  // Priority 6 — corridors are resolved before locality so that a corridor is
  // never presented as a single exact site.
  if (isCorridorProject(p, text)) {
    const c = find(CORRIDORS, text) ?? {
      match: [],
      lat: 31.3132,
      lon: 75.5602,
      label: "Representative Jalandhar corridor",
      status: "corridor" as MapLocationStatus,
      confidence: "low" as MapLocationConfidence,
    };
    return {
      map_location_status: "corridor",
      map_location_confidence: c.confidence,
      map_latitude: c.lat,
      map_longitude: c.lon,
      map_geometry: c.path ?? null,
      map_location_label: c.label,
      map_location_source: "OpenStreetMap corridor resolution",
      map_geocoding_method: "corridor",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note:
        "Representative corridor geography. Not an exact project point.",
      group_key: `corridor:${c.label}`,
    };
  }

  // Priorities 2, 3 and 5 — named asset, institution or locality.
  const anchor = find(ANCHORS, text);
  if (anchor) {
    return {
      map_location_status: anchor.status,
      map_location_confidence: anchor.confidence,
      map_latitude: anchor.lat,
      map_longitude: anchor.lon,
      map_geometry: null,
      map_location_label: anchor.label,
      map_location_source:
        anchor.status === "institutional" ? "Institution location" : "OpenStreetMap geocoding",
      map_geocoding_method:
        anchor.status === "geocoded_locality"
          ? "locality"
          : anchor.status === "institutional"
            ? "institution"
            : "named_asset",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note:
        "Position matched from the named place. The source does not publish a coordinate.",
      group_key: `anchor:${anchor.label}`,
    };
  }

  // Priority 4 — Jalandhar Cantt.
  if (scope.toLowerCase().includes("cantt") || locality.includes("cantt")) {
    return {
      map_location_status: "cantonment",
      map_location_confidence: "low",
      map_latitude: CANTONMENT_ANCHOR[0],
      map_longitude: CANTONMENT_ANCHOR[1],
      map_geometry: null,
      map_location_label: "Jalandhar Cantonment area",
      map_location_source: "geography_scope",
      map_geocoding_method: "cantonment_area",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note: "Associated with the cantonment area, not a single site.",
      group_key: "area:Jalandhar Cantonment",
    };
  }

  // Priority 5 — central institution with no named campus.
  if (scope.toLowerCase().includes("central institution")) {
    return {
      map_location_status: "institutional",
      map_location_confidence: "low",
      map_latitude: CITYWIDE_ANCHOR[0],
      map_longitude: CITYWIDE_ANCHOR[1],
      map_geometry: null,
      map_location_label: "Central institution in Jalandhar",
      map_location_source: "institution_location",
      map_geocoding_method: "institution_scope",
      map_reconciliation_status: "needs_review",
      map_reconciliation_note: "Institution not named precisely in the source record.",
      group_key: "area:Central institutions in Jalandhar",
    };
  }

  // Priority 7 — citywide interventions share one anchor.
  if (CITYWIDE_HINTS.some((h) => locality === h || locality.includes(h)) || locality === "") {
    return {
      map_location_status: "citywide",
      map_location_confidence: "low",
      map_latitude: CITYWIDE_ANCHOR[0],
      map_longitude: CITYWIDE_ANCHOR[1],
      map_geometry: null,
      map_location_label: "Jalandhar city (citywide intervention)",
      map_location_source: "Project geography_scope",
      map_geocoding_method: "citywide_anchor",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note:
        "Citywide intervention. Shares the city anchor with other citywide projects.",
      group_key: "citywide:Jalandhar city",
    };
  }

  // Priority 8 — area only.
  if (scope) {
    return {
      map_location_status: "approximate_area",
      map_location_confidence: "low",
      map_latitude: CITYWIDE_ANCHOR[0],
      map_longitude: CITYWIDE_ANCHOR[1],
      map_geometry: null,
      map_location_label: scope,
      map_location_source: "geography_scope",
      map_geocoding_method: "scope_area",
      map_reconciliation_status: "reconciled",
      map_reconciliation_note: "Area association only. No site-level precision available.",
      group_key: `area:${scope}`,
    };
  }

  // Final fallback — still visible, flagged for review.
  return {
    map_location_status: "unresolved",
    map_location_confidence: "low",
    map_latitude: CITYWIDE_ANCHOR[0],
    map_longitude: CITYWIDE_ANCHOR[1],
    map_geometry: null,
    map_location_label: "Location unresolved",
    map_location_source: "Project register only",
    map_geocoding_method: "none",
    map_reconciliation_status: "needs_review",
    map_reconciliation_note: "No usable geography in the source record.",
    group_key: "unresolved:Location unresolved",
  };
}

export interface MapGroup {
  key: string;
  lat: number;
  lon: number;
  path: [number, number][] | null;
  status: MapLocationStatus;
  confidence: MapLocationConfidence;
  label: string;
  projectIds: string[];
}

/** Groups projects that legitimately share one map representation. */
export function buildMapGroups(
  list: Project[],
  resolve: (p: Project) => MapLocation = resolveMapLocation,
): MapGroup[] {
  const groups = new Map<string, MapGroup>();
  for (const p of list) {
    const loc = resolve(p);
    if (loc.map_latitude === null || loc.map_longitude === null) continue;
    const existing = groups.get(loc.group_key);
    if (existing) {
      existing.projectIds.push(p.project_id);
      continue;
    }
    groups.set(loc.group_key, {
      key: loc.group_key,
      lat: loc.map_latitude,
      lon: loc.map_longitude,
      path: loc.map_geometry,
      status: loc.map_location_status,
      confidence: loc.map_location_confidence,
      label: loc.map_location_label,
      projectIds: [p.project_id],
    });
  }
  return [...groups.values()];
}

/** Cached resolution for the full register. */
export function locationIndex(list: Project[]): Map<string, MapLocation> {
  const index = new Map<string, MapLocation>();
  for (const p of list) index.set(p.project_id, resolveMapLocation(p));
  return index;
}

export const MAP_STATUS_TABS = [
  { id: "all", label: "All projects", statuses: null as MapLocationStatus[] | null },
  { id: "exact", label: "Exact locations", statuses: ["exact"] as MapLocationStatus[] },
  {
    id: "approximate",
    label: "Approximate locations",
    statuses: [
      "geocoded_named_asset",
      "geocoded_locality",
      "approximate_area",
      "cantonment",
      "institutional",
    ] as MapLocationStatus[],
  },
  { id: "citywide", label: "Citywide", statuses: ["citywide"] as MapLocationStatus[] },
  { id: "corridors", label: "Corridors", statuses: ["corridor"] as MapLocationStatus[] },
  {
    id: "review",
    label: "Needs location review",
    statuses: ["unresolved"] as MapLocationStatus[],
  },
];
