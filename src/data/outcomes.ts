// Outcome indicators for Jalandhar city systems.
//
// Rules followed here:
//  - No value is invented. Every indicator carries `value: null` until a
//    verified government source is attached, and the UI renders "Not available".
//  - Every indicator exposes its intended source and the date it was last
//    updated, so a reader can always see how old the number is.
//  - Time series are empty arrays where no published series exists. The UI
//    must not draw a trend from a single point or from nothing.

import type { CitySystem } from "./types";

export interface Indicator {
  id: string;
  label: string;
  unit: string | null;
  /** Verified value. Null means no verified source is attached yet. */
  value: number | null;
  /** Date the value refers to. */
  as_of: string | null;
  /** Agency expected to publish or having published the value. */
  source: string | null;
  source_url: string | null;
  /** What the indicator measures, in simple English. */
  definition: string;
  /** Construction output vs. service performance. */
  measure_type: "construction" | "service" | "finance";
}

export interface SeriesPoint {
  period: string;
  value: number | null;
}

export interface IndicatorSeries {
  id: string;
  label: string;
  unit: string | null;
  source: string | null;
  points: SeriesPoint[];
}

export interface OutcomeDomain {
  id: string;
  label: string;
  headline_question: string;
  /** City systems whose projects contribute to this domain. */
  sectors: CitySystem[];
  indicators: Indicator[];
  /** Layer ids on the City Map that show this domain. */
  map_layers: string[];
  /** Programmes that fund work in this domain (cross-scheme analysis). */
  related_programmes: string[];
  charts: IndicatorSeries[];
}

function ind(
  id: string,
  label: string,
  unit: string | null,
  definition: string,
  measure_type: Indicator["measure_type"],
  source: string | null,
): Indicator {
  return {
    id,
    label,
    unit,
    value: null,
    as_of: null,
    source,
    source_url: null,
    definition,
    measure_type,
  };
}

