import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  Briefcase,
  Building2,
  ChevronDown,
  Database,
  FileSearch,
  LayoutDashboard,
  ListChecks,
  Map,
  Menu,
  Scale,
  ShieldCheck,
  Target,
  Flag,
  Globe,
  Grid2x2,
  GitCompare,
  ClipboardList,
  Gavel,
  Home,
  IndianRupee,
  MapPin,
  Radar,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { GlobalHeader } from "@/components/app/GlobalHeader";
import { EvidenceDrawerProvider } from "@/components/app/EvidenceDrawer";
import { CityProvider, useCity } from "@/lib/cityContext";
import { GeoProvider } from "@/lib/geoContext";
import { CityGate } from "@/components/app/CityGate";

// Navigation is contextual to the active scope. Both trees reuse the exact
// existing routes; only the grouping and labels differ.
type NavItem = { to: string; label: string; icon: typeof Globe };
type NavGroup = { id: string; label: string; emphasis: boolean; items: NavItem[] };
type NavTree = { primary: NavItem[]; groups: NavGroup[] };

const DECIDE: NavGroup = {
  id: "decide",
  label: "Decide",
  emphasis: true,
  items: [
    { to: "/attention", label: "Attention", icon: Flag },
    { to: "/signals", label: "Decision Signals", icon: Radar },
    { to: "/interventions", label: "Planning Interventions", icon: ClipboardList },
    { to: "/briefing", label: "Executive Briefing", icon: Gavel },
  ],
};

const SYSTEMS: NavGroup = {
  id: "systems",
  label: "Urban systems",
  emphasis: false,
  items: [
    { to: "/housing", label: "Housing", icon: Home },
    { to: "/livelihoods", label: "Livelihoods & Mobility", icon: Briefcase },
    { to: "/investment", label: "Investment", icon: IndianRupee },
  ],
};

const DELIVERY: NavGroup = {
  id: "delivery",
  label: "Delivery",
  emphasis: false,
  items: [
    { to: "/projects", label: "Projects", icon: ListChecks },
    { to: "/assets", label: "Assets", icon: Boxes },
    { to: "/schemes", label: "Schemes", icon: Scale },
    { to: "/agencies", label: "Agencies", icon: Building2 },
  ],
};

const MEASURE: NavGroup = {
  id: "measure",
  label: "Measure & trust",
  emphasis: false,
  items: [
    { to: "/outcomes", label: "Outcomes", icon: Target },
    { to: "/evidence", label: "Evidence", icon: FileSearch },
    { to: "/data-quality", label: "Data Quality", icon: AlertTriangle },
    { to: "/data-integrity", label: "Data Integrity", icon: ShieldCheck },
  ],
};

const MORE: NavGroup = {
  id: "more",
  label: "More",
  emphasis: false,
  items: [{ to: "/data-layer", label: "Data Layer", icon: Database }],
};

const NATIONAL_NAV: NavTree = {
  primary: [
    { to: "/national", label: "National View", icon: Globe },
    { to: "/", label: "Overview", icon: LayoutDashboard },
  ],
  groups: [
    DECIDE,
    {
      id: "explore",
      label: "Explore",
      emphasis: false,
      items: [
        { to: "/national", label: "India Map", icon: Map },
        { to: "/states", label: "States", icon: MapPin },
        { to: "/compare", label: "Cities", icon: GitCompare },
      ],
    },
    SYSTEMS,
    DELIVERY,
    MEASURE,
    MORE,
  ],
};

const CITY_NAV: NavTree = {
  primary: [
    { to: "/", label: "City Overview", icon: LayoutDashboard },
    { to: "/map", label: "City Map", icon: Map },
  ],
  groups: [
    DECIDE,
    {
      id: "explore",
      label: "Explore",
      emphasis: false,
      items: [
        { to: "/localities", label: "Localities", icon: MapPin },
        { to: "/wards", label: "Ward View", icon: Grid2x2 },
      ],
    },
    SYSTEMS,
    DELIVERY,
    MEASURE,
    MORE,
  ],
};

const ALL_DESTINATIONS: { to: string; label: string }[] = [
  ...NATIONAL_NAV.primary,
  ...NATIONAL_NAV.groups.flatMap((g) => g.items),
  ...CITY_NAV.primary,
  ...CITY_NAV.groups.flatMap((g) => g.items),
].map((i) => ({ to: i.to, label: i.label }));

