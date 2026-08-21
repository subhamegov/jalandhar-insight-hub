import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { EvidenceBadge, StatusBadge } from "@/components/app/StatusBadge";
import { projects } from "@/data/selectors";
import type { Project } from "@/data/types";
import { CITY_SYSTEMS, PROJECT_STATUSES } from "@/data/types";
import { crore, labelise, text } from "@/lib/format";

const searchSchema = z.object({
  sector: z.string().optional(),
});

export const Route = createFileRoute("/projects/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Projects | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Searchable register of government projects in Jalandhar with status, agency, funding and evidence quality.",
      },
      { property: "og:title", content: "Projects — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Every identified government project in Jalandhar in one register.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { sector } = Route.useSearch();
  const rows = sector ? projects.filter((p) => p.sector === sector) : projects;

  const columns: Column<Project>[] = [
    {
      key: "project_name",
      header: "Project",
      value: (p) => p.project_name,
      render: (p) => (
        <div className="min-w-56">
          <Link
            to="/projects/$projectId"
            params={{ projectId: p.project_id }}
            className="font-medium hover:underline"
          >
            {p.project_name}
          </Link>
          <p className="num text-[11px] text-muted-foreground">{p.project_id}</p>
        </div>
      ),
    },
    { key: "sector", header: "System", value: (p) => p.sector, render: (p) => text(p.sector) },
    {
      key: "status",
      header: "Status",
      value: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "agency",
      header: "Implementing agency",
      value: (p) => p.implementing_agency,
      render: (p) => text(p.implementing_agency),
    },
    { key: "scheme", header: "Scheme", value: (p) => p.scheme, render: (p) => text(p.scheme) },
    {
      key: "sanctioned_cost",
      header: "Sanctioned",
      align: "right",
      value: (p) => p.sanctioned_cost,
      render: (p) => <span className="num">{crore(p.sanctioned_cost)}</span>,
    },
    {
      key: "expenditure",
      header: "Expenditure",
      align: "right",
      value: (p) => p.expenditure,
      render: (p) => <span className="num">{crore(p.expenditure)}</span>,
    },
    {
      key: "locality",
      header: "Location",
      value: (p) => p.locality,
      render: (p) => text(p.locality),
    },
    {
      key: "evidence_quality",
      header: "Evidence",
      value: (p) => p.evidence_quality,
      render: (p) => <EvidenceBadge quality={p.evidence_quality} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="All identified government interventions in Jalandhar, regardless of scheme or funding source."
        actions={
          sector ? (
            <Link
              to="/projects"
              className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Clear system filter: {sector}
            </Link>
          ) : null
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        getRowKey={(p) => p.project_id}
        searchPlaceholder="Search project, agency, scheme or location"
        filters={[
          {
            key: "status",
            label: "Status",
            options: PROJECT_STATUSES.map(labelise),
            match: (p, s) => labelise(p.status) === s,
          },
          {
            key: "sector",
            label: "System",
            options: [...CITY_SYSTEMS],
            match: (p, s) => p.sector === s,
          },
          {
            key: "agency",
            label: "Agency",
            options: [
              ...new Set(projects.map((p) => p.implementing_agency ?? "Not available")),
            ],
            match: (p, s) => (p.implementing_agency ?? "Not available") === s,
          },
        ]}
      />
    </>
  );
}
