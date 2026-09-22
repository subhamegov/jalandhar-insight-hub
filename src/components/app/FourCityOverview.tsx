import { lazy, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LocateFixed } from "lucide-react";
import { MunicipalIdentity } from "@/components/app/MunicipalIdentity";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { CitizenDomainSection } from "@/components/app/CitizenDomains";
import { CityBanner } from "@/components/app/CityBanner";
import { PageHeader, PrototypeNote } from "@/components/app/Primitives";
import { PropertyShowcaseEntry } from "@/components/app/PropertyShowcaseEntry";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import { fourCityBundle } from "@/data/four-city/dataset";
import { citizenDomains } from "@/data/four-city/citizenOutcomes";
import { missionLabel } from "@/data/four-city/adapter";
import { useCity } from "@/lib/cityContext";
import { count, crore, percent, text } from "@/lib/format";

const PointMap = lazy(() => import("@/components/map/PointMap"));

/** Citizen conditions and delivery records for one synthetic city sample. */
export function FourCityOverview() {
  const navigate = useNavigate();
  const { city } = useCity();
  const bundle = fourCityBundle(city.city_id);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  if (!bundle) return null;

  const domains = citizenDomains(city.city_id);
  const estimated = bundle.projects.reduce((sum, row) => sum + (row.estimated_cost_inr_lakh ?? 0), 0) / 100;
  const expenditure = bundle.finance.reduce((sum, row) => sum + (row.expenditure_inr_lakh ?? 0), 0) / 100;
  const delayed = bundle.projects.filter((row) => row.project_status === "delayed");
  const completed = bundle.projects.filter((row) => row.project_status === "completed");
  const notOperational = bundle.assets.filter(
    (row) => row.commissioning_status === "commissioned_not_operational",
  );
  const missions = new Map<string, number>();
  for (const project of bundle.projects) {
    missions.set(project.mission, (missions.get(project.mission) ?? 0) + 1);
  }

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      bundle.localities.map((locality) => ({
        id: locality.id,
        name: locality.name,
        sub: "Illustrative locality anchor",
        lat: locality.coordinates[1],
        lon: locality.coordinates[0],
        verified: locality.is_official_boundary,
      })),
    [bundle.localities],
  );

  const indicators = [
    ["Projects in dataset", count(bundle.projects.length)],
    ["Assets in dataset", count(bundle.assets.length)],
    ["Service records", count(bundle.serviceObservations.length)],
    ["Decision signals", count(bundle.signals.length)],
  ];

  const observations = [
    `${count(bundle.localities.length)} sampled locality anchors are available for geographic review.`,
    `${count(bundle.projects.length)} projects span ${count(missions.size)} missions in the supplied sample.`,
    notOperational.length > 0
      ? `${count(notOperational.length)} assets are reported as commissioned but not operational.`
      : `${count(delayed.length)} projects are reported as delayed.`,
  ];

  const missionCards: Array<[string, string, string]> = [
    ["Projects in sample", count(bundle.projects.length), `${missions.size} missions covered`],
    ["Estimated cost in sample", crore(estimated), "Sum of sampled project estimates"],
    ["Expenditure recorded", crore(expenditure), `${bundle.finance.length} finance records`],
    ["Reported as delayed", count(delayed.length), "Source status: delayed"],
    ["Reported as completed", count(completed.length), "Construction status, not service"],
    ["Assets built, not operational", count(notOperational.length), "Commissioned but not in service"],
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <PageHeader
        title="City at a glance"
        subtitle={`${city.name}, ${city.state} · ${city.urban_local_body}`}
        note={<PrototypeNote text="Observations are synthetic and are not official statistics" />}
        identity={
          <MunicipalIdentity
            cityId={city.city_id}
            cityName={city.name}
            stateName={city.state}
          />
        }
        actions={
          <Link
            to="/brief"
            className="rounded-sm border border-input bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            City brief
          </Link>
        }
      />

      <CityBanner city={city} />

      <PropertyShowcaseEntry city={city} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
        <div className="min-w-0 overflow-hidden rounded-sm border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Where are the sampled records?</h2>
              <p className="text-xs text-muted-foreground">Illustrative locality anchors, not municipal boundaries</p>
            </div>
            <Link to="/map" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              Explore city map
            </Link>
          </div>
          <div className="h-[360px] sm:h-[430px] xl:h-[500px]">
            <ClientOnly fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
              <PointMap
                points={mapPoints}
                centre={city.centre}
                zoom={12}
                selectedId={selectedLocality}
                fitToPoints
                onSelect={(id) => {
                  setSelectedLocality(id);
                  navigate({ to: "/localities/$localityId", params: { localityId: id } });
                }}
              />
            </ClientOnly>
          </div>
        </div>

        <div className="min-w-0 rounded-sm border border-border bg-card p-4 shadow-sm">
          <section>
            <h2 className="field-label">City observations</h2>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              {observations.map((observation) => <li key={observation}>{observation}</li>)}
            </ul>
          </section>

          <section className="mt-5 border-t border-border pt-4">
            <h2 className="field-label">Priority signals</h2>
            <ul className="mt-2 divide-y divide-border">
              {bundle.signals.slice(0, 3).map((signal) => {
                const localityId = signal.geography_ids.find((id) => mapPoints.some((point) => point.id === id));
                return (
                  <li key={signal.signal_id} className="py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/signals/$signalId"
                        params={{ signalId: signal.signal_id }}
                        className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {signal.observed_condition}
                      </Link>
                      {localityId ? (
                        <button
                          type="button"
                          aria-label="Focus this signal on the map"
                          title="Focus on map"
                          onClick={() => setSelectedLocality(localityId)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-input text-primary hover:bg-accent"
                        >
                          <LocateFixed className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{text(signal.potential_implications)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {count(signal.supporting_records.length)} supporting records
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-4 border-t border-border pt-4">
            <h2 className="field-label">Selected indicators</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
              {indicators.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="num mt-0.5 text-lg font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground">Citizen service conditions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Observed values come from service records. Reported values describe delivery. No combined score is used.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {domains.map((domain) => (
            <a key={domain.id} href={`#${domain.id}`} className="rounded-sm border border-input px-2 py-1 underline-offset-2 hover:underline">
              {domain.title}
            </a>
          ))}
        </div>
      </section>

      {domains.map((domain) => (
        <div key={domain.id} id={domain.id} className="scroll-mt-20">
          <CitizenDomainSection domain={domain} />
        </div>
      ))}

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Mission and investment reporting</h2>
        <p className="mt-1 text-xs text-muted-foreground">Delivery data for the same sample. Completion does not prove service access.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missionCards.map(([label, value, note]) => (
            <div key={label} className="rounded-sm border border-border/70 p-3">
              <p className="field-label">{label}</p>
              <p className="num mt-1 text-lg font-semibold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead><tr className="border-b border-border text-left"><th className="field-label py-2">Mission</th><th className="field-label py-2 text-right">Projects</th><th className="field-label py-2 text-right">Average physical progress</th></tr></thead>
            <tbody>
              {[...missions.entries()].sort((a, b) => b[1] - a[1]).map(([mission, total]) => {
                const rows = bundle.projects.filter((project) => project.mission === mission);
                const average = Math.round(rows.reduce((sum, row) => sum + (row.physical_progress_pct ?? 0), 0) / (rows.length || 1));
                return <tr key={mission} className="border-b border-border/60"><td className="py-2 pr-3">{missionLabel(mission)}</td><td className="num py-2 text-right">{count(total)}</td><td className="num py-2 text-right">{percent(average)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <Link to="/projects" className="mt-3 inline-block text-sm underline underline-offset-2">Open the project register</Link>
      </section>
    </div>
  );
}