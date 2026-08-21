import { createFileRoute } from "@tanstack/react-router";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { schemes } from "@/data/selectors";
import type { Scheme } from "@/data/types";
import { count, crore, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/schemes/")({
  head: () => ({
    meta: [
      { title: "Schemes | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Central and state schemes funding work in Jalandhar, treated as metadata against projects.",
      },
      { property: "og:title", content: "Schemes — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Which schemes fund Jalandhar, and how much they account for.",
      },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const columns: Column<Scheme>[] = [
    { key: "scheme_name", header: "Scheme", value: (s) => s.scheme_name },
    {
      key: "ministry",
      header: "Ministry",
      value: (s) => s.ministry,
      render: (s) => text(s.ministry),
    },
    {
      key: "state_or_central",
      header: "Level",
      value: (s) => s.state_or_central,
      render: (s) => labelise(s.state_or_central),
    },
    {
      key: "objective",
      header: "Objective",
      value: (s) => s.objective,
      render: (s) => text(s.objective),
    },
    {
      key: "start_year",
      header: "Period",
      value: (s) => s.start_year,
      render: (s) => (
        <span className="num">
          {s.start_year ?? "Not available"} – {s.end_year ?? "Not available"}
        </span>
      ),
    },
    {
      key: "total_jalandhar_projects",
      header: "Projects",
      align: "right",
      value: (s) => s.total_jalandhar_projects,
      render: (s) => <span className="num">{count(s.total_jalandhar_projects)}</span>,
    },
    {
      key: "jalandhar_sanctioned_value",
      header: "Sanctioned in Jalandhar",
      align: "right",
      value: (s) => s.jalandhar_sanctioned_value,
      render: (s) => <span className="num">{crore(s.jalandhar_sanctioned_value)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Schemes"
        subtitle="Scheme is recorded as metadata on each project. Use it to trace funding, not to navigate the city."
      />
      <DataTable
        rows={schemes}
        columns={columns}
        getRowKey={(s) => s.scheme_id}
        searchPlaceholder="Search scheme or ministry"
        filters={[
          {
            key: "level",
            label: "Level",
            options: ["central", "state", "joint"],
            match: (s, v) => s.state_or_central === v,
          },
        ]}
      />
    </>
  );
}
