import { lazy, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  FileCheck2,
  Home,
  Landmark,
  MapPin,
  Recycle,
  Route,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import propertyHouse from "@/assets/property/property-house.png";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { EmptyNote, Field, Panel, PrototypeNote } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import type {
  Property360View,
  PropertyEcosystemItem,
  PropertyMissionRelationship,
} from "@/data/four-city/property360";
import type { CityProfile } from "@/data/cities/registry";
import { count, dateText, labelise, NA, text } from "@/lib/format";
import { cn } from "@/lib/utils";

const PointMap = lazy(() => import("@/components/map/PointMap"));

const CHAPTERS = [
  ["overview", "Overview"],
  ["housing", "Housing"],
  ["water-sewerage", "Water and sewerage"],
  ["sanitation-waste", "Sanitation and waste"],
  ["municipal-finance", "Municipal finance"],
  ["services-grievances", "Services and grievances"],
  ["livelihoods-inclusion", "Livelihoods and inclusion"],
  ["mission-linkages", "Mission linkages"],
  ["projects-assets", "Projects and assets"],
  ["urban-ecosystem", "Surrounding urban ecosystem"],
  ["evidence-quality", "Evidence and data quality"],
] as const;

type MapLayer = "property" | "services" | "projects" | "assets" | "missions" | "ecosystem";

export function Property360({ view, city }: { view: Property360View; city: CityProfile }) {
  const { property, locality } = view;
  const chips = propertyChips(view);
  return (
    <div className="min-w-0 space-y-5">
      <Breadcrumbs
        trail={[
          { label: "Localities", to: "/localities" },
          { label: locality.name, to: "/localities/$localityId", params: { localityId: locality.id } },
          { label: `Property 360: ${property.property_aggregate_id}` },
        ]}
      />

      <header className="digit-card overflow-hidden">
        <div className="grid min-w-0 md:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="flex min-h-40 items-center justify-center border-b border-border bg-info-surface p-4 md:border-r md:border-b-0">
            <img
              src={propertyHouse}
              alt=""
              aria-hidden="true"
              width={816}
              height={816}
              className="h-36 w-36 object-contain"
            />
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="field-label">Property 360</p>
                <h1 className="mt-1 break-words text-xl font-semibold text-foreground">
                  {property.property_aggregate_id}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locality.name}, {city.name}, {city.state}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {view.geography.label}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Building" value={property.building_id} mono />
              <Field label="Land use" value={labelise(property.land_use)} />
              <Field label="Households" value={count(property.households)} mono />
              <Field label="Occupancy" value={labelise(property.occupancy_category)} />
              <Field label="Assessment" value={labelise(property.assessment_status)} />
              <Field label="Locality" value={locality.name} />
              <Field label="City" value={city.name} />
              <Field label="Geography" value={view.geography.label} />
            </dl>

            {chips.length ? (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Property status">
                {chips.map((chip) => (
                  <li
                    key={chip.label}
                    className={cn(
                      "inline-flex min-h-7 items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium",
                      chip.tone === "positive" && "border-positive/40 bg-positive/10 text-foreground",
                      chip.tone === "warning" && "border-warning/40 bg-warning/10 text-foreground",
                      chip.tone === "neutral" && "border-border bg-muted text-foreground",
                    )}
                  >
                    <chip.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {chip.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Property 360 chapters" className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <div className="digit-card p-2">
            <p className="field-label px-2 py-1.5">Property chapters</p>
            <ol className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
              {CHAPTERS.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex min-h-9 items-start gap-2 rounded-sm px-2 py-2 text-sm text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="num text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <main className="min-w-0 space-y-5">
          <PropertyOverview view={view} city={city} />
          <HousingSection view={view} cityId={city.city_id} />
          <WaterSection view={view} cityId={city.city_id} />
          <SanitationSection view={view} cityId={city.city_id} />
          <FinanceSection view={view} cityId={city.city_id} />
          <ServicesSection view={view} cityId={city.city_id} />
          <LivelihoodSection view={view} cityId={city.city_id} />
          <MissionSection view={view} cityId={city.city_id} />
          <ProjectsAssetsSection view={view} cityId={city.city_id} />
          <EcosystemSection view={view} cityId={city.city_id} />
          <EvidenceSection view={view} city={city} />
        </main>
      </div>
    </div>
  );
}

function PropertyOverview({ view, city }: { view: Property360View; city: CityProfile }) {
  const p = view.property;
  const abstract = catalogueNote(view, city);
  return (
    <section id="overview" className="scroll-mt-4 space-y-4" aria-labelledby="overview-title">
      <SectionTitle id="overview-title" number="01" title="Overview" note="Catalogue entry with linked civic evidence" />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel title="Property snapshot">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Property ID" value={p.property_aggregate_id} mono />
            <Field label="Building ID" value={p.building_id} mono />
            <Field label="Assessment ID" value={p.synthetic_assessment_id} mono />
            <Field label="Land use" value={labelise(p.land_use)} />
            <Field label="Households" value={count(p.households)} mono />
            <Field label="Built-up area" value={p.built_up_area_sqm === null ? NA : `${count(p.built_up_area_sqm)} sq m`} mono />
            <Field label="Occupancy" value={labelise(p.occupancy_category)} />
            <Field label="City" value={`${city.name}, ${city.state}`} />
            <Field label="Locality" value={view.locality.name} />
          </dl>
        </Panel>
        <Panel title="Service readiness">
          <ul className="divide-y divide-border text-sm">
            <ReadinessRow label="Water" value={p.water_connection_id ? "Connection recorded" : "No known connection"} />
            <ReadinessRow label="Sewerage" value={p.sewer_connection_id ? "Connection recorded" : "No known connection"} />
            <ReadinessRow label="Waste" value={p.waste_collection_route_id ? "Route assigned" : "No known route"} />
            <ReadinessRow label="Tax position" value={p.property_tax_arrears_inr === null ? NA : p.property_tax_arrears_inr > 0 ? "Arrears present" : "No arrears recorded"} />
            <ReadinessRow label="Grievances" value={view.grievances.length ? `${view.grievances.length} linked aggregate${view.grievances.length === 1 ? "" : "s"}` : "No linked aggregate"} />
            <ReadinessRow label="Mission links" value={`${view.missions.filter((m) => m.relationship !== "No known linkage").length} contextual or direct`} />
          </ul>
        </Panel>
      </div>

      <Panel title="Record abstract">
        <p className="max-w-4xl text-sm leading-6 text-foreground">{abstract}</p>
      </Panel>

      <MissionStrip missions={view.missions} />
      <PropertyMap view={view} />
    </section>
  );
}

function PropertyMap({ view }: { view: Property360View }) {
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({
    property: true,
    services: true,
    projects: true,
    assets: true,
    missions: false,
    ecosystem: true,
  });
  const points = useMemo(() => {
    const rows: Array<MapPoint & { layer: MapLayer }> = [
      {
        id: view.property.property_aggregate_id,
        name: view.property.property_aggregate_id,
        sub: "Property shown at its approximate locality context",
        lat: view.geography.point.lat,
        lon: view.geography.point.lon,
        verified: false,
        layer: "property",
      },
    ];
    if (view.serviceArea) {
      rows.push({
        id: view.serviceArea.service_area_id,
        name: view.serviceArea.service_area_id,
        sub: `${labelise(view.serviceArea.area_type)} service-area anchor`,
        lat: view.serviceArea.coordinates[1],
        lon: view.serviceArea.coordinates[0],
        verified: false,
        layer: "services",
      });
    }
    for (const asset of view.assets) {
      rows.push({
        id: asset.asset_id,
        name: asset.asset_name,
        sub: `${labelise(asset.asset_type)}${asset.actual_asset_location ? "" : ": illustrative anchor"}`,
        lat: asset.coordinates[1],
        lon: asset.coordinates[0],
        verified: asset.actual_asset_location,
        layer: "assets",
      });
    }
    for (const project of view.projects) {
      rows.push({
        id: `project-${project.project_id}`,
        name: project.project_name,
        sub: `${labelise(project.mission)} project context at the locality anchor`,
        lat: view.geography.point.lat,
        lon: view.geography.point.lon,
        verified: false,
        layer: "projects",
      });
    }
    for (const mission of view.missions.filter((row) => row.relationship !== "No known linkage")) {
      rows.push({
        id: `mission-${mission.key}`,
        name: mission.name,
        sub: `${mission.relationship}: mission context at the locality anchor`,
        lat: view.geography.point.lat,
        lon: view.geography.point.lon,
        verified: false,
        layer: "missions",
      });
    }
    for (const item of view.ecosystem) {
      if (!item.point) continue;
      rows.push({
        id: item.id,
        name: item.name,
        sub: `${item.mission}: ${item.relationship}`,
        lat: item.point.lat,
        lon: item.point.lon,
        verified: item.point.verified,
        layer: "ecosystem",
      });
    }
    return rows.filter((row) => layers[row.layer]);
  }, [layers, view]);
  return (
    <Panel title="Property and urban context" description={view.geography.note}>
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Map layers">
        {(Object.keys(layers) as MapLayer[]).map((layer) => (
          <Button
            key={layer}
            type="button"
            size="sm"
            variant={layers[layer] ? "secondary" : "outline"}
            aria-pressed={layers[layer]}
            onClick={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))}
          >
            {labelise(layer)}
          </Button>
        ))}
      </div>
      <div className="h-72 w-full overflow-hidden rounded-sm border border-border sm:h-80">
        <ClientOnly fallback={<div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Loading map…</div>}>
          <PointMap
            points={points}
            centre={[view.geography.point.lat, view.geography.point.lon]}
            zoom={13}
            selectedId={view.property.property_aggregate_id}
            fitToPoints={points.length > 1}
          />
        </ClientOnly>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Dashed amber points are illustrative anchors. Proximity and shared locality do not establish service receipt or programme benefit.
      </p>
    </Panel>
  );
}

function HousingSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="housing" number="02" title="Housing" note="Direct property links remain distinct from locality context">
      {view.housing.length ? (
        <RecordRows>
          {view.housing.map((row) => (
            <RecordRow key={row.housing_id} icon={Home} title={row.housing_id} relationship="Directly linked" detail={`${labelise(row.mission)}. ${count(row.completed_houses)} completed and ${count(row.occupied_houses)} occupied houses reported in this aggregate.`} id={row.housing_id} cityId={cityId} />
          ))}
        </RecordRows>
      ) : <EmptyNote>No housing aggregate explicitly lists this property.</EmptyNote>}
    </Chapter>
  );
}

function WaterSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="water-sewerage" number="03" title="Water and sewerage">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Utility identifiers">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Water connection" value={text(view.property.water_connection_id)} mono />
            <Field label="Sewer connection" value={text(view.property.sewer_connection_id)} mono />
            <Field label="Water service area" value={text(view.property.water_service_area_id)} mono />
            <Field label="Relationship" value={view.property.water_service_area_id ? "Falls within" : "No known linkage"} />
          </dl>
        </Panel>
        <Panel title="Service records">
          {view.waterRecords.length ? (
            <RecordRows>
              {view.waterRecords.map((row) => (
                <RecordRow key={row.connection_record_id} icon={Droplets} title={row.connection_record_id} relationship="Served by" detail={`${labelise(row.service_status)}. Water supply: ${row.water_supply_hours_per_day === null ? NA : `${row.water_supply_hours_per_day} hours per day`}.`} id={row.connection_record_id} cityId={cityId} />
              ))}
            </RecordRows>
          ) : <EmptyNote>No utility service record is linked to this property.</EmptyNote>}
        </Panel>
      </div>
    </Chapter>
  );
}

function SanitationSection({ view, cityId }: { view: Property360View; cityId: string }) {
  const exact = view.sanitation.filter((row) => row.collection_route_id === view.property.waste_collection_route_id);
  const rows = exact.length ? exact : view.sanitation;
  return (
    <Chapter id="sanitation-waste" number="04" title="Sanitation and waste">
      <Panel title="Waste service context" right={<RelationshipBadge label={exact.length ? "Served by" : rows.length ? "Related through locality" : "No known linkage"} />}>
        <Field label="Assigned waste route" value={text(view.property.waste_collection_route_id)} mono />
        {rows.length ? (
          <div className="mt-3"><RecordRows>{rows.map((row) => <RecordRow key={row.sanitation_id} icon={Recycle} title={row.collection_route_id ?? row.sanitation_id} relationship={row.collection_route_id === view.property.waste_collection_route_id ? "Served by" : "Related through locality"} detail={`Door-to-door coverage: ${row.door_to_door_coverage_pct === null ? NA : `${row.door_to_door_coverage_pct}%`}. Segregation: ${row.segregation_pct === null ? NA : `${row.segregation_pct}%`}.`} id={row.sanitation_id} cityId={cityId} />)}</RecordRows></div>
        ) : null}
      </Panel>
    </Chapter>
  );
}

function FinanceSection({ view, cityId }: { view: Property360View; cityId: string }) {
  const p = view.property;
  return (
    <Chapter id="municipal-finance" number="05" title="Municipal finance">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Panel title="Property tax position">
          <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Field label="Demand" value={inr(p.property_tax_demand_inr)} mono />
            <Field label="Collection" value={inr(p.property_tax_collection_inr)} mono />
            <Field label="Arrears" value={inr(p.property_tax_arrears_inr)} mono />
          </dl>
        </Panel>
        <Panel title="Local investment context" description="Project finance in the same locality. Not attributed to this property.">
          {view.finance.length ? <RecordRows>{view.finance.slice(0, 6).map((row) => <RecordRow key={row.finance_id} icon={CircleDollarSign} title={`${row.financial_year ?? "Period not available"}: ${inrLakh(row.expenditure_inr_lakh)}`} relationship="Related through locality" detail={`${text(row.funding_source)}. Project ${text(row.project_id)}.`} id={row.finance_id} cityId={cityId} />)}</RecordRows> : <EmptyNote>No project finance record is attached to this locality.</EmptyNote>}
        </Panel>
      </div>
    </Chapter>
  );
}

function ServicesSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="services-grievances" number="06" title="Services and grievances">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Service observations">
          {view.observations.length ? <RecordRows>{view.observations.map((row) => <RecordRow key={row.service_observation_id} icon={FileCheck2} title={labelise(row.service_type)} relationship="Directly linked" detail={`${text(row.period)}. ${count(row.applications_resolved)} of ${count(row.applications_received)} applications resolved.`} id={row.service_observation_id} cityId={cityId} />)}</RecordRows> : <EmptyNote>No service observation explicitly lists this property.</EmptyNote>}
        </Panel>
        <Panel title="Grievances">
          {view.grievances.length ? <RecordRows>{view.grievances.map((row) => <RecordRow key={row.complaint_aggregate_id} icon={AlertCircle} title={labelise(row.service_type)} relationship="Directly linked" detail={`${count(row.complaint_count)} complaints, including ${count(row.repeat_complaints)} repeat complaints, for ${text(row.period)}.`} id={row.complaint_aggregate_id} cityId={cityId} />)}</RecordRows> : <EmptyNote>No grievance aggregate explicitly lists this property.</EmptyNote>}
        </Panel>
      </div>
    </Chapter>
  );
}

