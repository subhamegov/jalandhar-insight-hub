import { createFileRoute } from "@tanstack/react-router";
import { EmptyNote, Field, PageHeader, Panel } from "@/components/app/Primitives";
import { projects } from "@/data/selectors";
import { CITY_SYSTEMS } from "@/data/types";
import { crore, text } from "@/lib/format";

export const Route = createFileRoute("/outcomes")({
  head: () => ({
    meta: [
      { title: "Outcomes | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Compare expenditure with measured service outcomes for water, waste, mobility and air quality in Jalandhar.",
      },
      { property: "og:title", content: "Outcomes — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Spend versus service delivery across Jalandhar city systems.",
      },
    ],
  }),
  component: OutcomesPage,
});

function OutcomesPage() {
  return (
    <>
      <PageHeader
        title="Outcomes"
        subtitle="Expenditure against measured service outcomes. Outcome indicators are only shown once a verified source is attached."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CITY_SYSTEMS.map((system) => {
          const rows = projects.filter((p) => p.sector === system);
          const spend = rows.reduce<number | null>(
            (acc, p) => (p.expenditure === null ? acc : (acc ?? 0) + p.expenditure),
            null,
          );
          const operational = rows.filter((p) => p.operational_status === "Operational").length;
          return (
            <Panel key={system} title={system}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Projects" value={rows.length} mono />
                <Field label="Recorded expenditure" value={crore(spend)} mono />
                <Field label="Confirmed operational" value={operational} mono />
                <Field label="Outcome indicator" value={text(null)} />
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel title="Spend against service delivery" className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="field-label px-3 py-2 text-left">Project</th>
              <th className="field-label px-3 py-2 text-left">System</th>
              <th className="field-label px-3 py-2 text-right">Expenditure</th>
              <th className="field-label px-3 py-2 text-left">Operational status</th>
              <th className="field-label px-3 py-2 text-left">Service outcome recorded</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.project_id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{p.project_name}</td>
                <td className="px-3 py-2">{text(p.sector)}</td>
                <td className="num px-3 py-2 text-right">{crore(p.expenditure)}</td>
                <td className="px-3 py-2">{text(p.operational_status)}</td>
                <td className="px-3 py-2 text-muted-foreground italic">Not available</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4">
        <EmptyNote>
          No outcome indicator series has been attached yet. Indicators such as water supply
          hours, treated wastewater reuse, waste processed, bus ridership and air quality will
          appear here once sourced from a publishing agency.
        </EmptyNote>
      </div>
    </>
  );
}
