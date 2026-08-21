# Jalandhar City Intelligence — Data Model

This document describes the domain model used by the Jalandhar City Intelligence application. It is intended for senior government users, data stewards and developers who need to understand how project, asset, scheme and evidence records are structured, linked and audited.

## Design principles

1. **No invented values.** Every financial figure, date, progress percentage and operational status must be traceable to a government source. When a value is not yet verified it is stored as `null` and rendered as **"Not available"**.
2. **Evidence before inference.** The system records conflicts between sources, but never fabricates a "true" value from incomplete evidence.
3. **Construction is not service.** A project marked `completed` is not treated as `operational`. Service outcomes are recorded separately and verified independently.
4. **Money follows funding components.** A physical project is recorded once, even when several schemes or ministries contribute funds. Financial flows are stored in `FundingComponent` records.
5. **Source and date on every record.** Each data point carries a `source_agency`, `source_url`, `source_date` and `last_verified` so readers can judge freshness and authority.

## Enumerations

### ProjectStatus

Lifecycle stages a project can be in.

| Value | Meaning |
| --- | --- |
| `announced` | Publicly announced but not yet sanctioned. |
| `proposed` | Proposed in a plan or DPR stage. |
| `sanctioned` | Formal sanction order exists. |
| `tendered` | Tender published. |
| `awarded` | Contract awarded. |
| `under_construction` | Physical works underway. |
| `substantially_complete` | Main works finished; final completion pending. |
| `completed` | Construction formally complete. |
| `commissioned` | Trial / commissioning in progress. |
| `operational` | Asset delivering service. |
| `stalled` | Work stopped or long delayed. |
| `cancelled` | Cancelled. |
| `unknown` | Status cannot be established. |

### EvidenceQuality

| Value | Meaning |
| --- | --- |
| `official_current` | Current official government record (sanction order, completion certificate, etc.). |
| `official_historical` | Older official record, possibly superseded. |
| `parliamentary_record` | Parliament question, committee report or budget document. |
| `government_tender` | Published tender or contract document. |
| `regulator_or_court` | Order or filing from a regulator, tribunal or court. |
| `government_report` | Published government progress or audit report. |
| `credible_media` | Reputable media report, not a government source. |
| `secondary_source` | Summary, academic or third-party compilation. |
| `unverified` | No verified source attached. |

### CitySystem

The city systems that projects and assets belong to:

- `Water`
- `Used Water`
- `Solid Waste`
- `Mobility`
- `Roads`
- `Air Quality`
- `Public Realm`
- `Environment`
- `Health Infrastructure`

### GovernmentLevel

- `central`
- `state`
- `city`

### Priority

- `critical`
- `high`
- `medium`
- `low`

### GeographyType

- `site` — a single location (STP, depot, station).
- `network` — linear infrastructure (pipeline, sewer line, bus route).
- `site_and_network` — both (treatment plant plus network).
- `city_wide` — benefit or scope covers the whole city.

### ConflictSeverity

- `material_conflict` — two sources disagree on a fact that affects decisions.
- `review_required` — missing or stale data that needs officer review.
- `informational` — a gap or inconsistency that should be noted but is not blocking.

## Core entities

### Project

