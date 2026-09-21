import { Link, useRouterState } from "@tanstack/react-router";
import { useCity } from "@/lib/cityContext";
import { FourCityOverview } from "@/components/app/FourCityOverview";
import { Unavailable } from "@/components/app/Unavailable";
import type { ReactNode } from "react";

/**
 * City views render records for the active city only.
 *
 * Three cases are handled honestly:
 *  - the city has records: its pages render normally;
 *  - the city is served by the four-city dataset and the page depends on an
 *    analysis built specifically for Jalandhar: the page says so instead of
 *    showing another city's reasoning;
 *  - the city is registered but no records are loaded: the page says so.
 */

/** Pages whose analysis is built on Jalandhar-specific reference work. */
const JALANDHAR_ONLY = ["/outcomes", "/attention", "/wards"];

/** Pages that sit above the city level and always render. */
const CITY_INDEPENDENT = ["/national", "/compare", "/states"];

export function CityGate({ children }: { children: ReactNode }) {
  const { city, dataset, portfolio } = useCity();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (CITY_INDEPENDENT.some((p) => pathname.startsWith(p))) return <>{children}</>;

  // Explicit All Cities context: city pages do not silently fall back to one
  // city's records, and no city's figures are added together.
  if (portfolio) return <PortfolioContext />;

  if (dataset.projects.length === 0) return <NoRecords />;

  if (dataset.synthetic) {
    if (pathname === "/") return <FourCityOverview />;
    const blocked = JALANDHAR_ONLY.find((p) => pathname.startsWith(p));
    if (blocked) return <NotBuiltForCity page={blocked} cityName={city.name} />;
  }

  return <>{children}</>;
}

function PortfolioContext() {
  const { cities, setCityId } = useCity();
  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <p className="field-label">All cities</p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">
        Four-city prototype coverage
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Four-city prototype coverage. Figures stay separate by city and are never added into a portfolio total.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/compare"
          className="rounded-sm border border-input bg-card px-3 py-1.5 text-sm hover:bg-accent"
        >
          Compare cities
        </Link>
        <Link
          to="/national"
          className="rounded-sm border border-input bg-card px-3 py-1.5 text-sm hover:bg-accent"
        >
          National view
        </Link>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {cities.map((c) => (
          <li key={c.city_id}>
            <button
              type="button"
              onClick={() => setCityId(c.city_id)}
              className="rounded-sm border border-input bg-card px-3 py-1.5 text-sm hover:bg-accent"
            >
              {c.name}, {c.state}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotBuiltForCity({ page, cityName }: { page: string; cityName: string }) {
  const label = page.replace("/", "");
  return (
    <Unavailable
      title={`This view is not available for ${cityName}`}
      detail={`The ${label} analysis uses Jalandhar-specific indicators, priorities and ward records. It is not applied to ${cityName}. Other views use ${cityName}'s own records.`}
    />
  );
}

function NoRecords() {
  const { city } = useCity();
  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <p className="field-label">{city.city_id}</p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">
        {city.name} is registered, records not yet loaded
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {city.name}, {city.state}, is registered with {city.urban_local_body}. No project, asset, scheme, or evidence records are loaded.
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
