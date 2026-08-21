import { createFileRoute } from "@tanstack/react-router";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { agencies } from "@/data/selectors";
import type { Agency } from "@/data/types";
import { count, text } from "@/lib/format";

export const Route = createFileRoute("/agencies/")({
  head: () => ({
    meta: [
      { title: "Agencies | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Which government body owns and implements each intervention in Jalandhar, across centre, state and city.",
      },
      { property: "og:title", content: "Agencies — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Accountability view of agencies working in Jalandhar.",
      },
    ],
  }),
  component: AgenciesPage,
});

function AgenciesPage() {
  const columns: Column<Agency>[] = [
    { key: "agency_name", header: "Agency", value: (a) => a.agency_name },
    { key: "agency_type", header: "Type", value: (a) => a.agency_type, render: (a) => text(a.agency_type) },
    {
      key: "parent_department",
      header: "Parent department",
      value: (a) => a.parent_department,
      render: (a) => text(a.parent_department),
    },
    {
      key: "jurisdiction",
      header: "Jurisdiction",
      value: (a) => a.jurisdiction,
      render: (a) => text(a.jurisdiction),
    },
    {
      key: "projects_owned",
      header: "Owned",
      align: "right",
      value: (a) => a.projects_owned,
      render: (a) => <span className="num">{count(a.projects_owned)}</span>,
    },
    {
      key: "projects_implemented",
      header: "Implemented",
      align: "right",
      value: (a) => a.projects_implemented,
      render: (a) => <span className="num">{count(a.projects_implemented)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Agencies"
        subtitle="Ownership and implementation responsibility for work in the city."
      />
      <DataTable
        rows={agencies}
        columns={columns}
        getRowKey={(a) => a.agency_id}
        searchPlaceholder="Search agency or department"
        filters={[
          {
            key: "type",
            label: "Type",
            options: [...new Set(agencies.map((a) => a.agency_type ?? "Not available"))],
            match: (a, v) => (a.agency_type ?? "Not available") === v,
          },
        ]}
      />
    </>
  );
}
