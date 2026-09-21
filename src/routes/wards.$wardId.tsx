import { lazy, Suspense } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { EmptyNote, Field, MetricCard, PageHeader, Panel } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { GovPoint } from "@/components/map/MapCanvas";
import { areaInvestment, serviceGaps, wardArea } from "@/data/wards";
import type { CitySystem } from "@/data/types";
import { crore, dateText, text } from "@/lib/format";
import { Unavailable } from "@/components/app/Unavailable";

const MapCanvas = lazy(() => import("@/components/map/MapCanvas"));

export const Route = createFileRoute("/wards/$wardId")({
  loader: ({ params }) => {
    const area = wardArea(params.wardId);
    if (!area) throw notFound();
    return { label: area.label };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Area not found | Jalandhar City Intelligence" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.label} | Ward View | Jalandhar City Intelligence`;
    const description = `Projects, investment, municipal assets and service gaps recorded for ${loaderData.label}, Jalandhar.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: AreaNotFound,
  component: WardDetail,
});

function AreaNotFound() {
  return (
    <Unavailable
      title="Area not found"
      detail="No area carries this identifier."
      backTo="/wards"
      backLabel="ward view"
    />
  );
}

const SECTION_SECTORS: { title: string; sectors: CitySystem[] }[] = [
  { title: "Water and sewer", sectors: ["Water", "Used Water"] },
  { title: "Waste", sectors: ["Solid Waste", "Environment"] },
  { title: "Mobility access", sectors: ["Mobility", "Roads"] },
  { title: "Public facilities", sectors: ["Public Realm", "Health Infrastructure"] },
];

function WardDetail() {
  const { wardId } = Route.useParams();
  const area = wardArea(wardId);
  if (!area) return <AreaNotFound />;

  const gaps = serviceGaps(area);
  const points: GovPoint[] = [
    ...area.projects
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map<GovPoint>((p) => ({
        id: p.project_id,
        kind: "project",
        name: p.project_name,
        sub: p.sector ?? "Not available",
        lat: p.latitude as number,
        lon: p.longitude as number,
        state: p.status === "stalled" ? "critical" : "active",
      })),
    ...area.assets
      .filter((a) => a.latitude !== null && a.longitude !== null)
      .map<GovPoint>((a) => ({
        id: a.asset_id,
        kind: "asset",
        name: a.asset_name,
        sub: a.asset_type ?? "Not available",
        lat: a.latitude as number,
        lon: a.longitude as number,
        state: "asset",
      })),
  ];

  return (
    <>
      <PageHeader
        title={area.label}
        subtitle={`Grouping basis: ${area.basis}. Ward boundaries and ward populations are not loaded, so area totals cover only records assigned here.`}
        actions={
          <Link to="/wards" className="text-xs text-primary hover:underline">
            All areas
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Population" value={area.population} hint="Not available" />
        <MetricCard label="Projects" value={area.projects.length} />
        <MetricCard label="Investment" value={crore(areaInvestment(area))} />
        <MetricCard
          label="Active projects"
          value={
            area.projects.filter((p) =>
              ["tendered", "awarded", "under_construction", "substantially_complete"].includes(
                p.status,
              ),
            ).length
          }
        />
        <MetricCard label="Service assets" value={area.assets.length} />
        <MetricCard
          label="Unresolved service gaps"
          value={gaps.length}
          tone={gaps.length > 0 ? "warning" : "default"}
        />
      </div>

      <Panel title="Map" className="mt-4">
        <div className="h-[380px] overflow-hidden rounded-sm border border-border">
          {points.length === 0 ? (
            <EmptyNote>No coordinates recorded for this area.</EmptyNote>
          ) : (
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                <MapCanvas
                  govPoints={points}
                  osmFeatures={[]}
                  layerColors={{}}
                  selectedId={null}
                  onSelectGov={() => {}}
                  onSelectOsm={() => {}}
                  fitSignal={1}
                  focus={null}
                />
              </Suspense>
            </ClientOnly>
          )}
        </div>
      </Panel>

      <Panel title="Projects" className="mt-4">
        {area.projects.length === 0 ? (
          <EmptyNote>No projects recorded in this area.</EmptyNote>
        ) : (
          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0"><table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60">
                <th className="field-label px-3 py-2 text-left">Project</th>
                <th className="field-label px-3 py-2 text-left">Sector</th>
                <th className="field-label px-3 py-2 text-right">Sanctioned</th>
                <th className="field-label px-3 py-2 text-left">Status</th>
                <th className="field-label px-3 py-2 text-left">Agency</th>
                <th className="field-label px-3 py-2 text-left">Last verified</th>
              </tr>
            </thead>
            <tbody>
              {area.projects.map((p) => (
                <tr key={p.project_id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: p.project_id }}
                      className="text-primary hover:underline"
                    >
                      {p.project_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{text(p.sector)}</td>
                  <td className="num px-3 py-2 text-right">{crore(p.sanctioned_cost)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-xs">{text(p.implementing_agency)}</td>
                  <td className="px-3 py-2 text-xs">{dateText(p.last_verified)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Panel>

      <Panel title="Municipal assets" className="mt-4">
        {area.assets.length === 0 ? (
          <EmptyNote>No assets recorded in this area.</EmptyNote>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {area.assets.map((a) => (
              <div key={a.asset_id} className="rounded-sm border border-border p-3">
                <p className="text-sm font-medium">{a.asset_name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Type" value={text(a.asset_type)} />
                  <Field label="Operational status" value={text(a.operational_status)} />
                  <Field label="Owning agency" value={text(a.owning_agency)} />
                  <Field label="Last verified" value={dateText(a.last_verified)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {SECTION_SECTORS.map((section) => {
          const rows = area.projects.filter((p) => p.sector && section.sectors.includes(p.sector));
          const sectionAssets = area.assets.filter(
            (a) => a.sector && section.sectors.includes(a.sector),
          );
          return (
            <Panel key={section.title} title={section.title}>
              {rows.length === 0 && sectionAssets.length === 0 ? (
                <EmptyNote>Nothing recorded for this area.</EmptyNote>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {rows.map((p) => (
                    <li key={p.project_id} className="flex justify-between gap-3">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: p.project_id }}
                        className="truncate text-primary hover:underline"
                      >
                        {p.project_name}
                      </Link>
                      <StatusBadge status={p.status} />
                    </li>
                  ))}
                  {sectionAssets.map((a) => (
                    <li
                      key={a.asset_id}
                      className="flex justify-between gap-3 text-muted-foreground"
                    >
                      <span className="truncate">{a.asset_name}</span>
                      <span className="text-xs">{text(a.operational_status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel title="Unresolved service gaps" className="mt-4">
        {gaps.length === 0 ? (
          <EmptyNote>No open service gaps recorded for this area.</EmptyNote>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