A physical intervention in the city. Stored in `src/data/jalandhar.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `project_id` | `string` | Stable identifier, e.g. `PRJ-JAL-001`. |
| `project_name` | `string` | Official or commonly used name. |
| `short_description` | `string \| null` | One-line description of the intervention. |
| `sector` | `CitySystem \| null` | City system the project belongs to. |
| `asset_type` | `string \| null` | Type of asset being created (STP, bus depot, etc.). |
| `scheme` | `string \| null` | Primary scheme under which the project is taken up. |
| `funding_programme` | `string \| null` | Additional funding programme, if known. |
| `central_ministry` | `string \| null` | sponsoring central ministry. |
| `state_department` | `string \| null` | sponsoring state department. |
| `implementing_agency` | `string \| null` | Agency executing the project. |
| `owning_agency` | `string \| null` | Agency that will own the asset. |
| `contractor` | `string \| null` | Executing contractor. |
| `consultant` | `string \| null` | Technical consultant, if any. |
| `sanctioned_cost` | `number \| null` | Sanctioned cost in INR crore. |
| `contracted_cost` | `number \| null` | Contracted cost in INR crore. |
| `expenditure` | `number \| null` | Expenditure incurred in INR crore. |
| `funding_central` | `number \| null` | Central share in INR crore. |
| `funding_state` | `number \| null` | State share in INR crore. |
| `funding_ulb` | `number \| null` | ULB share in INR crore. |
| `announcement_date` | `string \| null` | ISO date of announcement. |
| `sanction_date` | `string \| null` | ISO date of sanction. |
| `tender_date` | `string \| null` | ISO date of tender publication. |
| `award_date` | `string \| null` | ISO date of contract award. |
| `planned_start_date` | `string \| null` | Approved start date. |
| `planned_end_date` | `string \| null` | Approved completion date. |
| `actual_start_date` | `string \| null` | Actual start date. |
| `actual_completion_date` | `string \| null` | Actual completion date. |
| `status` | `ProjectStatus` | Current recorded status. |
| `physical_progress_percentage` | `number \| null` | Physical progress (0–100). |
| `financial_progress_percentage` | `number \| null` | Financial progress (0–100). |
| `operational_status` | `string \| null` | Independent service status. |
| `delay_days` | `number \| null` | Delay against approved completion date. |
| `delay_reason` | `string \| null` | Recorded reason for delay. |
| `latitude` | `number \| null` | Approximate latitude. |
| `longitude` | `number \| null` | Approximate longitude. |
| `geometry` | `string \| null` | WKT or GeoJSON geometry when available. |
| `ward` | `string \| null` | Ward, if recorded. |
| `locality` | `string \| null` | Locality or landmark. |
| `source_url` | `string \| null` | URL of primary source. |
| `source_agency` | `string \| null` | Agency that provided the source. |
| `source_date` | `string \| null` | Date of the source document. |
| `evidence_quality` | `EvidenceQuality` | Quality of attached evidence. |
| `last_verified` | `string \| null` | Date the record was last verified. |
| `notes` | `string \| null` | Free-text notes. |
| `conflict_note` | `string \| null` | Known source disagreement. |
| `record_updated` | `string \| null` | Date the record was last changed in this system. |
| `geography_type` | `GeographyType` | Whether the intervention is a site, network or both. |
| `priority` | `Priority` | Attention priority. |
| `progress_as_of` | `string \| null` | Date the progress figure refers to. |
| `key_attributes` | `KeyAttribute[]` | Known physical attributes (capacity, fleet size, etc.). |
| `cost_records` | `ReportedValue[]` | Cost figures reported by different sources. |
| `completion_date_records` | `ReportedValue[]` | Completion dates reported by different sources. |
| `status_records` | `ReportedValue[]` | Statuses reported by different sources. |

### Asset

A physical city asset that already exists or is created by a project. Stored in `src/data/jalandhar.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `asset_id` | `string` | Stable identifier, e.g. `AST-JAL-001`. |
| `asset_name` | `string` | Asset name. |
| `asset_type` | `string \| null` | Type of asset. |
| `sector` | `CitySystem \| null` | City system. |
| `owning_agency` | `string \| null` | Owning agency. |
| `operating_agency` | `string \| null` | Day-to-day operator. |
| `commissioning_date` | `string \| null` | Date commissioned. |
| `operational_status` | `string \| null` | Current operational status. |
| `capacity` | `number \| null` | Capacity number. |
| `capacity_unit` | `string \| null` | Capacity unit (MLD, TPD, buses, etc.). |
| `latitude` | `number \| null` | Latitude. |
| `longitude` | `number \| null` | Longitude. |
| `geometry` | `string \| null` | Geometry when available. |
| `ward` | `string \| null` | Ward. |
| `related_projects` | `string[]` | `project_id` values that created or affect this asset. |
| `data_source` | `string \| null` | Source agency. |
| `last_verified` | `string \| null` | Verification date. |

### Scheme

A central, state or city scheme that funds projects. Stored in `src/data/jalandhar.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `scheme_id` | `string` | Stable identifier, e.g. `SCH-001`. |
| `scheme_name` | `string` | Scheme name. |
| `ministry` | `string \| null` | sponsoring ministry. |
| `state_or_central` | `"central" \| "state" \| "joint" \| null` | Level of scheme. |
| `objective` | `string \| null` | Scheme objective. |
| `start_year` | `number \| null` | Start year. |
| `end_year` | `number \| null` | End year. |
| `total_jalandhar_projects` | `number \| null` | Total projects in Jalandhar under the scheme. |
| `jalandhar_sanctioned_value` | `number \| null` | Total sanctioned value in Jalandhar, INR crore. |
| `source_url` | `string \| null` | Source URL. |

### Agency

A government department, corporation, board or ministry that owns or implements projects. Stored in `src/data/jalandhar.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `agency_id` | `string` | Stable identifier. |
| `agency_name` | `string` | Full name. |
| `agency_type` | `string \| null` | Type (Corporation, Board, Ministry, etc.). |
| `parent_department` | `string \| null` | Parent department. |
| `jurisdiction` | `string \| null` | Geographic or functional jurisdiction. |
| `projects_owned` | `number` | Count of projects where this agency is the owner. |
| `projects_implemented` | `number` | Count of projects where this agency is the implementer. |

