import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { housingIntelligence, housingSummary } from "@/data/four-city/housing";
import { DATASET_REFERENCE_DATE } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { count, dateText, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/housing/")({
  head: () => ({
    meta: [
      { title: "Housing service readiness | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Sanctioned, grounded, completed, occupied and serviced houses, with the water, sewerage, waste and transport connections recorded against each housing record.",
      },
      {
        property: "og:title",
        content: "Housing service readiness: MoHUA Urban Intelligence",
      },
      {
        property: "og:description",
        content:
          "How many completed homes are ready for families to live in with essential municipal services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HousingIndex,
});

type SortKey = "gap" | "completed" | "occupied" | "locality";

function HousingIndex() {
  const { city, dataset } = useCity();
  const rows = useMemo(() => housingIntelligence(city.city_id), [city.city_id]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("gap");
  const [onlyGaps, setOnlyGaps] = useState(false);

  if (!dataset.synthetic || rows.length === 0) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Housing" }]} />
        <PageHeader
          title={`Housing service readiness is not available for ${city.name}`}
          subtitle="This view needs housing records that carry water, sewerage, waste and transport readiness fields. No such records are loaded for this city."
        />
        <Panel title="What to use instead">
          <p className="text-sm text-muted-foreground">
            For {city.name}, the project register, assets and outcomes views work from this city's
            own records.
          </p>
          <Link to="/projects" className="mt-2 inline-block text-sm underline underline-offset-2">
            Open the project register
          </Link>
        </Panel>
      </div>
    );
  }

  const s = housingSummary(rows);

  const filtered = rows.filter((r) => {
    if (onlyGaps && r.gaps.length === 0) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return [
      r.record.housing_id,
      r.record.project_id ?? "",
      r.record.mission ?? "",
      r.record.vertical ?? "",
      r.locality?.name ?? "",
      r.locality?.id ?? "",
      r.project?.project_name ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const worstGap = (r: (typeof rows)[number]) =>
    r.gaps.reduce((m, g) => Math.max(m, g.shortfall), 0);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "gap") return worstGap(b) - worstGap(a);
    if (sort === "completed") return (b.record.completed_houses ?? 0) - (a.record.completed_houses ?? 0);
    if (sort === "occupied") return (b.record.occupied_houses ?? 0) - (a.record.occupied_houses ?? 0);
    return (a.locality?.name ?? "").localeCompare(b.locality?.name ?? "");
  });

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Housing" }]} />
      <PageHeader
        title={`${city.name}: houses built, homes serviced`}
        subtitle={`How many completed homes are ready for families to live in with essential municipal services. ${count(rows.length)} sampled housing records, observed ${dateText(DATASET_REFERENCE_DATE)}. These are sampled synthetic records, not citywide totals and not government statistics.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Sanctioned" value={s.sanctioned} note="Approved under the missions" />
        <Tile label="Grounded" value={s.grounded} note="Construction started" />
        <Tile label="Completed" value={s.completed} note="Construction finished" />
        <Tile
          label="Occupied"
          value={s.occupied}
          note="Recorded as occupied. Not inferred from completion."
        />
        <Tile label="Water connection recorded" value={s.waterReady} note="Connection, not supply reliability" />
        <Tile label="Sewer connection recorded" value={s.sewerReady} note="Connection, not treatment capacity" />
        <Tile label="Waste collection recorded" value={s.wasteReady} note="Route covers the house" />
        <Tile
          label="All three connections"
          value={s.fullyServiceReady}
          note="Highest number that could hold water, sewer and waste together. Not a verified count."
        />
      </div>

      <Panel
        title="What these numbers do and do not show"
        description="Read each step from its own field."
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Completion is construction finished. It is not evidence that anyone lives there.</li>
          <li>Occupancy is read from the occupied-houses field only.</li>
          <li>
            A recorded connection means the link exists in the record. It does not show supply
            hours, treatment capacity in operation, or whether collection happened.
          </li>
          <li>
            {count(s.notOperationalAssets)} connected assets across these records are not in
            operational service.
          </li>
          <li>
            {count(s.withTransportStop)} of {count(s.records)} housing records have a transport stop
            record attached.
          </li>
        </ul>
      </Panel>

      <Panel title="Housing records" description="Open a record to trace its infrastructure, services, grievances and investment.">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search housing, project, mission or locality"
            aria-label="Search housing records"
            className="w-full min-w-0 rounded-sm border border-border bg-background px-3 py-2 text-sm sm:w-72"
          />
          <select
            aria-label="Sort housing records"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="gap">Sort: largest service gap</option>
            <option value="completed">Sort: completed houses</option>
            <option value="occupied">Sort: occupied houses</option>
            <option value="locality">Sort: locality</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyGaps}
              onChange={(e) => setOnlyGaps(e.target.checked)}
            />
            Only records with a service gap
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {[
                  "Housing record",
                  "Locality",
                  "Mission",
                  "Sanctioned",
                  "Grounded",
                  "Completed",
                  "Occupied",
                  "Water",
                  "Sewer",
                  "Waste",
                  "Largest gap",
                ].map((h) => (
                  <th key={h} className="field-label py-2 pr-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.record.housing_id} className="border-b border-border/60">
                  <td className="py-2 pr-3 align-top">
                    <Link
                      to="/housing/$housingId"
                      params={{ housingId: r.record.housing_id }}
                      className="num underline underline-offset-2"
                    >
                      {r.record.housing_id}
                    </Link>
                    <div className="text-xs text-muted-foreground">{labelise(r.record.vertical)}</div>
                  </td>
                  <td className="py-2 pr-3 align-top">
                    {r.locality ? (
                      <Link
                        to="/localities/$localityId"
                        params={{ localityId: r.locality.id }}
                        className="underline underline-offset-2"
                      >
                        {r.locality.name}
                      </Link>
                    ) : (
                      text(null)
                    )}
                  </td>
                  <td className="py-2 pr-3 align-top">{labelise(r.record.mission)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.sanctioned_houses)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.grounded_houses)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.completed_houses)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.occupied_houses)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.water_ready_houses)}</td>
                  <td className="num py-2 pr-3 align-top">{count(r.record.sewer_ready_houses)}</td>
                  <td className="num py-2 pr-3 align-top">
                    {count(r.record.waste_collection_ready_houses)}
                  </td>
                  <td className="py-2 pr-3 align-top text-xs">
                    {r.gaps.length === 0 ? (
                      <span className="text-muted-foreground">No recorded gap</span>
                    ) : (
                      <>
                        <span className="num font-semibold">{count(worstGap(r))}</span>{" "}
                        <span className="text-muted-foreground">
                          {r.gaps.reduce((a, b) => (b.shortfall > a.shortfall ? b : a)).label.toLowerCase()}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No housing records match this filter.</p>
        ) : null}
      </Panel>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="digit-card p-3">
      <p className="field-label">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{count(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
