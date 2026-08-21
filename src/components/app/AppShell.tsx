import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  Building2,
  FileSearch,
  LayoutDashboard,
  ListChecks,
  Map,
  Scale,
  Target,
  Flag,
  Grid2x2,
} from "lucide-react";
import type { ReactNode } from "react";

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
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0">
        <div className="border-b border-sidebar-border px-4 py-4">
          <p className="text-[11px] tracking-[0.12em] text-sidebar-foreground/60 uppercase">
            Government of India
          </p>
          <p className="mt-1 text-sm leading-tight font-semibold">Jalandhar City Intelligence</p>
        </div>
        <nav className="flex flex-wrap gap-1 p-2 lg:flex-col lg:flex-nowrap">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-4 py-4 text-[11px] leading-relaxed text-sidebar-foreground/50 lg:block">
          Records shown are working entries. Values marked "Not available" have no verified
          source attached yet.
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
