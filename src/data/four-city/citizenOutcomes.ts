/**
 * Citizen-centred reading of the four-city dataset.
 *
 * Every figure here is a plain sum or ratio of supplied record values. Nothing
 * is scored, weighted into an index, or scaled up to a citywide total: the
 * dataset is a sample of localities, so numerators, denominators and record
 * counts travel with each indicator. Reported delivery (houses completed,
 * loans sanctioned) is labelled separately from observed service conditions
 * (water hours, waste processed, complaint resolution) so construction is
 * never read as citizen impact.
 */
import { fourCityBundle, type FourCityBundle } from "./dataset";
import type { Locality } from "./types";

export type IndicatorNature = "observed" | "reported";

export type Drill =
  | { kind: "record"; id: string; label: string }
  | { kind: "route"; to: DrillRoute; label: string };

export type DrillRoute = "/livelihoods" | "/housing" | "/localities" | "/projects" | "/assets" | "/data-layer" | "/evidence";

export interface Indicator {
  id: string;
  label: string;
  /** Formatted headline value, or "Not available" when the dataset has none. */
  value: string;
  /** Numerator and denominator exactly as summed from the supplied records. */
  basis: string;
  /** Reporting period(s) the records carry. */
  period: string;
  nature: IndicatorNature;
  drills: Drill[];
}

export interface VariationRow {
  locality_id: string;
  name: string;
  value: string;
  detail: string;
  /** Sort key; lower means more underserved. */
  rank: number;
}

export interface Variation {
  measure: string;
  note: string;
  rows: VariationRow[];
}

export interface CitizenDomain {
  id: string;
  title: string;
  question: string;
  sample: string;
  indicators: Indicator[];
  variation: Variation | null;
}

// --------------------------------------------------------------- arithmetic

const sum = (rows: Array<number | null | undefined>) =>
  rows.reduce<number>((s, v) => s + (typeof v === "number" ? v : 0), 0);

const has = (rows: Array<number | null | undefined>) =>
  rows.filter((v) => typeof v === "number").length;

