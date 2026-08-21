import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Download, FileText, Search } from "lucide-react";
import { agencies, assets, projects, schemes } from "@/data/selectors";
import { dateText } from "@/lib/format";
import { AS_OF, freshnessOf, latestDate } from "@/lib/freshness";
import { downloadCsv, toCsv } from "@/lib/exportData";
import { projectCsv } from "@/lib/projectCsv";
import { cn } from "@/lib/utils";

type Hit = {
  id: string;
  label: string;
  sub: string;
  kind: string;
  to: string;
  params?: Record<string, string>;
};

function buildIndex(): Hit[] {
  const hits: Hit[] = [];
  for (const p of projects) {
    hits.push({
      id: `p-${p.project_id}`,
      label: p.project_name,
      sub: [p.sector, p.implementing_agency].filter(Boolean).join(" · ") || "Project",
      kind: "Project",
      to: "/projects/$projectId",
      params: { projectId: p.project_id },
    });
    if (p.contractor) {
      hits.push({
        id: `c-${p.project_id}`,
        label: p.contractor,
        sub: `Contractor on ${p.project_name}`,
        kind: "Contractor",
        to: "/projects/$projectId",
        params: { projectId: p.project_id },
      });
    }
    if (p.locality) {
      hits.push({
        id: `l-${p.project_id}`,
        label: p.locality,
        sub: `Locality · ${p.project_name}`,
        kind: "Locality",
        to: "/projects/$projectId",
        params: { projectId: p.project_id },
      });
    }
    if (p.ward) {
      hits.push({
        id: `w-${p.project_id}`,
        label: p.ward,
        sub: `Ward · ${p.project_name}`,
        kind: "Ward",
        to: "/wards",
      });
    }
  }
  for (const a of assets) {
    hits.push({
      id: `a-${a.asset_id}`,
      label: a.asset_name,
      sub: [a.sector, a.owning_agency].filter(Boolean).join(" · ") || "Asset",
      kind: "Asset",
      to: "/assets",
    });
  }
  for (const s of schemes) {
    hits.push({
      id: `s-${s.scheme_id}`,
      label: s.scheme_name,
      sub: s.ministry ?? "Scheme",
      kind: "Scheme",
      to: "/schemes",
    });
  }
  for (const ag of agencies) {
    hits.push({
      id: `g-${ag.agency_id}`,
      label: ag.agency_name,
      sub: ag.agency_type ?? "Agency",
      kind: "Agency",
      to: "/agencies",
    });
  }
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.kind}|${h.label}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function GlobalHeader() {
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return index
      .filter((h) => h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q))
      .slice(0, 12);
  }, [index, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const lastRefresh = latestDate([
    ...projects.map((p) => p.record_updated),
    ...projects.map((p) => p.last_verified),
  ]);
  const withEvidence = projects.filter(
    (p) => p.evidence_quality !== "unverified" && Boolean(p.source_url ?? p.source_agency),
  ).length;
  const completeness = projects.length ? Math.round((withEvidence / projects.length) * 100) : 0;
  const freshness = freshnessOf(lastRefresh);

  return (
    <header className="z-40 border-b border-border bg-background/95 backdrop-blur print:hidden lg:sticky lg:top-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4 lg:px-8">
        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-sm font-semibold text-foreground">
            Jalandhar City Intelligence
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Government projects, infrastructure and service outcomes
          </p>
        </div>

        <div
          ref={boxRef}
          className="relative order-last w-full min-w-0 flex-1 md:order-none md:w-auto md:max-w-md"
        >
          <label htmlFor="global-search" className="sr-only">
            Search projects, assets, schemes, agencies, contractors, wards and localities
          </label>
          <Search
            className="pointer-events-none absolute top-2 left-2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="global-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search projects, assets, schemes, agencies"
            className="w-full rounded-sm border border-input bg-card py-1.5 pr-2 pl-8 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          {open && query.trim().length >= 2 ? (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-sm border border-border bg-card shadow-md">
              {results.length ? (
                <ul>
                  {results.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          navigate({ to: h.to, params: h.params } as never);
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{h.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {h.sub}
                          </span>
                        </span>
                        <span className="field-label shrink-0">{h.kind}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  No records match this search.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div>
            <dt className="field-label">Last data refresh</dt>
            <dd className="num">
              {dateText(lastRefresh)}{" "}
              <span
                className={cn(
                  freshness === "current" && "text-positive",
                  freshness === "ageing" && "text-warning",
                  (freshness === "stale" || freshness === "very_stale") && "text-destructive",
                )}
              >
                ({freshness === "current" ? "current" : freshness.replace("_", " ")})
              </span>
            </dd>
          </div>
          <div>
            <dt className="field-label">Evidence completeness</dt>
            <dd className="num">
              {completeness}% <span className="text-muted-foreground">of projects sourced</span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const { headers, rows } = projectCsv();
              downloadCsv(`jalandhar-projects-${AS_OF}`, toCsv(headers, rows));
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export CSV
          </button>
          <Link
            to="/brief"
            className="inline-flex items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            City brief
          </Link>
        </div>
      </div>
    </header>
  );
}
