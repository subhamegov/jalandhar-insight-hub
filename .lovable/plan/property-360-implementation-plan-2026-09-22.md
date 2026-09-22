# Property 360 implementation plan

## Goal
Turn each existing property aggregate into a calm, geo-aware civic dossier while preserving canonical records, provenance, city isolation, maps, and UX4G styling.

## What will change

### 1. Shared Property 360 intelligence layer
- Build one typed selector for a property and its city bundle.
- Keep direct links primary: water and sewerage records, service areas, housing, grievances, service observations, projects, assets, finance, and declared graph relationships.
- Add deterministic, presentation-layer enrichment from the same locality and nearest synthetic coordinates. Every inferred relationship will carry city ID, locality ID, related entity ID, relationship type, map precision, synthetic flag, distance where meaningful, and a provenance note.
- Never treat proximity as beneficiary evidence. Never join across cities or by display name alone.

### 2. Geography and confidence
- Use a property point only if the supplied record has one.
- Otherwise use a linked building anchor if one exists, then the supplied locality anchor.
- Label the displayed precision as `Exact synthetic property point`, `Approximate building anchor`, or `Approximate locality context`.
- Show service areas, projects, assets, markets, vendors, transport, and other ecosystem points only when supported by canonical records.

### 3. Property 360 page
- Keep `/records/$recordId` and render Property 360 only when the record kind is `property_aggregate`; all other record types retain the existing record view.
- Add a compact catalogue header with a modest isometric home illustration, property metadata, geography confidence, and only data-supported status chips.
- Add page-local chapter navigation for Overview, Housing, Water and sewerage, Sanitation and waste, Municipal finance, Services and grievances, Livelihoods and inclusion, Mission linkages, Projects and assets, Surrounding urban ecosystem, and Evidence and data quality.
- Build the overview as a catalogue card with a factual abstract, service-readiness summary, mission strip, and a restrained interactive map with layer toggles.
- Keep every raw field under a secondary `Values exactly as supplied` section.

### 4. Mission and ecosystem relationships
- Use only the approved labels: Directly linked, Served by, Falls within, Related through locality, Nearby, No known linkage, and Not available.
- Cover PMAY-U, AMRUT, SBM-U, NUDM / UPYOG, PM SVANidhi, DAY-NULM, Smart Cities, CITIIS, UCF, and available transport programmes.
- Show linked records, plain-language meaning, evidence basis, and whether the relationship is direct or enriched.
- Present livelihood, public-service, and mobility context as concise rows rather than dense tables or repeated cards.

### 5. Trust and navigation
- Keep synthetic classification, observation date, verification status, evidence basis, missing links, and relationship confidence visible.
- Send provenance links with a validated return path containing the selected city, property, and section.
- Keep direct URLs functional and preserve browser back/forward behavior.

### 6. Six-city behavior
- Surat, Ahmedabad, Thane, Guwahati, and Karnal use their existing property aggregates.
- Jalandhar currently has no property aggregate records. Its city experience will show a contextual work-in-progress state instead of fabricated property data; no synthetic Jalandhar property will be mixed into its government-source dataset.

### 7. Validation
- Verify representative properties from every city with property data, plus Jalandhar's honest unavailable state.
- Test city mismatch handling, deep links, return-to-Property-360 provenance, map layers, local navigation, missing values, long labels, narrow screens, and page-level overflow.
- Confirm the current build remains clean and other record kinds are unchanged.

## Technical details
- Add a client-safe Property 360 view-model module beside the existing four-city data selectors.
- Add focused reusable UI components and one locally generated transparent house illustration asset.
- Reuse `Panel`, `Field`, `Breadcrumbs`, `ReturnLink`, the existing Button component, `ClientOnly`, `PointMap`, city context, canonical entity lookup, and current UX4G semantic tokens.
- Extend the point map only where required for typed layers and restrained marker distinctions; preserve OpenStreetMap attribution and existing geography safeguards.
