import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  Building2,
  FileSearch,
  LayoutDashboard,
  ListChecks,
  Map,
  Menu,
  Scale,
  Target,
  Flag,
  Grid2x2,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { GlobalHeader } from "@/components/app/GlobalHeader";
import { EvidenceDrawerProvider } from "@/components/app/EvidenceDrawer";
import { CityProvider, useCity } from "@/lib/cityContext";
import { CityGate } from "@/components/app/CityGate";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "City Map", icon: Map },
  { to: "/projects", label: "Projects", icon: ListChecks },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/outcomes", label: "Outcomes", icon: Target },
  { to: "/attention", label: "Attention", icon: Flag },
  { to: "/wards", label: "Ward View", icon: Grid2x2 },
  { to: "/schemes", label: "Schemes", icon: Scale },
  { to: "/agencies", label: "Agencies", icon: Building2 },
  { to: "/evidence", label: "Evidence", icon: FileSearch },
  { to: "/data-quality", label: "Data Quality", icon: AlertTriangle },
  { to: "/data-layer", label: "Data Layer", icon: Database },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:py-2"
          activeProps={{
            className:
              "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary",
          }}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CityProvider>
      <CityShell>{children}</CityShell>
    </CityProvider>
  );
}

function CityShell({ children }: { children: ReactNode }) {
  const { city } = useCity();
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

  const current = NAV.find((n) =>
    n.to === "/" ? pathname === "/" : pathname.startsWith(n.to),
  )?.label;

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
              MoHUA Urban Intelligence · {city.name}
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
                  <p className="text-xs text-sidebar-foreground/60">
                    {city.name}, {city.state}
                  </p>
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
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </div>
        ) : null}

        <aside className="hidden bg-sidebar text-sidebar-foreground print:hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto">
          <div className="border-b border-sidebar-border px-4 py-4">
            <p className="text-[11px] tracking-[0.12em] text-sidebar-foreground/60 uppercase">
              Government of India
            </p>
            <p className="mt-1 text-sm leading-tight font-semibold">MoHUA Urban Intelligence</p>
            <p className="text-[11px] text-sidebar-foreground/60">
              {city.name}, {city.state}
            </p>
          </div>
          <NavList />
          <div className="px-4 py-4 text-[11px] leading-relaxed text-sidebar-foreground/50">
            Records shown are working entries. Values marked "Not available" have no verified source
            attached yet.
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <GlobalHeader />
          <main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-7">
            <CityGate>{children}</CityGate>
          </main>
        </div>
      </div>
    </EvidenceDrawerProvider>
  );
}
