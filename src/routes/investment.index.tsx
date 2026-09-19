import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { investmentIntelligence } from "@/data/four-city/investment";
import { useCity } from "@/lib/cityContext";
import { count, labelise, percent, text } from "@/lib/format";

export const Route = createFileRoute("/investment/")({
  head: () => ({
    meta: [
      { title: "Investment and outcomes | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Mission investment followed through funding, expenditure, infrastructure created, operational service and observed citizen-service records.",
      },
      { property: "og:title", content: "Investment and outcomes — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Are investments across different missions collectively improving life for citizens?",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestmentIndex,
});

/** Amounts stay in the unit supplied by the dataset. */
export function lakh(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not available";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;
}

type Sort = "flags" | "cost" | "progress" | "mission";

function InvestmentIndex() {
  const { city, dataset } = useCity();
  const data = useMemo(() => investmentIntelligence(city.city_id), [city.city_id]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("flags");
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  if (!dataset.synthetic || !data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Investment and outcomes" }]} />
        <PageHeader
          title={`Investment chain records are not loaded for ${city.name}`}
          subtitle="This view needs mission project, municipal finance, asset, service and grievance records held together. None are loaded for this city."
        />
        <Panel title="What to use instead">
          <Link to="/projects" className="text-sm underline underline-offset-2">
            Open the project register
          </Link>
        </Panel>
      </div>
    );
  }

  const t = data.totals;
  const q = query.trim().toLowerCase();
  const rows = data.chains
    .filter((c) =>
      q
        ? [c.project.project_id, c.project.project_name, c.project.mission, c.project.implementing_agency]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true,
    )
    .filter((c) => (onlyFlagged ? c.flags.length > 0 : true))
    .sort((a, b) => {
      if (sort === "cost")
        return (b.project.estimated_cost_inr_lakh ?? 0) - (a.project.estimated_cost_inr_lakh ?? 0);
      if (sort === "progress")
        return (a.project.physical_progress_pct ?? 0) - (b.project.physical_progress_pct ?? 0);
      if (sort === "mission") return a.project.mission.localeCompare(b.project.mission);
      return b.flags.length - a.flags.length;
    });

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Investment and outcomes" }]} />
      <PageHeader
        title={`${city.name} — investment to outcome`}
        subtitle="Are investments across different missions collectively improving life for citizens? Each project is followed from mission and funding through expenditure, the infrastructure created, whether it is operating, and the service and complaint records observed around it."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Projects" value={count(t.projects)} note="Each counted once" />
        <Tile label="Completed" value={count(t.completedProjects)} note="Completion is not impact" />
        <Tile label="In progress" value={count(t.inProgressProjects)} note="Construction under way" />
        <Tile label="Delayed" value={count(t.delayedProjects)} note="Recorded as delayed" />
        <Tile label="Assets created" value={count(t.assets)} note="Distinct asset records" />
        <Tile label="Operational assets" value={count(t.operationalAssets)} note="By commissioning status" />
        <Tile label="Finance records" value={count(t.financeRecords)} note="Municipal finance rows" />
        <Tile
          label="Financial years"
          value={t.financialYears.length ? t.financialYears.join(", ") : "Not available"}
          note="Amounts are never summed across years"
        />
      </div>

      <Panel
        title="Municipal finance by financial year"
        description="All amounts in INR lakh, as supplied. Each year is summed on its own and unspent released funding is shown only where both released and expenditure are recorded."
      >
        <Table
          empty="No municipal finance records for this city."
          headers={[
            "Financial year",
            "Budget",
            "Released",
            "Expenditure",
            "Unspent released",
            "Accounting period ends",
            "Funding sources",
            "Records",
          ]}
          rows={data.byYear.map((y) => [
            y.financial_year,
            lakh(y.budget_inr_lakh),
            lakh(y.released_inr_lakh),
            lakh(y.expenditure_inr_lakh),
            y.unspent_inr_lakh === null ? "Not available" : lakh(y.unspent_inr_lakh),
            y.periodEnds.length ? y.periodEnds.join(", ") : "Not available",
            y.fundingSources.length ? y.fundingSources.map(labelise).join(", ") : "Not available",
            count(y.records.length),
          ])}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          No citywide return on investment is calculated. Spending and service conditions are
          reported separately because the data does not establish that one produced the other.
        </p>
      </Panel>

      <Panel title="Projects and their chain">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            aria-label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project, mission or agency"
            className="w-64 rounded-sm border border-border bg-background px-2 py-1 text-sm"
          />
          <label className="text-sm">
            <span className="field-label mr-2">Sort</span>
            <select aria-label="Sort projects"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-sm border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="flags">Most things to check</option>
              <option value="cost">Highest cost</option>
              <option value="progress">Lowest physical progress</option>
              <option value="mission">Mission</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => setOnlyFlagged(e.target.checked)}
            />
            Only projects with something to check
          </label>
          <span className="text-xs text-muted-foreground">{rows.length} shown</span>
        </div>

        <Table
          empty="No projects match this search."
          headers={[
            "Project",
            "Mission",
            "Agency",
            "Status",
            "Estimated cost",
            "Physical",
            "Financial",
            "Assets",
            "Service records",
            "Grievances",
            "To check",
          ]}
          rows={rows.map((c) => [
            <Link
              key={c.project.project_id}
              to="/investment/$projectId"
              params={{ projectId: c.project.project_id }}
              className="underline underline-offset-2"
            >
              {c.project.project_name}
              <span className="num ml-2 text-xs text-muted-foreground">{c.project.project_id}</span>
            </Link>,
            labelise(c.project.mission),
            text(c.project.implementing_agency),
            labelise(c.project.project_status),
            lakh(c.project.estimated_cost_inr_lakh),
            percent(c.project.physical_progress_pct),
            percent(c.project.financial_progress_pct),
            count(c.assets.length),
            count(c.observations.length),
            count(c.grievances.length),
            <span key={`f-${c.project.project_id}`} className="text-xs text-muted-foreground">
              {c.flags.length ? c.flags.join("; ") : "Nothing flagged"}
            </span>,
          ])}
        />
      </Panel>

      <Panel
        title="Convergence — investments serving the same locality"
        description="Projects are grouped by the locality they sit in or serve. A project appears in each locality its service area covers, and is counted once inside each group."
      >
        <div className="space-y-3">
          {data.convergence
            .filter((g) => g.chains.length > 0)
            .map((g) => (
              <div key={g.locality.id} className="rounded-sm border border-border p-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    to="/localities/$localityId"
                    params={{ localityId: g.locality.id }}
                    className="text-sm font-medium underline underline-offset-2"
                  >
                    {g.locality.name}
                  </Link>
                  <span className="num text-xs text-muted-foreground">
                    {count(g.chains.length)} projects · {g.missions.length} missions
                  </span>
                </div>
                <Bullets title="Complementary investment" items={g.complementary} />
                <Bullets title="To investigate" items={g.toInvestigate} />
                <Bullets title="Missing infrastructure dependency" items={g.missingDependencies} />
                <Bullets
                  title="Incomplete projects"
                  items={g.incompleteProjects.map(
                    (p) => `${p.project_name} (${p.project_id}) — ${labelise(p.project_status)}`,
                  )}
                />
                <Bullets
                  title="Underutilised assets"
                  items={g.underutilisedAssets.map(
                    (a) => `${a.asset_name} (${a.asset_id}) — ${percent(a.utilisation_pct)} utilisation`,
                  )}
                />
                <Bullets title="Operational bottlenecks" items={g.bottlenecks} />
              </div>
            ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Two projects of the same type in one locality are listed for checking only. Co-location is
          not duplication, and the data does not record scope boundaries.
        </p>
      </Panel>
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="field-label">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="digit-card p-3">
      <p className="field-label">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[60rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {headers.map((h) => (
              <th key={h} className="field-label py-2 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border/60">
              {cells.map((c, j) => (
                <td key={j} className="py-2 pr-3 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
