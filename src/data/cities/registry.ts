// City registry for the MoHUA Urban Intelligence application.
//
// One application, many cities. Each city carries only its identity and
// reference geography here; records live in the per-city datasets
// (see ./datasets.ts). No values are invented: where a city has no loaded
// records, the dataset is empty and the UI says so.

export type CityId =
  | "CITY-JALANDHAR"
  | "CITY-THANE"
  | "CITY-SURAT"
  | "CITY-AHMEDABAD"
  | "CITY-GUWAHATI"
  | "CITY-KARNAL";

export interface CityProfile {
  city_id: CityId;
  /** Short name used in navigation and headings. */
  name: string;
  state: string;
  /** Urban local body of record. */
  urban_local_body: string;
  /** Approximate city centre for map orientation only. */
  centre: [number, number];
  /** Map bounding box as [south, west, north, east] for OSM queries. */
  bbox: [number, number, number, number];
  /** Whether government records have been ingested for this city yet. */
  data_loaded: boolean;
}

export const CITIES: CityProfile[] = [
  {
    city_id: "CITY-JALANDHAR",
    name: "Jalandhar",
    state: "Punjab",
    urban_local_body: "Municipal Corporation Jalandhar",
    centre: [31.326, 75.5762],
    bbox: [31.2456, 75.4772, 31.4152, 75.6866],
    data_loaded: true,
  },
  {
    city_id: "CITY-THANE",
    name: "Thane",
    state: "Maharashtra",
    urban_local_body: "Thane Municipal Corporation",
    centre: [19.2183, 72.9781],
    bbox: [19.13, 72.89, 19.32, 73.08],
    data_loaded: true,
  },
  {
    city_id: "CITY-SURAT",
    name: "Surat",
    state: "Gujarat",
    urban_local_body: "Surat Municipal Corporation",
    centre: [21.1702, 72.8311],
    bbox: [21.05, 72.7, 21.29, 72.96],
    data_loaded: true,
  },
  {
    city_id: "CITY-AHMEDABAD",
    name: "Ahmedabad",
    state: "Gujarat",
    urban_local_body: "Ahmedabad Municipal Corporation",
    centre: [23.0225, 72.5714],
    bbox: [22.91, 72.45, 23.15, 72.71],
    data_loaded: true,
  },
  {
    city_id: "CITY-GUWAHATI",
    name: "Guwahati",
    state: "Assam",
    urban_local_body: "Guwahati Municipal Corporation",
    centre: [26.1445, 91.7362],
    bbox: [26.05, 91.6, 26.24, 91.9],
    data_loaded: true,
  },
  {
    city_id: "CITY-KARNAL",
    name: "Karnal",
    state: "Haryana",
    urban_local_body: "Municipal Corporation Karnal",
    centre: [29.6803, 76.9896],
    bbox: [29.61, 76.91, 29.75, 77.07],
    data_loaded: true,
  },
];

export const DEFAULT_CITY_ID: CityId = "CITY-SURAT";

export function cityProfile(id: CityId): CityProfile {
  return CITIES.find((c) => c.city_id === id) ?? CITIES[0]!;
}

export function isCityId(value: string | null | undefined): value is CityId {
  return Boolean(value) && CITIES.some((c) => c.city_id === value);
}
