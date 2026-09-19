// Per-city datasets.
//
// The Jalandhar dataset is the existing, unchanged Jalandhar record set. The
// other cities are registered with empty record sets until their government
// registers are ingested — records are never copied or inferred between
// cities.

import { agencies, assets, evidence, projects, schemes } from "../jalandhar";
import type { Agency, Asset, Evidence, Project, Scheme } from "../types";
import { CITIES, type CityId, type CityProfile, cityProfile } from "./registry";

export interface CityDataset {
  profile: CityProfile;
  projects: Project[];
  assets: Asset[];
  schemes: Scheme[];
  agencies: Agency[];
  evidence: Evidence[];
}

const EMPTY = {
  projects: [] as Project[],
  assets: [] as Asset[],
  schemes: [] as Scheme[],
  agencies: [] as Agency[],
  evidence: [] as Evidence[],
};

const DATASETS: Record<CityId, CityDataset> = {
  "CITY-JALANDHAR": {
    profile: cityProfile("CITY-JALANDHAR"),
    projects,
    assets,
    schemes,
    agencies,
    evidence,
  },
  "CITY-THANE": { profile: cityProfile("CITY-THANE"), ...EMPTY },
  "CITY-SURAT": { profile: cityProfile("CITY-SURAT"), ...EMPTY },
  "CITY-AHMEDABAD": { profile: cityProfile("CITY-AHMEDABAD"), ...EMPTY },
  "CITY-GUWAHATI": { profile: cityProfile("CITY-GUWAHATI"), ...EMPTY },
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
