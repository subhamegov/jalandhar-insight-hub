import { lazy, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { InfoTip } from "@/components/app/InfoTip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClientOnly } from "@/components/map/ClientOnly";
import type { MapPoint } from "@/components/map/PointMap";
import { ENTITY_LABELS } from "@/data/four-city/types";
import { lookupEntity } from "@/data/four-city/dataset";
import type {
  Property360View,
  PropertyEcosystemItem,
  PropertyMissionRelationship,
} from "@/data/four-city/property360";
import type { CityProfile } from "@/data/cities/registry";
import { propertyShowcase } from "@/data/propertyShowcases";
import { count, dateText, labelise, NA, text } from "@/lib/format";
import { cn } from "@/lib/utils";

const PointMap = lazy(() => import("@/components/map/PointMap"));

const CHAPTER_GROUPS = [
  { label: "Property", items: [["overview", "Overview"], ["housing", "Housing"], ["municipal-finance", "Municipal finance"]] },
  { label: "Services", items: [["water-sewerage", "Water & sewerage"], ["sanitation-waste", "Sanitation & waste"], ["services-grievances", "Services & grievances"]] },
  { label: "Urban ecosystem", items: [["livelihoods-inclusion", "Livelihoods & inclusion"], ["urban-ecosystem", "Surrounding urban ecosystem"], ["mission-linkages", "Mission linkages"]] },
  { label: "Delivery & trust", items: [["delivery-journey", "Public delivery journey"], ["projects-assets", "Projects & assets"], ["evidence-quality", "Evidence & data quality"]] },
] as const;

type SectionId = "overview" | "housing" | "municipal-finance" | "water-sewerage" | "sanitation-waste" | "services-grievances" | "livelihoods-inclusion" | "urban-ecosystem" | "mission-linkages" | "delivery-journey" | "projects-assets" | "evidence-quality";
type MapLayer = "water" | "waste" | "projects" | "vending" | "markets" | "transport";

const ALL_CHAPTERS: ReadonlyArray<readonly [SectionId, string]> = [
  ["overview", "Overview"], ["housing", "Housing"], ["municipal-finance", "Municipal finance"],
  ["water-sewerage", "Water & sewerage"], ["sanitation-waste", "Sanitation & waste"], ["services-grievances", "Services & grievances"],
  ["livelihoods-inclusion", "Livelihoods & inclusion"], ["urban-ecosystem", "Surrounding urban ecosystem"], ["mission-linkages", "Mission linkages"],
  ["delivery-journey", "Public delivery journey"], ["projects-assets", "Projects & assets"], ["evidence-quality", "Evidence & data quality"],
];

interface CatalogueRecord {
  id: string;
  mapId: string;
  name: string;
  type: string;
  mission: string;
  relationship: string;
  status: string;
  evidence: string;
  point: MapPoint | null;
  project?: boolean;
  raw: Record<string, unknown>;
}

export function Property360({ view, city }: { view: Property360View; city: CityProfile }) {
  const { property, locality } = view;
  const chips = propertyChips(view);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [selectedMission, setSelectedMission] = useState("all");
  const [mapLayer, setMapLayer] = useState<MapLayer>("water");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("activeSection");
    const mission = params.get("selectedMission");
    const layer = params.get("mapLayer");
    if (ALL_CHAPTERS.some(([id]) => id === section)) setActiveSection(section as SectionId);
    if (mission) setSelectedMission(mission);
    if (["water", "waste", "projects", "vending", "markets", "transport"].includes(layer ?? "")) setMapLayer(layer as MapLayer);
  }, []);

  const preserveState = (next: Partial<{ activeSection: SectionId; selectedMission: string; mapLayer: MapLayer }>) => {
    const state = { activeSection, selectedMission, mapLayer, ...next };
    setActiveSection(state.activeSection);
    setSelectedMission(state.selectedMission);
    setMapLayer(state.mapLayer);
    const url = new URL(window.location.href);
    url.searchParams.set("city", city.city_id);
    url.searchParams.set("propertyId", property.property_aggregate_id);
    url.searchParams.set("activeSection", state.activeSection);
    url.searchParams.set("selectedMission", state.selectedMission);
    url.searchParams.set("mapLayer", state.mapLayer);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}#${state.activeSection}`);
  };

  const selectSection = (section: SectionId) => {
    preserveState({ activeSection: section });
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <div className="min-w-0 space-y-5">
      <Breadcrumbs
        trail={[
          { label: "Localities", to: "/localities" },
          { label: locality.name, to: "/localities/$localityId", params: { localityId: locality.id } },
          { label: `Property 360: ${property.property_aggregate_id}` },
        ]}
      />

      <header className="digit-card overflow-hidden border-t-4 border-t-primary">
        <div className="grid min-w-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <div className="flex min-h-32 items-center justify-center border-b border-border bg-info-surface p-3 sm:border-r sm:border-b-0">
            <img
              src={propertyHouse}
              alt=""
              aria-hidden="true"
              width={816}
              height={816}
              className="h-28 w-28 object-contain"
            />
          </div>
          <div className="min-w-0 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="field-label">Property 360 civic catalogue</p>
                <h1 className="mt-1 break-words text-2xl font-semibold text-foreground">
                  {property.property_aggregate_id}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locality.name}, {city.name}, {city.state}
                </p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-sm border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-foreground sm:inline-flex">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {view.geography.label}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Field label="Classification" value={labelise(property.land_use)} />
              <Field label="Households" value={count(property.households)} mono />
              <Field label="Service summary" value={`${[property.water_connection_id, property.sewer_connection_id, property.waste_collection_route_id].filter(Boolean).length} of 3 recorded`} />
              <Field label="Assessment" value={labelise(property.assessment_status)} />
              <Field label="Prototype classification" value={text(view.provenance.data_classification)} />
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

      <div className="grid min-w-0 gap-5 xl:grid-cols-[14rem_minmax(0,1fr)]">
        <CatalogueNavigation activeSection={activeSection} onSelect={selectSection} />

        <main className="min-w-0 space-y-5">
          <PropertyOverview view={view} city={city} selectedMission={selectedMission} mapLayer={mapLayer} onMissionChange={(mission: string) => preserveState({ selectedMission: mission })} onLayerChange={(layer: MapLayer) => preserveState({ mapLayer: layer })} activeSection={activeSection} />
          <HousingSection view={view} cityId={city.city_id} />
          <WaterSection view={view} cityId={city.city_id} />
          <SanitationSection view={view} cityId={city.city_id} />
          <FinanceSection view={view} cityId={city.city_id} />
          <ServicesSection view={view} cityId={city.city_id} />
          <LivelihoodSection view={view} cityId={city.city_id} />
          <EcosystemSection view={view} cityId={city.city_id} />
          <MissionSection view={view} cityId={city.city_id} />
          <DeliveryJourneySection view={view} />
          <ProjectsAssetsSection view={view} cityId={city.city_id} />
          <EvidenceSection view={view} city={city} />
        </main>
      </div>
    </div>
  );
}

