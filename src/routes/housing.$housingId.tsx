import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { RecordLink } from "@/routes/localities.$localityId";
import { housingRecord } from "@/data/four-city/housing";
import { provenanceOf } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { count, dateText, labelise, percent, text } from "@/lib/format";

export const Route = createFileRoute("/housing/$housingId")({
  head: () => ({
    meta: [
      { title: "Housing record | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "One housing record traced through its locality, water and sewerage infrastructure, waste collection, transport access, service observations, grievances, investment and decision signals.",
      },
      { property: "og:title", content: "Housing record — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Houses completed against the municipal services recorded against them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HousingDetail,
});

const numText = (v: number | null) => (typeof v === "number" ? String(v) : "Not available");

const lakhToCrore = (v: number | null) => (typeof v === "number" ? (v / 100).toFixed(2) : null);

function HousingDetail() {
  const { housingId } = useParams({ from: "/housing/$housingId" });
  const { city } = useCity();
  const r = housingRecord(city.city_id, housingId);

  if (!r) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Housing", to: "/housing" }, { label: housingId }]} />
        <PageHeader
          title="Housing record not found in this city"
          subtitle={`${housingId} does not belong to ${city.name}. Records are never matched across cities.`}
        />
        <Link to="/housing" className="text-sm underline underline-offset-2">
          Back to housing
        </Link>
      </div>
    );
  }

  const h = r.record;
  const prov = provenanceOf(h as unknown as Record<string, unknown>);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        trail={[
          { label: "Housing", to: "/housing" },
          ...(r.locality
            ? [{ label: r.locality.name, to: "/localities/$localityId" as const, params: { localityId: r.locality.id } }]
            : []),
          { label: h.housing_id },
        ]}
      />
      <PageHeader
        title={`${h.housing_id} — ${labelise(h.vertical)}`}
        subtitle={`${labelise(h.mission)} · ${r.locality ? r.locality.name : "Locality not recorded"} · ${city.name}. Synthetic sampled record, classification ${text(prov.data_classification)}, observed ${dateText(prov.observation_date)}.`}
      />

      <Panel
        title="Housing progression"
        description="Sanctioned → grounded → completed → occupied → serviced. Each step is read from its own field."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="field-label py-2 pr-3">Step</th>
                <th className="field-label py-2 pr-3 text-right">Houses</th>
                <th className="field-label py-2 pr-3 text-right">Of</th>
                <th className="field-label py-2">What it means</th>
              </tr>
            </thead>
            <tbody>
              {r.progression.map((s) => (
                <tr key={s.key} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{s.label}</td>
                  <td className="num py-2 pr-3 text-right">{count(s.value)}</td>
                  <td className="num py-2 pr-3 text-right text-muted-foreground">
                    {s.ofValue === null ? "—" : `${count(s.ofValue)} ${s.ofLabel}`}
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Service readiness gaps"
        description="Completed houses with no recorded connection or occupancy."
      >
        {r.gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No shortfall is recorded between completed houses and the recorded connections. This
            does not confirm that the services run reliably.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {r.gaps.map((g) => (
              <li key={g.label} className="digit-card p-3">
                <p className="field-label">{g.label}</p>
                <p className="num mt-1 text-xl font-semibold">{count(g.shortfall)}</p>
                <p className="mt-1 text-xs text-muted-foreground">of {count(g.of)} completed</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {r.missingLinks.length > 0 ? (
        <Panel
          title="Missing connections in the records"
          description="Links named or expected in the data that have no matching record."
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {r.missingLinks.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mission investment" description="The project delivering these houses.">
          {r.project ? (
            <dl className="space-y-2 text-sm">
              <Field label="Project" value={r.project.project_name} />
              <Field label="Project identifier" value={r.project.project_id} />
              <Field label="Mission" value={labelise(r.project.mission)} />
              <Field label="Implementing agency" value={text(r.project.implementing_agency)} />
              <Field label="Status" value={labelise(r.project.project_status)} />
              <Field label="Physical progress" value={percent(r.project.physical_progress_pct)} />
              <Field
                label="Estimated cost"
                value={
                  lakhToCrore(r.project.estimated_cost_inr_lakh)
                    ? `INR ${lakhToCrore(r.project.estimated_cost_inr_lakh)} crore`
                    : text(null)
                }
              />
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: r.project.project_id }}
                  className="text-sm underline underline-offset-2"
                >
                  Open project
                </Link>
                <RecordLink id={r.project.project_id} label="Connected records" />
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project record is attached to this housing record.
            </p>
          )}
        </Panel>

        <Panel title="Financial records" description="Finance rows recorded against this project.">
          <Table
            empty="No financial records are attached to this project."
            headers={["Finance record", "Year", "Budget (cr)", "Released (cr)", "Expenditure (cr)"]}
            rows={r.finance.map((f) => [
              <RecordLink key={f.finance_id} id={f.finance_id} />,
              text(f.financial_year),
              text(lakhToCrore(f.budget_inr_lakh)),
              text(lakhToCrore(f.fund_released_inr_lakh)),
              text(lakhToCrore(f.expenditure_inr_lakh)),
            ])}
          />
        </Panel>
      </div>

      <Panel
        title="Water and sewerage infrastructure"
        description="Connection records for the linked property aggregates, and the assets serving them."
      >
        <Table
          empty="No water or sewerage connection records are linked to this housing record."
          headers={[
            "Connection record",
            "Supply hours/day",
            "Quality samples passed",
            "Status",
            "Water treatment asset",
            "Sewer treatment asset",
          ]}
          rows={r.waterSewerage.map((w) => [
            <RecordLink key={w.connection_record_id} id={w.connection_record_id} />,
            numText(w.water_supply_hours_per_day),
            w.water_quality_samples_total
              ? `${count(w.water_quality_samples_passed)} of ${count(w.water_quality_samples_total)}`
              : text(null),
            labelise(w.service_status),
            w.water_treatment_asset_id ? <RecordLink id={w.water_treatment_asset_id} /> : text(null),
            w.sewer_treatment_asset_id ? <RecordLink id={w.sewer_treatment_asset_id} /> : text(null),
          ])}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          A connection record shows that a link exists. It is not evidence that supply is reliable.
        </p>
      </Panel>

      <Panel
        title="Connected municipal assets"
        description="Assets reached through the project, the service areas and the waste collection route."
      >
        <Table
          empty="No municipal assets are connected to this housing record."
          headers={["Asset", "Type", "Commissioning", "Condition", "Utilisation", "Operator", "Record"]}
          rows={r.assets.map((a) => [
            a.asset_name,
            labelise(a.asset_type),
            labelise(a.commissioning_status),
            labelise(a.condition),
            percent(a.utilisation_pct),
            text(a.operator_agency),
            <RecordLink key={a.asset_id} id={a.asset_id} />,
          ])}
        />
        {r.notOperational.length > 0 ? (
          <p className="mt-2 text-sm text-foreground">
            <span className="font-semibold">{count(r.notOperational.length)}</span> of these assets
            are not in operational service:{" "}
            {r.notOperational.map((a) => a.asset_name).join(", ")}.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Waste collection" description="Routes covering the linked properties.">
          <Table
            empty="No waste collection record covers the linked properties."
            headers={["Sanitation record", "Door-to-door", "Segregation", "Collected/Generated (tpd)", "Record"]}
            rows={r.sanitation.map((s) => [
              s.sanitation_id,
              percent(s.door_to_door_coverage_pct),
              percent(s.segregation_pct),
              `${numText(s.waste_collected_tpd)} / ${numText(s.waste_generated_tpd)}`,
              <RecordLink key={s.sanitation_id} id={s.sanitation_id} />,
            ])}
          />
        </Panel>

        <Panel title="Transport access" description="Stops and routes recorded against this housing record.">
          <Table
            empty="No transport stop record is attached to this housing record."
            headers={["Stop", "Mode", "Headway (min)", "Daily trips", "Actual location", "Record"]}
            rows={r.transport.map((t) => [
              t.transport_stop_id,
              labelise(t.mode),
              numText(t.service_headway_minutes),
              count(t.daily_trips),
              t.actual_stop_or_route ? "Yes" : "No — illustrative",
              <RecordLink key={t.transport_stop_id} id={t.transport_stop_id} />,
            ])}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Service delivery" description="Observations touching these properties or assets.">
          <Table
            empty="No service-delivery observations are linked to this housing record."
            headers={["Service", "Period", "Received", "Resolved", "SLA", "Record"]}
            rows={r.serviceObservations.map((o) => [
              labelise(o.service_type),
              text(o.period),
              count(o.applications_received),
              count(o.applications_resolved),
              percent(o.sla_compliance_pct),
              <RecordLink key={o.service_observation_id} id={o.service_observation_id} />,
            ])}
          />
        </Panel>

        <Panel title="Grievances" description="Complaints recorded against the same properties or assets.">
          <Table
            empty="No grievance aggregates are linked to this housing record."
            headers={["Service", "Period", "Complaints", "Repeat", "Avg resolution (hrs)", "Record"]}
            rows={r.grievances.map((g) => [
              labelise(g.service_type),
              text(g.period),
              count(g.complaint_count),
              count(g.repeat_complaints),
              numText(g.average_resolution_hours),
              <RecordLink key={g.complaint_aggregate_id} id={g.complaint_aggregate_id} />,
            ])}
          />
        </Panel>
      </div>

      <Panel title="Responsible agencies" description="Implementing agency and asset owners or operators.">
        {r.agencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agency is recorded for these records.</p>
        ) : (
          <ul className="flex flex-wrap gap-2 text-sm">
            {r.agencies.map((a) => (
              <li key={a} className="rounded-sm border border-border px-2 py-1">
                {a}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Decision signals" description="Signals supported by this housing record, its project or its assets.">
        {r.signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No decision signal cites these records.
          </p>
        ) : (
          <ul className="space-y-3">
            {r.signals.map((s) => (
              <li key={s.signal_id} className="rounded-sm border border-border p-3">
                <p className="field-label">{s.signal_id}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{s.observed_condition}</p>
                {s.potential_implications ? (
                  <p className="mt-1 text-sm text-muted-foreground">{s.potential_implications}</p>
                ) : null}
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.supporting_records.map((sr) => (
                    <li key={sr.id}>
                      <RecordLink id={sr.id} label={`${labelise(sr.entity)}: ${sr.id}`} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Provenance">
        <dl className="grid gap-3 sm:grid-cols-4">
          <Field label="Record type" value={text(prov.record_type)} />
          <Field label="Verification status" value={text(prov.verification_status)} />
          <Field label="Data classification" value={text(prov.data_classification)} />
          <Field label="Observation date" value={dateText(prov.observation_date)} />
        </dl>
      </Panel>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {headers.map((h) => (
              <th key={h} className="field-label py-2 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border/60">
              {cells.map((c, j) => (
                <td key={j} className="py-2 pr-3 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
