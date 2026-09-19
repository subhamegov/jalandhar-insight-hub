// Client-only Leaflet canvas. Rendered lazily so Leaflet never loads during SSR.
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_ZOOM, JALANDHAR_BBOX, JALANDHAR_CENTER, OSM_ATTRIBUTION } from "@/data/mapLayers";
import type { OsmFeature } from "@/lib/overpass";

export type MarkerState =
  | "announced"
  | "active"
  | "completed"
  | "operational"
  | "warning"
  | "critical"
  | "asset"
  | "location";

export interface GovPoint {
  id: string;
  kind: "project" | "asset" | "location" | "group";
  name: string;
  sub: string;
  lat: number;
  lon: number;
  state: MarkerState;
  /** Corridor or line geometry, when the record represents a corridor. */
  path?: [number, number][] | null;
  /** Number of projects sharing this representation. */
  count?: number;
}


const STATE_COLORS: Record<MarkerState, { fill: string; stroke: string }> = {
  announced: { fill: "transparent", stroke: "#1d4ed8" },
  active: { fill: "#1d4ed8", stroke: "#1e3a8a" },
  completed: { fill: "#0f766e", stroke: "#134e4a" },
  operational: { fill: "#15803d", stroke: "#14532d" },
  warning: { fill: "#d97706", stroke: "#92400e" },
  critical: { fill: "#b91c1c", stroke: "#7f1d1d" },
  asset: { fill: "#0369a1", stroke: "#0c4a6e" },
  location: { fill: "#b45309", stroke: "#78350f" },
};

export interface MapCanvasProps {
  govPoints: GovPoint[];
  osmFeatures: OsmFeature[];
  layerColors: Record<string, string>;
  selectedId: string | null;
  onSelectGov: (id: string) => void;
  onSelectOsm: (feature: OsmFeature) => void;
  /** Increment to trigger a fit-to-city. */
  fitSignal: number;
  /** Coordinates to fly to, with a nonce so repeats work. */
  focus: { lat: number; lon: number; nonce: number } | null;
  /** Reference geography of the active city. */
  centre?: [number, number];
  bbox?: [number, number, number, number];
}

export default function MapCanvas({
  govPoints,
  osmFeatures,
  layerColors,
  selectedId,
  onSelectGov,
  onSelectOsm,
  fitSignal,
  focus,
  centre = JALANDHAR_CENTER,
  bbox: cityBbox = JALANDHAR_BBOX,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const govLayerRef = useRef<L.LayerGroup | null>(null);
  const osmLayerRef = useRef<L.LayerGroup | null>(null);

  const bounds = useMemo(
    () =>
      L.latLngBounds([cityBbox[0], cityBbox[1]], [cityBbox[2], cityBbox[3]]),
    [cityBbox],
  );

  // Recentre when the user switches city.
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(centre, CITY_ZOOM, { animate: false });
  }, [centre]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: centre,
      zoom: CITY_ZOOM,
      zoomControl: true,
      preferCanvas: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);
    osmLayerRef.current = L.layerGroup().addTo(map);
    govLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // OSM reference features
  useEffect(() => {
    const group = osmLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const f of osmFeatures) {
      const color = layerColors[f.layerId] ?? "#64748b";
      if (f.path && f.path.length > 1) {
        const shape = f.isArea
          ? L.polygon(f.path, { color, weight: 1, fillOpacity: 0.18 })
          : L.polyline(f.path, { color, weight: 2, opacity: 0.8 });
        shape.on("click", () => onSelectOsm(f));
        shape.addTo(group);
      } else if (f.center) {
        const dot = L.circleMarker(f.center, {
          radius: 4,
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.7,
        });
        dot.on("click", () => onSelectOsm(f));
        dot.addTo(group);
      }
    }
  }, [osmFeatures, layerColors, onSelectOsm]);

  // Government records
  useEffect(() => {
    const group = govLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const p of govPoints) {
      const c = STATE_COLORS[p.state];
      const isSelected = p.id === selectedId;
      const count = p.count ?? 1;
      if (p.path && p.path.length > 1) {
        const line = L.polyline(p.path, {
          color: isSelected ? "#0f172a" : c.stroke,
          weight: isSelected ? 7 : 5,
          opacity: 0.85,
          dashArray: "8 5",
        });
        line.bindTooltip(`${p.name} — ${p.sub}`, { direction: "top" });
        line.on("click", () => onSelectGov(p.id));
        line.addTo(group);
      }
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: count > 1 ? Math.min(9 + Math.round(Math.sqrt(count) * 2.5), 20) : 9,
        color: isSelected ? "#0f172a" : c.stroke,
        weight: isSelected ? 4 : 2,
        fillColor: c.fill === "transparent" ? "#ffffff" : c.fill,
        fillOpacity: c.fill === "transparent" ? 0.25 : 0.9,
      });
      marker.bindTooltip(
        count > 1 ? `${p.name} — ${count} projects` : `${p.name} — ${p.sub}`,
        { direction: "top", offset: [0, -6] },
      );
      if (count > 1) {
        marker
          .bindTooltip(String(count), {
            permanent: true,
            direction: "center",
            className: "map-count-label",
          })
          .openTooltip();
      }
      marker.on("click", () => onSelectGov(p.id));
      marker.addTo(group);
    }

  }, [govPoints, selectedId, onSelectGov]);

  useEffect(() => {
    if (fitSignal > 0) mapRef.current?.fitBounds(bounds, { padding: [16, 16] });
  }, [fitSignal, bounds]);

  useEffect(() => {
    if (focus) mapRef.current?.setView([focus.lat, focus.lon], 15, { animate: true });
  }, [focus]);

  return <div ref={containerRef} className="h-full w-full" />;
}