export const outcomeDomains: OutcomeDomain[] = [
  {
    id: "water",
    label: "Water",
    headline_question:
      "Is Jalandhar actually moving from groundwater dependence to reliable surface water?",
    sectors: ["Water"],
    map_layers: [
      "canals",
      "water_works",
      "water_towers",
      "transmission_mains",
      "tube_wells",
      "wards",
    ],
    related_programmes: [
      "AMRUT",
      "AMRUT 2.0",
      "Smart Cities Mission",
      "Punjab Urban Environment Improvement Programme",
    ],
    charts: [],
    indicators: [
      ind(
        "treatment_capacity_MLD",
        "Treatment capacity",
        "MLD",
        "Installed surface water treatment capacity commissioned and available.",
        "construction",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "surface_water_supplied_MLD",
        "Surface water supplied",
        "MLD",
        "Volume of treated surface water actually delivered into the distribution network.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "groundwater_extraction_dependency",
        "Groundwater dependence",
        "% of supply",
        "Share of city water supply still drawn from tube wells.",
        "service",
        "Central Ground Water Board",
      ),
      ind(
        "population_with_piped_water",
        "Population with piped water",
        "persons",
        "Residents with a working piped household connection.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "hours_of_supply",
        "Hours of supply",
        "hours per day",
        "Average hours of pressurised supply per day.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "non_revenue_water",
        "Non revenue water",
        "%",
        "Water produced but not billed, including leakage and unmetered use.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "reservoirs_completed",
        "Reservoirs completed",
        "number",
        "Service reservoirs handed over out of those sanctioned.",
        "construction",
        "Punjab Water Supply and Sewerage Board",
      ),
      ind(
        "transmission_network_completed",
        "Transmission network completed",
        "km",
        "Trunk transmission mains laid and tested.",
        "construction",
        "Punjab Water Supply and Sewerage Board",
      ),
      ind(
        "project_delay",
        "Project delay",
        "days",
        "Delay against the latest approved completion date.",
        "construction",
        "Implementing agency",
      ),
    ],
  },
  {
    id: "used_water",
    label: "Used Water",
    headline_question:
      "How much wastewater is generated, captured, treated to standard and actually reused?",
    sectors: ["Used Water"],
    map_layers: ["sewer_network", "stps", "drains", "wards"],
    related_programmes: [
      "AMRUT",
      "AMRUT 2.0",
      "Punjab Urban Environment Improvement Programme",
      "Punjab Municipal Services",
    ],
    charts: [],
    indicators: [
      ind(
        "wastewater_generated_MLD",
        "Wastewater generated",
        "MLD",
        "Estimated sewage generated across the city.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "sewerage_collected_MLD",
        "Sewage collected",
        "MLD",
        "Sewage actually captured by the sewer network and reaching a plant.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "treatment_capacity_MLD",
        "Treatment capacity",
        "MLD",
        "Commissioned treatment capacity at city sewage treatment plants.",
        "construction",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "wastewater_treated_MLD",
        "Wastewater treated",
        "MLD",
        "Volume treated, as against installed capacity.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "wastewater_reused_MLD",
        "Wastewater reused",
        "MLD",
        "Treated water supplied for irrigation, industry or other reuse.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "treatment_compliance",
        "Treatment compliance",
        "% of samples",
        "Share of monitored outlet samples meeting discharge standards.",
        "service",
        "Punjab Pollution Control Board",
      ),
    ],
  },
  {
    id: "solid_waste",
    label: "Solid Waste",
    headline_question: "Is the total stock of waste at Wariana decreasing every month?",
    sectors: ["Solid Waste"],
    map_layers: ["landfill", "waste_transfer", "recycling", "cnd_waste"],
    related_programmes: [
      "Swachh Bharat Mission Urban",
      "Smart Cities Mission",
      "National Clean Air Programme",
      "Punjab Local Government projects",
    ],
    charts: [
      {
        id: "legacy_waste_stock_over_time",
        label: "Legacy waste stock at Wariana over time",
        unit: "MT",
        source: "Municipal Corporation Jalandhar monthly remediation report",
        points: [],
      },
      {
        id: "daily_generation_vs_processing",
        label: "Daily waste generated against waste processed",
        unit: "TPD",
        source: "Municipal Corporation Jalandhar",
        points: [],
      },
      {
        id: "remediation_progress",
        label: "Legacy waste remediated against total stock",
        unit: "MT",
        source: "Swachh Bharat Mission Urban progress report",
        points: [],
      },
    ],
    indicators: [
      ind(
        "waste_generated_TPD",
        "Waste generated",
        "TPD",
        "Municipal solid waste generated across the city each day.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "waste_collected_TPD",
        "Waste collected",
        "TPD",
        "Waste lifted through door to door and secondary collection.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "waste_processed_TPD",
        "Waste processed",
        "TPD",
        "Waste treated at a processing facility rather than dumped.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "legacy_waste_stock_MT",
        "Legacy waste stock",
        "MT",
        "Waste remaining in the Wariana dump at the last survey.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "legacy_waste_remediated_MT",
        "Legacy waste remediated",
        "MT",
        "Waste bio mined and cleared to date.",
        "construction",
        "Swachh Bharat Mission Urban",
      ),
      ind(
        "incoming_waste_to_Wariana_TPD",
        "Incoming waste to Wariana",
        "TPD",
        "Fresh waste still being tipped at the site each day.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "reclaimed_land_area",
        "Reclaimed land area",
        "acres",
        "Land freed and certified fit for reuse.",
        "construction",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "fires_reported",
        "Fires reported",
        "incidents",
        "Fire incidents recorded at the site.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "leachate_compliance",
        "Leachate compliance",
        "% of samples",
        "Leachate samples within permitted limits.",
        "service",
        "Punjab Pollution Control Board",
      ),
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    headline_question:
      "Are transport investments increasing access to employment and essential services?",
    sectors: ["Mobility", "Roads"],
    map_layers: [
      "ebus_routes",
      "bus_stops",
      "bus_stations",
      "railway_stations",
      "hospitals",
      "education",
      "markets",
    ],
    related_programmes: [
      "PM eBus Sewa",
      "Smart Cities Mission",
      "National Clean Air Programme",
      "Punjab PWD projects",
      "Amrit Bharat Station Scheme",
    ],
    charts: [],
    indicators: [
      ind(
        "sanctioned_e_buses",
        "Sanctioned e buses",
        "buses",
        "Buses approved under sanction orders.",
        "construction",
        "Ministry of Housing and Urban Affairs",
      ),
      ind(
        "operational_e_buses",
        "Operational e buses",
        "buses",
        "Buses actually running in daily service.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "active_routes",
        "Active routes",
        "routes",
        "Routes in daily operation.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "daily_ridership",
        "Daily ridership",
        "passengers per day",
        "Passenger trips carried each day.",
        "service",
        "Operator returns",
      ),
      ind(
        "population_within_500m_of_route",
        "Population within 500 m of a route",
        "persons",
        "Residents living within a five minute walk of a bus route.",
        "service",
        "Census and route alignment analysis",
      ),
      ind(
        "jobs_within_500m_of_route",
        "Jobs within 500 m of a route",
        "jobs",
        "Workplaces within a five minute walk of a bus route.",
        "service",
        "Economic Census and route alignment analysis",
      ),
      ind(
        "average_route_frequency",
        "Average route frequency",
        "minutes",
        "Average waiting time between buses on a route.",
        "service",
        "Operator returns",
      ),
      ind(
        "depot_readiness",
        "Depot readiness",
        "% complete",
        "Depot civil and electrical works completed.",
        "construction",
        "Implementing agency",
      ),
      ind(
        "charging_readiness",
        "Charging readiness",
        "chargers commissioned",
        "Charging points energised and tested.",
        "construction",
        "Implementing agency",
      ),
    ],
  },
  {
    id: "air_quality",
    label: "Air Quality",
    headline_question:
      "Are public investments addressing the locations and sources responsible for pollution?",
    sectors: ["Air Quality", "Environment"],
    map_layers: ["air_quality", "landfill", "parks", "roads"],
    related_programmes: [
      "National Clean Air Programme",
      "Swachh Bharat Mission Urban",
      "Smart Cities Mission",
      "Punjab Local Government projects",
    ],
    charts: [],
    indicators: [
      ind(
        "PM10",
        "PM10 annual average",
        "µg/m³",
        "Annual average coarse particulate concentration.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "PM2_5",
        "PM2.5 annual average",
        "µg/m³",
        "Annual average fine particulate concentration.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "NCAP_funding",
        "NCAP funding",
        "rupees crore",
        "Funds released to the city under the National Clean Air Programme.",
        "finance",
        "Ministry of Environment, Forest and Climate Change",
      ),
      ind(
        "road_dust_interventions",
        "Road dust interventions",
        "number",
        "Paving, verge treatment and dust control works completed.",
        "construction",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "mechanical_sweeping_coverage",
        "Mechanical sweeping coverage",
        "km per day",
        "Road length swept mechanically each day.",
        "service",
        "Municipal Corporation Jalandhar",
      ),
      ind(
        "waste_burning_hotspots",
        "Waste burning hotspots",
        "locations",
        "Locations with repeated open burning.",
        "service",
        "Punjab Pollution Control Board",
      ),
      ind(
        "green_cover_interventions",
        "Green cover interventions",
        "number",
        "Plantation and green buffer works completed.",
        "construction",
        "Municipal Corporation Jalandhar",
      ),
    ],
  },
];

/** Programmes seen together within a domain, for cross scheme analysis. */
export const crossSchemeGroups = outcomeDomains.map((d) => ({
  id: d.id,
  label: d.label,
  programmes: d.related_programmes,
}));
