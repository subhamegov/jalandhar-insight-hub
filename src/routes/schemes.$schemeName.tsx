import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyNote, Field, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import { componentsFor, fundingComponents, programmesFor } from "@/data/programmes";
import { evidence, projects, schemes } from "@/data/selectors";
import { knownInrValue } from "@/data/registerLogic";
import { crore, dateText, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/schemes/$schemeName")({
  loader: ({ params }) => {
    const name = decodeURIComponent(params.schemeName);
    const scheme = schemes.find((s) => s.scheme_name === name) ?? null;
    return { name, scheme };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Scheme";
    const title = `${name} in Jalandhar | Jalandhar City Intelligence`;
    const description = `Projects in Jalandhar funded by ${name}, with sanctioned investment, expenditure, status and sources.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SchemePage,
});

function sum(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
}

function SchemePage() {
  const { name, scheme } = Route.useLoaderData();

  const linked = projects.filter((p) => programmesFor(p.project_id, p.scheme).includes(name));
  const components = fundingComponents.filter((c) => c.programme === name);

  const sanctioned = sum(components.map((c) => c.sanctioned_amount));
  const spent = sum(components.map((c) => c.expenditure));

  const statusCounts = new Map<string, number>();
  for (const p of linked) statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);

  const sources = evidence.filter((e) => linked.some((p) => p.project_id === e.linked_entity));

  return (
    <>
      <div className="mb-2 text-xs text-muted-foreground">
        <Link to="/schemes" className="hover:underline">
          Schemes
        </Link>
        <span className="px-1">/</span>
        <span>{name}</span>
      </div>

      <PageHeader
        title={name}
        subtitle={
          scheme?.objective ??
          "Programme recorded as funding metadata against physical interventions in Jalandhar."
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Project records identified" value={linked.length} />
        <MetricCard
          label="Known INR project value"
          value={crore(knownInrValue(linked))}
          hint="Identified records only, reconciliation records excluded"
        />
        <MetricCard label="Sanctioned through this programme" value={crore(sanctioned)} />
        <MetricCard label="Expenditure recorded" value={crore(spent)} />
        <MetricCard
          label="Level"
          value={labelise(scheme?.state_or_central ?? null)}
          hint={scheme?.ministry ?? undefined}
        />
      </div>

      <p className="mb-4 rounded-sm border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Totals shown here come from the project records identified so far. They should not be read
        as the complete allocation of this programme for Jalandhar.
      </p>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Programme record">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ministry or department" value={text(scheme?.ministry ?? null)} />
            <Field label="Level" value={labelise(scheme?.state_or_central ?? null)} />
            <Field label="Start year" value={scheme?.start_year ?? "Not available"} mono />
            <Field label="End year" value={scheme?.end_year ?? "Not available"} mono />
            <Field label="Source" value={text(scheme?.source_url ?? null)} />
          </div>
        </Panel>

        <Panel title="Project status mix">
          {statusCounts.size === 0 ? (
            <EmptyNote>No projects linked to this programme.</EmptyNote>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...statusCounts.entries()].map(([s, n]) => (
                <li key={s} className="flex items-center justify-between">
                  <span>{labelise(s)}</span>
                  <span className="num text-muted-foreground">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Geographic distribution">
          {linked.length === 0 ? (
            <EmptyNote>No locations recorded.</EmptyNote>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {linked.map((p) => (
                <li key={p.project_id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{text(p.locality)}</span>
                  <span className="num text-xs text-muted-foreground">
                    {p.latitude !== null && p.longitude !== null
                      ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                      : "No coordinates"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/map" className="mt-3 inline-block text-xs text-primary hover:underline">
            Open the city map
          </Link>
        </Panel>

        <Panel title="Projects funded" className="xl:col-span-3">
          {linked.length === 0 ? (
            <EmptyNote>No projects are linked to this programme.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {linked.map((p) => {
                const others = programmesFor(p.project_id, p.scheme).filter((s) => s !== name);
                return (
                  <li key={p.project_id} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.project_id }}
                        className="text-sm font-medium hover:underline"
                      >
                        {p.project_name}
                      </Link>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {text(p.sector)} · {text(p.implementing_agency)} · Sanctioned{" "}
                      {crore(p.sanctioned_cost)}
                    </p>
                    {others.length ? (
                      <p className="mt-0.5 text-xs text-warning">
                        Also funded by: {others.join(", ")}
                      </p>
                    ) : null}
                    {componentsFor(p.project_id).length > 1 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Single project record shared across {componentsFor(p.project_id).length}{" "}
                        funding components. It is not duplicated per programme.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Source documents" className="xl:col-span-3">
          {sources.length === 0 ? (
            <EmptyNote>No source documents attached to these projects.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {sources.map((e) => (
                <li key={e.evidence_id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {text(e.publishing_agency)} · {dateText(e.publication_date)}
                    </p>
                  </div>
                  <EvidenceBadge quality={e.evidence_quality} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
