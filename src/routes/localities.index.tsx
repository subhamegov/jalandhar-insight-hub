import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy } from "react";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import { fourCityBundle, localityRecords } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";
import { count } from "@/lib/format";

const PointMap = lazy(() => import("@/components/map/PointMap"));

export const Route = createFileRoute("/localities/")({
  head: () => ({
    meta: [
      { title: "Localities | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Locality-level view of housing, municipal assets, projects, service observations and grievances for the selected city.",
      },
      { property: "og:title", content: "Localities: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Explore the localities of the selected city and the records attached to each.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LocalitiesIndex,
});

function LocalitiesIndex() {
  const { city } = useCity();
  const { localities, localityId, setLocalityId } = useGeo();
  const [query, setQuery] = useState("");
  const bundle = fourCityBundle(city.city_id);

  const rows = useMemo(
    () =>
      localities
        .map((l) => {
          const rec = localityRecords(city.city_id, l.id);
          return {
            locality: l,
            projects: rec?.projects.length ?? 0,
            assets: rec?.assets.length ?? 0,
            housing: rec?.housing.length ?? 0,
            grievances: rec?.grievances.length ?? 0,
            signals: rec?.signals.length ?? 0,
          };
        })
        .filter((r) =>
          query.trim()
            ? `${r.locality.name} ${r.locality.id}`.toLowerCase().includes(query.trim().toLowerCase())
            : true,
        )
        .sort((a, b) => a.locality.name.localeCompare(b.locality.name)),
    [city.city_id, localities, query],
  );

  if (localities.length === 0) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: "Localities" }]} />
        <PageHeader
          title={`Localities: ${city.name}`}
          subtitle="No locality records are loaded for this city."
        />
        <Panel>
          <p className="text-sm text-muted-foreground">
            The locality layer comes from the four-city dataset, which does not cover {city.name}.
            No locality anchors are shown rather than borrowing another city's geography.
          </p>
          <Link to="/wards" className="mt-2 inline-block text-sm underline underline-offset-2">
            Ward View for {city.name}
          </Link>
        </Panel>
      </div>
    );
  }

  const points: MapPoint[] = rows.map((r) => ({
    id: r.locality.id,
    name: r.locality.name,
    sub: `${count(r.projects)} projects · ${count(r.assets)} assets`,
    lat: r.locality.coordinates[1],
    lon: r.locality.coordinates[0],
    verified: r.locality.is_official_boundary,
  }));

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Localities" }]} />
      <PageHeader
        title={`Localities: ${city.name}`}
        subtitle={`${localities.length} locality anchors supplied for ${city.urban_local_body}. Each anchor is an illustrative point, not a ward boundary, and carries no statutory ward identity.`}
      />

      <Panel
        title="Locality anchors"
        description="Illustrative points from the supplied geography registry. Not official boundaries."
      >
        <div className="h-[20rem] w-full overflow-hidden rounded-sm border border-border sm:h-[26rem]">
          <ClientOnly
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <PointMap
              points={points}
              centre={city.centre}
              zoom={11}
              selectedId={localityId}
              onSelect={setLocalityId}
              fitToPoints
            />
          </ClientOnly>
        </div>
        {bundle ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Geography caveat from the source: {bundle.city.geography_caveat}.
          </p>
        ) : null}
      </Panel>

      <Panel title="All localities" description="Search by locality name or identifier.">
        <input
          aria-label="Search localities"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search localities"
          className="mb-3 w-full max-w-sm rounded-sm border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="field-label py-2">Locality</th>
                <th className="field-label py-2">Identifier</th>
                <th className="field-label py-2">Projects</th>
                <th className="field-label py-2">Assets</th>
                <th className="field-label py-2">Housing</th>
                <th className="field-label py-2">Grievances</th>
                <th className="field-label py-2">Signals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.locality.id} className="border-b border-border/60">
                  <td className="py-2">
                    <Link
                      to="/localities/$localityId"
                      params={{ localityId: r.locality.id }}
                      onClick={() => setLocalityId(r.locality.id)}
                      className="font-medium underline underline-offset-2"
                    >
                      {r.locality.name}
                    </Link>
                  </td>
                  <td className="num py-2 text-xs text-muted-foreground">{r.locality.id}</td>
                  <td className="num py-2">{count(r.projects)}</td>
                  <td className="num py-2">{count(r.assets)}</td>
                  <td className="num py-2">{count(r.housing)}</td>
                  <td className="num py-2">{count(r.grievances)}</td>
                  <td className="num py-2">{count(r.signals)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