function LivelihoodSection({ view, cityId }: { view: Property360View; cityId: string }) {
  const items = view.ecosystem.filter((item) => item.kind === "livelihood");
  return (
    <Chapter id="livelihoods-inclusion" number="07" title="Livelihoods and inclusion" note="Locality context does not establish household participation">
      <EcosystemRows items={items} cityId={cityId} empty="No livelihood or street-vendor aggregate shares this locality." />
    </Chapter>
  );
}

function MissionSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="mission-linkages" number="08" title="Mission linkages" note="Direct service links are separated from locality context">
      <div className="divide-y divide-border rounded-sm border border-border bg-card">
        {view.missions.map((mission) => <MissionRow key={mission.key} mission={mission} cityId={cityId} />)}
      </div>
    </Chapter>
  );
}

function ProjectsAssetsSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="projects-assets" number="09" title="Projects and assets" note="Service-chain assets first, then locality context">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Projects in the locality">
          {view.projects.length ? <RecordRows>{view.projects.map((row) => <RecordRow key={row.project_id} icon={Landmark} title={row.project_name} relationship="Related through locality" detail={`${labelise(row.mission)}. ${labelise(row.project_status)}.`} id={row.project_id} cityId={cityId} project />)}</RecordRows> : <EmptyNote>No project shares this locality.</EmptyNote>}
        </Panel>
        <Panel title="Connected and locality assets">
          {view.assets.length ? <RecordRows>{view.assets.slice(0, 10).map((row) => <RecordRow key={row.asset_id} icon={Building2} title={row.asset_name} relationship={view.serviceArea?.water_asset_ids.includes(row.asset_id) || view.serviceArea?.sewer_asset_ids.includes(row.asset_id) ? "Served by" : "Related through locality"} detail={`${labelise(row.asset_type)}. ${labelise(row.commissioning_status)}.`} id={row.asset_id} cityId={cityId} />)}</RecordRows> : <EmptyNote>No connected or same-locality asset is available.</EmptyNote>}
        </Panel>
      </div>
    </Chapter>
  );
}

function EcosystemSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="urban-ecosystem" number="10" title="Surrounding urban ecosystem" note="Synthetic locality context. Not beneficiary proof">
      {(["livelihood", "public-service", "mobility"] as const).map((kind) => (
        <div key={kind} className="mb-4 last:mb-0">
          <h3 className="mb-2 text-sm font-semibold text-foreground">{kind === "livelihood" ? "Livelihood ecosystem" : kind === "public-service" ? "Public-service ecosystem" : "Mobility ecosystem"}</h3>
          <EcosystemRows items={view.ecosystem.filter((item) => item.kind === kind)} cityId={cityId} empty={`No ${kind.replace("-", " ")} context shares this locality.`} />
        </div>
      ))}
    </Chapter>
  );
}

function EvidenceSection({ view, city }: { view: Property360View; city: CityProfile }) {
  const p = view.property;
  const rawFields: Array<[string, unknown]> = Object.entries(p);
  const returnPath = `/records/${encodeURIComponent(p.property_aggregate_id)}?city=${encodeURIComponent(city.city_id)}#evidence-quality`;
  return (
    <Chapter id="evidence-quality" number="11" title="Evidence and data quality">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel title="Trust record">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Classification" value={text(view.provenance.data_classification)} />
            <Field label="Record type" value={text(view.provenance.record_type)} />
            <Field label="Verification" value={text(view.provenance.verification_status)} />
            <Field label="Observed" value={dateText(view.provenance.observation_date)} />
            <Field label="Geography confidence" value={view.geography.label} />
            <Field label="Context records added" value={count(view.enrichment.length)} mono />
          </dl>
          <div className="mt-4 rounded-sm border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
            <PrototypeNote text="Synthetic property and locality observations. Not official statistics or surveyed property positions" />
          </div>
        </Panel>
        <Panel title="Review provenance">
          <p className="text-sm text-muted-foreground">Open the wider evidence and data-quality view without losing this property context.</p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/data-quality" search={{ city: city.city_id, from: returnPath } as never}>Open data provenance</Link>
          </Button>
        </Panel>
      </div>
      <details className="digit-card mt-4 group">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Values exactly as supplied</summary>
        <div className="border-t border-border p-4">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rawFields.map(([key, value]) => <Field key={key} label={labelise(key)} value={formatRaw(value)} mono={key.endsWith("_id") || key.includes("_inr")} />)}
          </dl>
        </div>
      </details>
    </Chapter>
  );
}