function ratio(numerator: number, denominator: number): string {
  if (!denominator) return "Not available";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function num(value: number): string {
  return value.toLocaleString("en-IN");
}

function decimal(value: number, digits = 1): string {
  return value.toFixed(digits);
}

/** Distinct reporting periods carried by the records, as supplied. */
function periodsOf(rows: Array<{ period?: string | null; observation_date?: string | null }>) {
  const set = new Set<string>();
  for (const r of rows) {
    const p = r.period ?? r.observation_date ?? null;
    if (p) set.add(p);
  }
  const list = [...set].sort();
  if (list.length === 0) return "Period not stated";
  if (list.length === 1) return `Period ${list[0]}`;
  return `Periods ${list[0]} to ${list[list.length - 1]}`;
}

const localityName = (localities: Locality[], id: string | null) =>
  localities.find((l) => l.id === id)?.name ?? id ?? "Locality not stated";

/** Sample sentence shared by every domain: records counted, never scaled up. */
function sampleNote(recordCount: number, localityCount: number, kind: string) {
  return `${num(recordCount)} ${kind} across ${num(localityCount)} sampled localities. Not a citywide total.`;
}

function topRecords(ids: string[], label: (id: string) => string, limit = 3): Drill[] {
  return ids.slice(0, limit).map((id) => ({ kind: "record" as const, id, label: label(id) }));
}

// --------------------------------------------------------------- the domains

function housingDomain(b: FourCityBundle): CitizenDomain {
  const rows = b.housing;
  const sanctioned = sum(rows.map((r) => r.sanctioned_houses));
  const grounded = sum(rows.map((r) => r.grounded_houses));
  const completed = sum(rows.map((r) => r.completed_houses));
  const occupied = sum(rows.map((r) => r.occupied_houses));
  const waterReady = sum(rows.map((r) => r.water_ready_houses));
  const sewerReady = sum(rows.map((r) => r.sewer_ready_houses));
  const wasteReady = sum(rows.map((r) => r.waste_collection_ready_houses));
  const period = periodsOf(rows);

  const housingProjectIds = new Set(rows.map((r) => r.project_id).filter(Boolean) as string[]);
  const linkedAssets = b.assets.filter((a) => a.project_ids.some((p) => housingProjectIds.has(p)));

  const byLocality = new Map<string, { completed: number; occupied: number; water: number }>();
  for (const r of rows) {
    const key = r.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { completed: 0, occupied: 0, water: 0 };
    cur.completed += r.completed_houses ?? 0;
    cur.occupied += r.occupied_houses ?? 0;
    cur.water += r.water_ready_houses ?? 0;
    byLocality.set(key, cur);
  }

  return {
    id: "housing",
    title: "Housing and liveable neighbourhoods",
    question: "Are completed houses actually lived in, and connected to services?",
    sample: sampleNote(rows.length, byLocality.size, "housing records"),
    indicators: [
      {
        id: "houses-completed",
        label: "Houses completed",
        value: num(completed),
        basis: `${num(completed)} completed of ${num(sanctioned)} sanctioned, ${num(grounded)} grounded`,
        period,
        nature: "reported",
        drills: [
          { kind: "route", to: "/projects", label: "Housing projects" },
          ...topRecords(rows.map((r) => r.housing_id), (id) => id),
        ],
      },
      {
        id: "houses-occupied",
        label: "Houses occupied",
        value: ratio(occupied, completed),
        basis: `${num(occupied)} occupied of ${num(completed)} completed`,
        period,
        nature: "observed",
        drills: [{ kind: "route", to: "/localities", label: "Occupancy by locality" }],
      },
      {
        id: "housing-service-readiness",
        label: "Housing service readiness",
        value: ratio(waterReady, completed),
        basis: `Water ready ${num(waterReady)}, sewer ready ${num(sewerReady)}, waste collection ready ${num(wasteReady)} of ${num(completed)} completed`,
        period,
        nature: "observed",
        drills: [
          { kind: "route", to: "/housing", label: "Housing service readiness" },
          { kind: "route", to: "/localities", label: "Readiness by locality" },
        ],
      },
      {
        id: "housing-infrastructure",
        label: "Related municipal infrastructure",
        value: num(linkedAssets.length),
        basis: `Assets recorded against ${num(housingProjectIds.size)} housing projects, joined by project identifier`,
        period,
        nature: "reported",
        drills: [
          { kind: "route", to: "/assets", label: "Asset register" },
          ...topRecords(linkedAssets.map((a) => a.asset_id), (id) => id),
        ],
      },
    ],
    variation: {
      measure: "Houses occupied as a share of houses completed",
      note: "Localities with the lowest occupancy of completed houses appear first.",
      rows: [...byLocality.entries()]
        .filter(([, v]) => v.completed > 0)
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: ratio(v.occupied, v.completed),
          detail: `${num(v.occupied)} of ${num(v.completed)} completed occupied · water ready ${num(v.water)}`,
          rank: v.occupied / v.completed,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

function waterDomain(b: FourCityBundle): CitizenDomain {
  const conn = b.waterSewerage;
  const props = b.properties;
  const san = b.sanitation;

  const withWater = props.filter((p) => p.water_connection_id).length;
  const withSewer = props.filter((p) => p.sewer_connection_id).length;
  const supplyRecords = conn.filter((c) => typeof c.water_supply_hours_per_day === "number");
  const supplyHours = sum(conn.map((c) => c.water_supply_hours_per_day));
  const samplesPassed = sum(conn.map((c) => c.water_quality_samples_passed));
  const samplesTotal = sum(conn.map((c) => c.water_quality_samples_total));
  const households = sum(san.map((s) => s.households_in_sample));
  const coverageWeighted = sum(
    san.map((s) => ((s.door_to_door_coverage_pct ?? 0) / 100) * (s.households_in_sample ?? 0)),
  );
  const segregationWeighted = sum(
    san.map((s) => ((s.segregation_pct ?? 0) / 100) * (s.households_in_sample ?? 0)),
  );

  const byLocality = new Map<string, { hours: number; n: number; water: number; total: number }>();
  for (const c of conn) {
    const key = c.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { hours: 0, n: 0, water: 0, total: 0 };
    if (typeof c.water_supply_hours_per_day === "number") {
      cur.hours += c.water_supply_hours_per_day;
      cur.n += 1;
    }
    byLocality.set(key, cur);
  }
  for (const p of props) {
    const key = p.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { hours: 0, n: 0, water: 0, total: 0 };
    cur.total += 1;
    if (p.water_connection_id) cur.water += 1;
    byLocality.set(key, cur);
  }

  return {
    id: "water",
    title: "Water and sanitation",
    question: "Do households have a connection, and does the service actually run?",
    sample: sampleNote(conn.length + san.length, byLocality.size, "connection and sanitation records"),
    indicators: [
      {
        id: "water-coverage",
        label: "Water connection coverage",
        value: ratio(withWater, props.length),
        basis: `${num(withWater)} of ${num(props.length)} sampled property aggregates carry a water connection identifier`,
        period: periodsOf(props),
        nature: "reported",
        drills: [
          { kind: "route", to: "/localities", label: "Coverage by locality" },
          ...topRecords(props.slice(0, 3).map((p) => p.property_aggregate_id), (id) => id),
        ],
      },
      {
        id: "water-availability",
        label: "Water service availability",
        value: supplyRecords.length ? `${decimal(supplyHours / supplyRecords.length)} hrs/day` : "Not available",
        basis: `Mean of ${num(supplyRecords.length)} connection records reporting supply hours · quality samples passed ${num(samplesPassed)} of ${num(samplesTotal)}`,
        period: periodsOf(conn),
        nature: "observed",
        drills: [
          { kind: "route", to: "/localities", label: "Supply hours by locality" },
          ...topRecords(conn.slice(0, 3).map((c) => c.connection_record_id), (id) => id),
        ],
      },
      {
        id: "sewer-readiness",
        label: "Sewerage readiness",
        value: ratio(withSewer, props.length),
        basis: `${num(withSewer)} of ${num(props.length)} sampled property aggregates carry a sewer connection identifier`,
        period: periodsOf(props),
        nature: "reported",
        drills: [{ kind: "route", to: "/assets", label: "Sewerage assets" }],
      },
      {
        id: "waste-coverage",
        label: "Waste collection coverage",
        value: ratio(coverageWeighted, households),
        basis: `Door-to-door coverage weighted by ${num(households)} households in ${num(san.length)} sanitation records`,
        period: periodsOf(san),
        nature: "observed",
        drills: [
          { kind: "route", to: "/localities", label: "Coverage by locality" },
          ...topRecords(san.map((s) => s.sanitation_id), (id) => id),
        ],
      },
      {
        id: "waste-segregation",
        label: "Waste segregation",
        value: ratio(segregationWeighted, households),
        basis: `Segregation weighted by ${num(households)} households in ${num(san.length)} sanitation records`,
        period: periodsOf(san),
        nature: "observed",
        drills: [{ kind: "route", to: "/localities", label: "Segregation by locality" }],
      },
    ],
    variation: {
      measure: "Average water supply hours per day",
      note: "Localities with the fewest supply hours in their connection records appear first.",
      rows: [...byLocality.entries()]
        .filter(([, v]) => v.n > 0)
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: `${decimal(v.hours / v.n)} hrs/day`,
          detail: `${num(v.n)} connection records · water connection on ${num(v.water)} of ${num(v.total)} properties`,
          rank: v.hours / v.n,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

function cleanlinessDomain(b: FourCityBundle): CitizenDomain {
  const san = b.sanitation;
  const generated = sum(san.map((s) => s.waste_generated_tpd));
  const collected = sum(san.map((s) => s.waste_collected_tpd));
  const processed = sum(san.map((s) => s.waste_processed_tpd));
  const toilets = sum(san.map((s) => s.public_toilets));
  const floods = sum(san.map((s) => s.drain_flood_incidents));
  const publicAssets = b.assets.filter((a) =>
    ["public toilet", "park", "drain", "mrf", "compost", "community toilet"].some((t) =>
      a.asset_type.toLowerCase().includes(t),
    ),
  );
  const cleanTypes = new Set(["solid_waste", "sanitation", "drainage", "public_toilet"]);
  const complaints = b.grievances.filter((g) => cleanTypes.has(g.service_type));
  const complaintCount = sum(complaints.map((g) => g.complaint_count));

  const byLocality = new Map<string, { gen: number; proc: number; toilets: number }>();
  for (const s of san) {
    const key = s.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { gen: 0, proc: 0, toilets: 0 };
    cur.gen += s.waste_generated_tpd ?? 0;
    cur.proc += s.waste_processed_tpd ?? 0;
    cur.toilets += s.public_toilets ?? 0;
    byLocality.set(key, cur);
  }

  return {
    id: "cleanliness",
    title: "Cleanliness and public spaces",
    question: "Is waste collected and processed, and are public facilities available?",
    sample: sampleNote(san.length, byLocality.size, "sanitation records"),
    indicators: [
      {
        id: "waste-processing",
        label: "Waste-processing observations",
        value: ratio(processed, generated),
        basis: `${decimal(processed)} TPD processed of ${decimal(generated)} TPD generated · ${decimal(collected)} TPD collected`,
        period: periodsOf(san),
        nature: "observed",
        drills: [
          { kind: "route", to: "/assets", label: "Processing assets" },
          ...topRecords(san.map((s) => s.sanitation_id), (id) => id),
        ],
      },
      {
        id: "public-sanitation",
        label: "Public sanitation availability",
        value: num(toilets),
        basis: `Public toilets counted in ${num(has(san.map((s) => s.public_toilets)))} sanitation records`,
        period: periodsOf(san),
        nature: "observed",
        drills: [{ kind: "route", to: "/localities", label: "Facilities by locality" }],
      },
      {
        id: "public-space-assets",
        label: "Public-space assets",
        value: num(publicAssets.length),
        basis: `Assets of types ${[...new Set(publicAssets.map((a) => a.asset_type))].join(", ") || "none recorded"}`,
        period: periodsOf(b.assets),
        nature: "reported",
        drills: [
          { kind: "route", to: "/assets", label: "Asset register" },
          ...topRecords(publicAssets.map((a) => a.asset_id), (id) => id),
        ],
      },
      {
        id: "cleanliness-complaints",
        label: "Related service complaints",
        value: num(complaintCount),
        basis: `${num(complaintCount)} complaints in ${num(complaints.length)} aggregates covering ${[...cleanTypes].join(", ")}`,
        period: periodsOf(complaints),
        nature: "observed",
        drills: [
          ...topRecords(complaints.map((g) => g.complaint_aggregate_id), (id) => id),
          { kind: "route", to: "/data-layer", label: "Trace complaint records" },
        ],
      },
    ],
    variation: {
      measure: "Waste processed as a share of waste generated",
      note: "Localities processing the smallest share of the waste they generate appear first.",
      rows: [...byLocality.entries()]
        .filter(([, v]) => v.gen > 0)
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: ratio(v.proc, v.gen),
          detail: `${decimal(v.proc)} of ${decimal(v.gen)} TPD processed · ${num(v.toilets)} public toilets`,
          rank: v.proc / v.gen,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

function mobilityDomain(b: FourCityBundle): CitizenDomain {
  const t = b.transport;
  const routes = new Set(t.map((r) => r.route_id).filter(Boolean));
  const headwayRecords = t.filter((r) => typeof r.service_headway_minutes === "number");
  const headway = sum(t.map((r) => r.service_headway_minutes));
  const trips = sum(t.map((r) => r.daily_trips));
  const housingLinked = b.housing.filter((h) => h.nearest_transport_stop_id).length;

  const byLocality = new Map<string, { stops: number; headway: number; n: number }>();
  for (const r of t) {
    const key = r.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { stops: 0, headway: 0, n: 0 };
    cur.stops += 1;
    if (typeof r.service_headway_minutes === "number") {
      cur.headway += r.service_headway_minutes;
      cur.n += 1;
    }
    byLocality.set(key, cur);
  }

  return {
    id: "mobility",
    title: "Mobility and access",
    question: "Can people reach work and services from where they live?",
    sample: sampleNote(t.length, byLocality.size, "transport stop records"),
    indicators: [
      {
        id: "routes",
        label: "Available transport routes",
        value: num(routes.size),
        basis: `Distinct route identifiers across ${num(t.length)} stop records · modes ${[...new Set(t.map((r) => r.mode).filter(Boolean))].join(", ") || "not stated"}`,
        period: periodsOf(t),
        nature: "reported",
        drills: topRecords(t.map((r) => r.transport_stop_id), (id) => id),
      },
      {
        id: "stops",
        label: "Transport stops",
        value: num(t.length),
        basis: `${num(t.filter((r) => r.actual_stop_or_route).length)} actual stops. The rest are illustrative anchors`,
        period: periodsOf(t),
        nature: "reported",
        drills: [{ kind: "route", to: "/localities", label: "Stops by locality" }],
      },
      {
        id: "frequency",
        label: "Service frequency",
        value: headwayRecords.length
          ? `${decimal(headway / headwayRecords.length)} min headway`
          : "Not available",
        basis: `Mean headway across ${num(headwayRecords.length)} stop records · ${num(trips)} daily trips recorded`,
        period: periodsOf(t),
        nature: "observed",
        drills: [{ kind: "route", to: "/localities", label: "Frequency by locality" }],
      },
      {
        id: "housing-transport",
        label: "Housing-to-transport relationships",
        value: `${num(housingLinked)} of ${num(b.housing.length)}`,
        basis: "Housing records carrying a nearest transport stop identifier",
        period: periodsOf(b.housing),
        nature: "reported",
        drills: [{ kind: "route", to: "/data-layer", label: "Trace housing links" }],
      },
    ],
    variation: {
      measure: "Transport stops recorded in the locality",
      note: "Localities with the fewest recorded stops appear first.",
      rows: [...byLocality.entries()]
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: num(v.stops),
          detail: v.n
            ? `Mean headway ${decimal(v.headway / v.n)} min across ${num(v.n)} records`
            : "Headway not recorded",
          rank: v.stops,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

function livelihoodDomain(b: FourCityBundle): CitizenDomain {
  const liv = b.livelihoods;
  const vend = b.streetVendors;
  const shg = sum(liv.map((l) => l.shg_count));
  const enterprises = sum(liv.map((l) => l.enterprise_count));
  const training = sum(liv.map((l) => l.training_participants));
  const applications = sum(liv.map((l) => l.loan_applications));
  const sanctions = sum(liv.map((l) => l.loan_sanctions));
  const disbursements = sum(liv.map((l) => l.loan_disbursements));
  const surveyed = sum(vend.map((v) => v.surveyed_vendors));
  const vendorSanctioned = sum(vend.map((v) => v.sanctioned));
  const vendorDisbursed = sum(vend.map((v) => v.disbursed));
  const digital = sum(vend.map((v) => v.digital_active));
  const marketIds = new Set(
    [
      ...liv.map((l) => l.linked_market_asset_id),
      ...vend.map((v) => v.market_asset_id),
    ].filter(Boolean) as string[],
  );
  const marketAssets = b.assets.filter((a) => marketIds.has(a.asset_id));

  const byLocality = new Map<string, { sanc: number; disb: number; shg: number }>();
  for (const l of liv) {
    const key = l.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { sanc: 0, disb: 0, shg: 0 };
    cur.sanc += l.loan_sanctions ?? 0;
    cur.disb += l.loan_disbursements ?? 0;
    cur.shg += l.shg_count ?? 0;
    byLocality.set(key, cur);
  }

  return {
    id: "livelihoods",
    title: "Livelihoods and economic opportunity",
    question: "Does support reach the people who applied for it?",
    sample: sampleNote(liv.length + vend.length, byLocality.size, "livelihood and vendor records"),
    indicators: [
      {
        id: "participation",
        label: "Livelihood scheme participation",
        value: num(shg),
        basis: `${num(shg)} self-help groups, ${num(enterprises)} enterprises, ${num(training)} training participants in ${num(liv.length)} records`,
        period: periodsOf(liv),
        nature: "reported",
        drills: topRecords(liv.map((l) => l.livelihood_id), (id) => id),
      },
      {
        id: "loans",
        label: "Loan sanction and disbursement",
        value: ratio(disbursements, sanctions),
        basis: `${num(applications)} applications, ${num(sanctions)} sanctioned, ${num(disbursements)} disbursed`,
        period: periodsOf(liv),
        nature: "observed",
        drills: [
          { kind: "route", to: "/livelihoods", label: "Livelihood and mobility intelligence" },
          { kind: "route", to: "/localities", label: "Disbursement by locality" },
        ],
      },
      {
        id: "vendors",
        label: "Street-vendor support",
        value: ratio(vendorDisbursed, vendorSanctioned),
        basis: `${num(surveyed)} vendors surveyed, ${num(vendorSanctioned)} sanctioned, ${num(vendorDisbursed)} disbursed, ${num(digital)} digitally active`,
        period: periodsOf(vend),
        nature: "observed",
        drills: topRecords(vend.map((v) => v.vendor_aggregate_id), (id) => id),
      },
      {
        id: "markets",
        label: "Municipal market infrastructure",
        value: num(marketAssets.length),
        basis: `Market assets referenced by livelihood and vendor records, joined by asset identifier`,
        period: periodsOf(b.assets),
        nature: "reported",
        drills: [
          { kind: "route", to: "/assets", label: "Asset register" },
          ...topRecords([...marketIds], (id) => id),
        ],
      },
    ],
    variation: {
      measure: "Loans disbursed as a share of loans sanctioned",
      note: "Localities where the smallest share of sanctioned loans reached people appear first.",
      rows: [...byLocality.entries()]
        .filter(([, v]) => v.sanc > 0)
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: ratio(v.disb, v.sanc),
          detail: `${num(v.disb)} of ${num(v.sanc)} sanctioned disbursed · ${num(v.shg)} self-help groups`,
          rank: v.disb / v.sanc,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

function responsivenessDomain(b: FourCityBundle): CitizenDomain {
  const srv = b.serviceObservations;
  const grv = b.grievances;
  const received = sum(srv.map((s) => s.applications_received));
  const resolved = sum(srv.map((s) => s.applications_resolved));
  const slaWeighted = sum(
    srv.map((s) => ((s.sla_compliance_pct ?? 0) / 100) * (s.applications_received ?? 0)),
  );
  const complaints = sum(grv.map((g) => g.complaint_count));
  const repeats = sum(grv.map((g) => g.repeat_complaints));
  const resolutionRecords = grv.filter((g) => typeof g.average_resolution_hours === "number");
  const resolutionHours = sum(grv.map((g) => g.average_resolution_hours));

  const byLocality = new Map<string, { recv: number; sla: number; complaints: number }>();
  for (const s of srv) {
    const key = s.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { recv: 0, sla: 0, complaints: 0 };
    cur.recv += s.applications_received ?? 0;
    cur.sla += ((s.sla_compliance_pct ?? 0) / 100) * (s.applications_received ?? 0);
    byLocality.set(key, cur);
  }
  for (const g of grv) {
    const key = g.locality_id ?? "unassigned";
    const cur = byLocality.get(key) ?? { recv: 0, sla: 0, complaints: 0 };
    cur.complaints += g.complaint_count ?? 0;
    byLocality.set(key, cur);
  }

  return {
    id: "responsiveness",
    title: "Responsive municipal services",
    question: "When a citizen asks for something, does the city respond in time?",
    sample: sampleNote(srv.length + grv.length, byLocality.size, "service and complaint records"),
    indicators: [
      {
        id: "requests",
        label: "Service requests",
        value: num(received),
        basis: `${num(received)} applications received across ${num(srv.length)} observations covering ${[...new Set(srv.map((s) => s.service_type))].length} service types`,
        period: periodsOf(srv),
        nature: "observed",
        drills: topRecords(srv.map((s) => s.service_observation_id), (id) => id),
      },
      {
        id: "resolution",
        label: "Complaint resolution",
        value: ratio(resolved, received),
        basis: `${num(resolved)} resolved of ${num(received)} received · ${num(complaints)} complaints recorded separately`,
        period: periodsOf(srv),
        nature: "observed",
        drills: [{ kind: "route", to: "/localities", label: "Resolution by locality" }],
      },
      {
        id: "repeat",
        label: "Repeat complaints",
        value: ratio(repeats, complaints),
        basis: `${num(repeats)} repeat of ${num(complaints)} complaints in ${num(grv.length)} aggregates`,
        period: periodsOf(grv),
        nature: "observed",
        drills: topRecords(grv.map((g) => g.complaint_aggregate_id), (id) => id),
      },
      {
        id: "sla",
        label: "SLA compliance",
        value: ratio(slaWeighted, received),
        basis: `Compliance weighted by applications received · mean complaint resolution ${
          resolutionRecords.length ? `${decimal(resolutionHours / resolutionRecords.length)} hours` : "not recorded"
        }`,
        period: periodsOf(srv),
        nature: "observed",
        drills: [{ kind: "route", to: "/data-layer", label: "Trace service records" }],
      },
    ],
    variation: {
      measure: "SLA compliance weighted by applications received",
      note: "Localities with the weakest weighted compliance appear first.",
      rows: [...byLocality.entries()]
        .filter(([, v]) => v.recv > 0)
        .map(([id, v]) => ({
          locality_id: id,
          name: localityName(b.localities, id),
          value: ratio(v.sla, v.recv),
          detail: `${num(Math.round(v.recv))} applications · ${num(v.complaints)} complaints`,
          rank: v.sla / v.recv,
        }))
        .sort((a, z) => a.rank - z.rank),
    },
  };
}

/** The six citizen domains for a city, in the order they should be read. */
export function citizenDomains(cityId: string): CitizenDomain[] {
  const bundle = fourCityBundle(cityId);
  if (!bundle) return [];
  return [
    housingDomain(bundle),
    waterDomain(bundle),
    cleanlinessDomain(bundle),
    mobilityDomain(bundle),
    livelihoodDomain(bundle),
    responsivenessDomain(bundle),
  ];
}