### Evidence

A document, report, tender or media article that supports a record. Stored in `src/data/jalandhar.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `evidence_id` | `string` | Stable identifier. |
| `linked_entity` | `string` | `project_id`, `asset_id`, `scheme_id` or `agency_id` this evidence supports. |
| `title` | `string` | Document title. |
| `source_type` | `string \| null` | Type of document (sanction order, tender, report, etc.). |
| `publishing_agency` | `string \| null` | Agency that published it. |
| `publication_date` | `string \| null` | Publication date. |
| `url` | `string \| null` | URL or file reference. |
| `retrieved_date` | `string \| null` | Date retrieved into this system. |
| `evidence_quality` | `EvidenceQuality` | Quality rating. |
| `conflicting_evidence` | `boolean` | Whether this evidence contradicts another record. |
| `notes` | `string \| null` | Free-text notes. |

### FundingComponent

A single money flow from one programme to one project. Stored in `src/data/programmes.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `funding_component_id` | `string` | Stable identifier. |
| `project_id` | `string` | Project receiving the funds. |
| `programme` | `string` | Programme or scheme name. |
| `government_level` | `GovernmentLevel` | Central, state or city. |
| `ministry_or_department` | `string \| null` | Specific ministry or department. |
| `sanctioned_amount` | `number \| null` | Sanctioned amount, INR crore. |
| `released_amount` | `number \| null` | Released amount, INR crore. |
| `expenditure` | `number \| null` | Expenditure, INR crore. |
| `financial_year` | `string \| null` | Financial year. |
| `source` | `string \| null` | Source reference. |

### TimelineEvent

A milestone in a project's lifecycle. Stored in `src/data/programmes.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | `string` | Stable identifier. |
| `project_id` | `string` | Related project. |
| `event_type` | `TimelineEventType` | Type of event. |
| `event_date` | `string \| null` | ISO date of the event. |
| `description` | `string \| null` | Description. |
| `source` | `string \| null` | Source reference. |
| `evidence_quality` | `EvidenceQuality` | Evidence quality. |

### ReportedValue

A single value as reported by one government source. Used inside `Project.cost_records`, `Project.completion_date_records` and `Project.status_records`.

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Human label (e.g. "Sanctioned cost — MoHUA"). |
| `value` | `string \| null` | Value as reported. |
| `source` | `string \| null` | Source agency. |
| `source_date` | `string \| null` | Source date. |
| `evidence_quality` | `EvidenceQuality` | Evidence quality. |

### KeyAttribute

A known physical attribute of a project.

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Attribute label. |
| `value` | `string` | Attribute value. |
| `source` | `string \| null` | Source agency. |

### Conflict

A data-quality issue generated by the conflict detection engine. Stored in `src/data/conflicts.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `conflict_id` | `string` | Stable identifier. |
| `project_id` | `string` | Related project. |
| `project_name` | `string` | Project name for display. |
| `rule` | `string` | Machine rule code. |
| `rule_label` | `string` | Human-readable rule name. |
| `severity` | `ConflictSeverity` | Severity. |
| `summary` | `string` | Explanation of the conflict. |
| `sources` | `ReportedValue[]` | Sources that disagree. |

### OutcomeDomain

A city outcome area (Water, Waste, Mobility, Air Quality, etc.) with related indicators. Stored in `src/data/outcomes.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Domain identifier. |
| `label` | `string` | Display label. |
| `headline_question` | `string` | Decision-support question for senior officials. |
| `sectors` | `CitySystem[]` | City systems that contribute to this domain. |
| `indicators` | `Indicator[]` | Outcome indicators. |
| `map_layers` | `string[]` | Map layer IDs that help visualise this domain. |
| `related_programmes` | `string[]` | Funding programmes relevant to this domain. |
| `charts` | `IndicatorSeries[]` | Time series charts. |

### Indicator

A single outcome or performance indicator.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifier. |
| `label` | `string` | Display label. |
| `unit` | `string \| null` | Unit of measurement. |
| `value` | `number \| null` | Verified value. `null` when no source is attached. |
| `as_of` | `string \| null` | Date the value refers to. |
| `source` | `string \| null` | Expected or actual source agency. |
| `source_url` | `string \| null` | Source URL. |
| `definition` | `string` | Plain-English definition. |
| `measure_type` | `"construction" \| "service" \| "finance"` | What kind of measure this is. |

