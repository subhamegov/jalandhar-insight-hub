// Geographic context: the place the user is currently investigating.
//
// The hierarchy is India > State > City > Locality > entity. The city lives in
// the city context; the locality selected inside that city lives here so it
// survives navigation between the locality, project, asset and service-area
// views. Nothing here invents geography — a locality is only ever one of the
// supplied locality anchors for the active city.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCity } from "@/lib/cityContext";
import { fourCityBundle } from "@/data/four-city/dataset";
import type { Locality } from "@/data/four-city/types";

const KEY = "mohua.activeLocality.v1";

interface GeoContextValue {
  /** Localities supplied for the active city (empty when the city has none). */
  localities: Locality[];
  localityId: string | null;
  locality: Locality | null;
  setLocalityId: (id: string | null) => void;
}

const GeoContext = createContext<GeoContextValue | null>(null);

export function GeoProvider({ children }: { children: ReactNode }) {
  const { cityId } = useCity();
  const [selected, setSelected] = useState<string | null>(null);

  const localities = useMemo(() => fourCityBundle(cityId)?.localities ?? [], [cityId]);

  // Restore the last locality, but only when it belongs to the active city.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      setSelected(stored && localities.some((l) => l.id === stored) ? stored : null);
    } catch {
      setSelected(null);
    }
  }, [localities]);

  const setLocalityId = useCallback((id: string | null) => {
    setSelected(id);
    try {
      if (id) window.localStorage.setItem(KEY, id);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable; selection simply does not persist */
    }
  }, []);

  const value = useMemo<GeoContextValue>(() => {
    const localityId = selected && localities.some((l) => l.id === selected) ? selected : null;
    return {
      localities,
      localityId,
      locality: localityId ? (localities.find((l) => l.id === localityId) ?? null) : null,
      setLocalityId,
    };
  }, [localities, selected, setLocalityId]);

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextValue {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error("useGeo must be used inside GeoProvider");
  return ctx;
}
