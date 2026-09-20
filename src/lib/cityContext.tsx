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

// A new key intentionally retires the former Jalandhar-era default. Once a
// visitor makes a city choice in this version, that deliberate choice persists.
const KEY = "mohua.activeCity.v2";

/**
 * Geographic scope. The application operates either nationally (no city is
 * active) or inside one canonical city. The stored value "ALL" is the national
 * scope; it is kept as the URL token so existing links stay valid.
 */
export const ALL_CITIES = "ALL" as const;
export const NATIONAL = ALL_CITIES;
export type CitySelection = CityId | typeof ALL_CITIES;

/** Single scope state the header, sidebar and routing all derive from. */
export type Scope = { type: "NATIONAL"; cityId: null } | { type: "CITY"; cityId: CityId };

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
  /** True when the national scope is active (no city is selected). */
  portfolio: boolean;
  /** The one scope state: national, or a canonical city. */
  scope: Scope;
  /** Change scope. `to` optionally moves to a destination valid in that scope. */
  setCityId: (id: CitySelection, to?: string) => void;
  setScope: (scope: Scope, to?: string) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const urlCity = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>)["city"],
  });

  const isNationalPath =
    pathname.startsWith("/national") || pathname.startsWith("/states") || pathname.startsWith("/compare");
  const [selection, setSelection] = useState<CitySelection>(isNationalPath ? ALL_CITIES : DEFAULT_CITY_ID);
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
    (next: CitySelection, to?: string) => {
      apply(next);
      navigate({
        to: to ?? pathname,
        search: (prev: Record<string, unknown>) => ({ ...prev, city: next }),
      } as never);
    },
    [apply, navigate, pathname],
  );

  // National destinations carry no city. Landing on one clears the city scope
  // so the header and sidebar never imply a city while operating nationally.
  useEffect(() => {
    if (!restored) return;
    const nationalRoute =
      pathname.startsWith("/national") ||
      pathname.startsWith("/states") ||
      pathname.startsWith("/compare");
    if (nationalRoute && selection !== ALL_CITIES) {
      apply(ALL_CITIES);
      navigate({
        to: pathname,
        search: (prev: Record<string, unknown>) => ({ ...prev, city: ALL_CITIES }),
        replace: true,
      } as never);
    }
  }, [pathname, selection, restored, apply, navigate]);

  const setScope = useCallback(
    (next: Scope, to?: string) => {
      setCityId(next.type === "NATIONAL" ? NATIONAL : next.cityId, to);
    },
    [setCityId],
  );

  const value = useMemo<CityContextValue>(() => {
    const dataset = datasetFor(cityId);
    const national = selection === ALL_CITIES;
    return {
      cityId,
      city: dataset.profile,
      dataset,
      cities: CITIES,
      selection,
      portfolio: national,
      scope: national
        ? { type: "NATIONAL", cityId: null }
        : { type: "CITY", cityId: selection as CityId },
      setCityId,
      setScope,
    };
  }, [cityId, selection, setCityId, setScope]);

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
