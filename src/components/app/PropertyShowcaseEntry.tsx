import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { propertyShowcase } from "@/data/propertyShowcases";
import type { CityProfile } from "@/data/cities/registry";

export function PropertyShowcaseEntry({ city }: { city: CityProfile }) {
  const showcase = propertyShowcase(city.city_id);
  return (
    <section className="border-y border-border bg-card px-4 py-4" aria-labelledby="property-showcase-title">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-info-surface text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="field-label">Explore example properties</p>
            <h2 id="property-showcase-title" className="mt-0.5 text-sm font-semibold text-foreground">{showcase.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{showcase.description}</p>
            <p className="num mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {showcase.propertyId}{showcase.syntheticProperty ? " · Synthetic demonstration anchor" : ""}
            </p>
          </div>
        </div>
        <Link
          to="/records/$recordId"
          params={{ recordId: showcase.propertyId }}
          search={{ city: city.city_id } as never}
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-sm border border-input bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Open Household 360
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}