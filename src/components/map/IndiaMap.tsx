// Client-only national map. It draws India from a stored boundary dataset and
// uses no tile basemap, so no neighbouring country, foreign label or foreign
// boundary can appear. City markers come from the canonical city registry via
// props; this component never holds city data of its own.

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ux4g } from "@/lib/ux4gPalette";
import indiaStates from "@/data/geo/india_states.geojson.json";
import indiaOutline from "@/data/geo/india_outline.geojson.json";
import type { MapPoint } from "@/components/map/PointMap";

export interface IndiaMapProps {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/** India extent with a small ocean margin; the view can never leave it. */
const INDIA_BOUNDS = L.latLngBounds([5.5, 66.0], [38.5, 99.5]);
/** States large enough to carry a readable label at national zoom. */
const LABEL_SPAN_DEGREES = 2.8;

export default function IndiaMap({ points, selectedId = null, onSelect }: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      preferCanvas: true,
      attributionControl: true,
      maxBounds: INDIA_BOUNDS,
      maxBoundsViscosity: 1,
      worldCopyJump: false,
    });
    map.attributionControl.addAttribution("India boundary: stored national boundary dataset");

    // State boundaries: subtle context.
    const states = L.geoJSON(indiaStates as GeoJSON.GeoJsonObject, {
      style: {
        color: ux4g.neutral500,
        weight: 0.7,
        opacity: 0.55,
        fillColor: ux4g.neutral0,
        fillOpacity: 1,
      },
      interactive: false,
    }).addTo(map);

    // National boundary: the prominent outline, drawn over the states.
    L.geoJSON(indiaOutline as GeoJSON.GeoJsonObject, {
      style: { color: ux4g.neutral900, weight: 1.6, opacity: 0.9, fill: false },
      interactive: false,
    }).addTo(map);

    // Selective state labels.
    const labels = L.layerGroup().addTo(map);
    states.eachLayer((layer) => {
      const l = layer as L.Polygon & { feature?: GeoJSON.Feature };
      const name = (l.feature?.properties as { st_nm?: string } | undefined)?.st_nm;
      if (!name) return;
      const b = l.getBounds();
      const span = Math.max(
        b.getNorth() - b.getSouth(),
        b.getEast() - b.getWest(),
      );
      if (span < LABEL_SPAN_DEGREES) return;
      L.marker(b.getCenter(), {
        interactive: false,
        icon: L.divIcon({ className: "india-state-label", html: name, iconSize: [0, 0] }),
      }).addTo(labels);
    });

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => {
      try {
        map.invalidateSize(false);
        map.fitBounds(INDIA_BOUNDS, { padding: [8, 8] });
        // Zooming out beyond the national fit is not allowed.
        map.setMinZoom(map.getZoom());
        map.setMaxZoom(10);
      } catch {
        /* container not laid out yet */
      }
    });

    return () => {
      mapRef.current = null;
      markerLayerRef.current = null;
      try {
        map.remove();
      } catch {
        /* already detached */
      }
    };
  }, []);

  useEffect(() => {
    const group = markerLayerRef.current;
    if (!group) return;
    group.clearLayers();
    for (const p of points) {
      const active = p.id === selectedId;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: active ? 10 : 7,
        weight: active ? 3 : 2,
        color: p.verified ? ux4g.green900 : ux4g.orange900,
        fillColor: p.verified ? ux4g.green700 : ux4g.gold800,
        fillOpacity: p.verified ? 0.9 : 0.65,
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

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-muted"
      role="application"
      aria-label="Map of India with prototype cities"
    />
  );
}