function Chapter({ id, number, title, note, children }: { id: string; number: string; title: string; note?: string; children: ReactNode }) {
  const headingId = `${id}-title`;
  return <section id={id} className="scroll-mt-4 space-y-3" aria-labelledby={headingId}><SectionTitle id={headingId} number={number} title={title} {...(note ? { note } : {})} />{children}</section>;
}

function SectionTitle({ id, number, title, note }: { id: string; number: string; title: string; note?: string }) {
  return <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2"><span className="num text-xs font-medium text-primary">{number}</span><h2 id={id} className="text-base font-semibold text-foreground">{title}</h2>{note ? <p className="text-xs text-muted-foreground">{note}</p> : null}</div>;
}

function RecordRows({ children }: { children: ReactNode }) { return <ul className="divide-y divide-border">{children}</ul>; }

function RecordRow({ icon: Icon, title, relationship, detail, id, cityId, project = false }: { icon: typeof Home; title: string; relationship: string; detail: string; id: string; cityId: string; project?: boolean }) {
  return <li className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-2 py-3 first:pt-0 last:pb-0"><Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-words text-sm font-medium text-foreground">{title}</p><RelationshipBadge label={relationship} /></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p><Link to={project ? "/projects/$projectId" : "/records/$recordId"} params={(project ? { projectId: id } : { recordId: id }) as never} search={{ city: cityId } as never} className="mt-1 inline-flex text-xs font-medium text-primary underline-offset-2 hover:underline">Supporting record: {id}</Link></div></li>;
}

