import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyNote, Field } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { interventionView } from "@/data/four-city/briefing";
import { provenanceOf } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { count, text } from "@/lib/format";

export const Route = createFileRoute("/interventions/$interventionId")({
  head: () => ({
    meta: [
      { title: "Planning intervention | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "One supplied planning intervention: problem, evidence, missions, projects, assets, agencies, illustrative cost, dependencies, risks and the decision sought.",
      },
      { property: "og:title", content: "Planning intervention: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Evidence, agencies, dependencies and the decision required, with every record linked.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InterventionDetail,
});

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function InterventionDetail() {
  const { interventionId } = Route.useParams();
  const { city } = useCity();
  const view = useMemo(
    () => interventionView(city.city_id, interventionId),
    [city.city_id, interventionId],
  );

  if (!view) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Planning interventions", to: "/interventions" }, { label: interventionId }]} />
        <PageHeader
          title="This intervention is not loaded for the active city"
          subtitle="Intervention records belong to one city. Switch city in the header, or return to the list."
        />
        <Link to="/interventions" className="text-sm underline underline-offset-2">
          Back to planning interventions
        </Link>
      </div>
    );
  }

  const rec = view.intervention;
  const prov = provenanceOf(rec as unknown as Record<string, unknown>);

  return (
    <div className="space-y-4">
      <Breadcrumbs
        trail={[
          { label: "Planning interventions", to: "/interventions" },
          { label: rec.intervention_id },
        ]}
      />
      <PageHeader
        title={rec.problem_statement}
        subtitle={`Supplied planning intervention ${rec.intervention_id} for ${city.name}. It responds to decision signal ${rec.signal_id}. It is not an approved project and the cost is not an approved budget.`}
      />

      <Panel title="What is proposed, and for whom">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Problem stated" value={text(rec.problem_statement)} />
          <Field
            label="Target geography"
            value={
              view.localities.length
                ? view.localities.map((l) => l.name).join(", ")
                : "Not available"
            }
          />
          <Field
            label="Potentially affected population"
            value={
              rec.target_population === null ? "Not available" : `${count(rec.target_population)} (as stated in the record)`
            }
          />
          <Field
            label="Indicative cost"
            value={
              rec.indicative_cost_inr_lakh === null
                ? "Not available"
                : `₹${count(rec.indicative_cost_inr_lakh)} lakh`
            }
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cost basis: {text(rec.cost_basis)}. Locality anchors are illustrative points; no ward
          boundary is implied.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {view.localities.map((l) => (
            <Link
              key={l.id}
              to="/localities/$localityId"
              params={{ localityId: l.id }}
              className="underline underline-offset-2"
            >
              {l.name}
            </Link>
          ))}
          {view.unresolvedGeography.map((g) => (
            <span key={g} className="font-mono text-muted-foreground">
              {g} (no locality record loaded)
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Supporting evidence">
        {view.evidence.length === 0 ? (
          <EmptyNote>No supporting records are named in this intervention.</EmptyNote>
        ) : (
          <ul className="space-y-1 text-sm">
            {view.evidence.map((e) => (
              <li key={e.id}>
                {e.resolved ? (
                  <Link
                    to="/records/$recordId"
                    params={{ recordId: e.id }}
                    className="underline underline-offset-2"
                  >
                    {e.id}
                  </Link>
                ) : (
                  <span className="font-mono font-semibold">{e.id}</span>
                )}{" "}
                <span className="text-muted-foreground">{e.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Missing evidence and stated assumptions">
        <Bullets
          items={view.missingEvidence}
          empty="No evidence gaps or assumptions are stated in this record."
        />
      </Panel>

      <Panel title="Related missions, projects and infrastructure">
        <div className="space-y-3 text-sm">
          <div>
            <p className="field-label">Missions</p>
            <p>{view.missions.length ? view.missions.join(", ") : "Not available"}</p>
          </div>
          <div>
            <p className="field-label">Projects</p>
            {view.projects.length === 0 ? (
              <EmptyNote>No project record is linked.</EmptyNote>
            ) : (
              <ul className="space-y-1">
                {view.projects.map((p) => (
                  <li key={p.project_id}>
                    <Link
                      to="/investment/$projectId"
                      params={{ projectId: p.project_id }}
                      className="underline underline-offset-2"
                    >
                      {p.project_name}
                    </Link>{" "}
                    <span className="text-xs text-muted-foreground">
                      {p.mission} · {text(p.project_status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="field-label">Infrastructure</p>
            {view.assets.length === 0 ? (
              <EmptyNote>No asset record is linked.</EmptyNote>
            ) : (
              <ul className="space-y-1">
                {view.assets.map((a) => (
                  <li key={a.asset_id}>
                    <Link
                      to="/records/$recordId"
                      params={{ recordId: a.asset_id }}
                      className="underline underline-offset-2"
                    >
                      {a.asset_name}
                    </Link>{" "}
                    <span className="text-xs text-muted-foreground">
                      {text(a.commissioning_status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Existing investment on the linked projects">
        {view.finance.length === 0 ? (
          <EmptyNote>No municipal finance record is linked to these projects.</EmptyNote>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Funds released (INR lakh)"
              value={view.releasedInrLakh === null ? "Not available" : count(view.releasedInrLakh)}
            />
            <Field
              label="Expenditure (INR lakh)"
              value={
                view.expenditureInrLakh === null ? "Not available" : count(view.expenditureInrLakh)
              }
            />
            <Field
              label="Financial years covered"
              value={[...new Set(view.finance.map((f) => f.financial_year))].join(", ") || "Not available"}
            />
          </div>
        )}
      </Panel>

      <Panel title="Who would need to act">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lead agency" value={text(rec.lead_agency)} />
          <Field
            label="Supporting agencies"
            value={strArr(rec.supporting_agencies).join(", ") || "Not available"}
          />
        </div>
      </Panel>

      <Panel title="Funding options, dependencies and sequence">
        <div className="space-y-4">
          <div>
            <p className="field-label mb-1">Potential funding sources</p>
            <Bullets items={strArr(rec.funding_options)} empty="No funding option is stated." />
          </div>
          <div>
            <p className="field-label mb-1">Dependencies</p>
            <Bullets items={strArr(rec.dependencies)} empty="No dependency is stated." />
          </div>
          <div>
            <p className="field-label mb-1">Implementation sequence</p>
            {strArr(rec.implementation_sequence).length === 0 ? (
              <EmptyNote>No sequence is stated.</EmptyNote>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {strArr(rec.implementation_sequence).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="What it is expected to produce, and what could go wrong">
        <div className="space-y-4">
          <div>
            <p className="field-label mb-1">Expected outputs</p>
            <Bullets items={strArr(rec["expected_outputs"])} empty="No output is stated." />
          </div>
          <div>
            <p className="field-label mb-1">Expected outcomes</p>
            <Bullets items={strArr(rec["expected_outcomes"])} empty="No outcome is stated." />
            <p className="mt-1 text-xs text-muted-foreground">
              An expected outcome is an intention recorded in the scenario, not an observed result.
            </p>
          </div>
          <div>
            <p className="field-label mb-1">Risks</p>
            <Bullets items={strArr(rec["risks"])} empty="No risk is stated." />
          </div>
          <div>
            <p className="field-label mb-1">Indicators to track afterwards</p>
            <Bullets
              items={strArr(rec["monitoring_indicators"])}
              empty="No monitoring indicator is stated."
            />
          </div>
        </div>
      </Panel>

      <Panel title="Decision required from the Joint Secretary">
        <p className="text-sm">{text(view.decisionRequired)}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link
            to="/signals/$signalId"
            params={{ signalId: rec.signal_id }}
            className="underline underline-offset-2"
          >
            Open the signal and its evidence
          </Link>
          <Link to="/briefing" className="underline underline-offset-2">
            Add to the executive briefing view
          </Link>
          <Link to="/interventions" className="underline underline-offset-2">
            All interventions
          </Link>
        </div>
      </Panel>

      <Panel title="Provenance">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Record type" value={text(prov.record_type)} />
          <Field label="Classification" value={text(prov.data_classification)} />
          <Field label="Verification status" value={text(prov.verification_status)} />
          <Field label="Observation date" value={text(prov.observation_date)} />
        </div>
      </Panel>
    </div>
  );
}
