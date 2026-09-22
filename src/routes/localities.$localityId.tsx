import { lazy, useEffect } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import { localityRecords, provenanceOf } from "@/data/four-city/dataset";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";
import { count, dateText, labelise, percent, text } from "@/lib/format";
import { Unavailable } from "@/components/app/Unavailable";
import { PropertyShowcaseEntry } from "@/components/app/PropertyShowcaseEntry";

const PointMap = lazy(() => import("@/components/map/PointMap"));

export const Route = createFileRoute("/localities/$localityId")({
  head: () => ({
    meta: [
      { title: "Locality detail | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Housing, municipal assets, projects, service observations, grievances and decision signals attached to one locality.",
      },
      { property: "og:title", content: "Locality detail: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Every record attached to one locality anchor, with provenance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LocalityDetail,
});

function LocalityDetail() {
  const { localityId } = useParams({ from: "/localities/$localityId" });
  const { city } = useCity();
  const { setLocalityId } = useGeo();
  const records = localityRecords(city.city_id, localityId);

  // Hold this locality as the active geographic context for later views.
  useEffect(() => {
    if (records?.locality) setLocalityId(localityId);
  }, [localityId, records?.locality, setLocalityId]);

  if (!records?.locality) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: "Localities", to: "/localities" }, { label: localityId }]} />
        <Unavailable
          title="This locality is not in the current city's records"
          detail={`${localityId} does not belong to ${city.name}. Localities are never matched across cities.`}
          backTo="/localities"
          backLabel="localities"
        />
      </div>
    );
  }

  const l = records.locality;
  const prov = provenanceOf(l as unknown as Record<string, unknown>);
  const point: MapPoint[] = [
    {
      id: l.id,
      name: l.name,
      sub: l.geometry_type,
      lat: l.coordinates[1],
      lon: l.coordinates[0],
      verified: l.is_official_boundary,
    },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Localities", to: "/localities" }, { label: l.name }]} />
      <PageHeader
        title={`${l.name}, ${city.name}`}
        subtitle={`${l.id} · ${labelise(l.geometry_type)}. This is an illustrative point anchor. It carries no statutory ward identity, and no ward boundary is implied or inferred.`}
      />

      <PropertyShowcaseEntry city={city} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Locality anchor" description="Point geometry as supplied. Not a polygon.">
          <div className="h-64 w-full overflow-hidden rounded-sm border border-border">
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading map…
                </div>
              }
            >
              <PointMap
                points={point}
                centre={[l.coordinates[1], l.coordinates[0]]}
                zoom={13}
              />
            </ClientOnly>
          </div>
        </Panel>

        <Panel title="Geography and provenance">
          <dl className="space-y-2 text-sm">
            <Field label="Official ward identifier" value={text(l.official_ward_id)} />
            <Field label="Ward boundary version" value={text(l.ward_boundary_version)} />
            <Field label="Municipal zone" value={text(l.municipal_zone_id)} />
            <Field label="Geocoding precision" value={text(l.geocoding_precision)} />
            <Field
              label="Official boundary"
              value={l.is_official_boundary ? "Yes" : "No: illustrative anchor"}
            />
            <Field label="Record type" value={text(prov.record_type)} />
            <Field label="Data classification" value={text(prov.data_classification)} />
            <Field label="Observation date" value={dateText(prov.observation_date)} />
          </dl>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Projects" value={records.projects.length} />
        <Tile label="Municipal assets" value={records.assets.length} />
        <Tile label="Housing records" value={records.housing.length} />
        <Tile label="Property aggregates" value={records.properties.length} />
        <Tile label="Service observations" value={records.serviceObservations.length} />
        <Tile label="Grievance aggregates" value={records.grievances.length} />
        <Tile label="Decision signals" value={records.signals.length} />
        <Tile label="Planning interventions" value={records.interventions.length} />
      </div>

      <Panel title="Projects in this locality">
        <RecordTable
          empty="No project records are attached to this locality."
          headers={["Project", "Mission", "Status", "Record"]}
          rows={records.projects.map((p) => [
            <Link
              key={p.project_id}
              to="/projects/$projectId"
              params={{ projectId: p.project_id }}
              className="underline underline-offset-2"
            >
              {p.project_name}
            </Link>,
            labelise(p.mission),
            labelise(p.project_status),
            <RecordLink key={`r-${p.project_id}`} id={p.project_id} />,
          ])}
        />
      </Panel>

      <Panel title="Municipal assets" description="Assets anchored to this locality.">
        <RecordTable
          empty="No asset records are attached to this locality."
          headers={["Asset", "Type", "Commissioning", "Utilisation", "Record"]}
          rows={records.assets.map((a) => [
            a.asset_name,
            labelise(a.asset_type),
            labelise(a.commissioning_status),
            percent(a.utilisation_pct),
            <RecordLink key={a.asset_id} id={a.asset_id} />,
          ])}
        />
      </Panel>

      <Panel title="Housing">
        <RecordTable
          empty="No housing records are attached to this locality."
          headers={["Housing record", "Vertical", "Completed", "Occupied", "Water ready", "Record"]}
          rows={records.housing.map((h) => [
            h.housing_id,
            labelise(h.vertical),
            count(h.completed_houses),
            count(h.occupied_houses),
            count(h.water_ready_houses),
            <RecordLink key={h.housing_id} id={h.housing_id} />,
          ])}
        />
      </Panel>

      <Panel title="Service-delivery observations">
        <RecordTable
          empty="No service observations are attached to this locality."
          headers={["Service", "Period", "Received", "Resolved", "SLA", "Record"]}
          rows={records.serviceObservations.map((o) => [
            labelise(o.service_type),
            text(o.period),
            count(o.applications_received),
            count(o.applications_resolved),
            percent(o.sla_compliance_pct),
            <RecordLink key={o.service_observation_id} id={o.service_observation_id} />,
          ])}
        />
      </Panel>

      <Panel title="Grievances">
        <RecordTable
          empty="No grievance aggregates are attached to this locality."
          headers={["Service", "Period", "Complaints", "Repeat", "Record"]}
          rows={records.grievances.map((g) => [
            labelise(g.service_type),
            text(g.period),
            count(g.complaint_count),
            count(g.repeat_complaints),
            <RecordLink key={g.complaint_aggregate_id} id={g.complaint_aggregate_id} />,
          ])}
        />
      </Panel>

      <Panel title="Decision signals" description="Each signal lists the records that support it.">
        {records.signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No decision signals are attached to this locality.
          </p>
        ) : (
          <ul className="space-y-3">
            {records.signals.map((s) => (
              <li key={s.signal_id} className="rounded-sm border border-border p-3">
                <p className="field-label">{s.signal_id}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{s.observed_condition}</p>
                {s.potential_implications ? (
                  <p className="mt-1 text-sm text-muted-foreground">{text(s.potential_implications)}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">Supporting records:</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {s.supporting_records.map((r) => (
                    <li key={r.id}>
                      <RecordLink id={r.id} label={`${labelise(r.entity)}: ${r.id}`} />
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <Link
                    to="/signals/$signalId"
                    params={{ signalId: s.signal_id }}
                    className="text-sm underline underline-offset-2"
                  >
                    Open signal with its evidence
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
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

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="digit-card p-3">
      <p className="field-label">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{count(value)}</p>
    </div>
  );
}

export function RecordLink({ id, label }: { id: string; label?: string }) {
  return (
    <Link
      to="/records/$recordId"
      params={{ recordId: id }}
      className="num text-xs underline underline-offset-2"
    >
      {label ?? id}
    </Link>
  );
}

function RecordTable({
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
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {headers.map((h) => (
              <th key={h} className="field-label py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border/60">
              {cells.map((c, j) => (
                <td key={j} className="py-2 align-top">
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
