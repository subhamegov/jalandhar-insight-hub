import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { returnLabel, safeReturnPath } from "@/lib/returnTo";
import { useCity } from "@/lib/cityContext";

/**
 * Visible return action for pages entered from another context.
 * Falls back to a safe destination inside the active scope when the page was
 * opened directly.
 */
export function ReturnLink({ fallback = "/evidence" }: { fallback?: string }) {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const { portfolio } = useCity();
  const from = safeReturnPath(search?.["from"]);
  const target = from ?? (portfolio ? "/national" : fallback);
  const label = from ? returnLabel(from) : portfolio ? "National overview" : returnLabel(fallback);

  return (
    <Link
      to={target as never}
      className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none print:hidden"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      Back to {label}
    </Link>
  );
}

/** Search object that carries the current page as the return context. */
export function useReturnSearch(): { from: string } {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return { from: path };
}
