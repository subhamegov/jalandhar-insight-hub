import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyNote, Field } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { briefingFor } from "@/data/four-city/briefing";
import { useCity } from "@/lib/cityContext";
import { count, text } from "@/lib/format";
import { Tile } from "@/routes/signals.index";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Executive briefing | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "What is happening in the city, why it matters for citizens, the evidence behind it, the agencies involved and the decisions that need attention.",
      },
      { property: "og:title", content: "Executive briefing — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "From citizen-service gaps to evidence, investment, agencies and the decision sought.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BriefingPage,
});

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function BriefingPage() {
  const { city, dataset } = useCity();
  const view = useMemo(() => briefingFor(city.city_id), [city.city_id]);

  if (!dataset.synthetic || !view) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Executive briefing" }]} />
        <PageHeader
          title={`Briefing records are not loaded for ${city.name}`}
          subtitle="This view reads the supplied briefing scenario, decision signals and planning interventions. None are loaded for this city."
        />
        <Panel title="What to use instead">
          <Link to="/attention" className="text-sm underline underline-offset-2">
            Open the attention list for this city
          </Link>
        </Panel>
      </div>
    );
  }

  const sc = view.scenario;

  return (
    <div className="space-y-4">
      <Breadcrumbs trail={[{ label: "Executive briefing" }]} />
      <PageHeader
        title={`${city.name} — briefing for decision`}
        subtitle={
          sc
            ? sc.title
            : "Decision signals and planning interventions for this city, grouped for review."
        }
      />

      <div className="rounded-sm border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        This briefing is built from synthetic prototype records. It is not a government finding, not
        an official statistic and not an approval. Costs shown are illustrative placeholders. Every
        statement below links to the record it comes from, and the validation still required is
        listed at the end.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile label="Signals in this city" value={view.totals.signals} />
        <Tile label="Interventions recorded" value={view.totals.interventions} />
        <Tile label="Localities covered" value={view.totals.localities} />
        <Tile
          label="Funds released on linked projects (INR lakh)"
          value={view.totals.releasedInrLakh === null ? "Not available" : count(view.totals.releasedInrLakh)}
        />
        <Tile
          label="Indicative intervention cost (INR lakh)"
          value={
            view.totals.indicativeCostInrLakh === null
              ? "Not available"
              : count(view.totals.indicativeCostInrLakh)
          }
        />
      </div>

      <Panel title="What is happening">
        {sc ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Scenario" value={text(sc.title)} />
            <Field label="Decision question" value={text(sc.decision_question)} />
          </div>
        ) : (
          <EmptyNote>No briefing scenario record is supplied for this city.</EmptyNote>
        )}
        {view.scenarioSignals.length === 0 ? null : (
          <ul className="mt-3 space-y-2 text-sm">
            {view.scenarioSignals.map((s) => (
              <li key={s.signal.signal_id}>
                <Link
                  to="/signals/$signalId"
                  params={{ signalId: s.signal.signal_id }}
                  className="underline underline-offset-2"
                >
                  {s.signal.observed_condition}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  — {s.locality ? s.locality.name : "Locality not recorded"} ·{" "}
                  {count(s.evidence.length)} supporting record
                  {s.evidence.length === 1 ? "" : "s"}
                  {s.unresolvedEvidence.length
                    ? `, ${count(s.unresolvedEvidence.length)} not found`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Why it matters for citizens">
        {view.signals.length === 0 ? (
          <EmptyNote>No decision signal records are loaded for this city.</EmptyNote>
        ) : (
          <ul className="space-y-2 text-sm">
            {view.signals.map((s) => (
              <li key={s.signal.signal_id} className="rounded-sm border border-border p-3">
                <p className="font-medium">{s.signal.observed_condition}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  What it may mean: {text(s.signal.potential_implications as string | null)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Potentially affected population:{" "}
                  {typeof s.signal["affected_population_estimate"] === "number"
                    ? count(s.signal["affected_population_estimate"] as number)
                    : "Not available"}
                  {" · "}
                  Missions: {strArr(s.signal.related_missions).join(", ") || "Not available"}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <Link
                    to="/signals/$signalId"
                    params={{ signalId: s.signal.signal_id }}
                    className="underline underline-offset-2"
                  >
                    Evidence and records
                  </Link>
                  {s.locality ? (
                    <Link
                      to="/localities/$localityId"
                      params={{ localityId: s.locality.id }}
                      className="underline underline-offset-2"
                    >
                      {s.locality.name}
                    </Link>
                  ) : null}
                  {s.interventions.map((i) => (
                    <Link
                      key={i.intervention_id}
                      to="/interventions/$interventionId"
                      params={{ interventionId: i.intervention_id }}
                      className="underline underline-offset-2"
                    >
                      Intervention {i.intervention_id}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Missions and existing investment in scope">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Missions named on linked projects"
            value={view.missions.length ? view.missions.join(", ") : "Not available"}
          />
          <Field
            label="Funds released (INR lakh)"
            value={view.totals.releasedInrLakh === null ? "Not available" : count(view.totals.releasedInrLakh)}
          />
          <Field
            label="Expenditure (INR lakh)"
            value={
              view.totals.expenditureInrLakh === null
                ? "Not available"
                : count(view.totals.expenditureInrLakh)
            }
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Finance figures cover only the projects named by these interventions, in the financial
          years recorded. They are not the city&apos;s budget.
        </p>
        <Link to="/investment" className="mt-2 inline-block text-xs underline underline-offset-2">
          Open investment and outcomes
        </Link>
      </Panel>

      <Panel title="Agencies that would be involved">
        {view.agencies.length === 0 ? (
          <EmptyNote>No agency is named in these records.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 field-label">Agency</th>
                  <th className="py-2 pr-3 field-label">As lead</th>
                  <th className="py-2 field-label">As supporting</th>
                </tr>
              </thead>
              <tbody>
                {view.agencies.map((a) => (
                  <tr key={a.name} className="border-b border-border/60">
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3">{count(a.asLead)}</td>
                    <td className="py-2">{count(a.asSupporting)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Potential interventions">
        {view.interventions.length === 0 ? (
          <EmptyNote>No planning intervention records are loaded for this city.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 field-label">Problem</th>
                  <th className="py-2 pr-3 field-label">Geography</th>
                  <th className="py-2 pr-3 field-label">Lead agency</th>
                  <th className="py-2 pr-3 field-label">Indicative cost</th>
                  <th className="py-2 field-label">Evidence gaps</th>
                </tr>
              </thead>
              <tbody>
                {view.interventions.map((v) => (
                  <tr key={v.intervention.intervention_id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3">
                      <Link
                        to="/interventions/$interventionId"
                        params={{ interventionId: v.intervention.intervention_id }}
                        className="underline underline-offset-2"
                      >
                        {v.intervention.problem_statement}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {v.localities.length ? v.localities.map((l) => l.name).join(", ") : "Not available"}
                    </td>
                    <td className="py-2 pr-3 text-xs">{text(v.intervention.lead_agency)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {v.intervention.indicative_cost_inr_lakh === null
                        ? "Not available"
                        : `₹${count(v.intervention.indicative_cost_inr_lakh)} lakh (illustrative)`}
                    </td>
                    <td className="py-2 text-xs">{count(v.missingEvidence.length)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Decisions that need attention">
        {view.decisions.length === 0 ? (
          <EmptyNote>No decision is stated in these records.</EmptyNote>
        ) : (
          <ul className="space-y-2 text-sm">
            {view.decisions.map((d) => (
              <li key={d.interventionId}>
                <Link
                  to="/interventions/$interventionId"
                  params={{ interventionId: d.interventionId }}
                  className="underline underline-offset-2"
                >
                  {d.problem}
                </Link>
                <span className="text-muted-foreground"> — {d.decision}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Follow-up required before any decision">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {sc
            ? strArr(sc.required_validation).map((r) => <li key={r}>Validate against: {r}</li>)
            : null}
          {view.followUp.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        {sc?.not_a_real_government_finding ? (
          <p className="mt-3 text-xs text-muted-foreground">
            The supplied scenario record states plainly that this is not a real government finding.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link to="/signals" className="underline underline-offset-2">
            All decision signals
          </Link>
          <Link to="/interventions" className="underline underline-offset-2">
            All planning interventions
          </Link>
          <Link to="/compare" className="underline underline-offset-2">
            Compare the four cities
          </Link>
        </div>
      </Panel>
    </div>
  );
}
