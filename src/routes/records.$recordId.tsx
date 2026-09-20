import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import {
  byId,
  lookupEntity,
  provenanceOf,
  relationshipsFor,
  type Edge,
} from "@/data/four-city/dataset";
import { ENTITY_LABELS, type EntityKind } from "@/data/four-city/types";
import { useCity } from "@/lib/cityContext";
import { useGeo } from "@/lib/geoContext";
import { dateText, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/records/$recordId")({
  head: () => ({
    meta: [
      { title: "Record detail | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "One canonical record with its provenance and every relationship that connects it to projects, assets, service areas and localities.",
      },
      { property: "og:title", content: "Record detail: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Follow a record through its connected projects, assets and service areas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecordDetail,
});

/** Fields shown first, when the record carries them. */
const HEADLINE_FIELDS = [
  "asset_name",
  "project_name",
  "name",
  "asset_type",
  "area_type",
  "service_type",
  "mission",
  "vertical",
  "project_status",
  "commissioning_status",
  "condition",
  "period",
  "observed_condition",
];

const HIDDEN_FIELDS = new Set([
  "record_type",
  "data_classification",
  "verification_status",
  "observation_date",
  "source_record_id",
  "source_url",
  "coordinates",
]);

function RecordDetail() {
  const { recordId } = useParams({ from: "/records/$recordId" });
  const { city } = useCity();
  const { localities } = useGeo();
  const found = lookupEntity(recordId);

  if (!found) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: recordId }]} />
        <PageHeader
          title="Record not found"
          subtitle={`No record carries the identifier ${recordId}. Identifiers are matched exactly; records are never matched by name.`}
        />
      </div>
    );
  }

  const { kind, record } = found;
  const recordCity = (record["city_id"] as string | null) ?? null;
  const localityId = (record["locality_id"] as string | null) ?? null;
  const locality = localityId ? localities.find((l) => l.id === localityId) : undefined;
  const prov = provenanceOf(record);
  const { out, in: inbound } = relationshipsFor(recordId);
  const otherCity = recordCity && recordCity !== city.city_id;

  const trail = [
    ...(locality
      ? [
          { label: "Localities", to: "/localities" },
          {
            label: locality.name,
            to: "/localities/$localityId",
            params: { localityId: locality.id },
          },
        ]
      : [{ label: "Localities", to: "/localities" }]),
    { label: `${ENTITY_LABELS[kind]} ${recordId}` },
  ];

  const headline = HEADLINE_FIELDS.filter((f) => record[f] !== undefined && record[f] !== null);
  const rest = Object.keys(record).filter(
    (k) => !HIDDEN_FIELDS.has(k) && !headline.includes(k) && !Array.isArray(record[k]),
  );

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={trail} />
      <PageHeader
        title={
          (record["asset_name"] as string) ??
          (record["project_name"] as string) ??
          (record["name"] as string) ??
          recordId
        }
        subtitle={`${ENTITY_LABELS[kind]} · ${recordId}${
          locality ? ` · ${locality.name}` : ""
        }${recordCity ? ` · ${recordCity}` : ""}`}
      />

      {otherCity ? (
        <p className="rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
          This record belongs to {recordCity}, not the city currently selected ({city.city_id}).
          Records are never joined across cities.
        </p>
      ) : null}

      {kind === "project" ? (
        <p className="text-sm">
          <Link
            to="/projects/$projectId"
            params={{ projectId: recordId }}
            className="underline underline-offset-2"
          >
            Open the full project view
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Record fields" description="Values exactly as supplied.">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[...headline, ...rest].map((field) => (
              <div key={field}>
                <dt className="field-label">{labelise(field)}</dt>
                <dd className="text-sm break-words text-foreground">
                  {formatValue(record[field])}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Provenance">
          <dl className="space-y-2">
            <Field label="Record type" value={text(prov.record_type)} />
            <Field label="Data classification" value={text(prov.data_classification)} />
            <Field label="Verification status" value={text(prov.verification_status)} />
            <Field label="Observation date" value={dateText(prov.observation_date)} />
            <Field label="Source record" value={text(prov.source_record_id)} />
          </dl>
          {prov.source?.url ? (
            <a
              href={prov.source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs underline underline-offset-2"
            >
              Source reference
            </a>
          ) : null}
          {record["coordinates"] ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Position:{" "}
              {(record["coordinates"] as [number, number]).map((n) => n.toFixed(4)).join(", ")}:{" "}
              {record["actual_asset_location"] === true
                ? "reported as an actual location"
                : "illustrative point anchor, not a surveyed location and not a boundary"}
              .
            </p>
          ) : null}
        </Panel>
      </div>

      <Panel
        title="Connected records"
        description="Relationships resolved by canonical identifier only."
      >
        <EdgeTable title="This record points to" edges={out} direction="out" />
        <div className="h-4" />
        <EdgeTable title="Records pointing here" edges={inbound} direction="in" />
      </Panel>
    </div>
  );
}

function EdgeTable({
  title,
  edges,
  direction,
}: {
  title: string;
  edges: Edge[];
  direction: "in" | "out";
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {edges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No relationships recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="field-label py-2">Relationship</th>
                <th className="field-label py-2">Record</th>
                <th className="field-label py-2">Kind</th>
                <th className="field-label py-2">Basis</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e, i) => {
                const id = direction === "out" ? e.to_id : e.from_id;
                const kind = direction === "out" ? e.to_kind : e.from_kind;
                return (
                  <tr key={`${e.relationship_type}-${id}-${i}`} className="border-b border-border/60">
                    <td className="py-2">{labelise(e.relationship_type)}</td>
                    <td className="num py-2">
                      <Link
                        to="/records/$recordId"
                        params={{ recordId: id }}
                        className="underline underline-offset-2"
                      >
                        {displayName(id)}
                      </Link>
                    </td>
                    <td className="py-2">{ENTITY_LABELS[kind]}</td>
                    <td className="py-2 text-xs text-muted-foreground">{e.basis}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function displayName(id: string): string {
  const found = lookupEntity(id);
  if (!found) return id;
  const r = found.record as Record<string, unknown>;
  const name = (r["asset_name"] ?? r["project_name"] ?? r["name"]) as string | undefined;
  return name ? `${name} (${id})` : id;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Data not available";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Data not available";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

/** Keeps the entity index import honest: every kind is routable. */
export const ROUTABLE_KINDS = Object.keys(byId) as EntityKind[];