function matches(to: string, pathname: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

function activeGroupId(tree: NavTree, pathname: string) {
  if (tree.primary.some((i) => matches(i.to, pathname))) return null;
  return tree.groups.find((g) => g.items.some((i) => matches(i.to, pathname)))?.id ?? null;
}

const ITEM_CLASS =
  "flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:py-2";
const ACTIVE_CLASS =
  "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary";

function NavList({ tree, onNavigate }: { tree: NavTree; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = activeGroupId(tree, pathname);
  // Only the group holding the current page is open; the user can change this
  // and the choice is kept while navigating within the session.
  const [openId, setOpenId] = useState<string | null>(current);

  useEffect(() => {
    if (current) setOpenId(current);
  }, [current]);

  return (
    <nav className="flex flex-col p-2">
      <div className="flex flex-col gap-1">
        {tree.primary.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className={`${ITEM_CLASS} font-medium`}
            activeProps={{ className: ACTIVE_CLASS }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>

      <div className="my-2 border-t border-sidebar-border" />

      <div className="flex flex-col gap-1">
        {tree.groups.map((group) => {
          const expanded = openId === group.id;
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : group.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-sidebar-foreground/60 uppercase transition-colors hover:text-sidebar-foreground"
              >
                <span className="truncate">{group.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
                  aria-hidden="true"
                />
              </button>
              {expanded ? (
                <div className="mt-0.5 mb-1 flex flex-col gap-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={onNavigate}
                      className={`${ITEM_CLASS} ${group.emphasis ? "font-medium" : ""}`}
                      activeProps={{ className: ACTIVE_CLASS }}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CityProvider>
      <GeoProvider>
        <CityShell>{children}</CityShell>
      </GeoProvider>
    </CityProvider>
  );
}

function SyntheticNotice() {
  const { dataset } = useCity();
  if (!dataset.synthetic || dataset.projects.length === 0) return null;
  return (
    <p className="mb-4 rounded-sm border border-border bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Synthetic prototype data.</span> Records for
      this city come from the MoHUA four-city synthetic dataset. They are not government
      statistics, are not citywide totals, and must be validated against official records before
      any decision.
    </p>
  );
}

function CityShell({ children }: { children: ReactNode }) {
  const { city, scope } = useCity();
  const national = scope.type === "NATIONAL";
  const tree = national ? NATIONAL_NAV : CITY_NAV;
  const scopeLine = national ? "India · National" : `${city.name}, ${city.state}`;
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = ALL_DESTINATIONS.find((n) => matches(n.to, pathname))?.label;

  return (
    <EvidenceDrawerProvider>
      <div className="min-h-screen bg-background lg:flex">
        {/* Mobile bar */}
        <div className="sticky top-0 z-50 flex items-center gap-3 bg-sidebar px-3 py-2 text-sidebar-foreground print:hidden lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-sidebar-border hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:outline-none"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[10px] tracking-[0.12em] text-sidebar-foreground/60 uppercase">
              MoHUA Urban Intelligence · {national ? "India · National" : city.name}
            </p>
            <p className="truncate text-sm leading-tight font-semibold">{current ?? "Overview"}</p>
          </div>
        </div>

        {open ? (
          <div className="fixed inset-0 z-[60] lg:hidden print:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-foreground/50"
            />
            <div className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col overflow-y-auto bg-sidebar text-sidebar-foreground shadow-lg">
              <div className="flex items-start justify-between gap-2 border-b border-sidebar-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.12em] text-sidebar-foreground/60 uppercase">
                    Government of India
                  </p>
                  <p className="mt-1 text-sm leading-tight font-semibold">
                    MoHUA Urban Intelligence
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">{scopeLine}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm hover:bg-sidebar-accent"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <NavList tree={tree} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        ) : null}

        <aside className="hidden bg-sidebar text-sidebar-foreground print:hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <div className="border-b border-sidebar-border px-4 py-4">
            <p className="text-[11px] tracking-[0.12em] text-sidebar-foreground/60 uppercase">
              Government of India
            </p>
            <p className="mt-1 text-sm leading-tight font-semibold">MoHUA Urban Intelligence</p>
            <p className="text-[11px] text-sidebar-foreground/60">{scopeLine}</p>
          </div>
          <NavList tree={tree} />
          <div className="px-4 py-4 text-[11px] leading-relaxed text-sidebar-foreground/90">
            Records shown are working entries. Values marked "Not available" have no verified source
            attached yet.
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <GlobalHeader />
          <main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-7">
            <SyntheticNotice />
            <CityGate>{children}</CityGate>
          </main>
        </div>
      </div>
    </EvidenceDrawerProvider>
  );
}
