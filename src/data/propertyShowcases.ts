import type { CityId } from "@/data/cities/registry";

export interface PropertyShowcase {
  cityId: CityId;
  propertyId: string;
  title: string;
  description: string;
  storyline: string;
  syntheticProperty: boolean;
}

export const PROPERTY_SHOWCASES: Record<CityId, PropertyShowcase> = {
  "CITY-SURAT": {
    cityId: "CITY-SURAT",
    propertyId: "PROP-SURAT-0110",
    title: "Tax, water, waste and livelihoods",
    description: "Explore how property tax, utility connections, waste collection and livelihood activity connect around one property.",
    storyline: "Property tax, water connection, waste collection and same-locality street-vending and livelihood context.",
    syntheticProperty: false,
  },
  "CITY-THANE": {
    cityId: "CITY-THANE",
    propertyId: "PROP-THANE-0111",
    title: "Housing and service readiness",
    description: "Explore how housing readiness, water, sewerage infrastructure and grievances connect around one property.",
    storyline: "Housing service readiness, water and sewerage dependencies, infrastructure and grievance evidence.",
    syntheticProperty: false,
  },
  "CITY-AHMEDABAD": {
    cityId: "CITY-AHMEDABAD",
    propertyId: "PROP-AHMEDABAD-0028",
    title: "Services, mobility and public space",
    description: "Explore municipal services alongside same-locality mobility and public-space investment context.",
    storyline: "Property records, municipal services, transport context and public-space investment in the same locality.",
    syntheticProperty: false,
  },
  "CITY-GUWAHATI": {
    cityId: "CITY-GUWAHATI",
    propertyId: "PROP-GUWAHATI-0038",
    title: "Drainage and sanitation context",
    description: "Explore drainage investment, sanitation conditions and locality-level service evidence around one property.",
    storyline: "Drainage and sanitation context, infrastructure relationships and locality-level service conditions.",
    syntheticProperty: false,
  },
  "CITY-JALANDHAR": {
    cityId: "CITY-JALANDHAR",
    propertyId: "DEMO-PROP-JALANDHAR-001",
    title: "Project evidence and responsibility",
    description: "Explore an illustrative property context around a water project, its infrastructure and implementation responsibility.",
    storyline: "Evidence-backed project records, infrastructure and implementation responsibility, with property services left unavailable.",
    syntheticProperty: true,
  },
  "CITY-KARNAL": {
    cityId: "CITY-KARNAL",
    propertyId: "PROP-KARNAL-0011",
    title: "Water, drainage and public lighting",
    description: "Explore synthetic water, drainage, streetlight and municipal service relationships around one property.",
    storyline: "Synthetic water, drainage, public-lighting and municipal service relationships.",
    syntheticProperty: false,
  },
};

export function propertyShowcase(cityId: CityId): PropertyShowcase {
  return PROPERTY_SHOWCASES[cityId];
}