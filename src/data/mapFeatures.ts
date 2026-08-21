// Government-sourced priority locations. These are official records, not OSM
// features. Coordinates are approximate site centroids for orientation until
// surveyed geometry is attached.

export interface PriorityLocation {
  location_id: string;
  name: string;
  locality: string;
  category:
    | "solid_waste"
    | "wastewater"
    | "wastewater_and_waste"
    | "public_realm"
    | "transport"
    | "e_bus_depot_area";
  latitude: number;
  longitude: number;
  coordinate_precision: "site_centroid_approximate" | "surveyed";
  related_projects: string[];
  related_assets: string[];
  source_agency: string | null;
  source_url: string | null;
  last_verified: string | null;
  notes: string | null;
}

export const priorityLocations: PriorityLocation[] = [
  {
    location_id: "LOC-JAL-001",
    name: "Wariana Dumpsite",
    locality: "Wariana",
    category: "solid_waste",
    latitude: 31.3439,
    longitude: 75.5834,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-002"],
    related_assets: ["AST-JAL-002"],
    source_agency: "Municipal Corporation Jalandhar",
    source_url: null,
    last_verified: null,
    notes: "Legacy waste site under remediation programme.",
  },
  {
    location_id: "LOC-JAL-002",
    name: "Pholriwal STP",
    locality: "Pholriwal",
    category: "wastewater",
    latitude: 31.3097,
    longitude: 75.5402,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-003"],
    related_assets: ["AST-JAL-001"],
    source_agency: "Punjab Water Supply and Sewerage Board",
    source_url: null,
    last_verified: null,
    notes: "Sewage treatment and proposed reuse scheme.",
  },
  {
    location_id: "LOC-JAL-003",
    name: "Jamsher Dairy Complex",
    locality: "Jamsher",
    category: "wastewater_and_waste",
    latitude: 31.3618,
    longitude: 75.6162,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-007"],
    related_assets: [],
    source_agency: "Municipal Corporation Jalandhar",
    source_url: null,
    last_verified: null,
    notes: "Dairy waste and biogas intervention site.",
  },
  {
    location_id: "LOC-JAL-004",
    name: "Burlton Park",
    locality: "Jalandhar",
    category: "public_realm",
    latitude: 31.3204,
    longitude: 75.5716,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-005"],
    related_assets: ["AST-JAL-004"],
    source_agency: "Municipal Corporation Jalandhar",
    source_url: null,
    last_verified: null,
    notes: "Sports hub redevelopment.",
  },
  {
    location_id: "LOC-JAL-005",
    name: "Jalandhar City Railway Station",
    locality: "Jalandhar",
    category: "transport",
    latitude: 31.3256,
    longitude: 75.5792,
    coordinate_precision: "site_centroid_approximate",
    related_projects: [],
    related_assets: [],
    source_agency: "Indian Railways",
    source_url: null,
    last_verified: null,
    notes: "Principal passenger interchange for the city.",
  },
  {
    location_id: "LOC-JAL-006",
    name: "Jalandhar Cantt Railway Station",
    locality: "Jalandhar Cantonment",
    category: "transport",
    latitude: 31.2932,
    longitude: 75.6114,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-006"],
    related_assets: ["AST-JAL-003"],
    source_agency: "Indian Railways",
    source_url: null,
    last_verified: null,
    notes: "Station redevelopment under Amrit Bharat programme.",
  },
  {
    location_id: "LOC-JAL-007",
    name: "Lamba Pind",
    locality: "Jalandhar",
    category: "e_bus_depot_area",
    latitude: 31.3312,
    longitude: 75.6014,
    coordinate_precision: "site_centroid_approximate",
    related_projects: ["PRJ-JAL-004"],
    related_assets: [],
    source_agency: null,
    source_url: null,
    last_verified: null,
    notes: "Indicative depot and charging area for city electric bus operations.",
  },
];

export const LOCATION_CATEGORY_LABELS: Record<PriorityLocation["category"], string> = {
  solid_waste: "Solid waste",
  wastewater: "Wastewater",
  wastewater_and_waste: "Wastewater and waste",
  public_realm: "Public realm",
  transport: "Transport",
  e_bus_depot_area: "eBus depot area",
};
