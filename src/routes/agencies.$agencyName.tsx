import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyNote, Field, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import { agencies, assets, evidence, isDelayed, projects } from "@/data/selectors";
import { knownInrValue } from "@/data/registerLogic";
import { crore, dateText, text } from "@/lib/format";

export const Route = createFileRoute("/agencies/$agencyName")({
  loader: ({ params }) => {
    const name = decodeURIComponent(params.agencyName);
    const agency = agencies.find((a) => a.agency_name === name) ?? null;
    return { name, agency };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Agency";
    const title = `${name} | Jalandhar City Intelligence`;
    const description = `Projects owned and implemented by ${name} in Jalandhar, with value, delays, assets and evidence.`;
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
  component: AgencyPage,
});

function sum(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
}

function AgencyPage() {
  const { name, agency } = Route.useLoaderData();

  const owned = projects.filter((p) => p.owning_agency === name);
  const implemented = projects.filter((p) => p.implementing_agency === name);
  const contracted = projects.filter((p) => p.contractor === name);
  const related = [...new Set([...owned, ...implemented, ...contracted])];
  const delayed = related.filter(isDelayed);
  const agencyAssets = assets.filter(
    (a) => a.owning_agency === name || a.operating_agency === name,
  );
  const operational = agencyAssets.filter((a) => /^operational$/i.test(a.operational_status ?? ""));
  const docs = evidence.filter((e) => related.some((p) => p.project_id === e.linked_entity));

  return (
    <>
      <div className="mb-2 text-xs text-muted-foreground">
        <Link to="/agencies" className="hover:underline">
          Agencies
        </Link>
        <span className="px-1">/</span>
        <span>{name}</span>
      </div>

      <PageHeader
        title={name}
        subtitle={agency?.agency_type ?? "Body recorded against projects in Jalandhar."}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Projects owned" value={owned.length} />
        <MetricCard label="Projects implemented" value={implemented.length} />
        <MetricCard
          label="Known INR project value"
          value={crore(knownInrValue(related))}
          hint="Identified records only. USD source values are not converted."
        />
        <MetricCard
          label="Active projects"
          value={
            related.filter((p) =>
              ["tendered", "awarded", "under_construction", "substantially_complete"].includes(
                p.status,
              ),
            ).length
          }
        />
        <MetricCard
          label="Completed projects"
          value={related.filter((p) => p.status === "completed").length}
        />
        <MetricCard
          label="Requiring reconciliation"
          value={related.filter((p) => p.dedupe_review_required).length}
          tone={related.some((p) => p.dedupe_review_required) ? "warning" : "default"}
        />
        <MetricCard
          label="Delayed projects"
          value={delayed.length}
          tone={delayed.length ? "critical" : "default"}
        />
        <MetricCard
          label="Operational assets"
          value={`${operational.length} of ${agencyAssets.length}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Agency record">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" value={text(agency?.agency_type ?? null)} />
            <Field label="Parent department" value={text(agency?.parent_department ?? null)} />
            <Field label="Jurisdiction" value={text(agency?.jurisdiction ?? null)} />
          </div>
        </Panel>

        <Panel title="Assets held or operated" className="xl:col-span-2">
          {agencyAssets.length === 0 ? (
            <EmptyNote>No assets recorded for this agency.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {agencyAssets.map((a) => (
                <li key={a.asset_id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm">{a.asset_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {text(a.operational_status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Projects" className="xl:col-span-3">
          {related.length === 0 ? (
            <EmptyNote>No projects recorded against this agency.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {related.map((p) => (
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
                    Role:{" "}
                    {[
                      p.owning_agency === name ? "Owner" : null,
                      p.implementing_agency === name ? "Implementing" : null,
                      p.contractor === name ? "Contractor" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}{" "}
                    · Sanctioned {crore(p.sanctioned_cost)} · {text(p.sector)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Evidence" className="xl:col-span-3">
          {docs.length === 0 ? (
            <EmptyNote>No evidence records attached to this agency's projects.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((e) => (
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
