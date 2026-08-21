// Catalogue of map layers for the City Map.
// OSM layers are reference geography only. They are never treated as the
// authoritative source for government project status.

export type LayerCategory =
  | "administrative"
  | "transport"
  | "water"
  | "wastewater"
  | "solid_waste"
  | "environment"
  | "public_infrastructure"
  | "land_use"
  | "government";

export type LayerSource = "osm" | "official";

export interface MapLayer {
  id: string;
  label: string;
  category: LayerCategory;
  source: LayerSource;
  /** Overpass QL body fragments, evaluated inside a bbox union. */
  query: string[];
  /** Human readable OSM tag list shown in the legend. */
  tags: string[];
  color: string;
  /** Render polygons/lines rather than point markers where geometry allows. */
  geometry: "point" | "line" | "area";
  defaultOn?: boolean;
  /** Shown when the layer cannot be derived reliably from OSM. */
  caveat?: string;
}

export const CATEGORY_LABELS: Record<LayerCategory, string> = {
  government: "Government records",
  administrative: "Administrative",
  transport: "Transport",
  water: "Water",
  wastewater: "Wastewater",
  solid_waste: "Solid waste",
  environment: "Environment",
  public_infrastructure: "Public infrastructure",
  land_use: "Land use",
};

export const MAP_LAYERS: MapLayer[] = [
  // Government records (not OSM)
  {
    id: "gov_projects",
    label: "Government projects",
    category: "government",
    source: "official",
    query: [],
    tags: ["Project register"],
    color: "#1d4ed8",
    geometry: "point",
    defaultOn: true,
  },
  {
    id: "gov_assets",
    label: "Government assets",
    category: "government",
    source: "official",
    query: [],
    tags: ["Asset register"],
    color: "#0f766e",
    geometry: "point",
    defaultOn: true,
  },
  {
    id: "gov_locations",
    label: "Priority locations",
    category: "government",
    source: "official",
    query: [],
    tags: ["Seeded locations"],
    color: "#b45309",
    geometry: "point",
    defaultOn: true,
  },

  // Administrative
  {
    id: "municipal_boundary",
    label: "Municipal boundary (OSM)",
    category: "administrative",
    source: "osm",
    query: ['relation["boundary"="administrative"]["admin_level"~"8|9"]'],
    tags: ["boundary=administrative", "admin_level=8/9"],
    color: "#334155",
    geometry: "line",
    caveat: "OSM approximation. Replace with authoritative MC Jalandhar geometry when available.",
  },
  {
    id: "wards",
    label: "Wards (OSM)",
    category: "administrative",
    source: "osm",
    query: ['relation["boundary"="administrative"]["admin_level"="10"]'],
    tags: ["admin_level=10"],
    color: "#64748b",
    geometry: "line",
    caveat: "OSM ward coverage for Jalandhar is incomplete.",
  },
  {
    id: "localities",
    label: "Major localities",
    category: "administrative",
    source: "osm",
    query: ['node["place"~"suburb|neighbourhood|village|town"]'],
    tags: ["place=suburb", "place=neighbourhood"],
    color: "#94a3b8",
    geometry: "point",
  },

  // Transport
  {
    id: "roads",
    label: "Major roads",
    category: "transport",
    source: "osm",
    query: ['way["highway"~"motorway|trunk|primary|secondary"]'],
    tags: ["highway=*"],
    color: "#f59e0b",
    geometry: "line",
  },
  {
    id: "junctions",
    label: "Major junctions",
    category: "transport",
    source: "osm",
    query: ['node["highway"="motorway_junction"]', 'node["junction"]'],
    tags: ["highway=motorway_junction"],
    color: "#d97706",
    geometry: "point",
  },
  {
    id: "railway_lines",
    label: "Railway lines",
    category: "transport",
    source: "osm",
    query: ['way["railway"~"rail|light_rail"]'],
    tags: ["railway=*"],
    color: "#475569",
    geometry: "line",
  },
  {
    id: "railway_stations",
    label: "Railway stations",
    category: "transport",
    source: "osm",
    query: ['node["railway"~"station|halt"]', 'way["railway"~"station|halt"]'],
    tags: ["railway=station"],
    color: "#1e293b",
    geometry: "point",
  },
  {
    id: "bus_stations",
    label: "Bus stations",
    category: "transport",
    source: "osm",
    query: ['node["amenity"="bus_station"]', 'way["amenity"="bus_station"]'],
    tags: ["amenity=bus_station"],
    color: "#7c3aed",
    geometry: "point",
  },
  {
    id: "bus_stops",
    label: "Bus stops",
    category: "transport",
    source: "osm",
    query: ['node["highway"="bus_stop"]', 'node["public_transport"="platform"]'],
    tags: ["highway=bus_stop", "public_transport=*"],
    color: "#a78bfa",
    geometry: "point",
  },
  {
    id: "ebus_routes",
    label: "Proposed eBus routes",
    category: "transport",
    source: "official",
    query: [],
    tags: ["PM eBus Sewa"],
    color: "#9333ea",
    geometry: "line",
    caveat: "Route alignments not published. No geometry available.",
  },

  // Water
  {
    id: "canals",
    label: "Canals and waterways",
    category: "water",
    source: "osm",
    query: ['way["waterway"~"canal|river|stream|drain"]'],
    tags: ["waterway=*"],
    color: "#0ea5e9",
    geometry: "line",
  },
  {
    id: "water_works",
    label: "Water works and treatment",
    category: "water",
    source: "osm",
    query: ['node["man_made"="water_works"]', 'way["man_made"="water_works"]'],
    tags: ["man_made=water_works"],
    color: "#0284c7",
    geometry: "point",
  },
  {
    id: "water_towers",
    label: "Reservoirs and towers",
    category: "water",
    source: "osm",
    query: [
      'node["man_made"~"water_tower|storage_tank|reservoir_covered"]',
      'way["man_made"~"water_tower|storage_tank|reservoir_covered"]',
    ],
    tags: ["man_made=water_tower", "man_made=storage_tank"],
    color: "#38bdf8",
    geometry: "point",
  },
  {
    id: "tube_wells",
    label: "Tube wells and pumping",
    category: "water",
    source: "osm",
    query: ['node["man_made"~"water_well|pumping_station"]'],
    tags: ["man_made=water_well", "man_made=pumping_station"],
    color: "#075985",
    geometry: "point",
  },
  {
    id: "transmission_mains",
    label: "Transmission pipelines",
    category: "water",
    source: "official",
    query: [],
    tags: ["Utility drawings"],
    color: "#0369a1",
    geometry: "line",
    caveat: "Underground pipelines are never inferred from OSM. Awaiting utility drawings.",
  },

  // Wastewater
  {
    id: "stps",
    label: "Sewage treatment plants",
    category: "wastewater",
    source: "osm",
    query: ['node["man_made"="wastewater_plant"]', 'way["man_made"="wastewater_plant"]'],
    tags: ["man_made=wastewater_plant"],
    color: "#65a30d",
    geometry: "point",
  },
  {
    id: "drains",
    label: "Open drains",
    category: "wastewater",
    source: "osm",
    query: ['way["waterway"="drain"]', 'way["waterway"="ditch"]'],
    tags: ["waterway=drain"],
    color: "#84cc16",
    geometry: "line",
  },
  {
    id: "sewer_network",
    label: "Sewer network",
    category: "wastewater",
    source: "official",
    query: [],
    tags: ["Utility drawings"],
    color: "#4d7c0f",
    geometry: "line",
    caveat: "Buried sewer lines are not mapped in OSM. Awaiting official network data.",
  },

  // Solid waste
  {
    id: "landfill",
    label: "Landfill and dumpsites",
    category: "solid_waste",
    source: "osm",
    query: ['way["landuse"="landfill"]', 'node["amenity"="waste_disposal"]'],
    tags: ["landuse=landfill", "amenity=waste_disposal"],
    color: "#b91c1c",
    geometry: "area",
  },
  {
    id: "recycling",
    label: "Recovery and recycling",
    category: "solid_waste",
    source: "osm",
    query: ['node["amenity"="recycling"]', 'way["amenity"="recycling"]'],
    tags: ["amenity=recycling"],
    color: "#ea580c",
    geometry: "point",
  },
  {
    id: "waste_transfer",
    label: "Waste processing and transfer",
    category: "solid_waste",
    source: "osm",
    query: ['node["man_made"="waste_transfer_station"]', 'way["landuse"="industrial"]["industrial"="waste"]'],
    tags: ["man_made=waste_transfer_station"],
    color: "#c2410c",
    geometry: "point",
  },
  {
    id: "cnd_waste",
    label: "C&D waste sites",
    category: "solid_waste",
    source: "official",
    query: [],
    tags: ["MC Jalandhar"],
    color: "#7c2d12",
    geometry: "point",
    caveat: "Site list not published in a mappable form.",
  },

  // Environment
  {
    id: "air_quality",
    label: "Air quality stations",
    category: "environment",
    source: "osm",
    query: ['node["man_made"="monitoring_station"]'],
    tags: ["man_made=monitoring_station"],
    color: "#dc2626",
    geometry: "point",
  },
  {
    id: "parks",
    label: "Parks and gardens",
    category: "environment",
    source: "osm",
    query: ['way["leisure"~"park|garden"]', 'node["leisure"~"park|garden"]'],
    tags: ["leisure=park", "leisure=garden"],
    color: "#16a34a",
    geometry: "area",
  },
  {
    id: "water_bodies",
    label: "Water bodies",
    category: "environment",
    source: "osm",
    query: ['way["natural"="water"]'],
    tags: ["natural=water"],
    color: "#0891b2",
    geometry: "area",
  },

  // Public infrastructure
  {
    id: "hospitals",
    label: "Hospitals and clinics",
    category: "public_infrastructure",
    source: "osm",
    query: ['node["amenity"~"hospital|clinic"]', 'way["amenity"~"hospital|clinic"]'],
    tags: ["amenity=hospital", "amenity=clinic"],
    color: "#e11d48",
    geometry: "point",
  },
  {
    id: "education",
    label: "Schools and colleges",
    category: "public_infrastructure",
    source: "osm",
    query: [
      'node["amenity"~"school|college|university"]',
      'way["amenity"~"school|college|university"]',
    ],
    tags: ["amenity=school", "amenity=college", "amenity=university"],
    color: "#2563eb",
    geometry: "point",
  },
  {
    id: "gov_offices",
    label: "Government offices",
    category: "public_infrastructure",
    source: "osm",
    query: ['node["office"="government"]', 'way["office"="government"]', 'node["amenity"="townhall"]'],
    tags: ["office=government", "amenity=townhall"],
    color: "#4338ca",
    geometry: "point",
  },
  {
    id: "markets",
    label: "Markets",
    category: "public_infrastructure",
    source: "osm",
    query: ['node["amenity"="marketplace"]', 'way["amenity"="marketplace"]'],
    tags: ["amenity=marketplace"],
    color: "#a16207",
    geometry: "point",
  },
  {
    id: "sports",
    label: "Sports facilities",
    category: "public_infrastructure",
    source: "osm",
    query: ['way["leisure"~"stadium|sports_centre|pitch"]', 'node["leisure"~"stadium|sports_centre"]'],
    tags: ["leisure=stadium", "leisure=sports_centre"],
    color: "#059669",
    geometry: "area",
  },

  // Land use
  {
    id: "lu_residential",
    label: "Residential land",
    category: "land_use",
    source: "osm",
    query: ['way["landuse"="residential"]'],
    tags: ["landuse=residential"],
    color: "#f472b6",
    geometry: "area",
  },
  {
    id: "lu_commercial",
    label: "Commercial land",
    category: "land_use",
    source: "osm",
    query: ['way["landuse"~"commercial|retail"]'],
    tags: ["landuse=commercial"],
    color: "#f97316",
    geometry: "area",
  },
  {
    id: "lu_industrial",
    label: "Industrial land",
    category: "land_use",
    source: "osm",
    query: ['way["landuse"="industrial"]'],
    tags: ["landuse=industrial"],
    color: "#8b5cf6",
    geometry: "area",
  },
  {
    id: "lu_institutional",
    label: "Institutional land",
    category: "land_use",
    source: "osm",
    query: ['way["landuse"~"institutional|education|religious"]'],
    tags: ["landuse=institutional"],
    color: "#0d9488",
    geometry: "area",
  },
  {
    id: "lu_open_space",
    label: "Open space",
    category: "land_use",
    source: "osm",
    query: ['way["landuse"~"grass|recreation_ground|meadow|farmland"]'],
    tags: ["landuse=recreation_ground"],
    color: "#22c55e",
    geometry: "area",
  },
];

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const JALANDHAR_CENTER: [number, number] = [31.326, 75.576];
export const JALANDHAR_BBOX: [number, number, number, number] = [31.24, 75.48, 31.42, 75.68];
export const CITY_ZOOM = 12;
