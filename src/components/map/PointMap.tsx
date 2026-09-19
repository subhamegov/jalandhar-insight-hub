// Client-only Leaflet point map, used for the national city overview and for
// locality anchors. It shares the map framework, tile source and attribution
// used by the City Map — no second mapping library is introduced.
//
// Every point drawn here is a position anchor. Points marked verified=false are
// illustrative anchors from the synthetic dataset: they are not surveyed
// locations and never a boundary.

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_ATTRIBUTION } from "@/data/mapLayers";

export interface MapPoint {
  id: string;
  name: string;
  sub?: string;
  lat: number;
  lon: number;
  /** False when the position is an illustrative anchor, not a verified location. */
  verified: boolean;
}

export interface PointMapProps {
  points: MapPoint[];
  centre: [number, number];
  zoom: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  fitToPoints?: boolean;
}

export default function PointMap({
  points,
  centre,
  zoom,
  selectedId = null,
  onSelect,
  fitToPoints = false,
}: PointMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const bounds = useMemo(() => {
    if (!fitToPoints || points.length === 0) return null;
    return L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
  }, [fitToPoints, points]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: centre,
      zoom,
      zoomControl: true,
      preferCanvas: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Leaflet throws if the map is resized or moved before its panes are laid
  // out, so view changes run on the next frame and are guarded.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;
      try {
        map.invalidateSize(false);
        map.setView(centre, zoom, { animate: false });
      } catch {
        /* container not laid out yet */
      }
    });
    return () => cancelAnimationFrame(id);
  }, [centre, zoom]);

  useEffect(() => {
    if (!bounds) return;
    const id = requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;
      try {
        map.invalidateSize(false);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {
        /* container not laid out yet */
      }
    });
    return () => cancelAnimationFrame(id);
  }, [bounds]);

  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const p of points) {
      const active = p.id === selectedId;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: active ? 10 : 7,
        weight: active ? 3 : 2,
        color: p.verified ? "#134e4a" : "#92400e",
        fillColor: p.verified ? "#0f766e" : "#d97706",
        fillOpacity: p.verified ? 0.85 : 0.55,
        dashArray: p.verified ? undefined : "3 2",
      });
      marker.bindTooltip(
        `<strong>${p.name}</strong>${p.sub ? `<br/>${p.sub}` : ""}<br/>${
          p.verified ? "Verified position" : "Illustrative anchor — not a boundary"
        }`,
        { direction: "top" },
      );
      marker.on("click", () => selectRef.current?.(p.id));
      marker.addTo(group);
    }
  }, [points, selectedId]);

  return <div ref={containerRef} className="h-full w-full" role="application" aria-label="Map" />;
}
