// Geographic breadcrumbs: India > State > City > Locality > record.
//
// Every level above the current one is a link, so a reader can step back up the
// geography without losing the city or locality they were working in.

import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

/**
 * Breadcrumbs for a view inside the active city.
 * `trail` holds the levels below the city (locality, record, and so on).
 */
export function Breadcrumbs({ trail = [] }: { trail?: Crumb[] }) {
  const { city } = useCity();
  const { locality } = useGeo();

  const crumbs: Crumb[] = [
    { label: "India", to: "/national" },
    { label: city.state },
    { label: city.name, to: "/" },
  ];

  // Keep the held locality visible even on views that did not name it, so the
  // geographic context a reader selected is never silently dropped.
  const trailHasLocality = trail.some((c) => c.label === locality?.name);
  if (locality && !trailHasLocality) {
    crumbs.push({
      label: locality.name,
      to: "/localities/$localityId",
      params: { localityId: locality.id },
    });
  }
  crumbs.push(...trail);

  return (
    <nav aria-label="Geographic context" className="mb-3 print:hidden">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  params={crumb.params as never}
                  className="underline-offset-2 hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-foreground" : undefined}>
                  {crumb.label}
                </span>
              )}
              {last ? null : <ChevronRight className="h-3 w-3" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
