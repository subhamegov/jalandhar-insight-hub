// Fetches OpenStreetMap features from the Overpass API for a bounding box.
// OSM is reference geography only; it never overrides government project data.

import { JALANDHAR_BBOX, type MapLayer } from "@/data/mapLayers";

export interface OsmFeature {
  id: string;
  layerId: string;
  name: string | null;
  tags: Record<string, string>;
  /** Point marker position. */
  center: [number, number] | null;
  /** Line or polygon geometry when the element is a way. */
  path: [number, number][] | null;
  isArea: boolean;
}

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const cache = new Map<string, OsmFeature[]>();

function bboxString() {
  const [s, w, n, e] = JALANDHAR_BBOX;
  return `${s},${w},${n},${e}`;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

export async function fetchLayer(layer: MapLayer, signal?: AbortSignal): Promise<OsmFeature[]> {
  if (layer.source !== "osm" || layer.query.length === 0) return [];
  const cached = cache.get(layer.id);
  if (cached) return cached;

  const bbox = bboxString();
  const body =
    `[out:json][timeout:45];(` +
    layer.query.map((q) => `${q}(${bbox});`).join("") +
    `);out geom center tags 400;`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    body: new URLSearchParams({ data: body }),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) throw new Error(`Overpass request failed (${res.status})`);
  const json = (await res.json()) as { elements?: OverpassElement[] };

  const features: OsmFeature[] = [];
  for (const el of json.elements ?? []) {
    const tags = el.tags ?? {};
    const geom = el.geometry?.map((g) => [g.lat, g.lon] as [number, number]) ?? null;
    const center: [number, number] | null =
      el.lat !== undefined && el.lon !== undefined
        ? [el.lat, el.lon]
        : el.center
          ? [el.center.lat, el.center.lon]
          : geom && geom.length > 0
            ? (geom[Math.floor(geom.length / 2)] ?? null)
            : null;
    if (!center && !geom) continue;
    const first = geom?.[0];
    const last = geom?.[geom.length - 1];
    const closed =
      !!geom && geom.length > 3 && !!first && !!last && first[0] === last[0] && first[1] === last[1];
    features.push({
      id: `${el.type}/${el.id}`,
      layerId: layer.id,
      name: tags["name"] ?? tags["name:en"] ?? null,
      tags,
      center,
      path: geom && geom.length > 1 ? geom : null,
      isArea: layer.geometry === "area" && closed,
    });
  }

  cache.set(layer.id, features);
  return features;
}