function CatalogueNavigation({ activeSection, onSelect }: { activeSection: SectionId; onSelect: (section: SectionId) => void }) {
  const activeGroup = CHAPTER_GROUPS.find((group) => group.items.some(([id]) => id === activeSection));
  return (
    <nav aria-label="Property 360 chapters" className="min-w-0 xl:sticky xl:top-4 xl:self-start">
      <div className="digit-card p-3">
        <div className="xl:hidden">
          <label className="field-label mb-2 block" htmlFor="property-section">Catalogue section</label>
          <Select value={activeSection} onValueChange={(value) => onSelect(value as SectionId)}>
            <SelectTrigger id="property-section"><SelectValue /></SelectTrigger>
            <SelectContent>{CHAPTER_GROUPS.map((group) => group.items.map(([id, label]) => <SelectItem key={id} value={id}>{group.label}: {label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="hidden xl:block">
          <p className="field-label px-2 pb-2">Catalogue index</p>
          {CHAPTER_GROUPS.map((group) => {
            const open = group === activeGroup;
            return <div key={group.label} className="border-t border-border py-2 first:border-t-0">
              <p className="px-2 py-1 text-[0.68rem] font-semibold uppercase text-muted-foreground">{group.label}</p>
              {open ? <ol className="space-y-0.5">{group.items.map(([id, label]) => <li key={id}><button type="button" onClick={() => onSelect(id)} aria-current={activeSection === id ? "location" : undefined} className={cn("grid min-h-9 w-full grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 rounded-sm px-2 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", activeSection === id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent")}><span className="text-xs opacity-70">{String(ALL_CHAPTERS.findIndex(([chapter]) => chapter === id) + 1).padStart(2, "0")}</span><span>{label}</span></button></li>)}</ol> : null}
            </div>;
          })}
        </div>
      </div>
    </nav>
  );
}

function PropertyOverview({ view, city, selectedMission, mapLayer, onMissionChange, onLayerChange, activeSection }: { view: Property360View; city: CityProfile; selectedMission: string; mapLayer: MapLayer; onMissionChange: (mission: string) => void; onLayerChange: (layer: MapLayer) => void; activeSection: SectionId }) {
  const p = view.property;
  const abstract = catalogueNote(view, city);
  const showcase = propertyShowcase(city.city_id);
  return (
    <section id="overview" className="scroll-mt-4 space-y-4" aria-labelledby="overview-title">
      <SectionTitle id="overview-title" number="01" title="Overview" note="Catalogue entry with linked civic evidence" />
      {showcase.propertyId === p.property_aggregate_id ? (
        <Panel title="Demonstration journey">
          <p className="text-sm font-medium text-foreground">{showcase.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{showcase.storyline}</p>
          <p className="mt-2 text-xs text-muted-foreground">This is a guided prototype example. Synthetic relationships are context, not official findings.</p>
        </Panel>
      ) : null}
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

      <MissionStrip missions={view.missions} selectedMission={selectedMission} onSelect={onMissionChange} />
      <PropertyMap view={view} cityId={city.city_id} selectedMission={selectedMission} layer={mapLayer} onLayerChange={onLayerChange} activeSection={activeSection} />
    </section>
  );
}

function PropertyMap({ view, cityId, selectedMission, layer, onLayerChange, activeSection }: { view: Property360View; cityId: string; selectedMission: string; layer: MapLayer; onLayerChange: (layer: MapLayer) => void; activeSection: SectionId }) {
  const records = useMemo(() => catalogueRecords(view, layer).filter((record) => selectedMission === "all" || view.missions.find((mission) => mission.key === selectedMission)?.recordIds.includes(record.id)), [layer, selectedMission, view]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<CatalogueRecord | null>(null);
  const points = records.flatMap((record) => record.point ? [record.point] : []);
  const selectRecord = (record: CatalogueRecord) => {
    if (record.point) setSelectedId(record.mapId);
    setPreview(record);
  };
  const selectMarker = (mapId: string) => {
    const record = records.find((item) => item.mapId === mapId);
    if (record) selectRecord(record);
  };
  return (
    <Panel title="Investigate the city around this property" description={view.geography.note} right={<InfoTip label="Map method"><p>Only supplied coordinates or labelled locality anchors are shown. Selecting a record never creates a coordinate.</p></InfoTip>}>
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Map layers">
        {(["water", "waste", "projects", "vending", "markets", "transport"] as MapLayer[]).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={layer === option ? "default" : "outline"}
            aria-pressed={layer === option}
            onClick={() => { onLayerChange(option); setSelectedId(null); }}
          >
            {labelise(option)}
          </Button>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
        <div className="h-72 w-full overflow-hidden rounded-sm border border-border sm:h-80 lg:h-[26rem]">
          <ClientOnly fallback={<div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Loading map…</div>}>
            <PointMap points={points} centre={[view.geography.point.lat, view.geography.point.lon]} zoom={13} selectedId={selectedId} onSelect={selectMarker} fitToPoints={points.length > 1} />
          </ClientOnly>
        </div>
        <div className="min-w-0">
          <p className="field-label mb-2">Linked records · {records.length}</p>
          {records.length ? <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">{records.map((record) => <li key={record.id}><button type="button" onClick={() => selectRecord(record)} className={cn("w-full rounded-sm border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", selectedId === record.mapId ? "border-primary bg-info-surface" : "border-border bg-card hover:bg-accent")}><p className="text-sm font-semibold text-foreground">{record.name}</p><p className="mt-1 text-xs text-muted-foreground">{record.type} · {relationshipLabel(record.relationship)}</p><p className="mt-1 text-xs text-muted-foreground">{record.point ? record.point.verified ? "Reported position" : "In the same locality" : "No mappable position"}</p></button></li>)}</ul> : <EmptyNote>No records match this layer and mission.</EmptyNote>}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Dashed amber points are illustrative anchors. Proximity and shared locality do not establish service receipt or programme benefit.
      </p>
      <RecordPreview record={preview} cityId={cityId} returnSection={activeSection} propertyId={view.property.property_aggregate_id} onClose={() => setPreview(null)} />
    </Panel>
  );
}

function catalogueRecords(view: Property360View, layer: MapLayer): CatalogueRecord[] {
  const localityPoint = (id: string, name: string, sub: string): MapPoint => ({ id, name, sub, lat: view.geography.point.lat, lon: view.geography.point.lon, verified: false });
  const assetPoint = (id: string) => {
    const asset = view.assets.find((row) => row.asset_id === id);
    return asset ? { id, name: asset.asset_name, sub: asset.actual_asset_location ? "Reported asset position" : "Illustrative asset anchor", lat: asset.coordinates[1], lon: asset.coordinates[0], verified: asset.actual_asset_location } : null;
  };
  const make = (id: string, name: string, type: string, mission: string, relationship: string, status: string, evidence: string, point: MapPoint | null, raw: Record<string, unknown>, project = false): CatalogueRecord => ({ id, mapId: point?.id ?? id, name, type, mission, relationship, status, evidence, point, raw, project });
  if (layer === "water") {
    const rows = view.waterRecords.map((row) => make(row.connection_record_id, "Water and sewerage service", "Water and sewerage service", "AMRUT", "Directly linked", labelise(row.service_status), "Property aggregate identifier", view.serviceArea ? { id: row.connection_record_id, name: "Water and sewerage service", sub: "Service-area anchor", lat: view.serviceArea.coordinates[1], lon: view.serviceArea.coordinates[0], verified: false } : localityPoint(row.connection_record_id, "Water and sewerage service", "In the same locality"), row as unknown as Record<string, unknown>));
    if (!rows.length && view.serviceArea) rows.push(make(view.serviceArea.service_area_id, "Water service area", "Asset service area", "AMRUT", "Falls within", labelise(view.serviceArea.area_type), "Property water service-area identifier", { id: view.serviceArea.service_area_id, name: "Water service area", sub: "Service-area anchor", lat: view.serviceArea.coordinates[1], lon: view.serviceArea.coordinates[0], verified: false }, view.serviceArea as unknown as Record<string, unknown>));
    return rows;
  }
  if (layer === "waste") return view.sanitation.map((row) => make(row.sanitation_id, "Waste collection service", "Sanitation service", "SBM-U", row.collection_route_id === view.property.waste_collection_route_id ? "Served by" : "Related through locality", row.collection_route_id ? "Route recorded" : "Route not available", row.collection_route_id === view.property.waste_collection_route_id ? "Matching collection route identifier" : "Shared canonical locality", localityPoint(row.sanitation_id, "Waste collection service", "In the same locality"), row as unknown as Record<string, unknown>));
  if (layer === "projects") return view.projects.map((row) => make(row.project_id, row.project_name, "Project", labelise(row.mission), "Related through locality", labelise(row.project_status), "Shared canonical locality", localityPoint(`project-${row.project_id}`, row.project_name, "Project context in the same locality"), row as unknown as Record<string, unknown>, true));
  if (layer === "vending") return view.vendors.map((row) => make(row.vendor_aggregate_id, "Street-vending activity", "Street-vendor aggregate", "PM SVANidhi", "Related through locality", row.vending_zone_id ? "Vending zone recorded" : "Zone not available", "Shared canonical locality", assetPoint(row.market_asset_id ?? "") ?? localityPoint(row.vendor_aggregate_id, "Street-vending activity", "In the same locality"), row as unknown as Record<string, unknown>));
  if (layer === "markets") return view.ecosystem.filter((item) => item.kind === "livelihood" && item.point).map((item) => {
    const point = item.point ? { id: item.id, name: item.name, sub: `${item.mission}: ${relationshipLabel(item.relationship)}`, lat: item.point.lat, lon: item.point.lon, verified: item.point.verified } : null;
    const found = lookupEntity(item.supportingRecordId);
    return make(item.supportingRecordId, item.name, "Market and livelihood context", item.mission, item.relationship, "Context available", "Linked market asset or shared canonical locality", point, found?.record ?? {});
  });
  return view.transport.map((row) => make(row.transport_stop_id, `${labelise(row.mode)} transport record`, "Transport route", "Urban transport context", "Related through locality", row.actual_stop_or_route ? "Reported route or stop" : "Illustrative record", "Shared canonical locality", localityPoint(row.transport_stop_id, `${labelise(row.mode)} transport record`, "In the same locality"), row as unknown as Record<string, unknown>));
}

function RecordPreview({ record, cityId, returnSection, propertyId, onClose }: { record: CatalogueRecord | null; cityId: string; returnSection: SectionId; propertyId: string; onClose: () => void }) {
  if (!record) return null;
  const returnPath = `/records/${encodeURIComponent(propertyId)}?city=${encodeURIComponent(cityId)}&propertyId=${encodeURIComponent(propertyId)}&activeSection=${encodeURIComponent(returnSection)}#${returnSection}`;
  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}><SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle>{record.name}</SheetTitle><SheetDescription>{record.type}</SheetDescription></SheetHeader><div className="mt-6 space-y-4"><dl className="grid gap-3 sm:grid-cols-2"><Field label="Mission" value={record.mission} /><Field label="Relationship" value={relationshipLabel(record.relationship)} /><Field label="Status" value={record.status} /><Field label="Geography" value={record.point ? record.point.verified ? "Reported position" : "In the same locality" : "No mappable position"} /></dl><div><p className="field-label">Evidence</p><p className="mt-1 text-sm text-foreground">{record.evidence}</p></div><Button asChild className="w-full"><Link to={record.project ? "/projects/$projectId" : "/records/$recordId"} params={(record.project ? { projectId: record.id } : { recordId: record.id }) as never} search={{ city: cityId, from: returnPath } as never}>Open full record</Link></Button><details className="rounded-sm border border-border"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Full raw metadata</summary><dl className="grid gap-3 border-t border-border p-3">{Object.entries(record.raw).map(([key, value]) => <Field key={key} label={labelise(key)} value={formatRaw(value)} mono={key.includes("id")} />)}</dl></details></div></SheetContent></Sheet>;
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
    <Chapter id="water-sewerage" number="04" title="Water and sewerage">
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
    <Chapter id="sanitation-waste" number="05" title="Sanitation and waste">
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
    <Chapter id="municipal-finance" number="03" title="Municipal finance">
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
    <Chapter id="mission-linkages" number="09" title="Mission linkages" note="Direct service links are separated from locality context">
      <div className="divide-y divide-border rounded-sm border border-border bg-card">
        {view.missions.map((mission) => <MissionRow key={mission.key} mission={mission} cityId={cityId} />)}
      </div>
    </Chapter>
  );
}

function ProjectsAssetsSection({ view, cityId }: { view: Property360View; cityId: string }) {
  return (
    <Chapter id="projects-assets" number="11" title="Projects and assets" note="Service-chain assets first, then locality context">
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
    <Chapter id="urban-ecosystem" number="08" title="Surrounding urban ecosystem" note="Synthetic locality context. Not beneficiary proof">
      {(["livelihood", "public-service", "mobility"] as const).map((kind) => (
        <div key={kind} className="mb-4 last:mb-0">
          <h3 className="mb-2 text-sm font-semibold text-foreground">{kind === "livelihood" ? "Livelihood ecosystem" : kind === "public-service" ? "Public-service ecosystem" : "Mobility ecosystem"}</h3>
          <EcosystemRows items={view.ecosystem.filter((item) => item.kind === kind)} cityId={cityId} empty={`No ${kind.replace("-", " ")} context shares this locality.`} />
        </div>
      ))}
    </Chapter>
  );
}

function DeliveryJourneySection({ view }: { view: Property360View }) {
  const stages = [
    { label: "Property record", value: "Catalogue entry available" },
    { label: "Service connection", value: view.waterRecords.length ? "Direct record available" : "No direct record" },
    { label: "Municipal response", value: view.observations.length || view.grievances.length ? "Delivery evidence available" : "No linked evidence" },
    { label: "Infrastructure context", value: view.projects.length || view.assets.length ? "Locality context available" : "No linked context" },
  ];
  return <Chapter id="delivery-journey" number="10" title="Public delivery journey" note="A trace through available records, not a service-performance score">
    <ol className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">{stages.map((stage, index) => <li key={stage.label} className="min-w-0 bg-card p-4"><p className="num text-xs text-primary">{String(index + 1).padStart(2, "0")}</p><p className="mt-2 text-sm font-semibold text-foreground">{stage.label}</p><p className="mt-1 text-xs text-muted-foreground">{stage.value}</p></li>)}</ol>
  </Chapter>;
}

function EvidenceSection({ view, city }: { view: Property360View; city: CityProfile }) {
  const p = view.property;
  const rawFields: Array<[string, unknown]> = Object.entries(p);
  const returnPath = `/records/${encodeURIComponent(p.property_aggregate_id)}?city=${encodeURIComponent(city.city_id)}#evidence-quality`;
  return (
    <Chapter id="evidence-quality" number="12" title="Evidence and data quality">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel title="Trust record">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Classification" value={text(view.provenance.data_classification)} />
            <Field label="Record type" value={text(view.provenance.record_type)} />
            <Field label="Verification" value={text(view.provenance.verification_status)} />
            <Field label="Observed" value={dateText(view.provenance.observation_date)} />
            <Field label="Geography confidence" value={view.geography.label} />
            <Field label="Relationship records" value={count(view.enrichment.length)} mono />
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
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Full relationship evidence and provenance</summary>
        <div className="w-full min-w-0 overflow-x-auto border-t border-border p-4">
          <table className="w-full min-w-[48rem] text-sm">
            <thead><tr className="border-b border-border text-left"><th className="field-label py-2">Relationship</th><th className="field-label py-2">Target record</th><th className="field-label py-2">Geography</th><th className="field-label py-2">Classification</th><th className="field-label py-2">Provenance</th></tr></thead>
            <tbody>{view.enrichment.map((row) => <tr key={`${row.relationshipType}-${row.targetEntityId}`} className="border-b border-border/60 align-top"><td className="py-2 pr-3">{relationshipLabel(row.relationshipType)}</td><td className="py-2 pr-3"><RelationshipRecordLink id={row.targetEntityId} cityId={city.city_id} /></td><td className="py-2 pr-3">{labelise(row.geographicPrecision)}</td><td className="py-2 pr-3">{labelise(row.dataClassification)}</td><td className="py-2 text-xs text-muted-foreground">{row.provenance}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
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
  const found = lookupEntity(id);
  const displayTitle = title === id && found ? ENTITY_LABELS[found.kind] : title;
  return <li className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-2 py-3 first:pt-0 last:pb-0"><Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-words text-sm font-medium text-foreground">{displayTitle}</p><RelationshipBadge label={relationship} /></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p><Link to={project ? "/projects/$projectId" : "/records/$recordId"} params={(project ? { projectId: id } : { recordId: id }) as never} search={{ city: cityId } as never} className="mt-1 inline-flex text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">Open full record</Link></div></li>;
}

function EcosystemRows({ items, cityId, empty }: { items: PropertyEcosystemItem[]; cityId: string; empty: string }) {
  if (!items.length) return <EmptyNote>{empty}</EmptyNote>;
  const icons = { livelihood: Store, "public-service": Recycle, mobility: Route } as const;
  return <div className="rounded-sm border border-border bg-card px-3"><RecordRows>{items.map((item) => <RecordRow key={`${item.kind}-${item.id}`} icon={icons[item.kind]} title={item.name} relationship={item.relationship} detail={`${item.mission}. ${item.meaning}`} id={item.supportingRecordId} cityId={cityId} />)}</RecordRows></div>;
}

function MissionStrip({ missions, selectedMission, onSelect }: { missions: PropertyMissionRelationship[]; selectedMission: string; onSelect: (mission: string) => void }) {
  const available = missions.filter((mission) => mission.relationship !== "No known linkage");
  return <Panel title="Mission relationships" description="Select a mission to filter the investigative map and linked records." right={<InfoTip label="Mission relationship"><p>A relationship may be direct, service-area based, or shared locality context. It does not establish a beneficiary relationship.</p></InfoTip>}><div className="flex flex-wrap gap-2" role="group" aria-label="Mission filter"><Button type="button" size="sm" variant={selectedMission === "all" ? "default" : "outline"} aria-pressed={selectedMission === "all"} onClick={() => onSelect("all")}>All missions</Button>{available.map((mission) => <Button key={mission.key} type="button" size="sm" variant={selectedMission === mission.key ? "default" : "outline"} aria-pressed={selectedMission === mission.key} onClick={() => onSelect(mission.key)}>{mission.name}</Button>)}</div></Panel>;
}

function MissionRow({ mission, cityId }: { mission: PropertyMissionRelationship; cityId: string }) {
  return <div className="grid min-w-0 gap-2 p-3 sm:grid-cols-[9rem_8.5rem_minmax(0,1fr)] sm:p-4"><p className="text-sm font-semibold text-foreground">{mission.name}</p><RelationshipBadge label={mission.relationship} /><div className="min-w-0"><p className="text-sm text-foreground">{mission.meaning}</p><p className="mt-1 break-words text-xs text-muted-foreground">Evidence: {mission.evidenceBasis}</p>{mission.recordIds.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{mission.recordIds.slice(0, 4).map((id) => <RelationshipRecordLink key={id} id={id} cityId={cityId} />)}</div> : null}</div></div>;
}

function RelationshipRecordLink({ id, cityId }: { id: string; cityId: string }) {
  const isJalandharProject = cityId === "CITY-JALANDHAR" && id.startsWith("PRJ-JAL-");
  return <Link to={isJalandharProject ? "/projects/$projectId" : "/records/$recordId"} params={(isJalandharProject ? { projectId: id } : { recordId: id }) as never} search={{ city: cityId } as never} className="num text-xs text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{id}</Link>;
}

function RelationshipBadge({ label }: { label: string }) {
  return <span className="inline-flex w-fit shrink-0 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground">{relationshipLabel(label)}</span>;
}

function relationshipLabel(label: string): string {
  return label === "Related through locality" ? "In the same locality" : label;
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