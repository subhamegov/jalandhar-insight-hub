import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyNote, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadge";
import { allConflicts } from "@/data/conflicts";
import type { Indicator, IndicatorSeries, OutcomeDomain } from "@/data/outcomes";
import { outcomeDomains } from "@/data/outcomes";
import { isCompletedNotOperational, isDelayed, projects } from "@/data/selectors";
import { crore, dateText, text } from "@/lib/format";

export const Route = createFileRoute("/outcomes")({
  head: () => ({
    meta: [
      { title: "Outcomes | Jalandhar City Intelligence" },
      {
        name: "description",
        content:
          "Whether investment in Jalandhar is producing working water, sewerage, waste, transport and air quality services.",
      },
      { property: "og:title", content: "Outcomes — Jalandhar City Intelligence" },
      {
        property: "og:description",
        content: "Service outcomes against investment across Jalandhar city systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OutcomesPage,
});

function valueSum(pick: (p: (typeof projects)[number]) => number | null): number | null {
  return projects.reduce<number | null>((acc, p) => {
    const v = pick(p);
    return v === null || v === undefined ? acc : (acc ?? 0) + v;
  }, null);
}

function OutcomesPage() {
  const conflicts = allConflicts();
  const material = conflicts.filter((c) => c.severity === "material_conflict");
  const delayedValue = valueSum((p) => (isDelayed(p) ? p.sanctioned_cost : null));
  const stalledValue = valueSum((p) => (p.status === "stalled" ? p.sanctioned_cost : null));
  const builtNotRunning = valueSum((p) =>
    isCompletedNotOperational(p) ? p.sanctioned_cost : null,
  );

  return (
    <>
      <PageHeader
        title="Outcomes"
        subtitle="Whether investment is producing working city services."
      />

      <Panel
        title="Investment and delivery"
        description="Which projects require senior government intervention"
        right={
          <Link to="/attention" className="text-xs text-primary hover:underline">
            Open Projects Requiring Attention
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Total sanctioned value"
            value={crore(valueSum((p) => p.sanctioned_cost))}
            hint="Sum of verified sanction values only"
          />
          <MetricCard
            label="Total expenditure"
            value={crore(valueSum((p) => p.expenditure))}
            hint="Sum of verified expenditure only"
          />
          <MetricCard
            label="Delayed project value"
            value={crore(delayedValue)}
            hint={`${projects.filter(isDelayed).length} projects delayed or stalled`}
            tone="warning"
          />
          <MetricCard
            label="Stalled project value"
            value={crore(stalledValue)}
            hint={`${projects.filter((p) => p.status === "stalled").length} projects stalled`}
            tone="critical"
          />
          <MetricCard
            label="Completed, not operational"
            value={crore(builtNotRunning)}
            hint={`${projects.filter(isCompletedNotOperational).length} built assets not confirmed in service`}
            tone="critical"
          />
          <MetricCard
            label="Material data conflicts"
            value={material.length}
            hint={`${conflicts.length} open data items in total`}
            tone={material.length > 0 ? "warning" : "default"}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Value weighted measures are used throughout. A large number of small projects does not
          raise a sector up this list. A completed project whose asset is not confirmed operational
          stays visible as a risk.
        </p>
      </Panel>

      <div className="mt-4 grid gap-4">
        {outcomeDomains.map((domain) => (
          <DomainPanel key={domain.id} domain={domain} />
        ))}
      </div>

      <Panel title="Cross scheme analysis" className="mt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          A single physical intervention is usually funded by more than one programme. These are the
          programmes that fund each domain, so a reader can see where one problem is being addressed
          by several ministries and departments at once.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {outcomeDomains.map((d) => (
            <div key={d.id} className="rounded-sm border border-border p-3">
              <p className="text-sm font-semibold">{d.label}</p>
              <ul className="mt-2 space-y-1">
                {d.related_programmes.map((prog) => (
                  <li key={prog}>
                    <Link
                      to="/schemes/$schemeName"
                      params={{ schemeName: prog }}
                      className="text-xs text-primary hover:underline"
                    >
                      {prog}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function DomainPanel({ domain }: { domain: OutcomeDomain }) {
  const linked = projects.filter((p) => p.sector && domain.sectors.includes(p.sector));
  const spend = linked.reduce<number | null>(
    (acc, p) => (p.expenditure === null ? acc : (acc ?? 0) + p.expenditure),
    null,
  );
  const sanctioned = linked.reduce<number | null>(
    (acc, p) => (p.sanctioned_cost === null ? acc : (acc ?? 0) + p.sanctioned_cost),
    null,
  );
  const service = domain.indicators.filter((i) => i.measure_type === "service");
  const construction = domain.indicators.filter((i) => i.measure_type !== "service");

  return (
    <Panel title={domain.label} description={domain.headline_question}>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Projects in this domain" value={linked.length} />
        <MetricCard label="Sanctioned" value={crore(sanctioned)} />
        <MetricCard label="Expenditure" value={crore(spend)} />
        <MetricCard
          label="Assets confirmed operational"
          value={linked.filter((p) => p.operational_status === "Operational").length}
          hint="Service confirmed, not just built"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IndicatorTable title="Service performance" rows={service} />
        <IndicatorTable title="Construction and funding" rows={construction} />
      </div>

      {domain.charts.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {domain.charts.map((series) => (
            <ChartSlot key={series.id} series={series} />
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="field-label mb-1">Projects</p>
          {linked.length === 0 ? (
            <EmptyNote>No projects recorded in this domain.</EmptyNote>
          ) : (
            <ul className="divide-y divide-border rounded-sm border border-border">
              {linked.map((p) => (
                <li
                  key={p.project_id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.project_id }}
                    className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
                  >
                    {p.project_name}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="num text-xs text-muted-foreground">
                      {crore(p.sanctioned_cost)}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <p className="field-label mb-1">Map layers for this domain</p>
          <div className="flex flex-wrap gap-1.5">
            {domain.map_layers.map((layer) => (
              <span
                key={layer}
                className="rounded-sm border border-border bg-muted/50 px-2 py-1 text-xs"
              >
                {layer.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <Link to="/map" className="mt-2 inline-block text-xs text-primary hover:underline">
            Open these layers on the city map
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function IndicatorTable({ title, rows }: { title: string; rows: Indicator[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <p className="field-label border-b border-border bg-muted/60 px-3 py-2">{title}</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="field-label px-3 py-1.5 text-left">Indicator</th>
            <th className="field-label px-3 py-1.5 text-right">Value</th>
            <th className="field-label px-3 py-1.5 text-left">As of</th>
            <th className="field-label px-3 py-1.5 text-left">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id} className="border-b border-border last:border-0 align-top">
              <td className="px-3 py-2">
                <span className="block">{i.label}</span>
                <span className="block text-xs text-muted-foreground">{i.definition}</span>
              </td>
              <td className="num px-3 py-2 text-right whitespace-nowrap">
                {i.value === null ? (
                  <span className="text-xs text-muted-foreground italic">Not available</span>
                ) : (
                  `${i.value}${i.unit ? ` ${i.unit}` : ""}`
                )}
              </td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{dateText(i.as_of)}</td>
              <td className="px-3 py-2 text-xs">{text(i.source)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

function ChartSlot({ series }: { series: IndicatorSeries }) {
  const points = series.points.filter((p) => p.value !== null);
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="text-sm font-medium">{series.label}</p>
      <p className="text-xs text-muted-foreground">Source: {text(series.source)}</p>
      {points.length < 2 ? (
        <p className="mt-3 rounded-sm border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
          No published series attached. A trend is not shown from a single reading or from missing
          data.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {points.map((p) => (
            <li key={p.period} className="flex justify-between text-xs">
              <span>{p.period}</span>
              <span className="num">
                {p.value}
                {series.unit ? ` ${series.unit}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
