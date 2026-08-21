import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/Primitives";
import { StatusBadge, EvidenceBadge } from "@/components/app/StatusBadge";
import { ClientOnly } from "@/components/map/ClientOnly";
import { DEFAULT_SHARED_FILTERS, readSharedFilters, writeSharedFilters } from "@/lib/sharedFilters";
import type { GovPoint, MarkerState } from "@/components/map/MapCanvas";
import { assets, evidence, projects } from "@/data/selectors";
import { priorityLocations, LOCATION_CATEGORY_LABELS } from "@/data/mapFeatures";
import {
  CATEGORY_LABELS,
  MAP_LAYERS,
  OSM_ATTRIBUTION,
  type LayerCategory,
  type MapLayer,
} from "@/data/mapLayers";
import { fetchLayer, type OsmFeature } from "@/lib/overpass";
import { crore, dateText, labelise, percent, text } from "@/lib/format";
import type { Project, ProjectStatus } from "@/data/types";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "City Map | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Geospatial operating map of Jalandhar on an OpenStreetMap base layer, showing government projects, assets and city infrastructure.",
      },
      { property: "og:title", content: "City Map — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content:
          "Toggle infrastructure layers, locate government projects and move between the map and the project register.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CityMap,
});

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

function markerState(status: ProjectStatus, delayed: boolean): MarkerState {
  if (status === "stalled" || status === "cancelled") return "critical";
  if (delayed) return "warning";
  if (status === "operational" || status === "commissioned") return "operational";
  if (status === "completed" || status === "substantially_complete") return "completed";
  if (status === "under_construction" || status === "awarded" || status === "tendered")
    return "active";
  return "announced";
}

const MARKER_LEGEND: { state: MarkerState; label: string }[] = [
  { state: "announced", label: "Announced or sanctioned" },
  { state: "active", label: "Under construction" },
  { state: "completed", label: "Completed" },
  { state: "operational", label: "Operational" },
  { state: "warning", label: "Delayed" },
  { state: "critical", label: "Stalled" },
  { state: "asset", label: "Government asset" },
  { state: "location", label: "Priority location" },
];

const LEGEND_COLORS: Record<MarkerState, string> = {
  announced: "#ffffff",
  active: "#1d4ed8",
  completed: "#0f766e",
  operational: "#15803d",
  warning: "#d97706",
  critical: "#b91c1c",
  asset: "#0369a1",
  location: "#b45309",
};

const CATEGORY_ORDER: LayerCategory[] = [
  "government",
  "administrative",
  "transport",
  "water",
  "wastewater",
  "solid_waste",
  "environment",
  "public_infrastructure",
  "land_use",
];

const INVESTMENT_RANGES = [
  { id: "all", label: "Any investment" },
  { id: "lt50", label: "Under ₹50 cr", test: (v: number) => v < 50 },
  { id: "50to500", label: "₹50 cr – ₹500 cr", test: (v: number) => v >= 50 && v <= 500 },
  { id: "gt500", label: "Above ₹500 cr", test: (v: number) => v > 500 },
  { id: "unknown", label: "Value not available" },
];

function uniq(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}

function isDelayedProject(p: Project) {
  return p.status === "stalled" || (p.delay_days !== null && p.delay_days > 0);
}

type Selection =
  | { kind: "project"; id: string }
  | { kind: "asset"; id: string }
  | { kind: "location"; id: string }
  | { kind: "osm"; feature: OsmFeature }
  | null;

