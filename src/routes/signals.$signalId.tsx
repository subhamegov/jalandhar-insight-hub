import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, Panel, Field } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { provenanceOf } from "@/data/four-city/dataset";
import { signalView } from "@/data/four-city/signals";
import { useCity } from "@/lib/cityContext";
import { count, dateText, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/signals/$signalId")({
  head: () => ({
    meta: [
      { title: "Decision signal | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "One decision signal with its observed condition, supporting records, related missions, projects, assets, agencies, possible intervention and evidence gaps.",
      },
      { property: "og:title", content: "Decision signal — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "What was observed, what supports it, and what is still missing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignalDetail,
});

function RecordLink({ id, label }: { id: string; label?: string }) {
  return (
    <Link
      to="/records/$recordId"
      params={{ recordId: id }}
      className="text-sm underline underline-offset-2"
    >
      {label ?? id}
    </Link>
  );
}

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1 text-sm text-foreground">
      {items.map((i) => (
        <li key={i}>· {i}</li>
      ))}
    </ul>
  );
}

function SignalDetail() {
  const { signalId } = useParams({ from: "/signals/$signalId" });
  const { city } = useCity();
  const v = signalView(city.city_id, signalId);

  if (!v) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Decision signals", to: "/signals" }, { label: signalId }]} />
        <PageHeader
          title="Signal not found in this city"
          subtitle={`${signalId} does not belong to ${city.name}. Signals are never matched across cities.`}
        />
        <Link to="/signals" className="text-sm underline underline-offset-2">
          Back to decision signals
        </Link>
      </div>
    );
  }

  const s = v.signal;
  const prov = provenanceOf(s as unknown as Record<string, unknown>);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        trail={[{ label: "Decision signals", to: "/signals" }, { label: s.signal_id }]}
      />
      <PageHeader
        title={s.observed_condition}
        subtitle={`${s.signal_id} · ${city.name}${v.locality ? ` · ${v.locality.name}` : ""}. A supplied synthetic signal for this prototype, not a live government alert.`}
      />

      <Panel
        title="Observed condition and what it may mean"
        description="The first line is what the record states. The second is an interpretation offered by the record, not a finding."
      >
        <div className="space-y-3">
          <Field label="Observed" value={s.observed_condition} />
          <Field label="Potential implication" value={text(s.potential_implications)} />
          <Field
            label="Potentially affected population"
            value={
              s.affected_population_estimate === null
                ? "Not estimated"
                : count(s.affected_population_estimate)
            }
          />
          <Field label="How that figure was made" value={text(s.affected_population_method)} />
          <Field
            label="Confidence basis"
            value={text((s["confidence_basis"] as string | null) ?? null)}
          />
        </div>
      </Panel>

      <Panel
        title="Conditions read from the named records"
        description="Each line below is a value taken from a record this signal names. Nothing is scored or ranked."
      >
        {v.patterns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No condition of the kinds this view checks for is present in the records this signal
            names.
          </p>
        ) : (
          <ul className="space-y-3">
            {v.patterns.map((p) => (
              <li key={p.key} className="rounded-sm border border-border p-3">
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {p.basis.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Geography">
        <div className="space-y-2 text-sm">
          {v.localities.length === 0 ? (
            <p className="text-muted-foreground">No locality is named on this signal.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {v.localities.map((l) => (
                <li key={l.id}>
                  <Link
                    to="/localities/$localityId"
                    params={{ localityId: l.id }}
                    className="underline underline-offset-2"
                  >
                    {l.name} ({l.id})
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground">
            Locality anchors are illustrative points. No ward boundary is implied.
          </p>
        </div>
      </Panel>

      <Panel title="Supporting evidence" description="Every record the signal names, resolved against the loaded data.">
        <ul className="space-y-2">
          {v.evidence.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-sm border border-border p-2">
              <span className="text-sm">
                {e.resolved ? <RecordLink id={e.id} /> : <span className="font-medium">{e.id}</span>}{" "}
                <span className="text-muted-foreground">· {labelise(e.declaredEntity)}</span>
              </span>
              <span className="text-sm text-muted-foreground">{e.summary}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Missing information"
        description="Gaps stated by the record, plus identifiers named here with no matching record loaded."
      >
        <div className="space-y-3">
          <div>
            <p className="field-label">Stated data gaps</p>
            <Bullets items={s.data_gaps ?? []} empty="The record states no data gap." />
          </div>
          <div>
            <p className="field-label">Named but not found</p>
            <Bullets
              items={[...v.unresolvedEvidence.map((e) => e.id), ...v.missingLinks]}
              empty="Every identifier named by this signal resolves to a loaded record."
            />
          </div>
        </div>
      </Panel>

      <Panel title="Related missions, projects and infrastructure">
        <div className="space-y-3 text-sm">
          <div>
            <p className="field-label">Missions</p>
            <p>{(s.related_missions ?? []).join(", ") || "Not recorded"}</p>
          </div>
          <div>
            <p className="field-label">Projects</p>
            {v.projects.length === 0 ? (
              <p className="text-muted-foreground">No project record is loaded for this signal.</p>
            ) : (
              <ul className="space-y-1">
                {v.projects.map((p) => (
                  <li key={p.project_id}>
                    <Link
                      to="/investment/$projectId"
                      params={{ projectId: p.project_id }}
                      className="underline underline-offset-2"
                    >
                      {p.project_id}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      {p.project_name} · {labelise(p.project_status)} · physical{" "}
                      {p.physical_progress_pct ?? "not recorded"}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="field-label">Assets</p>
            {v.assets.length === 0 ? (
              <p className="text-muted-foreground">No asset record is loaded for this signal.</p>
            ) : (
              <ul className="space-y-1">
                {v.assets.map((a) => (
                  <li key={a.asset_id}>
                    <RecordLink id={a.asset_id} />{" "}
                    <span className="text-muted-foreground">
                      {a.asset_name} · {labelise(a.commissioning_status)} · utilisation{" "}
                      {a.utilisation_pct ?? "not recorded"}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="field-label">Housing records in the same area</p>
            {v.housing.length === 0 ? (
              <p className="text-muted-foreground">No housing record is attached.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {v.housing.map((h) => (
                  <li key={h.housing_id}>
                    <Link
                      to="/housing/$housingId"
                      params={{ housingId: h.housing_id }}
                      className="underline underline-offset-2"
                    >
                      {h.housing_id}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Observed service delivery and complaints" description="Aggregated records only. No personal data is held.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="field-label">Service observations</p>
            {v.observations.length === 0 ? (
              <p className="text-sm text-muted-foreground">None linked.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {v.observations.map((o) => (
                  <li key={o.service_observation_id}>
                    <RecordLink id={o.service_observation_id} />{" "}
                    <span className="text-muted-foreground">
                      {labelise(o.service_type)} · {o.period} · SLA{" "}
                      {o.sla_compliance_pct ?? "not recorded"}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="field-label">Grievance aggregates</p>
            {v.grievances.length === 0 ? (
              <p className="text-sm text-muted-foreground">None linked.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {v.grievances.map((g) => (
                  <li key={g.complaint_aggregate_id}>
                    <RecordLink id={g.complaint_aggregate_id} />{" "}
                    <span className="text-muted-foreground">
                      {labelise(g.service_type)} · {g.period} · {count(g.complaint_count)} complaints,{" "}
                      {count(g.repeat_complaints)} repeat
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Who would need to act"
        description="Taken from the agencies and coordination stated in the records. Escalation above city level is shown only as a consideration."
      >
        <ul className="space-y-2">
          {v.coordination.map((c, i) => (
            <li key={`${c.level}-${i}`} className="rounded-sm border border-border p-2 text-sm">
              <p className="font-medium text-foreground">{c.level}</p>
              <p className="text-muted-foreground">{c.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">Read from: {c.basis}</p>
            </li>
          ))}
        </ul>
        {v.coordination.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agency or coordination is recorded.</p>
        ) : null}
      </Panel>

      <Panel
        title="Potential intervention"
        description="Planning intervention records supplied with the dataset. Costs are illustrative placeholders, not estimates."
      >
        {v.interventions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No planning intervention record is attached to this signal.
          </p>
        ) : (
          <ul className="space-y-3">
            {v.interventions.map((i) => (
              <li key={i.intervention_id} className="rounded-sm border border-border p-3 text-sm">
                <p className="font-medium text-foreground">
                  <Link
                    to="/interventions/$interventionId"
                    params={{ interventionId: i.intervention_id }}
                    className="underline underline-offset-2"
                  >
                    {i.intervention_id} — {i.problem_statement}
                  </Link>
                </p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <Field label="Lead agency" value={text(i.lead_agency)} />
                  <Field
                    label="Supporting agencies"
                    value={i.supporting_agencies.join(", ") || "Not recorded"}
                  />
                  <Field
                    label="Indicative cost"
                    value={
                      i.indicative_cost_inr_lakh === null
                        ? "Not available"
                        : `₹${i.indicative_cost_inr_lakh.toLocaleString("en-IN")} lakh`
                    }
                  />
                  <Field label="Cost basis" value={text(i.cost_basis)} />
                  <Field
                    label="Target population"
                    value={i.target_population === null ? "Not recorded" : count(i.target_population)}
                  />
                  <Field
                    label="Funding options"
                    value={i.funding_options.join(", ") || "Not recorded"}
                  />
                </div>
                <div className="mt-2">
                  <p className="field-label">Dependencies</p>
                  <Bullets items={i.dependencies ?? []} empty="No dependency is recorded." />
                </div>
                <div className="mt-2">
                  <p className="field-label">Implementation sequence</p>
                  <Bullets
                    items={i.implementation_sequence ?? []}
                    empty="No sequence is recorded."
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Provenance">
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Record type" value={text(prov.record_type)} />
          <Field label="Classification" value={text(prov.data_classification)} />
          <Field label="Verification" value={text(prov.verification_status)} />
          <Field label="Observation date" value={dateText(prov.observation_date)} />
          <Field
            label="Last updated"
            value={dateText((s["last_updated"] as string | null) ?? null)}
          />
          <Field label="Source record" value={text(prov.source_record_id)} />
        </div>
      </Panel>
    </div>
  );
}
