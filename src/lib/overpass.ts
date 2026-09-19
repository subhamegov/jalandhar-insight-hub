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

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const cache = new Map<string, OsmFeature[]>();

function bboxString(box: [number, number, number, number] = JALANDHAR_BBOX) {
  const [s, w, n, e] = box;
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

export async function fetchLayer(
  layer: MapLayer,
  signal?: AbortSignal,
  box?: [number, number, number, number],
): Promise<OsmFeature[]> {
  if (layer.source !== "osm" || layer.query.length === 0) return [];
  // Cache per city: the same layer covers different features in each bbox.
  const cacheKey = `${layer.id}@${(box ?? JALANDHAR_BBOX).join(",")}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const bbox = bboxString(box);
  const body =
    `[out:json][timeout:45];(` +
    layer.query.map((q) => `${q}(${bbox});`).join("") +
    `);out geom center tags 400;`;

  let json: { elements?: OverpassElement[] } | null = null;
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: body }),
        ...(signal ? { signal } : {}),
      });
      if (!res.ok) throw new Error(`Overpass request failed (${res.status})`);
      json = (await res.json()) as { elements?: OverpassElement[] };
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!json) throw lastError instanceof Error ? lastError : new Error("Overpass unavailable");

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
      !!geom &&
      geom.length > 3 &&
      !!first &&
      !!last &&
      first[0] === last[0] &&
      first[1] === last[1];
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