function CityMap() {
  const [search, setSearch] = useState("");
  const [activeLayers, setActiveLayers] = useState<string[]>(
    MAP_LAYERS.filter((l) => l.defaultOn).map((l) => l.id),
  );
  const [osmData, setOsmData] = useState<Record<string, OsmFeature[]>>({});
  const [loadingLayers, setLoadingLayers] = useState<string[]>([]);
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Selection>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const [focus, setFocus] = useState<{ lat: number; lon: number; nonce: number } | null>(null);

  const [sector, setSector] = useState("all");
  const [scheme, setScheme] = useState("all");
  const [status, setStatus] = useState("all");
  const [implementing, setImplementing] = useState("all");
  const [owning, setOwning] = useState("all");
  const [ward, setWard] = useState("all");
  const [investment, setInvestment] = useState("all");
  const [completionYear, setCompletionYear] = useState("all");
  const [quality, setQuality] = useState("all");

  // Filters carried over from the project register, and kept in step with it.
  useEffect(() => {
    const shared = readSharedFilters();
    if (shared.sector !== "all") setSector(shared.sector);
    if (shared.scheme !== "all") setScheme(shared.scheme);
    if (shared.status !== "all") setStatus(shared.status);
    if (shared.agency !== "all") setImplementing(shared.agency);
    if (shared.ward !== "all") setWard(shared.ward);
    if (shared.query) setSearch(shared.query);
    // Applied once on entry so the review context is not lost.
  }, []);

  useEffect(() => {
    writeSharedFilters({ sector, scheme, status, agency: implementing, ward, query: search });
  }, [sector, scheme, status, implementing, ward, search]);

  function resetFilters() {
    setSearch("");
    setSector("all");
    setScheme("all");
    setStatus("all");
    setImplementing("all");
    setOwning("all");
    setWard("all");
    setInvestment("all");
    setCompletionYear("all");
    setQuality("all");
    writeSharedFilters(DEFAULT_SHARED_FILTERS);
  }

  // Load OSM layers on demand.
  useEffect(() => {
    const pending = activeLayers
      .map((id) => MAP_LAYERS.find((l) => l.id === id))
      .filter((l): l is MapLayer => Boolean(l && l.source === "osm" && l.query.length > 0))
      .filter((l) => !osmData[l.id] && !loadingLayers.includes(l.id) && !layerErrors[l.id]);
    if (pending.length === 0) return;
    setLoadingLayers((prev) => [...prev, ...pending.map((l) => l.id)]);
    for (const layer of pending) {
      fetchLayer(layer)
        .then((features) => setOsmData((prev) => ({ ...prev, [layer.id]: features })))
        .catch((err: unknown) =>
          setLayerErrors((prev) => ({
            ...prev,
            [layer.id]: err instanceof Error ? err.message : "Could not load layer",
          })),
        )
        .finally(() => setLoadingLayers((prev) => prev.filter((id) => id !== layer.id)));
    }
  }, [activeLayers, osmData, loadingLayers, layerErrors]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = INVESTMENT_RANGES.find((r) => r.id === investment);
    return projects.filter((p) => {
      if (sector !== "all" && p.sector !== sector) return false;
      if (scheme !== "all" && p.scheme !== scheme) return false;
      if (status !== "all" && p.status !== status) return false;
      if (implementing !== "all" && p.implementing_agency !== implementing) return false;
      if (owning !== "all" && p.owning_agency !== owning) return false;
      if (ward !== "all" && (p.ward ?? "Not available") !== ward) return false;
      if (quality !== "all" && p.evidence_quality !== quality) return false;
      if (investment === "unknown" && p.sanctioned_cost !== null) return false;
      if (range?.test) {
        if (p.sanctioned_cost === null || !range.test(p.sanctioned_cost)) return false;
      }
      if (completionYear !== "all") {
        const year = (p.planned_end_date ?? "").slice(0, 4);
        if (completionYear === "unknown" ? year !== "" : year !== completionYear) return false;
      }
      if (q) {
        const hay = [p.project_name, p.locality, p.sector, p.implementing_agency, p.scheme]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    search,
    sector,
    scheme,
    status,
    implementing,
    owning,
    ward,
    investment,
    completionYear,
    quality,
  ]);

  const govPoints: GovPoint[] = useMemo(() => {
    const points: GovPoint[] = [];
    if (activeLayers.includes("gov_projects")) {
      for (const p of filteredProjects) {
        if (p.latitude === null || p.longitude === null) continue;
        points.push({
          id: p.project_id,
          kind: "project",
          name: p.project_name,
          sub: `${labelise(p.status)} · ${text(p.sector)}`,
          lat: p.latitude,
          lon: p.longitude,
          state: markerState(p.status, isDelayedProject(p)),
        });
      }
    }
    if (activeLayers.includes("gov_assets")) {
      for (const a of assets) {
        if (a.latitude === null || a.longitude === null) continue;
        points.push({
          id: a.asset_id,
          kind: "asset",
          name: a.asset_name,
          sub: `${text(a.asset_type)} · ${text(a.operational_status)}`,
          lat: a.latitude,
          lon: a.longitude,
          state: "asset",
        });
      }
    }
    if (activeLayers.includes("gov_locations")) {
      for (const l of priorityLocations) {
        points.push({
          id: l.location_id,
          kind: "location",
          name: l.name,
          sub: LOCATION_CATEGORY_LABELS[l.category],
          lat: l.latitude,
          lon: l.longitude,
          state: "location",
        });
      }
    }
    return points;
  }, [activeLayers, filteredProjects]);

  const osmFeatures = useMemo(
    () => activeLayers.flatMap((id) => osmData[id] ?? []),
    [activeLayers, osmData],
  );

  const layerColors = useMemo(() => Object.fromEntries(MAP_LAYERS.map((l) => [l.id, l.color])), []);

  const selectedId = selection && selection.kind !== "osm" ? selection.id : null;

  const handleSelectGov = useCallback((id: string) => {
    if (id.startsWith("PRJ")) setSelection({ kind: "project", id });
    else if (id.startsWith("AST")) setSelection({ kind: "asset", id });
    else setSelection({ kind: "location", id });
  }, []);

  const handleSelectOsm = useCallback((feature: OsmFeature) => {
    setSelection({ kind: "osm", feature });
  }, []);

  function locate(lat: number | null, lon: number | null) {
    if (lat === null || lon === null) return;
    setFocus({ lat, lon, nonce: Date.now() });
  }

  const toggleLayer = (id: string) =>
    setActiveLayers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const results: {
      id: string;
      label: string;
      sub: string;
      lat: number | null;
      lon: number | null;
    }[] = [];
    for (const p of filteredProjects.slice(0, 6))
      results.push({
        id: p.project_id,
        label: p.project_name,
        sub: "Project",
        lat: p.latitude,
        lon: p.longitude,
      });
    for (const l of priorityLocations.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 4))
      results.push({
        id: l.location_id,
        label: l.name,
        sub: "Location",
        lat: l.latitude,
        lon: l.longitude,
      });
    return results;
  }, [search, filteredProjects]);

  return (
    <>
      <PageHeader
        title="City Map"
        subtitle="OpenStreetMap provides the reference geography. Project status, cost and progress come only from the government record."
        actions={
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFitSignal((n) => n + 1)}
              className="rounded-sm border border-border px-3 py-1.5"
            >
              Fit to city
            </button>
            <button onClick={resetFilters} className="rounded-sm border border-border px-3 py-1.5">
              Reset filters
            </button>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        {/* LEFT PANEL */}
        <aside className="flex max-h-[78vh] flex-col gap-3 overflow-y-auto rounded-md border border-border bg-card p-3">
          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search
            </h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Project, locality or location"
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
            />
            {searchMatches.length > 0 && (
              <ul className="mt-1.5 divide-y divide-border rounded-sm border border-border">
                {searchMatches.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        handleSelectGov(m.id);
                        locate(m.lat, m.lon);
                      }}
                      className="w-full px-2 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <span className="block truncate">{m.label}</span>
                      <span className="text-[11px] text-muted-foreground">{m.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <FilterSection
            projects={projects}
            values={{
              sector,
              scheme,
              status,
              implementing,
              owning,
              ward,
              investment,
              completionYear,
              quality,
            }}
            set={{
              setSector,
              setScheme,
              setStatus,
              setImplementing,
              setOwning,
              setWard,
              setInvestment,
              setCompletionYear,
              setQuality,
            }}
          />

          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Layers
            </h2>
            <div className="space-y-2">
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat}>
                  <p className="mb-1 text-[11px] font-semibold text-foreground">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <ul className="space-y-0.5">
                    {MAP_LAYERS.filter((l) => l.category === cat).map((l) => {
                      const on = activeLayers.includes(l.id);
                      const unavailable =
                        l.source === "official" && l.query.length === 0 && l.caveat;
                      return (
                        <li key={l.id} className="text-[12px]">
                          <label className="flex items-start gap-1.5">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={Boolean(unavailable)}
                              onChange={() => toggleLayer(l.id)}
                              className="mt-0.5"
                            />
                            <span className="flex-1">
                              <span
                                className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                                style={{ background: l.color }}
                              />
                              {l.label}
                              <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                                {l.source === "osm" ? "OSM" : "Gov"}
                              </span>
                              {loadingLayers.includes(l.id) && (
                                <span className="ml-1 text-[10px] text-muted-foreground">
                                  loading…
                                </span>
                              )}
                              {layerErrors[l.id] && (
                                <span className="ml-1 text-[10px] text-destructive">
                                  unavailable
                                </span>
                              )}
                              {l.caveat && (
                                <span className="block text-[10px] leading-tight text-muted-foreground">
                                  {l.caveat}
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Legend
            </h2>
            <ul className="space-y-1 text-[12px]">
              {MARKER_LEGEND.map((m) => (
                <li key={m.state} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border-2"
                    style={{
                      background: LEGEND_COLORS[m.state],
                      borderColor: m.state === "announced" ? "#1d4ed8" : LEGEND_COLORS[m.state],
                    }}
                  />
                  {m.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-tight text-muted-foreground">
              Circles are government records. Thin lines and small dots are OpenStreetMap reference
              features and carry no status meaning.
            </p>
          </section>
        </aside>

        {/* MAP */}
        <div className="flex flex-col">
          <div className="h-[78vh] overflow-hidden rounded-md border border-border">
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading map…
                </div>
              }
            >
              <MapCanvas
                govPoints={govPoints}
                osmFeatures={osmFeatures}
                layerColors={layerColors}
                selectedId={selectedId}
                onSelectGov={handleSelectGov}
                onSelectOsm={handleSelectOsm}
                fitSignal={fitSignal}
                focus={focus}
              />
            </ClientOnly>
          </div>
          <p
            className="mt-1 text-[10px] text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: `Base map ${OSM_ATTRIBUTION}. Reference features queried live from the Overpass API.`,
            }}
          />
        </div>

        {/* RIGHT PANEL */}
        <aside className="max-h-[78vh] overflow-y-auto rounded-md border border-border bg-card p-3 xl:block">
          {selection === null ? (
            <p className="text-sm text-muted-foreground">
              Select a marker on the map to see the record, its linked projects and assets, and the
              evidence behind it.
            </p>
          ) : selection.kind === "project" ? (
            <ProjectPanel id={selection.id} onLocate={locate} onSelect={handleSelectGov} />
          ) : selection.kind === "asset" ? (
            <AssetPanel id={selection.id} onLocate={locate} onSelect={handleSelectGov} />
          ) : selection.kind === "location" ? (
            <LocationPanel id={selection.id} onLocate={locate} onSelect={handleSelectGov} />
          ) : (
            <OsmPanel feature={selection.feature} />
          )}
        </aside>
      </div>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-sm border border-border bg-background px-1.5 py-1 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterValues {
  sector: string;
  scheme: string;
  status: string;
  implementing: string;
  owning: string;
  ward: string;
  investment: string;
  completionYear: string;
  quality: string;
}

interface FilterSetters {
  setSector: (v: string) => void;
  setScheme: (v: string) => void;
  setStatus: (v: string) => void;
  setImplementing: (v: string) => void;
  setOwning: (v: string) => void;
  setWard: (v: string) => void;
  setInvestment: (v: string) => void;
  setCompletionYear: (v: string) => void;
  setQuality: (v: string) => void;
}

function FilterSection({
  projects: all,
  values,
  set,
}: {
  projects: Project[];
  values: FilterValues;
  set: FilterSetters;
}) {
  const opt = (list: string[], allLabel: string) => [
    { value: "all", label: allLabel },
    ...list.map((v) => ({ value: v, label: labelise(v) })),
  ];
  const years = uniq(all.map((p) => (p.planned_end_date ? p.planned_end_date.slice(0, 4) : null)));

  return (
    <section>
      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Filters
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Sector"
          value={values.sector}
          onChange={set.setSector}
          options={opt(uniq(all.map((p) => p.sector)), "All sectors")}
        />
        <Select
          label="Scheme"
          value={values.scheme}
          onChange={set.setScheme}
          options={opt(uniq(all.map((p) => p.scheme)), "All schemes")}
        />
        <Select
          label="Status"
          value={values.status}
          onChange={set.setStatus}
          options={opt(uniq(all.map((p) => p.status)), "All statuses")}
        />
        <Select
          label="Evidence"
          value={values.quality}
          onChange={set.setQuality}
          options={opt(uniq(all.map((p) => p.evidence_quality)), "Any quality")}
        />
        <Select
          label="Implementing agency"
          value={values.implementing}
          onChange={set.setImplementing}
          options={opt(uniq(all.map((p) => p.implementing_agency)), "All agencies")}
        />
        <Select
          label="Owning agency"
          value={values.owning}
          onChange={set.setOwning}
          options={opt(uniq(all.map((p) => p.owning_agency)), "All agencies")}
        />
        <Select
          label="Ward"
          value={values.ward}
          onChange={set.setWard}
          options={opt(uniq(all.map((p) => p.ward ?? "Not available")), "All wards")}
        />
        <Select
          label="Investment"
          value={values.investment}
          onChange={set.setInvestment}
          options={INVESTMENT_RANGES.map((r) => ({ value: r.id, label: r.label }))}
        />
        <Select
          label="Completion year"
          value={values.completionYear}
          onChange={set.setCompletionYear}
          options={[
            { value: "all", label: "Any year" },
            ...years.map((y) => ({ value: y, label: y })),
            { value: "unknown", label: "Not available" },
          ]}
        />
      </div>
    </section>
  );
}

function PanelTitle({ children, kind }: { children: React.ReactNode; kind: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kind}</p>
      <h2 className="text-sm font-semibold leading-tight">{children}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border py-1 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">{children}</div>;
}

const actionClass = "rounded-sm border border-border px-2 py-1 hover:bg-muted";

function ProjectPanel({
  id,
  onLocate,
  onSelect,
}: {
  id: string;
  onLocate: (lat: number | null, lon: number | null) => void;
  onSelect: (id: string) => void;
}) {
  const p = projects.find((x) => x.project_id === id);
  if (!p) return <p className="text-sm">Record not found.</p>;
  const linkedAssets = assets.filter((a) => a.related_projects.includes(p.project_id));
  const linkedEvidence = evidence.filter((e) => e.linked_entity === p.project_id);
  const nearby = projects
    .filter(
      (o) =>
        o.project_id !== p.project_id &&
        o.latitude !== null &&
        o.longitude !== null &&
        p.latitude !== null &&
        p.longitude !== null,
    )
    .map((o) => ({
      p: o,
      d: Math.hypot(
        (o.latitude as number) - (p.latitude as number),
        (o.longitude as number) - (p.longitude as number),
      ),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);

  return (
    <div>
      <PanelTitle kind="Government project">{p.project_name}</PanelTitle>
      <div className="mb-2 flex gap-1.5">
        <StatusBadge status={p.status} />
        <EvidenceBadge quality={p.evidence_quality} />
      </div>
      <Row label="Sector" value={text(p.sector)} />
      <Row label="Scheme" value={text(p.scheme)} />
      <Row label="Sanctioned cost" value={crore(p.sanctioned_cost)} />
      <Row label="Implementing agency" value={text(p.implementing_agency)} />
      <Row label="Contractor" value={text(p.contractor)} />
      <Row label="Planned completion" value={dateText(p.planned_end_date)} />
      <Row label="Physical progress" value={percent(p.physical_progress_percentage)} />
      <Row label="Locality" value={text(p.locality)} />
      <Row label="Source" value={text(p.source_agency)} />
      <Row label="Last verified" value={dateText(p.last_verified)} />

      <Actions>
        <Link
          to="/projects/$projectId"
          params={{ projectId: p.project_id }}
          className={actionClass}
        >
          View project
        </Link>
        <Link to="/evidence" className={actionClass}>
          View evidence
        </Link>
        <button className={actionClass} onClick={() => onLocate(p.latitude, p.longitude)}>
          Locate on map
        </button>
      </Actions>

      <PanelList title="Related assets" empty="No assets linked.">
        {linkedAssets.map((a) => (
          <button
            key={a.asset_id}
            onClick={() => onSelect(a.asset_id)}
            className="block w-full text-left hover:underline"
          >
            {a.asset_name}
          </button>
        ))}
      </PanelList>

      <PanelList title="Nearby projects" empty="No nearby projects.">
        {nearby.map(({ p: o }) => (
          <button
            key={o.project_id}
            onClick={() => onSelect(o.project_id)}
            className="block w-full text-left hover:underline"
          >
            {o.project_name}
          </button>
        ))}
      </PanelList>

      <PanelList title="Evidence and sources" empty="No evidence records attached.">
        {linkedEvidence.map((e) => (
          <span key={e.evidence_id} className="block">
            {e.url ? (
              <a href={e.url} target="_blank" rel="noreferrer" className="underline">
                {e.title}
              </a>
            ) : (
              e.title
            )}
            <span className="text-muted-foreground"> · {labelise(e.evidence_quality)}</span>
          </span>
        ))}
      </PanelList>
    </div>
  );
}

function PanelList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.flat().filter(Boolean).length > 0;
  return (
    <div className="mt-3">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1 text-[12px]">
        {hasItems ? children : <p className="text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function AssetPanel({
  id,
  onLocate,
  onSelect,
}: {
  id: string;
  onLocate: (lat: number | null, lon: number | null) => void;
  onSelect: (id: string) => void;
}) {
  const a = assets.find((x) => x.asset_id === id);
  if (!a) return <p className="text-sm">Record not found.</p>;
  return (
    <div>
      <PanelTitle kind="Government asset">{a.asset_name}</PanelTitle>
      <Row label="Asset type" value={text(a.asset_type)} />
      <Row label="Sector" value={text(a.sector)} />
      <Row label="Owning agency" value={text(a.owning_agency)} />
      <Row label="Operating agency" value={text(a.operating_agency)} />
      <Row label="Operational status" value={text(a.operational_status)} />
      <Row
        label="Capacity"
        value={a.capacity === null ? text(null) : `${a.capacity} ${text(a.capacity_unit)}`}
      />
      <Row label="Source" value={text(a.data_source)} />
      <Row label="Last verified" value={dateText(a.last_verified)} />
      <Actions>
        <Link to="/assets" className={actionClass}>
          Asset register
        </Link>
        <button className={actionClass} onClick={() => onLocate(a.latitude, a.longitude)}>
          Locate on map
        </button>
      </Actions>
      <PanelList title="Linked projects" empty="No projects linked.">
        {a.related_projects.map((pid) => {
          const p = projects.find((x) => x.project_id === pid);
          return (
            <button
              key={pid}
              onClick={() => onSelect(pid)}
              className="block w-full text-left hover:underline"
            >
              {p ? p.project_name : pid}
            </button>
          );
        })}
      </PanelList>
    </div>
  );
}

function LocationPanel({
  id,
  onLocate,
  onSelect,
}: {
  id: string;
  onLocate: (lat: number | null, lon: number | null) => void;
  onSelect: (id: string) => void;
}) {
  const l = priorityLocations.find((x) => x.location_id === id);
  if (!l) return <p className="text-sm">Record not found.</p>;
  return (
    <div>
      <PanelTitle kind="Priority location">{l.name}</PanelTitle>
      <Row label="Locality" value={text(l.locality)} />
      <Row label="Category" value={LOCATION_CATEGORY_LABELS[l.category]} />
      <Row label="Coordinate basis" value={labelise(l.coordinate_precision)} />
      <Row label="Source agency" value={text(l.source_agency)} />
      <Row label="Last verified" value={dateText(l.last_verified)} />
      <Row label="Notes" value={text(l.notes)} />
      <Actions>
        <button className={actionClass} onClick={() => onLocate(l.latitude, l.longitude)}>
          Locate on map
        </button>
        <Link to="/projects" className={actionClass}>
          Project register
        </Link>
      </Actions>
      <PanelList title="Linked projects" empty="No projects linked.">
        {l.related_projects.map((pid) => {
          const p = projects.find((x) => x.project_id === pid);
          return (
            <button
              key={pid}
              onClick={() => onSelect(pid)}
              className="block w-full text-left hover:underline"
            >
              {p ? p.project_name : pid}
            </button>
          );
        })}
      </PanelList>
      <PanelList title="Linked assets" empty="No assets linked.">
        {l.related_assets.map((aid) => {
          const a = assets.find((x) => x.asset_id === aid);
          return (
            <button
              key={aid}
              onClick={() => onSelect(aid)}
              className="block w-full text-left hover:underline"
            >
              {a ? a.asset_name : aid}
            </button>
          );
        })}
      </PanelList>
    </div>
  );
}

function OsmPanel({ feature }: { feature: OsmFeature }) {
  const layer = MAP_LAYERS.find((l) => l.id === feature.layerId);
  const tags = Object.entries(feature.tags).slice(0, 12);
  return (
    <div>
      <PanelTitle kind="OpenStreetMap feature">{feature.name ?? "Unnamed feature"}</PanelTitle>
      <p className="mb-2 rounded-sm bg-muted px-2 py-1 text-[11px] text-muted-foreground">
        Reference geography from OpenStreetMap. Not a government record and not evidence of project
        status.
      </p>
      <Row label="Layer" value={text(layer?.label ?? null)} />
      <Row label="OSM element" value={feature.id} />
      {tags.map(([k, v]) => (
        <Row key={k} label={k} value={v} />
      ))}
      <Actions>
        <a
          href={`https://www.openstreetmap.org/${feature.id}`}
          target="_blank"
          rel="noreferrer"
          className={actionClass}
        >
          Open in OpenStreetMap
        </a>
      </Actions>
    </div>
  );
}
