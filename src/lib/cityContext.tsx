// Active city selection — one source of truth for the whole application.
//
// The selection lives in the URL (`?city=CITY-SURAT`, or `?city=ALL` for the
// four-city portfolio) so direct links, refresh, and browser back/forward all
// land on the same city. It is mirrored into localStorage so a visit with no
// city in the URL resumes where the user left off. Every city-aware view reads
// its records through useCity()/useCityDataset() — no component keeps its own
// city state.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { CITIES, DEFAULT_CITY_ID, isCityId, type CityId, type CityProfile } from "@/data/cities/registry";
import { datasetFor, type CityDataset } from "@/data/cities/datasets";
import { setActiveCityRecords } from "@/data/selectors";

const KEY = "mohua.activeCity.v1";

/** Explicit portfolio context covering the four prototype cities. */
export const ALL_CITIES = "ALL" as const;
export type CitySelection = CityId | typeof ALL_CITIES;

function isSelection(value: unknown): value is CitySelection {
  return value === ALL_CITIES || (typeof value === "string" && isCityId(value));
}

interface CityContextValue {
  /** The city whose records are shown. In portfolio context this is the last city used. */
  cityId: CityId;
  city: CityProfile;
  dataset: CityDataset;
  cities: CityProfile[];
  /** What the header shows: a city id, or ALL for the four-city portfolio. */
  selection: CitySelection;
  /** True when the explicit All Cities portfolio context is active. */
  portfolio: boolean;
  setCityId: (id: CitySelection) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const urlCity = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>)["city"],
  });

  const [selection, setSelection] = useState<CitySelection>(DEFAULT_CITY_ID);
  const [lastCity, setLastCity] = useState<CityId>(DEFAULT_CITY_ID);
  const [restored, setRestored] = useState(false);

  const cityId = selection === ALL_CITIES ? lastCity : selection;

  // Point the shared record selectors at the active city before children render,
  // so every view reads that city's records and never another city's.
  setActiveCityRecords(cityId);

  const apply = useCallback((next: CitySelection) => {
    setSelection(next);
    if (next !== ALL_CITIES) setLastCity(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable; selection simply does not persist */
    }
  }, []);

  // The URL wins. On first load with no city in the URL, resume the stored one.
  useEffect(() => {
    if (isSelection(urlCity)) {
      if (urlCity !== selection) apply(urlCity);
      if (!restored) setRestored(true);
      return;
    }
    if (!restored) {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(KEY);
      } catch {
        stored = null;
      }
      const next = isSelection(stored) ? stored : DEFAULT_CITY_ID;
      if (next !== selection) apply(next);
      setRestored(true);
      navigate({
        to: pathname,
        search: (prev: Record<string, unknown>) => ({ ...prev, city: next }),
        replace: true,
      } as never);
      return;
    }
    // Navigated to a link that carried no city: keep the URL in step.
    navigate({
      to: pathname,
      search: (prev: Record<string, unknown>) => ({ ...prev, city: selection }),
      replace: true,
    } as never);
  }, [urlCity, pathname, selection, restored, apply, navigate]);

  const setCityId = useCallback(
    (next: CitySelection) => {
      apply(next);
      navigate({
        to: pathname,
        search: (prev: Record<string, unknown>) => ({ ...prev, city: next }),
      } as never);
    },
    [apply, navigate, pathname],
  );

  const value = useMemo<CityContextValue>(() => {
    const dataset = datasetFor(cityId);
    return {
      cityId,
      city: dataset.profile,
      dataset,
      cities: CITIES,
      selection,
      portfolio: selection === ALL_CITIES,
      setCityId,
    };
  }, [cityId, selection, setCityId]);

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
