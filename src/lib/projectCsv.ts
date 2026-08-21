import { projects } from "@/data/selectors";
import { assessProject } from "@/data/attentionLabel";
import { FRESHNESS_LABEL, freshnessOf } from "@/lib/freshness";
import { labelise } from "@/lib/format";

/** Flat, auditable export of the project register. */
export function projectCsv(rows = projects) {
  const headers = [
    "Project ID",
    "Project",
    "Sector",
    "Location",
    "Ward",
    "Scheme",
    "Funding programme",
    "Central ministry",
    "State department",
    "Implementing agency",
    "Owning agency",
    "Contractor",
    "Sanctioned cost (INR crore)",
    "Contracted cost (INR crore)",
    "Expenditure (INR crore)",
    "Status",
    "Attention",
    "Physical progress (%)",
    "Financial progress (%)",
    "Planned completion",
    "Delay (days)",
    "Operational status",
    "Evidence quality",
    "Last verified",
    "Freshness",
    "Source agency",
    "Source URL",
  ];
  const data = rows.map((p) => [
    p.project_id,
    p.project_name,
    p.sector,
    p.locality,
    p.ward,
    p.scheme,
    p.funding_programme,
    p.central_ministry,
    p.state_department,
    p.implementing_agency,
    p.owning_agency,
    p.contractor,
    p.sanctioned_cost,
    p.contracted_cost,
    p.expenditure,
    labelise(p.status),
    assessProject(p).label,
    p.physical_progress_percentage,
    p.financial_progress_percentage,
    p.planned_end_date,
    p.delay_days,
    p.operational_status,
    labelise(p.evidence_quality),
    p.last_verified,
    FRESHNESS_LABEL[freshnessOf(p.last_verified)],
    p.source_agency,
    p.source_url,
  ]);
  return { headers, rows: data };
}
