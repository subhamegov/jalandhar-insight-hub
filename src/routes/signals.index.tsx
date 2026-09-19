import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { signalIntelligence } from "@/data/four-city/signals";
import { useCity } from "@/lib/cityContext";
import { count, text } from "@/lib/format";

export const Route = createFileRoute("/signals/")({
  head: () => ({
    meta: [
      { title: "Decision signals | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "What requires government attention in each city, and the project, infrastructure, service and complaint records that explain why.",
      },
      { property: "og:title", content: "Decision signals — MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content: "Evidence-backed conditions, the records behind them and the evidence still missing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignalsIndex,
});

export function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="field-label">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {typeof value === "number" ? count(value) : value}
      </p>
    </div>
  );
}

function SignalsIndex() {
  const { city, dataset } = useCity();
  const data = useMemo(() => signalIntelligence(city.city_id), [city.city_id]);
  const [query, setQuery] = useState("");
  const [pattern, setPattern] = useState("all");
  const [onlyGaps, setOnlyGaps] = useState(false);

  if (!dataset.synthetic || !data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs trail={[{ label: "Decision signals" }]} />
        <PageHeader
          title={`Decision signal records are not loaded for ${city.name}`}
          subtitle="This view reads the supplied decision signal records. None are loaded for this city, so nothing is shown rather than anything assumed."
        />
        <Panel title="What to use instead">
          <Link to="/attention" className="text-sm underline underline-offset-2">
            Open the attention list for this city
          </Link>
        </Panel>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const rows = data.signals
    .filter((v) =>
      q
        ? [
            v.signal.signal_id,
            v.signal.observed_condition,
            v.locality?.name ?? "",
            (v.signal.related_missions ?? []).join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true,
    )
    .filter((v) => (pattern === "all" ? true : v.patterns.some((p) => p.key === pattern)))
    .filter((v) =>
      onlyGaps
        ? v.unresolvedEvidence.length > 0 ||
          v.missingLinks.length > 0 ||
          (v.signal.data_gaps ?? []).length > 0
        : true,
    )
    .sort((a, b) => b.patterns.length - a.patterns.length);

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={[{ label: "Decision signals" }]} />
      <PageHeader
        title={`${city.name} — what requires attention, and why`}
        subtitle="These are the supplied synthetic decision signals for this prototype. They are not live government alerts and carry no urgency score or confidence percentage. Each signal states an observed condition; the patterns listed beside it are read from the records the signal names, and any evidence that cannot be resolved is shown as a gap."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="Signals" value={data.totals.signals} />
        <Tile label="With an intervention record" value={data.totals.withIntervention} />
        <Tile label="With unresolved evidence" value={data.totals.withUnresolvedEvidence} />
        <Tile label="With stated data gaps" value={data.totals.withDataGaps} />
        <Tile label="Localities covered" value={data.totals.localitiesCovered} />
      </div>

      <Panel
        title="Conditions observed across the signals"
        description="Counted from the records each signal names. A signal can show more than one condition."
      >
        <ul className="grid gap-2 md:grid-cols-2">
          {data.patternCounts.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 rounded-sm border border-border p-2">
              <button
                type="button"
                onClick={() => setPattern(pattern === p.key ? "all" : p.key)}
                className="text-left text-sm underline underline-offset-2"
              >
                {p.label}
              </button>
              <span className="num text-sm text-muted-foreground">{count(p.signals)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Signals">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search signal, condition, locality or mission"
            className="w-full max-w-sm rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
          />
          <select aria-label="Filter signals by pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All conditions</option>
            {data.patternCounts.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={onlyGaps} onChange={(e) => setOnlyGaps(e.target.checked)} />
            Only signals with missing evidence
          </label>
          <span className="text-sm text-muted-foreground">{count(rows.length)} shown</span>
        </div>

        <ul className="space-y-3">
          {rows.map((v) => (
            <li key={v.signal.signal_id} className="rounded-sm border border-border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to="/signals/$signalId"
                  params={{ signalId: v.signal.signal_id }}
                  className="text-sm font-semibold underline underline-offset-2"
                >
                  {v.signal.signal_id}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {v.locality ? v.locality.name : "Locality not recorded"}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{v.signal.observed_condition}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {text(v.signal.potential_implications)}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {v.patterns.map((p) => (
                  <li
                    key={p.key}
                    className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {p.label}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                {count(v.evidence.length)} supporting records ·{" "}
                {v.unresolvedEvidence.length + v.missingLinks.length > 0
                  ? `${count(v.unresolvedEvidence.length + v.missingLinks.length)} named records not found`
                  : "all named records resolve"}{" "}
                · potentially affected population{" "}
                {v.signal.affected_population_estimate === null
                  ? "not estimated"
                  : count(v.signal.affected_population_estimate)}
              </p>
            </li>
          ))}
        </ul>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signal matches this filter.</p>
        ) : null}
      </Panel>
    </div>
  );
}