function EcosystemRows({ items, cityId, empty }: { items: PropertyEcosystemItem[]; cityId: string; empty: string }) {
  if (!items.length) return <EmptyNote>{empty}</EmptyNote>;
  const icons = { livelihood: Store, "public-service": Recycle, mobility: Route } as const;
  return <div className="rounded-sm border border-border bg-card px-3"><RecordRows>{items.map((item) => <RecordRow key={`${item.kind}-${item.id}`} icon={icons[item.kind]} title={item.name} relationship={item.relationship} detail={`${item.mission}. ${item.meaning}`} id={item.supportingRecordId} cityId={cityId} />)}</RecordRows></div>;
}

function MissionStrip({ missions }: { missions: PropertyMissionRelationship[] }) {
  return <Panel title="Mission snapshot"><ul className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">{missions.map((mission) => <li key={mission.key} className="min-w-0 bg-card p-3"><p className="text-xs font-semibold text-foreground">{mission.name}</p><p className="mt-1 text-xs text-muted-foreground">{mission.relationship}</p></li>)}</ul></Panel>;
}

function MissionRow({ mission, cityId }: { mission: PropertyMissionRelationship; cityId: string }) {
  return <div className="grid min-w-0 gap-2 p-3 sm:grid-cols-[9rem_8.5rem_minmax(0,1fr)] sm:p-4"><p className="text-sm font-semibold text-foreground">{mission.name}</p><RelationshipBadge label={mission.relationship} /><div className="min-w-0"><p className="text-sm text-foreground">{mission.meaning}</p><p className="mt-1 text-xs text-muted-foreground">Evidence: {mission.evidenceBasis}</p>{mission.recordIds.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{mission.recordIds.slice(0, 4).map((id) => <Link key={id} to="/records/$recordId" params={{ recordId: id }} search={{ city: cityId } as never} className="num text-xs text-primary underline-offset-2 hover:underline">{id}</Link>)}</div> : null}</div></div>;
}

