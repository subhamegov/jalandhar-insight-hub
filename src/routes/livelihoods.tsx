import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { RecordLink } from "@/routes/localities.$localityId";
import { livelihoodMobility } from "@/data/four-city/livelihoods";
import { useCity } from "@/lib/cityContext";
import { count, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/livelihoods")({
  head: () => ({
    meta: [
      { title: "Livelihoods and mobility | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Self-help groups, street-vendor aggregates, municipal markets, housing and transport records read together to show access to livelihoods and everyday movement.",
      },
      { property: "og:title", content: "Livelihoods and mobility: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content:
          "Are urban schemes and municipal investments enabling citizens to access livelihoods and economic opportunities?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivelihoodsPage,
});

const SECTIONS = [
  { id: "vendors", label: "Street vendors" },
  { id: "groups", label: "Livelihood groups" },
  { id: "mobility", label: "Housing and transport" },
  { id: "neighbourhoods", label: "Neighbourhoods" },
  { id: "signals", label: "Decision signals" },
];

function LivelihoodsPage() {
  const { city, dataset } = useCity();
  const data = useMemo(() => livelihoodMobility(city.city_id), [city.city_id]);

  if (!dataset.synthetic || !data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Livelihoods and mobility" }]} />
        <PageHeader
          title={`Livelihood and mobility records are not loaded for ${city.name}`}
          subtitle="This view needs livelihood group, street-vendor, market asset and transport records. None are loaded for this city."
        />
        <Panel title="What to use instead">
          <Link to="/projects" className="text-sm underline underline-offset-2">
            Open the project register
          </Link>
        </Panel>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Livelihoods and mobility" }]} />
      <PageHeader
        title={`${city.name}: livelihoods and everyday access`}
        subtitle={`Are urban schemes and municipal investments enabling citizens to access livelihoods and economic opportunities? Observed ${data.period}. Sampled synthetic aggregates, not citywide totals and not government statistics. No beneficiary identity or personal financial record is held.`}
      />

      <Panel title="Sections">
        <div className="flex flex-wrap gap-2 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-sm border border-border px-2 py-1 underline-offset-2 hover:underline"
            >
              {s.label}
            </a>
          ))}
        </div>
      </Panel>

      <section id="vendors" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Tile label="Vendors surveyed" value={t.surveyedVendors} note="PM SVANidhi survey aggregates" />
          <Tile label="Eligible applications" value={t.eligibleApplications} note="Of those surveyed" />
          <Tile label="Loans sanctioned" value={t.sanctioned} note="Sanction only. Money not yet in hand." />
          <Tile
            label="Loans disbursed"
            value={t.disbursed}
            note="Kept separate from sanction. Not evidence of income change."
          />
          <Tile label="Bank returns" value={t.bankReturns} note="Applications returned by banks" />
          <Tile label="Digitally active vendors" value={t.digitalActive} note="Recorded digital activity" />
        </div>

        <Panel
          title="Street-vendor aggregates"
          description="Each aggregate with its vending zone and the municipal market asset it is linked to."
        >
          <Table
            empty="No street-vendor aggregates are recorded for this city."
            headers={[
              "Aggregate",
              "Locality",
              "Surveyed",
              "Eligible",
              "Sanctioned",
              "Disbursed",
              "Bank returns",
              "Digital active",
              "Vending zone",
              "Market asset",
              "Market transport",
              "Notes",
            ]}
            rows={data.vendors.map((v) => [
              <RecordLink key={v.record.vendor_aggregate_id} id={v.record.vendor_aggregate_id} />,
              <LocalityCell key={`l-${v.record.vendor_aggregate_id}`} id={v.locality?.id} name={v.locality?.name} />,
              count(v.record.surveyed_vendors),
              count(v.record.eligible_applications),
              count(v.record.sanctioned),
              count(v.record.disbursed),
              count(v.record.bank_returns),
              count(v.record.digital_active),
              text(v.record.vending_zone_id),
              v.market ? <RecordLink id={v.market.asset_id} label={v.market.asset_name} /> : text(v.record.market_asset_id),
              v.marketTransport.length
                ? v.marketTransport.map((tr) => (
                    <RecordLink key={tr.transport_stop_id} id={tr.transport_stop_id} />
                  ))
                : "No stop recorded",
              v.notes.length ? v.notes.join(" · ") : "Not available",
            ])}
          />
        </Panel>
      </section>

      <section id="groups" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Self-help groups" value={t.shgCount} note="DAY-NULM groups in the sample" />
          <Tile label="Area federations" value={t.alfCount} note="Area-level federations" />
          <Tile label="City federations" value={t.clfCount} note="City-level federations" />
          <Tile label="Enterprises" value={t.enterpriseCount} note="Recorded enterprise activity" />
          <Tile label="Loan applications" value={t.loanApplications} note="Applications made" />
          <Tile label="Loans sanctioned" value={t.loanSanctions} note="Sanction only" />
          <Tile label="Loans disbursed" value={t.loanDisbursements} note="Disbursement, shown separately" />
          <Tile label="Training participants" value={t.trainingParticipants} note="Participation, not employment" />
        </div>

        <Panel
          title="Livelihood groups"
          description="Group records with their locality and the market infrastructure they are linked to."
        >
          <Table
            empty="No livelihood group records are recorded for this city."
            headers={[
              "Record",
              "Mission",
              "Locality",
              "SHGs",
              "Enterprises",
              "Applications",
              "Sanctions",
              "Disbursements",
              "Training",
              "Municipal service link",
              "Market asset",
              "Market transport",
            ]}
            rows={data.livelihoods.map((g) => [
              <RecordLink key={g.record.livelihood_id} id={g.record.livelihood_id} />,
              labelise(g.record.mission),
              <LocalityCell key={`l-${g.record.livelihood_id}`} id={g.locality?.id} name={g.locality?.name} />,
              count(g.record.shg_count),
              count(g.record.enterprise_count),
              count(g.record.loan_applications),
              count(g.record.loan_sanctions),
              count(g.record.loan_disbursements),
              count(g.record.training_participants),
              labelise(g.record.municipal_service_link),
              g.market ? <RecordLink id={g.market.asset_id} label={g.market.asset_name} /> : text(g.record.linked_market_asset_id),
              g.transport.length
                ? g.transport.map((tr) => <RecordLink key={tr.transport_stop_id} id={tr.transport_stop_id} />)
                : "No stop recorded",
            ])}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            A sanctioned or disbursed loan is a scheme transaction. It is not evidence of higher
            income or of an employment outcome, and no such outcome is recorded here.
          </p>
        </Panel>
      </section>

      <section id="mobility" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile
            label="Housing records with a stop"
            value={t.housingWithStop}
            note={`Of ${count(t.housingRecords)} housing records`}
          />
          <Tile label="Market assets" value={t.marketAssets} note="Municipal market infrastructure" />
          <Tile
            label="Housing records without a stop"
            value={t.housingRecords - t.housingWithStop}
            note="No transport record attached"
          />
        </div>

        <Panel
          title="Housing and transport"
          description="Stops and routes recorded against housing. Distance and journey time are not in the data and are not estimated."
        >
          <Table
            empty="No housing records are recorded for this city."
            headers={[
              "Housing record",
              "Locality",
              "Stop",
              "Mode",
              "Route",
              "Headway (min)",
              "Daily trips",
              "Stops on route",
              "What the record shows",
            ]}
            rows={data.mobility.map((m) => [
              <Link
                key={m.housing.housing_id}
                to="/housing/$housingId"
                params={{ housingId: m.housing.housing_id }}
                className="num underline underline-offset-2"
              >
                {m.housing.housing_id}
              </Link>,
              <LocalityCell key={`l-${m.housing.housing_id}`} id={m.locality?.id} name={m.locality?.name} />,
              m.stop ? <RecordLink id={m.stop.transport_stop_id} /> : "Not available",
              labelise(m.stop?.mode ?? null),
              m.stop ? m.stop.route_id : "Not available",
              m.stop?.service_headway_minutes ?? "Not available",
              count(m.stop?.daily_trips ?? null),
              m.routeRecords.length ? count(m.routeRecords.length) : "Not available",
              <span key={`n-${m.housing.housing_id}`} className="text-xs text-muted-foreground">
                {m.note}
              </span>,
            ])}
          />
        </Panel>
      </section>

      <section id="neighbourhoods">
        <Panel
          title="Neighbourhoods: housing, economic activity and access"
          description="Each locality with the records present, and the records that are absent."
        >
          <Table
            empty="No localities are recorded for this city."
            headers={[
              "Locality",
              "Houses completed",
              "Houses occupied",
              "SHGs",
              "Enterprises",
              "Vendors surveyed",
              "Market assets",
              "Transport stops",
              "Observable gaps",
            ]}
            rows={data.neighbourhoods.map((n) => [
              <LocalityCell key={n.locality.id} id={n.locality.id} name={n.locality.name} />,
              count(n.completedHouses),
              count(n.occupiedHouses),
              count(n.shgCount),
              count(n.enterpriseCount),
              count(n.surveyedVendors),
              count(n.marketAssets),
              count(n.transportStops),
              <span key={`g-${n.locality.id}`} className="text-xs text-muted-foreground">
                {n.gaps.length ? n.gaps.join(" · ") : "No absent record types"}
              </span>,
            ])}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            A gap here means a record type is absent from the sample for that locality. It is not a
            statement that the service or facility does not exist on the ground.
          </p>
        </Panel>
      </section>

      <section id="signals">
        <Panel
          title="Related decision signals"
          description="Signals citing livelihood, vendor, market or transport records."
        >
          {data.signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No decision signal cites these records.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.signals.map((s) => (
                <li key={s.signal_id} className="rounded-sm border border-border p-3">
                  <p className="field-label">{s.signal_id}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{s.observed_condition}</p>
                  {s.potential_implications ? (
                    <p className="mt-1 text-sm text-muted-foreground">{s.potential_implications}</p>
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
      </section>
    </div>
  );
}

function LocalityCell({ id, name }: { id?: string | undefined; name?: string | undefined }) {
  if (!id || !name) return <>Not available</>;
  return (
    <Link to="/localities/$localityId" params={{ localityId: id }} className="underline underline-offset-2">
      {name}
    </Link>
  );
}

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="digit-card p-3">
      <p className="field-label">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{count(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
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
      <table className="w-full min-w-[60rem] text-sm">
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
