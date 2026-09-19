import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyNote } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { briefingFor } from "@/data/four-city/briefing";
import { useCity } from "@/lib/cityContext";
import { count, text } from "@/lib/format";
import { Tile } from "@/routes/signals.index";

export const Route = createFileRoute("/interventions/")({
  head: () => ({
    meta: [
      { title: "Planning interventions | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Supplied planning interventions for each city: the problem, target geography, agencies, illustrative cost, dependencies and the decision sought.",
      },
      { property: "og:title", content: "Planning interventions — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "What government could consider doing, and the evidence behind each option.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InterventionsIndex,
});

function InterventionsIndex() {
  const { city, dataset } = useCity();
  const view = useMemo(() => briefingFor(city.city_id), [city.city_id]);
  const [query, setQuery] = useState("");
  const [onlyGaps, setOnlyGaps] = useState(false);

  if (!dataset.synthetic || !view) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Planning interventions" }]} />
        <PageHeader
          title={`Planning intervention records are not loaded for ${city.name}`}
          subtitle="This view reads the supplied planning intervention records. None are loaded for this city, so nothing is shown rather than anything assumed."
        />
        <Panel title="What to use instead">
          <Link to="/attention" className="text-sm underline underline-offset-2">
            Open the attention list for this city
          </Link>
        </Panel>
      </div>
    );
  }

  const rows = view.interventions.filter((v) => {
    if (onlyGaps && v.missingEvidence.length === 0) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [
      v.intervention.intervention_id,
      v.intervention.problem_statement,
      v.intervention.lead_agency ?? "",
      ...v.localities.map((l) => l.name),
      ...v.missions,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-4">
      <Breadcrumbs trail={[{ label: "Planning interventions" }]} />
      <PageHeader
        title={`${city.name} — what government could consider doing`}
        subtitle="Each record states a problem observed in the data, the geography and people it would cover, the agencies involved, an illustrative cost and the decision sought."
      />

      <div className="rounded-sm border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Synthetic prototype records. Costs are illustrative placeholders, not detailed project
        reports, market estimates or sanctioned amounts. Nothing here replaces field verification,
        engineering assessment or formal government approval.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label="Interventions" value={view.totals.interventions} />
        <Tile label="Signals they respond to" value={view.totals.signals} />
        <Tile label="Localities covered" value={view.totals.localities} />
        <Tile
          label="Indicative cost (INR lakh)"
          value={
            view.totals.indicativeCostInrLakh === null
              ? "Not available"
              : count(view.totals.indicativeCostInrLakh)
          }
        />
        <Tile
          label="People in scope (stated)"
          value={
            view.totals.populationInScope === null
              ? "Not available"
              : count(view.totals.populationInScope)
          }
        />
      </div>

      <Panel title="Interventions">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            aria-label="Search interventions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problem, agency, locality or mission"
            className="w-full max-w-md rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyGaps}
              onChange={(e) => setOnlyGaps(e.target.checked)}
            />
            Only interventions with missing evidence
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyNote>No intervention records match this search.</EmptyNote>
        ) : (
          <div className="space-y-3">
            {rows.map((v) => (
              <div key={v.intervention.intervention_id} className="rounded-sm border border-border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    to="/interventions/$interventionId"
                    params={{ interventionId: v.intervention.intervention_id }}
                    className="text-sm font-medium underline underline-offset-2"
                  >
                    {v.intervention.problem_statement}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {v.intervention.intervention_id}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    <span className="field-label">Lead agency</span>
                    <br />
                    {text(v.intervention.lead_agency)}
                  </p>
                  <p>
                    <span className="field-label">Geography</span>
                    <br />
                    {v.localities.length ? v.localities.map((l) => l.name).join(", ") : "Not available"}
                  </p>
                  <p>
                    <span className="field-label">Indicative cost</span>
                    <br />
                    {v.intervention.indicative_cost_inr_lakh === null
                      ? "Not available"
                      : `₹${count(v.intervention.indicative_cost_inr_lakh)} lakh (illustrative)`}
                  </p>
                  <p>
                    <span className="field-label">Evidence</span>
                    <br />
                    {count(v.evidence.length)} named
                    {v.missingEvidence.length
                      ? `, ${count(v.missingEvidence.length)} gap${v.missingEvidence.length === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <Link
                    to="/signals/$signalId"
                    params={{ signalId: v.intervention.signal_id }}
                    className="underline underline-offset-2"
                  >
                    Signal {v.intervention.signal_id}
                  </Link>
                  <Link to="/briefing" className="underline underline-offset-2">
                    Executive briefing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