function RelationshipBadge({ label }: { label: string }) {
  return <span className="inline-flex w-fit shrink-0 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground">{label}</span>;
}

function ReadinessRow({ label, value }: { label: string; value: string }) { return <li className="flex min-w-0 items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="min-w-0 text-right font-medium text-foreground">{value}</span></li>; }

function catalogueNote(view: Property360View, city: CityProfile): string {
  const p = view.property;
  const parts = [
    `This ${p.land_use ? labelise(p.land_use).toLowerCase() : "property"} aggregate in ${view.locality.name}, ${city.name}, represents ${p.households === null ? "an unknown number of" : count(p.households)} households.`,
    p.water_connection_id ? "A water connection is recorded." : "No water connection is recorded.",
    p.sewer_connection_id ? "A sewer connection is recorded." : "No sewer connection is recorded.",
    p.waste_collection_route_id ? "A waste route is assigned." : "No waste route is recorded.",
    p.property_tax_arrears_inr === null ? "The arrears position is not available." : p.property_tax_arrears_inr > 0 ? "Property tax arrears are present." : "No property tax arrears are recorded.",
    view.housing.length || view.projects.length || view.ecosystem.length ? "Linked records and locality context show how services, missions, and nearby civic activity relate to this aggregate." : "No wider mission or locality context is currently linked.",
  ];
  return parts.join(" ");
}

function propertyChips(view: Property360View) {
  const p = view.property;
  const rows: Array<{ label: string; tone: "positive" | "warning" | "neutral"; icon: typeof CheckCircle2 }> = [];
  if (p.water_connection_id) rows.push({ label: "Water connected", tone: "positive", icon: Droplets });
  else rows.push({ label: "Water connection unknown", tone: "warning", icon: Droplets });
  if (p.sewer_connection_id) rows.push({ label: "Sewer connected", tone: "positive", icon: ShieldCheck });
  else rows.push({ label: "Sewer unavailable", tone: "warning", icon: ShieldCheck });
  if (p.waste_collection_route_id) rows.push({ label: "Waste route assigned", tone: "positive", icon: Recycle });
  if (p.property_tax_arrears_inr !== null && p.property_tax_arrears_inr > 0) rows.push({ label: "Tax arrears present", tone: "warning", icon: CircleDollarSign });
  if (view.housing.length) rows.push({ label: "Housing linked", tone: "neutral", icon: Home });
  if (view.grievances.length) rows.push({ label: "Open grievance context", tone: "warning", icon: AlertCircle });
  if (view.vendors.length || view.livelihoods.length) rows.push({ label: "Livelihood context nearby", tone: "neutral", icon: Users });
  return rows.slice(0, 6);
}

function inr(value: number | null): string { return value === null ? NA : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function inrLakh(value: number | null): string { return value === null ? NA : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`; }
function formatRaw(value: unknown): string {
  if (value === null || value === undefined || value === "") return NA;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : NA;
  return String(value);
}