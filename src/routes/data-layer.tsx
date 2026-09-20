import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/Primitives";
import { ReturnLink } from "@/components/app/ReturnLink";
import { useCity } from "@/lib/cityContext";
import { count, dateText, text } from "@/lib/format";
import {
  DATA_PRODUCTS,
  DATASET_REFERENCE_DATE,
  datasetManifest,
  edges,
  fourCityBundle,
  localityRecords,
  lookupEntity,
  provenanceOf,
  relationshipsFor,
  traverse,
} from "@/data/four-city/dataset";
import { ENTITY_LABELS, type EntityKind } from "@/data/four-city/types";
import { validationSummary } from "@/data/four-city/validation";

export const Route = createFileRoute("/data-layer")({
  head: () => ({
    meta: [
      { title: "Data Layer | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "The connected four-city data layer: data products, canonical identifiers, cross-mission relationships, provenance and validation.",
      },
      { property: "og:title", content: "Data Layer: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Every data product, relationship and validation check behind the four-city view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataLayerPage,
});

function Card({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-3 shadow-sm">
      <p className="field-label">{label}</p>
      <p className="num mt-1 text-lg font-semibold text-foreground">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function DataLayerPage() {
  const { city } = useCity();
  const bundle = fourCityBundle(city.city_id);
  const validation = useMemo(() => validationSummary(), []);
  const [lookupId, setLookupId] = useState("");
  const [localityId, setLocalityId] = useState("");

  const lookup = lookupId.trim() ? lookupEntity(lookupId.trim()) : null;
  const related = lookup ? relationshipsFor(lookupId.trim()) : null;
  const reach = lookup ? traverse(lookupId.trim(), 2).length : 0;
  const locality = localityId ? localityRecords(city.city_id, localityId) : null;

  return (
    <div className="space-y-6">
      <ReturnLink fallback="/data-quality" />
      <PageHeader
        title="Data layer"
        subtitle="Data products as supplied, with canonical identifiers, relationships, provenance and validation."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Dataset" value={datasetManifest.dataset_name} note={`Version ${datasetManifest.version}`} />
        <Card label="Reference date" value={dateText(DATASET_REFERENCE_DATE)} note="Observation date on all records" />
        <Card label="Data products" value={count(DATA_PRODUCTS.length)} note="All numbered products loaded" />
        <Card label="Relationships built" value={count(edges.length)} note="Across all four cities" />
      </section>

      {bundle ? (
        <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{city.name} record counts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sampled synthetic records, not citywide totals. Do not extrapolate.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ["Localities", bundle.localities.length],
                ["Projects", bundle.projects.length],
                ["Assets", bundle.assets.length],
                ["Service areas", bundle.serviceAreas.length],
                ["Property aggregates", bundle.properties.length],
                ["Housing", bundle.housing.length],
                ["Water and sewerage", bundle.waterSewerage.length],
                ["Sanitation", bundle.sanitation.length],
                ["Finance", bundle.finance.length],
                ["Service observations", bundle.serviceObservations.length],
                ["Grievances", bundle.grievances.length],
                ["Decision signals", bundle.signals.length],
              ] as Array<[string, number]>
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="field-label">{label}</dt>
                <dd className="num text-sm">{count(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{city.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {city.name} is not part of the four-city dataset. Its records come from its own
            government register.
          </p>
        </section>
      )}

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Data products</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="field-label py-2">File</th>
                <th className="field-label py-2">Entity</th>
                <th className="field-label py-2">Description</th>
                <th className="field-label py-2 text-right">Records</th>
              </tr>
            </thead>
            <tbody>
              {DATA_PRODUCTS.map((p) => (
                <tr key={p.filename} className="border-b border-border/60">
                  <td className="num py-2 pr-3">{p.filename}</td>
                  <td className="py-2 pr-3">
                    {p.entity === "reference" ? "Reference" : ENTITY_LABELS[p.entity as EntityKind]}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.description}</td>
                  <td className="num py-2 text-right">{count(p.records)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Validation</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Checks run in the application against the data as loaded. {validation.passed} of{" "}
          {validation.total} passed.
        </p>
        <ul className="mt-3 space-y-2">
          {validation.checks.map((c) => (
            <li key={c.id} className="rounded-sm border border-border/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${
                    c.passed
                      ? "bg-muted text-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {c.passed ? "Passed" : `${c.failures.length}+ issues`}
                </span>
                <span className="text-sm text-foreground">{c.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
              {c.failures.length ? (
                <ul className="num mt-1 space-y-0.5 text-xs text-destructive">
                  {c.failures.slice(0, 5).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Entity lookup and relationships</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter any canonical identifier, for example a project, asset, property aggregate or
          decision signal identifier.
        </p>
        <input
          aria-label="Search by canonical record id"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder="PRJ-THANE-001"
          className="num mt-3 w-full max-w-sm rounded-sm border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        {lookupId.trim() && !lookup ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No record with that identifier is loaded.
          </p>
        ) : null}
        {lookup ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="field-label">Entity</p>
                <p className="text-sm">{ENTITY_LABELS[lookup.kind]}</p>
              </div>
              <div>
                <p className="field-label">Direct relationships</p>
                <p className="num text-sm">
                  {count((related?.out.length ?? 0) + (related?.in.length ?? 0))}
                </p>
              </div>
              <div>
                <p className="field-label">Reachable within two hops</p>
                <p className="num text-sm">{count(reach)}</p>
              </div>
            </div>
            {(() => {
              const p = provenanceOf(lookup.record);
              return (
                <dl className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="field-label">Record type</dt>
                    <dd className="text-sm">{text(p.record_type)}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Classification</dt>
                    <dd className="text-sm">{text(p.data_classification)}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Verification</dt>
                    <dd className="text-sm">{text(p.verification_status)}</dd>
                  </div>
                  <div>
                    <dt className="field-label">Observed</dt>
                    <dd className="num text-sm">{dateText(p.observation_date)}</dd>
                  </div>
                </dl>
              );
            })()}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="field-label py-2">Direction</th>
                    <th className="field-label py-2">Relationship</th>
                    <th className="field-label py-2">Related record</th>
                    <th className="field-label py-2">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...(related?.out ?? []).map((e) => ({ dir: "Out", e })),
                    ...(related?.in ?? []).map((e) => ({ dir: "In", e })),
                  ]
                    .slice(0, 60)
                    .map(({ dir, e }, i) => (
                      <tr key={`${e.from_id}-${e.to_id}-${e.relationship_type}-${i}`} className="border-b border-border/60">
                        <td className="py-2 pr-3">{dir}</td>
                        <td className="py-2 pr-3">{e.relationship_type.replace(/_/g, " ")}</td>
                        <td className="num py-2 pr-3">
                          <button
                            type="button"
                            className="underline underline-offset-2"
                            onClick={() => setLookupId(dir === "Out" ? e.to_id : e.from_id)}
                          >
                            {dir === "Out" ? e.to_id : e.from_id}
                          </button>
                          <span className="ml-2 text-muted-foreground">
                            {ENTITY_LABELS[dir === "Out" ? e.to_kind : e.from_kind]}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">{e.basis}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      {bundle ? (
        <section className="rounded-sm border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Locality drill-down</h2>
          <select aria-label="Choose a locality"
            value={localityId}
            onChange={(e) => setLocalityId(e.target.value)}
            className="mt-3 w-full max-w-sm rounded-sm border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a locality</option>
            {bundle.localities.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.id})
              </option>
            ))}
          </select>
          {locality ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["Projects", locality.projects.length],
                  ["Assets", locality.assets.length],
                  ["Property aggregates", locality.properties.length],
                  ["Housing", locality.housing.length],
                  ["Grievances", locality.grievances.length],
                  ["Decision signals", locality.signals.length],
                ] as Array<[string, number]>
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="field-label">{label}</dt>
                  <dd className="num text-sm">{count(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {locality?.locality ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {locality.locality.name} is anchored at an illustrative point, not an official ward
              boundary. Official ward identifier: {text(locality.locality.official_ward_id)}.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
