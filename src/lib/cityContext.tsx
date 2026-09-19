// Active city selection.
//
// The selection is held in React state so server and client render the same
// default, then restored from localStorage after mount. Every city-aware view
// reads its records through useCityDataset().

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CITIES, DEFAULT_CITY_ID, isCityId, type CityId, type CityProfile } from "@/data/cities/registry";
import { datasetFor, type CityDataset } from "@/data/cities/datasets";

const KEY = "mohua.activeCity.v1";

interface CityContextValue {
  cityId: CityId;
  city: CityProfile;
  dataset: CityDataset;
  cities: CityProfile[];
  setCityId: (id: CityId) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [cityId, setCity] = useState<CityId>(DEFAULT_CITY_ID);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (isCityId(stored)) setCity(stored);
    } catch {
      /* storage unavailable; selection simply does not persist */
    }
  }, []);

  const setCityId = useCallback((id: CityId) => {
    setCity(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CityContextValue>(() => {
    const dataset = datasetFor(cityId);
    return { cityId, city: dataset.profile, dataset, cities: CITIES, setCityId };
  }, [cityId, setCityId]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error("useCity must be used inside CityProvider");
  return ctx;
}

export function useCityDataset(): CityDataset {
  return useCity().dataset;
}