### IndicatorSeries / SeriesPoint

Time-series data for an indicator.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Series identifier. |
| `label` | `string` | Series label. |
| `unit` | `string \| null` | Unit. |
| `source` | `string \| null` | Source. |
| `points` | `SeriesPoint[]` | Data points. |

`SeriesPoint`:

| Field | Type | Description |
| --- | --- | --- |
| `period` | `string` | Period label (month, quarter, year). |
| `value` | `number \| null` | Value for that period. |

### WardArea

A ward or derived geographic grouping used for area-level analysis. Stored in `src/data/wards.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Derived slug. |
| `label` | `string` | Ward name or locality. |
| `basis` | `"official ward" \| "recorded locality" \| "not recorded"` | How the grouping was derived. |
| `population` | `number \| null` | Population when available. |
| `projects` | `Project[]` | Projects linked to this area. |
| `assets` | `Asset[]` | Assets linked to this area. |

### PriorityLocation

A government-priority place shown on the city map. Stored in `src/data/mapFeatures.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `location_id` | `string` | Stable identifier. |
| `name` | `string` | Place name. |
| `locality` | `string` | Locality. |
| `category` | `solid_waste \| wastewater \| wastewater_and_waste \| public_realm \| transport \| e_bus_depot_area` | Category. |
| `latitude` | `number` | Approximate latitude. |
| `longitude` | `number` | Approximate longitude. |
| `coordinate_precision` | `"site_centroid_approximate" \| "surveyed"` | Precision level. |
| `related_projects` | `string[]` | Related project IDs. |
| `related_assets` | `string[]` | Related asset IDs. |
| `source_agency` | `string \| null` | Source agency. |
| `source_url` | `string \| null` | Source URL. |
| `last_verified` | `string \| null` | Last verified date. |
| `notes` | `string \| null` | Notes. |

### MapLayer

A layer on the City Map. Stored in `src/data/mapLayers.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Layer identifier. |
| `label` | `string` | Display label. |
| `category` | `LayerCategory` | Thematic category. |
| `source` | `"osm" \| "official"` | Whether the layer comes from OpenStreetMap or government records. |
| `query` | `string[]` | Overpass QL fragments for OSM layers. |
| `tags` | `string[]` | Human-readable OSM tags. |
| `color` | `string` | Layer colour. |
| `geometry` | `"point" \| "line" \| "area"` | Geometry type. |
| `defaultOn` | `boolean` | Whether the layer is visible by default. |
| `caveat` | `string \| null` | Warning when OSM data is approximate. |

### RiskProfile

An editorial assessment of why a project matters and what decision is needed. Stored in `src/data/attention.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `project_id` | `string` | Related project. |
| `service_criticality` | `number` | 1–5: centrality to a basic city service. |
| `public_health_risk` | `number` | 1–5: public health consequence of failure. |
| `environmental_risk` | `number` | 1–5: environmental consequence. |
| `depends_on_this` | `string[]` | Other outcomes blocked until this project delivers. |
| `why_it_matters` | `string` | Reason for senior attention. |
| `problem` | `string` | Current problem. |
| `decision_required` | `string` | Specific decision asked of the officer. |

### AttentionRow

A computed ranking row used by the `/attention` view. Stored in `src/data/attention.ts`.

| Field | Type | Description |
| --- | --- | --- |
| `project` | `Project` | The project. |
| `profile` | `RiskProfile \| undefined` | Risk profile. |
| `score` | `number` | Computed attention score. |
| `breakdown` | `ScoreBreakdown[]` | How the score was built. |
| `materialConflicts` | `number` | Count of material conflicts. |

## Relationships

```
Project 1--* FundingComponent
Project 1--* TimelineEvent
Project 1--* Asset            (via related_projects)
Project *--1 Scheme
Project *--1 Agency            (implementing / owning)
Project 1--* Evidence
Project 1--* Conflict          (derived)
Project 1--1 RiskProfile      (editorial)

Asset 1--* Project            (via related_projects)
Asset *--1 Agency

Scheme 1--* Project

Agency 1--* Project (owned)
Agency 1--* Project (implemented)

OutcomeDomain 1--* Indicator
OutcomeDomain *--* CitySystem
OutcomeDomain *--* MapLayer
OutcomeDomain *--* FundingComponent

WardArea 1--* Project
WardArea 1--* Asset

PriorityLocation 1--* Project
PriorityLocation 1--* Asset
PriorityLocation *--* MapLayer
```

