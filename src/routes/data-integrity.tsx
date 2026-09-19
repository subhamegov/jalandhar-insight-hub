import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, EmptyNote } from "@/components/app/Primitives";
import { useCity } from "@/lib/cityContext";
import {
  GROUP_LABELS,
  runIntegrity,
  type IntegrityCheck,
  type IntegrityGroup,
} from "@/data/four-city/integrity";
import { indicatorContracts, type IndicatorContract } from "@/data/four-city/indicators";

export const Route = createFileRoute("/data-integrity")({
  head: () => ({
    meta: [
      { title: "Data Integrity | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Indicator definitions, source records and the integrity checks behind every figure in the four-city prototype.",
      },
      { property: "og:title", content: "Data Integrity — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content:
          "What each indicator counts, the records it is summed from, and every integrity check with its result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataIntegrityPage,
});

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return (
    <div className="rounded-sm border border-border bg-card p-3 shadow-sm">
      <p className="field-label">{label}</p>
      <p
        className={`num mt-1 text-lg font-semibold ${
          tone === "bad" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CheckRow({ check }: { check: IntegrityCheck }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-2 last:border-0">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold ${
            check.passed
              ? "bg-secondary text-secondary-foreground"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {check.passed ? "Passed" : "Failed"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{check.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{check.method}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Read by: {check.components.join(", ")}
          </p>
          {!check.passed ? (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary underline"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Hide affected records" : `Show affected records (${check.affected.length}${
                check.affected.length === 25 ? "+, first 25" : ""
              })`}
            </button>
          ) : null}
          {open ? (
            <ul className="mt-1 space-y-0.5">
              {check.affected.map((a) => (
                <li key={a} className="num text-xs text-foreground">
                  {a}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: IndicatorContract }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{contract.indicator_name}</p>
        <p className="num text-xs text-muted-foreground">{contract.indicator_id}</p>
      </div>
      <p className="num mt-1 text-lg font-semibold text-foreground">
        {contract.value === null ? "Not available" : `${contract.value}${contract.unit === "%" ? "%" : ` ${contract.unit}`}`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{contract.description}</p>
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        <div>
          <dt className="field-label">Numerator</dt>
          <dd className="num text-foreground">
            {contract.numerator === null ? "Not available" : contract.numerator} —{" "}
            {contract.numerator_label}
          </dd>
        </div>
        <div>
          <dt className="field-label">Denominator</dt>
          <dd className="num text-foreground">
            {contract.denominator === null ? "Not available" : contract.denominator} —{" "}
            {contract.denominator_label}
          </dd>
        </div>
        <div>
          <dt className="field-label">Calculation</dt>
          <dd className="text-foreground">{contract.calculation_method}</dd>
        </div>
        <div>
          <dt className="field-label">Aggregation</dt>
          <dd className="text-foreground">{contract.aggregation_method}</dd>
        </div>
        <div>
          <dt className="field-label">Geographic scope</dt>
          <dd className="text-foreground">{contract.geographic_scope}</dd>
        </div>
        <div>
          <dt className="field-label">Observation period</dt>
          <dd className="text-foreground">{contract.observation_period}</dd>
        </div>
        <div>
          <dt className="field-label">Classification</dt>
          <dd className="text-foreground">
            {contract.data_classification.length
              ? contract.data_classification.join(", ")
              : "Not recorded"}
          </dd>
        </div>
        <div>
          <dt className="field-label">Source records</dt>
          <dd className="text-foreground">{contract.source_record_ids.length}</dd>
        </div>
      </dl>
      {contract.source_record_ids.length ? (
        <>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-primary underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide source records" : "Show source records"}
          </button>
          {open ? (
            <ul className="mt-1 flex flex-wrap gap-1">
              {contract.source_record_ids.map((id) => (
                <li key={id}>
                  <Link
                    to="/records/$recordId"
                    params={{ recordId: id }}
                    className="num rounded-sm border border-border px-1.5 py-0.5 text-xs text-primary"
                  >
                    {id}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function DataIntegrityPage() {
  const { city } = useCity();
  const summary = useMemo(() => runIntegrity(), []);
  const contracts = useMemo(() => indicatorContracts(city.city_id), [city.city_id]);
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [scope, setScope] = useState<"city" | "all">("city");

  const checks = summary.checks.filter((c) => {
    if (scope === "city" && c.cityId && c.cityId !== city.city_id) return false;
    if (onlyFailed && c.passed) return false;
    return true;
  });

  const groups = Object.keys(GROUP_LABELS) as IntegrityGroup[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Data integrity"
        subtitle="What each figure counts, the records it comes from, and every check run against them. Failed checks are shown as they are; no source value is corrected here."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Checks performed" value={String(summary.total)} />
        <Stat label="Passed" value={String(summary.passed)} />
        <Stat
          label="Failed"
          value={String(summary.failed)}
          tone={summary.failed ? "bad" : undefined}
        />
        <Stat label="Dataset reference date" value={summary.referenceDate} />
      </div>

      <Panel title="Checks" description="Referential, geographic, numerical, temporal, financial, funnel, provenance, reconciliation and city-filtering checks.">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={onlyFailed}
              onChange={(e) => setOnlyFailed(e.target.checked)}
            />
            Failed checks only
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={scope === "all"}
              onChange={(e) => setScope(e.target.checked ? "all" : "city")}
            />
            All four cities
          </label>
          <span className="text-xs text-muted-foreground">
            Showing {checks.length} of {summary.total}
          </span>
        </div>
        {checks.length === 0 ? (
          <EmptyNote>No checks match this filter.</EmptyNote>
        ) : (
          groups.map((g) => {
            const rows = checks.filter((c) => c.group === g);
            if (!rows.length) return null;
            return (
              <div key={g} className="mt-3">
                <p className="field-label">{GROUP_LABELS[g]}</p>
                <div className="mt-1">
                  {rows.map((c) => (
                    <CheckRow key={c.id} check={c} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </Panel>

      <Panel
        title={`Indicator definitions — ${city.name}`}
        description="One definition per indicator, used wherever the indicator appears. Every value can be re-created from the records listed."
      >
        {contracts.length === 0 ? (
          <EmptyNote>
            Indicator definitions cover the four prototype cities. {city.name} is not one of them.
          </EmptyNote>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {contracts.map((c) => (
              <ContractCard key={c.indicator_id} contract={c} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Unresolved data limitations" description="What these figures cannot tell you.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {summary.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
