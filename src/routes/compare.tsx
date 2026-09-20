import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, EmptyNote } from "@/components/app/Primitives";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { comparisonSet, localityBreakdown } from "@/data/four-city/comparison";
import { useCity } from "@/lib/cityContext";
import { isCityId } from "@/data/cities/registry";
import { count, text } from "@/lib/format";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare cities | MoHUA Urban Intelligence" },
      {
        name: "description",
        content:
          "Compare prototype cities using consistent service and investment indicators.",
      },
      { property: "og:title", content: "Compare cities: MoHUA Urban Intelligence" },
      {
        property: "og:description",
        content:
          "Compare sampled outcomes using the same definitions and units.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

function fmt(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return "Not available";
  if (unit === "%") return `${value}%`;
  if (unit === "INR lakh") return `₹${count(value)} lakh`;
  return `${count(value)} ${unit}`;
}

function ComparePage() {
  const { cityId, setCityId } = useCity();
  const set = useMemo(() => comparisonSet(), []);
  const [indicatorKey, setIndicatorKey] = useState("housing_service_readiness");
  const [drillCity, setDrillCity] = useState<string>(
    set.cities.some((c) => c.cityId === cityId) ? cityId : (set.cities[0]?.cityId ?? ""),
  );

  const selected = set.indicatorKeys.find((i) => i.key === indicatorKey);
  const rowsByCity = set.cities.map((c) => ({
    city: c,
    indicator: c.indicators.find((i) => i.key === indicatorKey) ?? null,
  }));
  const drill = set.cities.find((c) => c.cityId === drillCity) ?? null;
  const localityRows = useMemo(
    () => (drill ? localityBreakdown(drill.cityId, indicatorKey) : []),
    [drill, indicatorKey],
  );
  const drillIndicator = drill?.indicators.find((i) => i.key === indicatorKey) ?? null;

  return (
    <div className="space-y-4">
      <Breadcrumbs trail={[{ label: "Compare cities" }]} />
      <PageHeader
        title="Compare prototype cities"
        subtitle="Compare service outcomes using the same calculation in every city."
      />

      <div className="rounded-sm border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Synthetic sample, not official statistics. Figures are not scaled, scored, ranked, or treated as national performance.
      </div>

      <Panel title="Choose an indicator">
        <div className="flex flex-wrap gap-2">
          {set.indicatorKeys.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={() => setIndicatorKey(i.key)}
              className={`rounded-sm border px-2.5 py-1.5 text-xs transition-colors ${
                i.key === indicatorKey
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
        {selected ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">How it is computed: </span>
            {selected.definition} Unit: {selected.unit}.
          </p>
        ) : null}
      </Panel>

      <Panel title={`Side by side: ${selected?.label ?? "Indicator"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-3 field-label">City</th>
                <th className="py-2 pr-3 field-label">Value</th>
                <th className="py-2 pr-3 field-label">Numerator</th>
                <th className="py-2 pr-3 field-label">Denominator</th>
                <th className="py-2 pr-3 field-label">Reporting period</th>
                <th className="py-2 pr-3 field-label">Records sampled</th>
                <th className="py-2 field-label">Investigate</th>
              </tr>
            </thead>
            <tbody>
              {rowsByCity.map(({ city, indicator }) => (
                <tr key={city.cityId} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDrillCity(city.cityId);
                        if (isCityId(city.cityId)) setCityId(city.cityId);
                      }}
                      className="text-left font-medium underline underline-offset-2"
                    >
                      {city.cityName}
                    </button>
                    <p className="text-xs text-muted-foreground">{city.state}</p>
                  </td>
                  <td className="py-2 pr-3 font-semibold">
                    {indicator ? fmt(indicator.value, indicator.unit) : "Not available"}
                    {indicator ? (
                      <p className="text-xs font-normal text-muted-foreground">
                        {indicator.kind === "percentage"
                          ? "Percentage"
                          : indicator.kind === "average"
                            ? "Average of recorded values"
                            : "Absolute sampled value"}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    {indicator
                      ? `${indicator.numerator === null ? "Not applicable" : count(indicator.numerator)}: ${indicator.numeratorLabel}`
                      : "Not available"}
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    {indicator
                      ? `${indicator.denominator === null ? "Not applicable" : count(indicator.denominator)}: ${indicator.denominatorLabel}`
                      : "Not available"}
                  </td>
                  <td className="py-2 pr-3 text-xs">{indicator ? text(indicator.period) : "Not available"}</td>
                  <td className="py-2 pr-3 text-xs">{indicator ? count(indicator.records) : "Not available"}</td>
                  <td className="py-2 text-xs">
                    {indicator ? (
                      <Link
                        to={
                          indicator.drill === "housing"
                            ? "/housing"
                            : indicator.drill === "investment"
                              ? "/investment"
                              : indicator.drill === "livelihoods"
                                ? "/livelihoods"
                                : indicator.drill === "signals"
                                  ? "/signals"
                                  : "/localities"
                        }
                        onClick={() => {
                          if (isCityId(city.cityId)) setCityId(city.cityId);
                        }}
                        className="underline underline-offset-2"
                      >
                        Open records
                      </Link>
                    ) : (
                      "Not available"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title={
          drill
            ? `${drill.cityName}: ${selected?.label ?? "indicator"} by locality`
            : "Locality drill-down"
        }
      >
        {!drill ? (
          <EmptyNote>Select a city above to see the same indicator locality by locality.</EmptyNote>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {set.cities.map((c) => (
                <button
                  key={c.cityId}
                  type="button"
                  onClick={() => {
                    setDrillCity(c.cityId);
                    if (isCityId(c.cityId)) setCityId(c.cityId);
                  }}
                  className={`rounded-sm border px-2.5 py-1 text-xs ${
                    c.cityId === drill.cityId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {c.cityName}
                </button>
              ))}
            </div>
            {drillIndicator ? (
              <p className="mb-3 text-xs text-muted-foreground">
                City value {fmt(drillIndicator.value, drillIndicator.unit)} for {text(drillIndicator.period)}. Locality figures use local records only. Points do not imply ward boundaries.
              </p>
            ) : null}
            {localityRows.length === 0 ? (
              <EmptyNote>No locality records are loaded for this indicator.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 field-label">Locality</th>
                      <th className="py-2 pr-3 field-label">Value</th>
                      <th className="py-2 pr-3 field-label">Numerator</th>
                      <th className="py-2 pr-3 field-label">Denominator</th>
                      <th className="py-2 field-label">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localityRows.map((r) => (
                      <tr key={r.localityId} className="border-b border-border/60">
                        <td className="py-2 pr-3">
                          <Link
                            to="/localities/$localityId"
                            params={{ localityId: r.localityId }}
                            onClick={() => {
                              if (isCityId(drill.cityId)) setCityId(drill.cityId);
                            }}
                            className="underline underline-offset-2"
                          >
                            {r.localityName}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 font-medium">
                          {fmt(r.value, drillIndicator?.unit ?? "")}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {r.numerator === null ? "Not applicable" : count(r.numerator)}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {r.denominator === null ? "Not applicable" : count(r.denominator)}
                        </td>
                        <td className="py-2 text-xs">{count(r.records)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link to="/housing" className="underline underline-offset-2">
                Housing records
              </Link>
              <Link to="/investment" className="underline underline-offset-2">
                Projects and infrastructure
              </Link>
              <Link to="/signals" className="underline underline-offset-2">
                Decision signals
              </Link>
              <Link to="/national" className="underline underline-offset-2">
                Back to the national view
              </Link>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Supplied comparison record for each city">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-3 field-label">City</th>
                <th className="py-2 pr-3 field-label">Projects sampled</th>
                <th className="py-2 pr-3 field-label">Assets sampled</th>
                <th className="py-2 pr-3 field-label">Houses completed (sample)</th>
                <th className="py-2 pr-3 field-label">Houses occupied (sample)</th>
                <th className="py-2 pr-3 field-label">Complaints (sample)</th>
                <th className="py-2 field-label">Record type</th>
              </tr>
            </thead>
            <tbody>
              {set.cities.map((c) => (
                <tr key={c.cityId} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{c.cityName}</td>
                  <td className="py-2 pr-3">{c.supplied ? count(c.supplied.project_sample_count) : "Not available"}</td>
                  <td className="py-2 pr-3">{c.supplied ? count(c.supplied.asset_sample_count) : "Not available"}</td>
                  <td className="py-2 pr-3">
                    {c.supplied ? count(c.supplied.housing_units_completed_sample) : "Not available"}
                  </td>
                  <td className="py-2 pr-3">
                    {c.supplied ? count(c.supplied.housing_units_occupied_sample) : "Not available"}
                  </td>
                  <td className="py-2 pr-3">
                    {c.supplied ? count(c.supplied.grievance_count_sample) : "Not available"}
                  </td>
                  <td className="py-2 text-xs">{c.supplied ? text(c.supplied.record_type) : "Not available"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {set.cities[0]?.supplied?.warning ??
            "Sample totals, not citywide estimates or actual city performance."}{" "}
          Derived from {text(set.cities[0]?.supplied?.derived_from ?? null)}.
        </p>
      </Panel>
    </div>
  );
}
