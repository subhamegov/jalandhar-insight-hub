import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadge";
import { assets, projects } from "@/data/selectors";
import { text } from "@/lib/format";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "City Map | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Geographic view of government projects and infrastructure assets across Jalandhar.",
      },
      { property: "og:title", content: "City Map — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Where government projects and assets are physically located in Jalandhar.",
      },
    ],
  }),
  component: CityMap,
});

// Bounding box used to place points on the schematic plan view.
const BOUNDS = { minLat: 31.27, maxLat: 31.38, minLon: 75.53, maxLon: 75.65 };

function position(lat: number, lon: number) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { left: `${Math.min(97, Math.max(3, x))}%`, top: `${Math.min(96, Math.max(4, y))}%` };
}

function CityMap() {
  const [layer, setLayer] = useState<"projects" | "assets">("projects");
  const [selected, setSelected] = useState<string | null>(null);

  const points =
    layer === "projects"
      ? projects
          .filter((p) => p.latitude !== null && p.longitude !== null)
          .map((p) => ({
            id: p.project_id,
            name: p.project_name,
            lat: p.latitude as number,
            lon: p.longitude as number,
            sub: `${text(p.sector)} · ${text(p.locality)}`,
          }))
      : assets
          .filter((a) => a.latitude !== null && a.longitude !== null)
          .map((a) => ({
            id: a.asset_id,
            name: a.asset_name,
            lat: a.latitude as number,
            lon: a.longitude as number,
            sub: `${text(a.asset_type)} · ${text(a.operational_status)}`,
          }));

  const missing =
    layer === "projects"
      ? projects.filter((p) => p.latitude === null).length
      : assets.filter((a) => a.latitude === null).length;

  return (
    <>
      <PageHeader
        title="City Map"
        subtitle="Schematic plan view. Coordinates are approximate placements for orientation until surveyed geometry is attached."
        actions={
          <div className="flex rounded-sm border border-border">
            {(["projects", "assets"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className={
                  "px-3 py-1.5 text-xs capitalize " +
                  (layer === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                {l}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-muted/50">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "10% 10%",
            }}
          />
          {points.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setSelected(pt.id)}
              style={position(pt.lat, pt.lon)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              title={pt.name}
            >
              <span
                className={
                  "block h-3 w-3 rounded-full border-2 border-card " +
                  (selected === pt.id ? "bg-destructive" : "bg-primary")
                }
              />
            </button>
          ))}
          <p className="absolute right-2 bottom-2 text-[11px] text-muted-foreground">
            Jalandhar approximate extent · {points.length} located, {missing} without coordinates
          </p>
        </div>

        <Panel title={layer === "projects" ? "Located projects" : "Located assets"}>
          <ul className="divide-y divide-border">
            {points.map((pt) => (
              <li
                key={pt.id}
                className={
                  "cursor-pointer py-2 " + (selected === pt.id ? "bg-accent/50" : "")
                }
                onMouseEnter={() => setSelected(pt.id)}
              >
                {layer === "projects" ? (
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: pt.id }}
                    className="text-sm font-medium hover:underline"
                  >
                    {pt.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{pt.name}</span>
                )}
                <p className="text-xs text-muted-foreground">{pt.sub}</p>
                <p className="num text-[11px] text-muted-foreground">
                  {pt.lat.toFixed(4)}, {pt.lon.toFixed(4)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Projects without a mapped location" className="mt-4">
        <ul className="divide-y divide-border">
          {projects
            .filter((p) => p.latitude === null)
            .map((p) => (
              <li key={p.project_id} className="flex justify-between py-2 text-sm">
                {p.project_name}
                <StatusBadge status={p.status} />
              </li>
            ))}
          {projects.every((p) => p.latitude !== null) ? (
            <li className="py-2 text-sm text-muted-foreground">
              Every project record has approximate coordinates.
            </li>
          ) : null}
        </ul>
      </Panel>
    </>
  );
}
