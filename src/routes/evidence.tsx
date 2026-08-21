import { createFileRoute, Link } from "@tanstack/react-router";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { EvidenceBadge } from "@/components/app/StatusBadge";
import { evidence, projects } from "@/data/selectors";
import type { Evidence } from "@/data/types";
import { EVIDENCE_QUALITIES } from "@/data/types";
import { dateText, labelise, text } from "@/lib/format";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Source records behind every figure: official documents, tenders, reports and their verification status.",
      },
      { property: "og:title", content: "Evidence — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Traceability layer linking each Jalandhar record to its source.",
      },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const projectName = (id: string) =>
    projects.find((p) => p.project_id === id)?.project_name ?? id;

  const columns: Column<Evidence>[] = [
    { key: "title", header: "Document", value: (e) => e.title },
    {
      key: "linked_entity",
      header: "Linked record",
      value: (e) => projectName(e.linked_entity),
      render: (e) => (
        <Link
          to="/projects/$projectId"
          params={{ projectId: e.linked_entity }}
          className="hover:underline"
        >
          {projectName(e.linked_entity)}
        </Link>
      ),
    },
    {
      key: "source_type",
      header: "Source type",
      value: (e) => e.source_type,
      render: (e) => text(e.source_type),
    },
    {
      key: "publishing_agency",
      header: "Publisher",
      value: (e) => e.publishing_agency,
      render: (e) => text(e.publishing_agency),
    },
    {
      key: "publication_date",
      header: "Published",
      value: (e) => e.publication_date,
      render: (e) => <span className="num">{dateText(e.publication_date)}</span>,
    },
    {
      key: "retrieved_date",
      header: "Retrieved",
      value: (e) => e.retrieved_date,
      render: (e) => <span className="num">{dateText(e.retrieved_date)}</span>,
    },
    {
      key: "evidence_quality",
      header: "Quality",
      value: (e) => e.evidence_quality,
      render: (e) => <EvidenceBadge quality={e.evidence_quality} />,
    },
    {
      key: "conflicting_evidence",
      header: "Conflict",
      value: (e) => (e.conflicting_evidence ? "Yes" : "No"),
      render: (e) =>
        e.conflicting_evidence ? (
          <span className="text-destructive">Yes</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
    { key: "url", header: "URL", value: (e) => e.url, render: (e) => text(e.url) },
  ];

  return (
    <>
      <PageHeader
        title="Evidence"
        subtitle="Every number in this system should link back to a document. Records without a source are marked unverified."
      />
      <DataTable
        rows={evidence}
        columns={columns}
        getRowKey={(e) => e.evidence_id}
        searchPlaceholder="Search document, publisher or linked record"
        filters={[
          {
            key: "quality",
            label: "Quality",
            options: EVIDENCE_QUALITIES.map(labelise),
            match: (e, v) => labelise(e.evidence_quality) === v,
          },
          {
            key: "conflict",
            label: "Conflict",
            options: ["Yes", "No"],
            match: (e, v) => (e.conflicting_evidence ? "Yes" : "No") === v,
          },
        ]}
      />
    </>
  );
}
