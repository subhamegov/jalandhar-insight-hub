import { lazy, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, PrototypeNote } from "@/components/app/Primitives";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import { CITIES } from "@/data/cities/registry";
import { datasetFor } from "@/data/cities/datasets";
import { fourCityBundle } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";
import { count, crore } from "@/lib/format";

const IndiaMap = lazy(() => import("@/components/map/IndiaMap"));

export const Route = createFileRoute("/national")({
  head: () => ({
    meta: [
      { title: "National view | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "National entry point for MoHUA Urban Intelligence: select a city and move from the national view into its localities, projects, assets and service areas.",
      },
      { property: "og:title", content: "National view: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content:
          "Select a city to investigate its localities, projects, assets and service areas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NationalView,
});


function NationalView() {
  const { setCityId } = useCity();
  const { setLocalityId } = useGeo();

  const cards = useMemo(
    () =>
      CITIES.map((profile) => {
        const dataset = datasetFor(profile.city_id);
        const bundle = fourCityBundle(profile.city_id);
        const sanctioned = dataset.projects.reduce((s, p) => s + (p.sanctioned_cost_cr ?? 0), 0);
        return {
          profile,
          dataset,
          localities: bundle?.localities.length ?? 0,
          assets: dataset.assets.length,
          projects: dataset.projects.length,
          sanctioned,
        };
      }),
    [],
  );

  const points: MapPoint[] = cards.map((c) => ({
    id: c.profile.city_id,
    name: c.profile.name,
    sub: `${c.profile.state} · ${count(c.projects)} project records`,
    lat: c.profile.centre[0],
    lon: c.profile.centre[1],
    verified: !c.dataset.synthetic,
  }));

  const open = (id: (typeof CITIES)[number]["city_id"]) => {
    setLocalityId(null);
    // One scope change: the city becomes the active scope and its overview opens.
    setCityId(id, "/");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="National view"
        subtitle="Explore urban systems and delivery across the prototype cities."
        note={<PrototypeNote text={`${CITIES.length} cities. Not a national statistic`} />}
      />

      <Panel
        title="Cities in this prototype"
        description="Map positions are approximate city anchors for orientation only, not municipal boundaries."
      >
        <div className="h-[22rem] w-full overflow-hidden rounded-sm border border-border sm:h-[28rem]">
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <IndiaMap
              points={points}
              
              onSelect={(id) => open(id as (typeof CITIES)[number]["city_id"])}
            />
          </ClientOnly>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Solid markers carry government-sourced records. Dashed markers are illustrative anchors
          for cities served by synthetic prototype records.
        </p>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <article
            key={c.profile.city_id}
            className="digit-card p-4"
          >
            <p className="field-label">{c.profile.city_id}</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              {c.profile.name}, {c.profile.state}
            </h2>
            <p className="text-xs text-muted-foreground">{c.profile.urban_local_body}</p>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Project records" value={count(c.projects)} />
              <Stat label="Asset records" value={count(c.assets)} />
              <Stat label="Localities" value={c.localities ? count(c.localities) : "Not available"} />
              <Stat
                label="Sanctioned in records"
                value={c.sanctioned > 0 ? crore(c.sanctioned) : "Not available"}
              />
            </dl>

            <p className="mt-3 text-xs text-muted-foreground">
              {c.dataset.synthetic
                ? "Synthetic prototype records. Not government statistics, not citywide totals."
                : "Government-sourced records compiled for this city."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => open(c.profile.city_id)}
                className="rounded-sm border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                Open {c.profile.name}
              </button>
              {c.localities > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocalityId(null);
                    setCityId(c.profile.city_id, "/localities");
                  }}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  Localities
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="num text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
