import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyNote, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { areaInvestment, serviceGaps, WARD_BOUNDARIES_LOADED, wardAreas } from "@/data/wards";
import { crore } from "@/lib/format";

export const Route = createFileRoute("/wards/")({
  head: () => ({
    meta: [
      { title: "Ward View | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Ward level view of Jalandhar projects, investment, municipal assets and unresolved service gaps.",
      },
      { property: "og:title", content: "Ward View — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Projects, assets and service gaps grouped by ward or recorded locality.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WardsPage,
});

function WardsPage() {
  const areas = wardAreas();
  return (
    <>
      <PageHeader
        title="Ward View"
        subtitle="Investment and service delivery grouped by area. Ward numbers are shown only where an agency has recorded them."
      />

      {!WARD_BOUNDARIES_LOADED ? (
        <p className="mb-4 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
          Official ward boundaries have not been loaded. Records without a recorded ward are grouped
          by locality, or shown together as "Ward not recorded". Ward populations are not available.
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Areas with records" value={areas.length} />
        <MetricCard
          label="Areas with a recorded ward"
          value={areas.filter((a) => a.basis === "official ward").length}
        />
        <MetricCard
          label="Records without a ward"
          value={areas
            .filter((a) => a.basis !== "official ward")
            .reduce((n, a) => n + a.projects.length + a.assets.length, 0)}
          tone="warning"
        />
        <MetricCard label="Ward population data" value={null} hint="Not available" />
      </div>

      <Panel title="Areas" className="mt-4">
        {areas.length === 0 ? (
          <EmptyNote>No records to group.</EmptyNote>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60">
                <th className="field-label px-3 py-2 text-left">Area</th>
                <th className="field-label px-3 py-2 text-left">Grouping basis</th>
                <th className="field-label px-3 py-2 text-right">Projects</th>
                <th className="field-label px-3 py-2 text-right">Investment</th>
                <th className="field-label px-3 py-2 text-right">Assets</th>
                <th className="field-label px-3 py-2 text-right">Service gaps</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      to="/wards/$wardId"
                      params={{ wardId: a.id }}
                      className="text-primary hover:underline"
                    >
                      {a.label}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{a.basis}</td>
                  <td className="num px-3 py-2 text-right">{a.projects.length}</td>
                  <td className="num px-3 py-2 text-right">{crore(areaInvestment(a))}</td>
                  <td className="num px-3 py-2 text-right">{a.assets.length}</td>
                  <td className="num px-3 py-2 text-right">{serviceGaps(a).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