## Data quality rules

The following rules are enforced by the conflict engine in `src/data/conflicts.ts`:

- **Multiple costs:** If a project has more than one cost record, a `material_conflict` is raised.
- **Multiple completion dates:** If a project has more than one completion date record, a `material_conflict` is raised.
- **Status disagreement:** If a project has more than one status record, a `material_conflict` is raised.
- **Progress missing:** If no physical progress percentage is recorded, a `review_required` is raised.
- **Progress stale:** If the progress figure is older than 180 days, a `review_required` is raised.
- **Completed but not operational:** If a project is `completed` or `substantially_complete` but `operational_status` is not "Operational", a `material_conflict` is raised.
- **No precise location:** If a project has no coordinates, a `review_required` is raised.
- **Point for network:** If a network project has only a single point and no geometry, an `informational` note is raised.
- **Scheme count differs:** If a project's primary scheme does not appear in its funding components, an `informational` note is raised.
- **Recorded conflict note:** If a `conflict_note` is set, a `review_required` is raised.
- **Unverified evidence:** If `evidence_quality` is `unverified`, an `informational` note is raised.

## Data freshness

Freshness is calculated from the fixed `AS_OF` date `2026-08-21` in `src/lib/freshness.ts`:

| Bucket | Age |
| --- | --- |
| Current | 0–90 days |
| Ageing | 91–180 days |
| Stale | 181–365 days |
| Very Stale | 366+ days |

## File map

| File | Purpose |
| --- | --- |
| `src/data/types.ts` | All TypeScript interfaces and enumerations. |
| `src/data/jalandhar.ts` | Seed projects, assets, schemes, agencies and evidence. |
| `src/data/programmes.ts` | Funding components, timeline events and helper functions. |
| `src/data/conflicts.ts` | Conflict detection rules. |
| `src/data/outcomes.ts` | Outcome domains, indicators and series. |
| `src/data/wards.ts` | Ward area grouping and service-gap analysis. |
| `src/data/mapFeatures.ts` | Priority locations for the city map. |
| `src/data/mapLayers.ts` | Map layer catalogue. |
| `src/data/attention.ts` | Risk profiles and attention ranking. |
| `src/lib/freshness.ts` | Data freshness calculation. |
| `src/lib/format.ts` | Institutional formatting helpers. |
| `src/lib/exportData.ts` | CSV export utilities. |

## Seed data

The seed dataset includes seven priority projects:

1. `PRJ-JAL-001` — Jalandhar Surface Water Project
2. `PRJ-JAL-002` — Wariana Legacy Waste Remediation
3. `PRJ-JAL-003` — Pholriwal Sewage Treatment and Reuse System
4. `PRJ-JAL-004` — Jalandhar PM eBus Sewa
5. `PRJ-JAL-005` — Burlton Park Sports Hub
6. `PRJ-JAL-006` — Jalandhar Cantt Railway Station Redevelopment
7. `PRJ-JAL-007` — Jamsher Dairy Waste and Biogas Intervention

And four seed assets:

1. `AST-JAL-001` — Pholriwal Sewage Treatment Plant
2. `AST-JAL-002` — Wariana Dumpsite
3. `AST-JAL-003` — Jalandhar Cantt Railway Station
4. `AST-JAL-004` — Burlton Park Sports Complex

## Notes on geospatial data

- Coordinates in project and asset records are **approximate city-level or site-centroid placements** for orientation only.
- `geometry` fields are `null` until official surveyed geometry is attached.
- OpenStreetMap layers on the City Map are **reference geography only** and are never treated as the authoritative source for project status, cost or progress.
- The system distinguishes OSM-derived features from official government records using the `source` field on each `MapLayer` and explicit `PriorityLocation` records for seeded locations.

## Extending the model

When adding a new project, asset or scheme:

1. Add the record to `src/data/jalandhar.ts`.
2. Add funding components to `src/data/programmes.ts` if the project receives money from a programme.
3. Add timeline events to `src/data/programmes.ts` if known milestones exist.
4. Add a risk profile to `src/data/attention.ts` if the project is significant enough to appear in the senior attention list.
5. Add a priority location to `src/data/mapFeatures.ts` if the project has a mappable site.
6. Update `src/data/outcomes.ts` if the project introduces a new indicator or outcome domain.
7. Run the typecheck and the Playwright mobile audit to ensure the new data renders correctly on all screen sizes.
