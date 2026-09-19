import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { CitizenDomainSection } from "@/components/app/CitizenDomains";
import { fourCityBundle } from "@/data/four-city/dataset";
import { citizenDomains } from "@/data/four-city/citizenOutcomes";
import { missionLabel } from "@/data/four-city/adapter";
import { useCity } from "@/lib/cityContext";
import { count, crore, dateText, percent, text } from "@/lib/format";

/**
 * Overview for cities served by the four-city dataset.
 *
 * It leads with what people experience — housing, water and sanitation,
 * cleanliness, mobility, livelihoods and municipal responsiveness — and keeps
 * mission and investment reporting below as supporting evidence. It reports
 * only what the dataset carries, for the sample it carries, and never
 * extrapolates a sample to a citywide total.
 */
export function FourCityOverview() {
  const { city } = useCity();
  const bundle = fourCityBundle(city.city_id);
  if (!bundle) return null;
  const domains = citizenDomains(city.city_id);

  const estimated = bundle.projects.reduce((s, p) => s + (p.estimated_cost_inr_lakh ?? 0), 0) / 100;
  const expenditure = bundle.finance.reduce((s, f) => s + (f.expenditure_inr_lakh ?? 0), 0) / 100;
  const delayed = bundle.projects.filter((p) => p.project_status === "delayed");
  const completed = bundle.projects.filter((p) => p.project_status === "completed");
  const notOperational = bundle.assets.filter(
    (a) => a.commissioning_status === "commissioned_not_operational",
  );
  const missions = new Map<string, number>();
  for (const p of bundle.projects) missions.set(p.mission, (missions.get(p.mission) ?? 0) + 1);

  const missionCards: Array<[string, string, string]> = [
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
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <PageHeader
        title={`${city.name} — how services reach people`}
        subtitle={`Synthetic prototype records for ${city.urban_local_body}, observed ${dateText(bundle.city.reference_date)}. Figures cover the sampled localities only, are not citywide totals, and are not government statistics.`}
      />

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">
          How are citizens experiencing urban services, and where are people still underserved?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each domain below shows the service condition first, with the numerator, denominator and
          reporting period behind it. Values marked <strong>Observed</strong> come from service
          records; values marked <strong>Reported</strong> describe delivery and do not by
          themselves show a citizen outcome. Nothing here is combined into a single score.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {domains.map((d) => (
            <a
              key={d.id}
              href={`#${d.id}`}
              className="rounded-sm border border-input px-2 py-1 underline-offset-2 hover:underline"
            >
              {d.title}
            </a>
          ))}
        </div>
      </section>

      {domains.map((d) => (
        <div key={d.id} id={d.id} className="scroll-mt-20">
          <CitizenDomainSection domain={d} />
        </div>
      ))}

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Decision signals</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Conditions observed across missions in the sample, each with the records that support it.
        </p>
        <ul className="mt-3 space-y-2">
          {bundle.signals.slice(0, 8).map((s) => (
            <li key={s.signal_id} className="rounded-sm border border-border/70 p-3">
              <Link
                to="/signals/$signalId"
                params={{ signalId: s.signal_id }}
                className="num field-label underline underline-offset-2"
              >
                {s.signal_id}
              </Link>
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
        <h2 className="text-sm font-semibold text-foreground">
          Mission and investment reporting — supporting evidence
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivery reporting for the same sample. Completion is a construction status, not proof
          that a service reached a household.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missionCards.map(([label, value, note]) => (
            <div key={label} className="rounded-sm border border-border/70 p-3">
              <p className="field-label">{label}</p>
              <p className="num mt-1 text-lg font-semibold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
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

        <Link to="/projects" className="mt-3 inline-block text-sm underline underline-offset-2">
          Open the project register
        </Link>
      </section>
    </div>
  );
}
