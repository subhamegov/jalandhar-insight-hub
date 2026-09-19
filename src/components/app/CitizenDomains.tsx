import { Link } from "@tanstack/react-router";
import type { CitizenDomain, Drill } from "@/data/four-city/citizenOutcomes";

/**
 * Renders the citizen service domains. Values, numerators and denominators
 * come from the data layer unchanged; this file only lays them out and offers
 * the routes for investigating each figure.
 */
function DrillLink({ drill }: { drill: Drill }) {
  if (drill.kind === "record") {
    return (
      <Link
        to="/records/$recordId"
        params={{ recordId: drill.id }}
        className="num rounded-sm border border-input px-1.5 py-0.5 text-xs underline-offset-2 hover:underline"
      >
        {drill.label}
      </Link>
    );
  }
  return (
    <Link
      to={drill.to}
      className="rounded-sm border border-input px-1.5 py-0.5 text-xs underline-offset-2 hover:underline"
    >
      {drill.label}
    </Link>
  );
}

export function CitizenDomainSection({ domain }: { domain: CitizenDomain }) {
  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <header className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">{domain.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{domain.question}</p>
        <p className="mt-1 text-xs text-muted-foreground">{domain.sample}</p>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {domain.indicators.map((ind) => (
          <div key={ind.id} className="rounded-sm border border-border/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="field-label">{ind.label}</p>
              <span
                className="shrink-0 rounded-sm border border-border px-1 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                title={
                  ind.nature === "observed"
                    ? "Observed service condition in the records"
                    : "Reported delivery. It does not by itself show a citizen outcome."
                }
              >
                {ind.nature === "observed" ? "Observed" : "Reported"}
              </span>
            </div>
            <p className="num mt-1 text-lg font-semibold text-foreground">{ind.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ind.basis}</p>
            <p className="num mt-1 text-xs text-muted-foreground">{ind.period}</p>
            {ind.drills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ind.drills.map((d) => (
                  <DrillLink key={d.kind === "record" ? d.id : d.to} drill={d} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {domain.variation && domain.variation.rows.length > 0 && (
        <div className="border-t border-border p-4">
          <p className="text-sm font-semibold text-foreground">Where the gap is widest</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {domain.variation.measure}. {domain.variation.note}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="field-label py-2">Locality</th>
                  <th className="field-label py-2 pr-3 text-right">Measure</th>
                  <th className="field-label py-2">Records behind it</th>
                </tr>
              </thead>
              <tbody>
                {domain.variation.rows.slice(0, 5).map((row) => (
                  <tr key={row.locality_id} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <Link
                        to="/localities/$localityId"
                        params={{ localityId: row.locality_id }}
                        className="underline underline-offset-2"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="num py-2 pr-3 text-right">{row.value}</td>
                    <td className="py-2 text-xs text-muted-foreground">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/localities" className="mt-2 inline-block text-sm underline underline-offset-2">
            All sampled localities
          </Link>
        </div>
      )}
    </section>
  );
}
