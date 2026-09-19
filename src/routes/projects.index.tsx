import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PageHeader } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SourceBadge } from "@/components/app/SourceBadge";
import { FreshnessBadge } from "@/components/app/FreshnessBadge";
import { AttentionBadge } from "@/components/app/AttentionBadge";
import { EvidenceLink } from "@/components/app/EvidenceDrawer";
import { ATTENTION_LABELS, assessProject } from "@/data/attentionLabel";
import { downloadCsv, toCsv } from "@/lib/exportData";
import { projectCsv } from "@/lib/projectCsv";
import { readSharedFilters, writeSharedFilters } from "@/lib/sharedFilters";
import { conflictsForProject } from "@/data/conflicts";
import {
  ATTENTION_BANDS,
  SCOPE_GROUPS,
  attentionScore,
  matchesScopeGroup,
} from "@/data/registerLogic";
import { programmesFor } from "@/data/programmes";
import {
  COST_BANDS,
  costBand,
  governmentLevelOf,
  isDelayed,
  projectYear,
  projects,
} from "@/data/selectors";
import { useCity } from "@/lib/cityContext";
import type { Project } from "@/data/types";
import { CITY_SYSTEMS, EVIDENCE_QUALITIES, PROJECT_STATUSES } from "@/data/types";
import { EMPTY, crore, dateText, labelise, percent, text } from "@/lib/format";

const searchSchema = z.object({
  sector: z.string().optional(),
  scheme: z.string().optional(),
  agency: z.string().optional(),
});

export const Route = createFileRoute("/projects/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Project register | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Central, state and city investments in Jalandhar organised by physical intervention and sector, with scheme and funding as metadata.",
      },
      { property: "og:title", content: "Project register — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content:
          "Every identified government project in Jalandhar in one evidence backed register.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

function uniq(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.map((v) => v ?? "Not available"))].sort();
}

