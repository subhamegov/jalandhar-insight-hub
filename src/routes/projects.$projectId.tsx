import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Field, PageHeader, Panel } from "@/components/app/Primitives";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import { assets, evidence, projects } from "@/data/selectors";
import { crore, dateText, percent, text } from "@/lib/format";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.project_id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Project not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.project.project_name} | Jalandhar City Intelligence`;
    const description =
      loaderData.project.short_description ??
      "Project record with status, funding, agencies, location and evidence.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project: p } = Route.useLoaderData();
  const linkedEvidence = evidence.filter((e) => e.linked_entity === p.project_id);
  const linkedAssets = assets.filter((a) => a.related_projects.includes(p.project_id));

  return (
    <>
      <div className="mb-2 text-xs text-muted-foreground">
        <Link to="/projects" className="hover:underline">
          Projects
        </Link>
        <span className="px-1">/</span>
        <span className="num">{p.project_id}</span>
      </div>
      <PageHeader
        title={p.project_name}
        subtitle={p.short_description ?? undefined}
        actions={<StatusBadge status={p.status} />}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Classification" className="xl:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sector" value={text(p.sector)} />
            <Field label="Asset type" value={text(p.asset_type)} />
            <Field label="Scheme" value={text(p.scheme)} />
            <Field label="Funding programme" value={text(p.funding_programme)} />
            <Field label="Operational status" value={text(p.operational_status)} />
            <Field label="Physical progress" value={percent(p.physical_progress_percentage)} mono />
          </div>
        </Panel>

        <Panel title="Responsibility" className="xl:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Central ministry" value={text(p.central_ministry)} />
            <Field label="State department" value={text(p.state_department)} />
            <Field label="Implementing agency" value={text(p.implementing_agency)} />
            <Field label="Owning agency" value={text(p.owning_agency)} />
            <Field label="Contractor" value={text(p.contractor)} />
            <Field label="Consultant" value={text(p.consultant)} />
          </div>
        </Panel>

        <Panel title="Finance" className="xl:col-span-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sanctioned cost" value={crore(p.sanctioned_cost)} mono />
            <Field label="Contracted cost" value={crore(p.contracted_cost)} mono />
            <Field label="Expenditure" value={crore(p.expenditure)} mono />
            <Field label="Financial progress" value={percent(p.financial_progress_percentage)} mono />
            <Field label="Central share" value={crore(p.funding_central)} mono />
            <Field label="State share" value={crore(p.funding_state)} mono />
            <Field label="ULB share" value={crore(p.funding_ulb)} mono />
          </div>
        </Panel>

        <Panel title="Timeline" className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="Announced" value={dateText(p.announcement_date)} mono />
            <Field label="Sanctioned" value={dateText(p.sanction_date)} mono />
            <Field label="Tendered" value={dateText(p.tender_date)} mono />
            <Field label="Awarded" value={dateText(p.award_date)} mono />
            <Field label="Planned start" value={dateText(p.planned_start_date)} mono />
            <Field label="Planned end" value={dateText(p.planned_end_date)} mono />
            <Field label="Actual start" value={dateText(p.actual_start_date)} mono />
            <Field label="Actual completion" value={dateText(p.actual_completion_date)} mono />
            <Field label="Delay (days)" value={p.delay_days ?? "Not available"} mono />
            <Field label="Delay reason" value={text(p.delay_reason)} />
          </div>
        </Panel>

        <Panel title="Location">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" value={p.latitude ?? "Not available"} mono />
            <Field label="Longitude" value={p.longitude ?? "Not available"} mono />
            <Field label="Ward" value={text(p.ward)} />
            <Field label="Locality" value={text(p.locality)} />
            <Field label="Geometry" value={text(p.geometry)} />
          </div>
          <Link
            to="/map"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            View on city map
          </Link>
        </Panel>

        <Panel title="Source and verification" className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="Source agency" value={text(p.source_agency)} />
            <Field label="Source date" value={dateText(p.source_date)} mono />
            <Field label="Source URL" value={text(p.source_url)} />
            <Field
              label="Evidence quality"
              value={<EvidenceBadge quality={p.evidence_quality} />}
            />
            <Field label="Last verified" value={dateText(p.last_verified)} mono />
            <Field label="Record updated" value={dateText(p.record_updated)} mono />
          </div>
          {p.conflict_note ? (
            <p className="mt-3 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Conflict: {p.conflict_note}
            </p>
          ) : null}
          {p.notes ? <p className="mt-3 text-sm text-muted-foreground">{p.notes}</p> : null}
        </Panel>

        <Panel title="Linked assets">
          {linkedAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked assets recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {linkedAssets.map((a) => (
                <li key={a.asset_id} className="py-2 text-sm">
                  {a.asset_name}
                  <span className="block text-xs text-muted-foreground">
                    {text(a.operational_status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Evidence" className="xl:col-span-3">
          {linkedEvidence.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evidence records attached.</p>
          ) : (
            <ul className="divide-y divide-border">
              {linkedEvidence.map((e) => (
                <li key={e.evidence_id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{text(e.notes)}</p>
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
