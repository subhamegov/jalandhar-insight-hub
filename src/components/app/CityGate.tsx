import { useCity } from "@/lib/cityContext";
import type { ReactNode } from "react";

/**
 * City views render records for the active city only. Where a city has been
 * registered but its government records are not yet ingested, the views say so
 * rather than showing another city's records.
 */
export function CityGate({ children }: { children: ReactNode }) {
  const { city, dataset } = useCity();
  if (dataset.projects.length > 0) return <>{children}</>;

  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <p className="field-label">{city.city_id}</p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">
        {city.name} is registered, records not yet loaded
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {city.name} ({city.state}) is set up in this system with its reference geography and{" "}
        {city.urban_local_body} as urban local body of record. No project, asset, scheme or
        evidence records have been ingested for this city yet, so no values are shown. Every page
        in this application — overview, map, projects, assets, outcomes, schemes, agencies,
        evidence and data quality — works for {city.name} as soon as its register is loaded.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="field-label">City identifier</dt>
          <dd className="num text-sm">{city.city_id}</dd>
        </div>
        <div>
          <dt className="field-label">Map centre</dt>
          <dd className="num text-sm">
            {city.centre[0].toFixed(4)}, {city.centre[1].toFixed(4)}
          </dd>
        </div>
        <div>
          <dt className="field-label">Records loaded</dt>
          <dd className="num text-sm">Not available</dd>
        </div>
      </dl>
    </section>
  );
}
