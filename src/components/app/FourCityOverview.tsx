import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { fourCityBundle } from "@/data/four-city/dataset";
import { missionLabel } from "@/data/four-city/adapter";
import { useCity } from "@/lib/cityContext";
import { count, crore, dateText, percent, text } from "@/lib/format";

/**
 * Overview for cities served by the four-city dataset. It reports only what the
 * dataset carries, for the sample it carries, and never extrapolates a sample
 * to a citywide total.
 */
export function FourCityOverview() {
  const { city } = useCity();
  const bundle = fourCityBundle(city.city_id);
  if (!bundle) return null;

  const estimated = bundle.projects.reduce((s, p) => s + (p.estimated_cost_inr_lakh ?? 0), 0) / 100;
  const expenditure = bundle.finance.reduce((s, f) => s + (f.expenditure_inr_lakh ?? 0), 0) / 100;
  const delayed = bundle.projects.filter((p) => p.project_status === "delayed");
  const completed = bundle.projects.filter((p) => p.project_status === "completed");
  const notOperational = bundle.assets.filter(
    (a) => a.commissioning_status === "commissioned_not_operational",
  );
  const missions = new Map<string, number>();
  for (const p of bundle.projects) missions.set(p.mission, (missions.get(p.mission) ?? 0) + 1);

  const housingCompleted = bundle.housing.reduce((s, h) => s + (h.completed_houses ?? 0), 0);
  const housingOccupied = bundle.housing.reduce((s, h) => s + (h.occupied_houses ?? 0), 0);
  const wasteGenerated = bundle.sanitation.reduce((s, r) => s + (r.waste_generated_tpd ?? 0), 0);
  const wasteProcessed = bundle.sanitation.reduce((s, r) => s + (r.waste_processed_tpd ?? 0), 0);

  const cards: Array<[string, string, string]> = [
    ["Projects in sample", count(bundle.projects.length), `${missions.size} missions covered`],
    ["Estimated cost in sample", crore(estimated), "Sum of sampled project estimates"],
    ["Expenditure recorded", crore(expenditure), `${bundle.finance.length} finance records`],
    ["Reported as delayed", count(delayed.length), "Source status: delayed"],
    ["Reported as completed", count(completed.length), "Construction status, not service"],
    [
      "Assets built, not operational",
      count(notOperational.length),
      "Commissioned but not in service",
    ],
    [
      "Houses completed / occupied",
      `${count(housingCompleted)} / ${count(housingOccupied)}`,
      "Sampled housing records",
    ],
    [
      "Waste generated / processed",
      `${wasteGenerated.toFixed(1)} / ${wasteProcessed.toFixed(1)} TPD`,
      "Sampled wards only",
    ],
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <PageHeader
        title={`${city.name} at a glance`}
        subtitle={`Synthetic prototype records for ${city.urban_local_body}, observed ${dateText(bundle.city.reference_date)}. Every figure covers the sampled records only and is not a citywide total.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, note]) => (
          <div key={label} className="rounded-sm border border-border bg-card p-3 shadow-sm">
            <p className="field-label">{label}</p>
            <p className="num mt-1 text-lg font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Decision signals</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Conditions observed across missions in the sample, each with the records that support it.
        </p>
        <ul className="mt-3 space-y-2">
          {bundle.signals.slice(0, 8).map((s) => (
            <li key={s.signal_id} className="rounded-sm border border-border/70 p-3">
              <p className="num field-label">{s.signal_id}</p>
              <p className="mt-1 text-sm text-foreground">{s.observed_condition}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {text(s.potential_implications)}
              </p>
              <p className="num mt-1 text-xs text-muted-foreground">
                {s.supporting_records.length} supporting records ·{" "}
                {s.related_missions.map((m) => missionLabel(m)).join(", ") || "No mission linked"}
              </p>
            </li>
          ))}
        </ul>
        <Link to="/data-layer" className="mt-3 inline-block text-sm underline underline-offset-2">
          Open the data layer to trace any record
        </Link>
      </section>

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Mission coverage in the sample</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="field-label py-2">Mission</th>
                <th className="field-label py-2 text-right">Projects</th>
                <th className="field-label py-2 text-right">Average physical progress</th>
              </tr>
            </thead>
            <tbody>
              {[...missions.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([mission, n]) => {
                  const rows = bundle.projects.filter((p) => p.mission === mission);
                  const avg = Math.round(
                    rows.reduce((s, r) => s + (r.physical_progress_pct ?? 0), 0) / (rows.length || 1),
                  );
                  return (
                    <tr key={mission} className="border-b border-border/60">
                      <td className="py-2 pr-3">{missionLabel(mission)}</td>
                      <td className="num py-2 text-right">{count(n)}</td>
                      <td className="num py-2 text-right">{percent(avg)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
