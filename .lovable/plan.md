# Add Karnal as the sixth city

## Scope
- Register `CITY-KARNAL` for Karnal, Haryana, with Municipal Corporation Karnal, canonical centre coordinates, and a clearly labelled orientation extent. Keep Surat as the default.
- Add Karnal to city selectors, national and Haryana views, comparison, integrity checks, identity context, maps, and all existing city routes.
- Reuse the shared synthetic-city model and existing raw products. Do not create a Karnal-only dashboard, schema, or design.

## Deterministic Karnal dataset
- Append Karnal records to the existing shared JSON and GeoJSON products with stable IDs, canonical links, null handling, periods, units, classifications, and synthetic provenance.
- Create 10 to 12 genuine locality references and up to 20 prototype ward references. Use illustrative points only. Do not invent ward or municipal polygons.
- Create exactly 32 projects, 64 assets, 60 property aggregates, 160 grievance aggregate records, 240 service observation records, 48 finance records, 16 interventions, 12 to 16 decision signals, and 12 outcome-supporting observations.
- Preserve the six required anchor projects and their requested values exactly. Connect drainage, water reliability, waste, road safety, lighting, and property/service-delivery scenarios across missions, projects, assets, finance, grievances, observations, signals, interventions, agencies, and source records.
- Add project components, service areas, housing, water/sewerage, sanitation, livelihoods, vendors, transport, comparison, briefing, source, quality, manifest, and validation records needed by existing views.
- Treat the requested complaint and service-event counts through the existing `GrievanceAggregate` and `ServiceObservation` contracts. No personal records or parallel event model will be introduced.

## Application integration
- Extend the city and dataset registries without changing `DEFAULT_CITY_ID` from `CITY-SURAT`.
- Make comparison and integrity city lists data-driven so Karnal is included without future fixed-list leakage.
- Fix project and asset registers and project detail lookup where legacy Jalandhar selectors currently block synthetic-city drill-through.
- Keep national map markers registry-driven and city maps based only on canonical Karnal points.
- Add Municipal Corporation Karnal and District Administration Karnal to the authority registry using neutral fallback icons. Record official source pages. Do not use a Smart City mark or unverified municipal seal.
- Replace outdated “four-city” and fixed city-count interface copy where it describes current coverage.

## Validation
- Run existing validation and all 101 integrity checks after extending them to Karnal.
- Verify exact requested counts, unique IDs, foreign keys, city isolation, chronology, finance ordering and reconciliation, funnel ordering, provenance, coordinates, map visibility, and anchor-project values.
- Verify fresh Surat landing, Karnal selection, Haryana navigation, national marker navigation, overview, locality, project, asset, signal, intervention, investment, outcomes, evidence, data quality, and comparison routes.
- Check desktop and mobile behavior, map interactions, accessibility, console errors, and regressions across the five existing cities.

## Delivery report
- Report changed files, generated counts, key canonical links, map-visible records, identity handling and source URLs, geography limitations, validation results, and unresolved issues.
