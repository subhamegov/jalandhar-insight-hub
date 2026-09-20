import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { RecordLink } from "@/routes/localities.$localityId";
import { Table, lakh } from "@/routes/investment.index";
import { investmentChain } from "@/data/four-city/investment";
import { provenanceOf } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { count, dateText, labelise, percent, text } from "@/lib/format";

export const Route = createFileRoute("/investment/$projectId")({
  head: () => ({
    meta: [
      { title: "Investment chain | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "One project followed from mission and funding through expenditure, infrastructure created, operating status and the service and complaint records observed around it.",
      },
      { property: "og:title", content: "Investment chain: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Mission, funding, expenditure, infrastructure, service and citizen records for one project.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestmentDetail,
});

function InvestmentDetail() {
  const { projectId } = Route.useParams();
  const { city } = useCity();
  const chain = useMemo(() => investmentChain(city.city_id, projectId), [city.city_id, projectId]);

  if (!chain) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Investment and outcomes", to: "/investment" }, { label: projectId }]} />
        <PageHeader
          title="This project is not in the current city's records"
          subtitle={`No project with identifier ${projectId} is loaded for ${city.name}.`}
        />
        <Link to="/investment" className="text-sm underline underline-offset-2">
          Back to investment and outcomes
        </Link>
      </div>
    );
  }

  const p = chain.project;
  const prov = provenanceOf(p as unknown as Record<string, unknown>);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        trail={[
          { label: "Investment and outcomes", to: "/investment" },
          { label: p.project_name },
        ]}
      />
      <PageHeader
        title={p.project_name}
        subtitle={`${labelise(p.mission)} · ${p.implementing_agency} · ${p.project_id}. The chain below runs mission → funding → expenditure → infrastructure → operating status → observed service records. A completed step never implies the next one.`}
      />

      <Panel title="Project">
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Mission" value={labelise(p.mission)} />
          <Field label="Project type" value={labelise(p.project_type)} />
          <Field label="Implementing agency" value={text(p.implementing_agency)} />
          <Field label="Status" value={labelise(p.project_status)} />
          <Field label="Estimated cost" value={lakh(p.estimated_cost_inr_lakh)} />
          <Field label="Awarded cost" value={lakh(p.awarded_cost_inr_lakh)} />
          <Field label="Physical progress" value={percent(p.physical_progress_pct)} />
          <Field label="Financial progress" value={percent(p.financial_progress_pct)} />
          <Field label="Start" value={dateText(p.start_date)} />
          <Field label="Scheduled completion" value={dateText(p.scheduled_completion_date)} />
          <Field label="Actual completion" value={dateText(p.actual_completion_date)} />
          <Field
            label="Locality"
            value={
              chain.locality ? (
                <Link
                  to="/localities/$localityId"
                  params={{ localityId: chain.locality.id }}
                  className="underline underline-offset-2"
                >
                  {chain.locality.name}
                </Link>
              ) : (
                "Not available"
              )
            }
          />
        </dl>
        {chain.flags.length ? (
          <div className="mt-3 rounded-sm border border-border bg-muted/40 p-3">
            <p className="field-label">What to check on this project</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {chain.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Funding and expenditure"
        description="Amounts in INR lakh as supplied, grouped by financial year. Years are never added together, and unspent released funding is shown only where released and expenditure are both recorded."
      >
        <Table
          empty="No finance record is linked to this project."
          headers={[
            "Financial year",
            "Budget",
            "Released",
            "Expenditure",
            "Unspent released",
            "Period end",
            "Source",
            "Capex / Opex",
            "Record",
          ]}
          rows={chain.finance.flatMap((y) =>
            y.records.map((r) => [
              y.financial_year,
              lakh(r.budget_inr_lakh),
              lakh(r.fund_released_inr_lakh),
              lakh(r.expenditure_inr_lakh),
              r.fund_released_inr_lakh !== null && r.expenditure_inr_lakh !== null
                ? lakh(r.fund_released_inr_lakh - r.expenditure_inr_lakh)
                : "Not available",
              dateText(r.accounting_period_end),
              labelise(r.funding_source),
              labelise(r.capex_opex),
              <RecordLink key={r.finance_id} id={r.finance_id} />,
            ]),
          )}
        />
      </Panel>

      <Panel title="Project components" description="Targets and achievement recorded against the project.">
        <Table
          empty="No component record for this project."
          headers={["Component", "Type", "Target", "Achieved", "Unit", "Milestone", "Milestone status"]}
          rows={chain.components.map((c) => [
            <RecordLink key={c.component_id} id={c.component_id} />,
            labelise(c.component_type),
            count(c.target_quantity),
            count(c.achieved_quantity),
            text(c.unit),
            text(c.milestone),
            labelise(c.milestone_status),
          ])}
        />
      </Panel>

      <Panel
        title="Infrastructure created"
        description="Assets recorded against this project, with whether each is operating and how far it is used."
      >
        <Table
          empty="No asset is recorded against this project."
          headers={[
            "Asset",
            "Type",
            "Commissioning status",
            "Condition",
            "Capacity",
            "Utilisation",
            "Owner",
            "Operator",
          ]}
          rows={chain.assets.map((a) => [
            <RecordLink key={a.asset_id} id={a.asset_id} label={`${a.asset_name} (${a.asset_id})`} />,
            labelise(a.asset_type),
            labelise(a.commissioning_status),
            labelise(a.condition),
            a.capacity_value === null ? "Not available" : `${count(a.capacity_value)} ${text(a.capacity_unit)}`,
            percent(a.utilisation_pct),
            text(a.owner_agency),
            text(a.operator_agency),
          ])}
        />
        {chain.notOperational.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {chain.notOperational.length} asset(s) here are not operating yet. Spending and
            construction on this project do not by themselves put a service in front of citizens.
          </p>
        ) : null}
      </Panel>

      <Panel
        title="Service areas and localities served"
        description="Service areas named by the assets, and the localities those areas list. Areas are recorded as points, not boundaries."
      >
        <Table
          empty="No service area is recorded for these assets."
          headers={["Service area", "Area type", "Localities listed", "Water assets", "Sewer assets"]}
          rows={chain.serviceAreas.map((s) => [
            <RecordLink key={s.service_area_id} id={s.service_area_id} />,
            labelise(s.area_type),
            s.locality_ids.length
              ? s.locality_ids.map((id) => (
                  <Link
                    key={id}
                    to="/localities/$localityId"
                    params={{ localityId: id }}
                    className="mr-2 text-xs underline underline-offset-2"
                  >
                    {id}
                  </Link>
                ))
              : "Not available",
            count(s.water_asset_ids.length),
            count(s.sewer_asset_ids.length),
          ])}
        />
      </Panel>

      <Panel
        title="Observed service delivery"
        description="Service observations recorded against the assets created by this project."
      >
        <Table
          empty="No service observation names these assets."
          headers={[
            "Observation",
            "Service",
            "Period",
            "Applications received",
            "Resolved",
            "Compliance",
            "Average resolution (hrs)",
          ]}
          rows={chain.observations.map((o) => [
            <RecordLink key={o.service_observation_id} id={o.service_observation_id} />,
            labelise(o.service_type),
            text(o.period),
            count(o.applications_received),
            count(o.applications_resolved),
            percent(o.sla_compliance_pct),
            o.average_resolution_hours ?? "Not available",
          ])}
        />
      </Panel>

      <Panel
        title="Grievances"
        description="Complaint aggregates naming these assets. Aggregates only: no personal information is held."
      >
        <Table
          empty="No complaint aggregate names these assets."
          headers={["Aggregate", "Service", "Period", "Complaints", "Repeat complaints", "Average resolution (hrs)"]}
          rows={chain.grievances.map((g) => [
            <RecordLink key={g.complaint_aggregate_id} id={g.complaint_aggregate_id} />,
            labelise(g.service_type),
            text(g.period),
            count(g.complaint_count),
            count(g.repeat_complaints),
            g.average_resolution_hours ?? "Not available",
          ])}
        />
      </Panel>

      <Panel title="Housing delivered" description="Housing records named by this project.">
        {chain.housingIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No housing record is named by this project.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {chain.housingIds.map((id) => (
              <li key={id}>
                <Link
                  to="/housing/$housingId"
                  params={{ housingId: id }}
                  className="num text-xs underline underline-offset-2"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Decision signals" description="Signals citing this project or its assets.">
        {chain.signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No decision signal cites this project.</p>
        ) : (
          <ul className="space-y-3">
            {chain.signals.map((s) => (
              <li key={s.signal_id} className="rounded-sm border border-border p-3">
                <p className="field-label">{s.signal_id}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{s.observed_condition}</p>
                {s.potential_implications ? (
                  <p className="mt-1 text-sm text-muted-foreground">{text(s.potential_implications)}</p>
                ) : null}
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.supporting_records.map((r) => (
                    <li key={r.id}>
                      <RecordLink id={r.id} label={`${labelise(r.entity)}: ${r.id}`} />
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signals/$signalId"
                  params={{ signalId: s.signal_id }}
                  className="mt-2 inline-block text-sm underline underline-offset-2"
                >
                  Open signal with its evidence
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {chain.missingLinks.length ? (
        <Panel title="Links named in the data with no matching record">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {chain.missingLinks.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Provenance">
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Record type" value={text(prov?.record_type ?? p.record_type)} />
          <Field label="Classification" value={text(prov?.data_classification ?? p.data_classification)} />
          <Field label="Verification" value={labelise(prov?.verification_status ?? p.verification_status)} />
          <Field label="Observed" value={dateText(prov?.observation_date ?? p.observation_date)} />
          <Field label="Source record" value={text(prov?.source_record_id ?? p.source_record_id)} />
          <Field label="Official project id" value={text(p.official_project_id)} />
        </dl>
      </Panel>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
