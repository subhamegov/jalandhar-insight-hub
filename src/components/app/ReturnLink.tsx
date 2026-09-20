import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { returnLabel, safeReturnPath } from "@/lib/returnTo";
import { useCity } from "@/lib/cityContext";

/**
 * Visible return action for pages entered from another context.
 * The originating path travels in the URL, so a refresh, a direct link and
 * browser history all behave the same way. The active city is carried back so
 * the reader never lands in a different city than the one they left.
 */
export function ReturnLink({ fallback = "/evidence" }: { fallback?: string }) {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const { portfolio } = useCity();
  const from = safeReturnPath(search?.["from"]);
  const raw = from ?? (portfolio ? "/national" : fallback);
  const [path, queryString] = raw.split("?");
  const target = path ?? "/";

  const nextSearch: Record<string, string> = {};
  if (queryString) {
    for (const [key, value] of new URLSearchParams(queryString)) {
      if (key !== "from") nextSearch[key] = value;
    }
  }
  const city = search?.["city"];
  if (typeof city === "string" && !nextSearch["city"]) nextSearch["city"] = city;

  const label = from ? returnLabel(target) : portfolio ? "National overview" : returnLabel(fallback);

  return (
    <Link
      to={target as never}
      search={nextSearch as never}
      className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none print:hidden"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      Back to {label}
    </Link>
  );
}