function ProjectsPage() {
  const { sector, scheme, agency } = Route.useSearch();
  const { city, dataset } = useCity();
  // The geographic scope groups are Jalandhar reference work. Cities served by
  // the four-city dataset carry their own locality scope instead.
  const scopeGroupsApply = !dataset.synthetic;

  // Filters persist when moving between the register and the map.
  useEffect(() => {
    writeSharedFilters({
      sector: sector ?? "all",
      scheme: scheme ?? "all",
      agency: agency ?? "all",
    });
  }, [sector, scheme, agency]);

  const [scope, setScope] = useState<string>("Jalandhar city");

  const rows = projects.filter((p) => {
    if (scopeGroupsApply && !matchesScopeGroup(p, scope)) return false;
    if (sector && p.sector !== sector) return false;
    if (scheme && !programmesFor(p.project_id, p.scheme).includes(scheme)) return false;
    if (agency && p.implementing_agency !== agency && p.owning_agency !== agency) return false;
    return true;
  });

  const allProgrammes = [
    ...new Set(projects.flatMap((p) => programmesFor(p.project_id, p.scheme))),
  ].sort();

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
          <p className="num text-[11px] text-muted-foreground">
            {p.project_id} · {labelise(p.geography_type ?? null)}
          </p>
        </div>
      ),
    },
    { key: "sector", header: "Sector", value: (p) => p.sector, render: (p) => text(p.sector) },
    {
      key: "geography_scope",
      header: "Geographic scope",
      value: (p) => p.geography_scope ?? null,
      render: (p) => (
        <div className="min-w-32">
          {text(p.geography_scope ?? null)}
          {p.source_record_id ? (
            <span className="num block text-[11px] text-muted-foreground">
              Source record {p.source_record_id}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "locality",
      header: "Location",
      value: (p) => p.locality,
      render: (p) => (
        <div>
          {text(p.locality)}
          <span className="block text-[11px] text-muted-foreground">
            Ward {p.ward ?? "not available"}
          </span>
        </div>
      ),
    },
    {
      key: "scheme",
      header: "Scheme",
      value: (p) => p.scheme,
      render: (p) => {
        const list = programmesFor(p.project_id, p.scheme);
        if (list.length === 0) return text(null);
        return (
          <div className="min-w-40">
            <span>{list[0]}</span>
            {list.length > 1 ? (
              <span className="block text-[11px] text-muted-foreground">
                +{list.length - 1} other funding programme(s)
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "agency",
      header: "Implementing agency",
      value: (p) => p.implementing_agency,
      render: (p) => text(p.implementing_agency),
    },
    {
      key: "sanctioned_cost",
      header: "Sanctioned cost",
      align: "right",
      value: (p) => p.sanctioned_cost,
      render: (p) => (
        <span className="num block">
          {crore(p.sanctioned_cost)}
          {p.source_cost_text && !p.sanctioned_cost_cr ? (
            <span className="block text-[11px] text-muted-foreground">
              Source value {p.source_cost_text}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      value: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "attention",
      header: "Attention",
      value: (p) => assessProject(p).label,
      render: (p) => {
        const a = assessProject(p);
        return <AttentionBadge label={a.label} title={a.reasons.join("; ")} />;
      },
    },
    {
      key: "physical_progress_percentage",
      header: "Physical progress",
      align: "right",
      value: (p) => p.physical_progress_percentage,
      render: (p) => <span className="num">{percent(p.physical_progress_percentage)}</span>,
    },
    {
      key: "planned_end_date",
      header: "Planned completion",
      value: (p) => p.planned_end_date,
      render: (p) => <span className="num">{dateText(p.planned_end_date)}</span>,
    },
    {
      key: "delay",
      header: "Delay",
      align: "right",
      value: (p) => p.delay_days,
      render: (p) => (
        <span className={p.delay_days || p.status === "stalled" ? "num text-destructive" : "num"}>
          {p.delay_days !== null
            ? `${p.delay_days} days`
            : isDelayed(p)
              ? "Delayed, duration not available"
              : "Not available"}
        </span>
      ),
    },
    {
      key: "evidence_quality",
      header: "Evidence quality",
      value: (p) => p.evidence_quality,
      render: (p) => (
        <span className="flex items-center gap-1.5">
          <SourceBadge quality={p.evidence_quality} />
          <EvidenceLink
            request={{
              fact: "Project record",
              entityId: p.project_id,
              entityName: p.project_name,
              lastVerified: p.last_verified,
              conflictNote: p.conflict_note ?? null,
              reported: p.cost_records ?? [],
              fallback: {
                source_agency: p.source_agency,
                source_url: p.source_url,
                source_date: p.source_date,
                evidence_quality: p.evidence_quality,
              },
            }}
          />
        </span>
      ),
    },
    {
      key: "last_verified",
      header: "Last verified",
      value: (p) => p.last_verified,
      render: (p) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="num">{dateText(p.last_verified)}</span>
          <FreshnessBadge date={p.last_verified} />
        </span>
      ),
    },
    {
      key: "conflicts",
      header: "Conflicts",
      align: "right",
      value: (p) => conflictsForProject(p).length,
      render: (p) => {
        const c = conflictsForProject(p);
        const material = c.filter((x) => x.severity === "material_conflict").length;
        return (
          <span className={material ? "num text-destructive" : "num text-muted-foreground"}>
            {c.length}
          </span>
        );
      },
    },
  ];

  const activeFilters = [
    sector ? ["Sector", sector] : null,
    scheme ? ["Scheme", scheme] : null,
    agency ? ["Agency", agency] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <Breadcrumbs trail={[{ label: "Projects" }]} />
      <PageHeader
        title="Government projects"
        subtitle={
          scopeGroupsApply
            ? "Central government, national infrastructure and related public investments relevant to Jalandhar. Each row is one official source record. Records are not merged when scope overlap is uncertain."
            : `Mission-linked projects recorded for ${city.name}. Each row is one record in the four-city dataset, with its mission, implementing agency and reported progress as supplied.`
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const { headers, rows: data } = projectCsv(rows);
                downloadCsv(`${city.name.toLowerCase()}-project-register`, toCsv(headers, data));
              }}
              className="rounded-sm border border-input bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Export CSV
            </button>
            {activeFilters.length ? (
              <Link
                to="/projects"
                search={{}}
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Clear: {activeFilters.map(([k, v]) => `${k} = ${v}`).join(", ")}
              </Link>
            ) : null}
          </div>
        }
      />
      {scopeGroupsApply ? (
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2.5">
        <span className="field-label text-muted-foreground">Geographic scope</span>
        {SCOPE_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setScope(g)}
            aria-pressed={scope === g}
            className={
              scope === g
                ? "rounded-sm border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-sm border border-input px-2.5 py-1 text-xs hover:bg-muted"
            }
          >
            {g}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground">
          A district highway package, a central institution campus or a Cantonment work is not a
          Municipal Corporation Jalandhar project.
        </span>
      </div>
      ) : null}
      <DataTable
        defaultSort={{ key: "sanctioned_cost", dir: "desc" }}
        rows={rows}
        columns={columns}
        getRowKey={(p) => p.project_id}
        searchPlaceholder="Search project, scheme, agency, contractor or locality"
        searchValues={(p) => [
          p.contractor,
          p.consultant,
          p.owning_agency,
          p.short_description,
          p.source_record_id ?? null,
          p.source_agency,
          p.geography_scope ?? null,
          p.central_ministry,
          p.state_department,
          ...programmesFor(p.project_id, p.scheme),
        ]}
        filters={[
          {
            key: "level",
            label: "Centre or state",
            options: ["Central", "State", "Central and state", "Not available"],
            match: (p, v) => governmentLevelOf(p) === v,
          },
          {
            key: "ministry",
            label: "Ministry",
            options: uniq(projects.map((p) => p.central_ministry)),
            match: (p, v) => (p.central_ministry ?? "Not available") === v,
          },
          {
            key: "department",
            label: "State department",
            options: uniq(projects.map((p) => p.state_department)),
            match: (p, v) => (p.state_department ?? "Not available") === v,
          },
          {
            key: "scheme",
            label: "Scheme",
            options: allProgrammes,
            match: (p, v) => programmesFor(p.project_id, p.scheme).includes(v),
          },
          {
            key: "sector",
            label: "Sector",
            options: [...CITY_SYSTEMS],
            match: (p, v) => p.sector === v,
          },
          {
            key: "agency",
            label: "Agency",
            options: uniq([
              ...projects.map((p) => p.implementing_agency),
              ...projects.map((p) => p.owning_agency),
            ]),
            match: (p, v) =>
              (p.implementing_agency ?? "Not available") === v ||
              (p.owning_agency ?? "Not available") === v,
          },
          {
            key: "contractor",
            label: "Contractor",
            options: uniq(projects.map((p) => p.contractor)),
            match: (p, v) => (p.contractor ?? "Not available") === v,
          },
          {
            key: "status",
            label: "Status",
            options: PROJECT_STATUSES.map(labelise),
            match: (p, v) => labelise(p.status) === v,
          },
          {
            key: "ward",
            label: "Ward",
            options: uniq(projects.map((p) => p.ward)),
            match: (p, v) => (p.ward ?? "Not available") === v,
          },
          {
            key: "cost",
            label: "Cost range",
            options: COST_BANDS,
            match: (p, v) => costBand(p) === v,
          },
          {
            key: "delayed",
            label: "Delayed only",
            options: ["Delayed", "Not delayed"],
            match: (p, v) => (v === "Delayed" ? isDelayed(p) : !isDelayed(p)),
          },
          {
            key: "attention",
            label: "Attention",
            options: [...ATTENTION_LABELS],
            match: (p, v) => assessProject(p).label === v,
          },
          {
            key: "evidence",
            label: "Evidence quality",
            options: EVIDENCE_QUALITIES.map(labelise),
            match: (p, v) => labelise(p.evidence_quality) === v,
          },
          {
            key: "scope",
            label: "Geographic scope",
            options: uniq(projects.map((p) => p.geography_scope ?? null)),
            match: (p, v) => (p.geography_scope ?? "Not available") === v,
          },
          {
            key: "asset_type",
            label: "Asset type",
            options: uniq(projects.map((p) => p.asset_type)),
            match: (p, v) => (p.asset_type ?? "Not available") === v,
          },
          {
            key: "funding_programme",
            label: "Funding programme",
            options: uniq(projects.map((p) => p.funding_programme)),
            match: (p, v) => (p.funding_programme ?? "Not available") === v,
          },
          {
            key: "source_agency",
            label: "Source agency",
            options: uniq(projects.map((p) => p.source_agency)),
            match: (p, v) => (p.source_agency ?? "Not available") === v,
          },
          {
            key: "operational_status",
            label: "Operational status",
            options: uniq(projects.map((p) => p.operational_status)),
            match: (p, v) => (p.operational_status ?? "Not available") === v,
          },
          {
            key: "reconciliation",
            label: "Reconciliation",
            options: ["Requires reconciliation", "No reconciliation flag"],
            match: (p, v) =>
              v === "Requires reconciliation"
                ? Boolean(p.dedupe_review_required)
                : !p.dedupe_review_required,
          },
          {
            key: "prioritisation",
            label: "System prioritisation",
            options: [...ATTENTION_BANDS],
            match: (p, v) => attentionScore(p).band === v,
          },
          {
            key: "year",
            label: "Year",
            options: uniq(projects.map((p) => projectYear(p))),
            match: (p, v) => projectYear(p) === v,
          },
        ]}
      />
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{EMPTY.noProjects}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Tender publication is not treated as proof of implementation, and completion of construction
        is not treated as proof that an asset is operational.
      </p>
    </>
  );
}
