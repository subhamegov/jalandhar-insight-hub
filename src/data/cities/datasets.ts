// Per-city datasets.
//
// Jalandhar is the existing, unchanged Jalandhar record set built from
// government sources. The other registered cities are served by the shared
// synthetic prototype dataset, which is adapted
// into the same application model, never mixed with Jalandhar records and
// never presented as government statistics.

import { agencies, assets, evidence, projects, schemes } from "../jalandhar";
import { adaptedRecords } from "../four-city/adapter";
import type { Agency, Asset, Evidence, Project, Scheme } from "../types";
import { CITIES, type CityId, type CityProfile, cityProfile } from "./registry";

export interface CityDataset {
  profile: CityProfile;
  projects: Project[];
  assets: Asset[];
  schemes: Scheme[];
  agencies: Agency[];
  evidence: Evidence[];
  /** True when the records come from the synthetic four-city dataset. */
  synthetic: boolean;
}

const EMPTY = {
  projects: [] as Project[],
  assets: [] as Asset[],
  schemes: [] as Scheme[],
  agencies: [] as Agency[],
  evidence: [] as Evidence[],
};

function fourCity(id: CityId): CityDataset {
  const records = adaptedRecords(id);
  return {
    profile: cityProfile(id),
    ...(records ?? EMPTY),
    synthetic: true,
  };
}

const DATASETS: Record<CityId, CityDataset> = {
  "CITY-JALANDHAR": {
    profile: cityProfile("CITY-JALANDHAR"),
    projects,
    assets,
    schemes,
    agencies,
    evidence,
    synthetic: false,
  },
  "CITY-THANE": fourCity("CITY-THANE"),
  "CITY-SURAT": fourCity("CITY-SURAT"),
  "CITY-AHMEDABAD": fourCity("CITY-AHMEDABAD"),
  "CITY-GUWAHATI": fourCity("CITY-GUWAHATI"),
  "CITY-KARNAL": fourCity("CITY-KARNAL"),
};

export function datasetFor(id: CityId): CityDataset {
  return DATASETS[id];
}

export function allDatasets(): CityDataset[] {
  return CITIES.map((c) => DATASETS[c.city_id]);
}

export function hasRecords(id: CityId): boolean {
  return datasetFor(id).projects.length > 0;
}
