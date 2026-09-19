# MoHUA Four-City Cross-Mission Synthetic Urban Intelligence Dataset

Reference date: 19 September 2026. Cities: Thane, Surat, Ahmedabad and Guwahati.

**All project, asset, property, finance, housing, livelihood, grievance and service observations are SYNTHETIC. They are not actual city performance figures or official project records.** Verified contextual source links are held only in `21_source_registry.json`. City names and ULB names are real; approximate city centres and all point placements are illustrative, NOT official GIS locations.

## How to use in another chat
Upload the ZIP and ask the assistant to extract it and read `dataset_manifest.json`, this README, `22_data_dictionary.json` and `validation_report.json` first. Import city/geography/mission registries, then projects and assets, then service-area, property, housing, service, financial and complaint records, then relationships and decision signals. Do not render the sample totals as citywide government statistics.

## Join rules
Use `city_id`, `locality_id`, `project_id`, `asset_id`, `property_aggregate_id`, `service_area_id`, `housing_id`, `signal_id` and other namespaced IDs. Never join by locality names or infer actual ward numbers. Project-to-asset is many-to-many through `18_cross_mission_relationships.json`; some other files include redundant linked IDs for convenience. Property records are aggregates, not household/person records.

## Geographic integrity
`02_geography_registry.geojson`, `06_assets.geojson` and `07_asset_service_areas.geojson` contain illustrative Point geometries, NOT polygons, actual infrastructure coordinates, or official jurisdiction boundaries. Surat election wards differ from property-tax assessment wards. Guwahati's historical 31-ward profile and later 60-ward delimitation must not be silently conflated. Do not infer administrative ward membership from the sample points.

## Units and limitations
Project and municipal finance values use INR lakh. Property tax values use INR. Waste uses tonnes per day. All costs and output capacities are fictional. Housing funnel values are internally constrained. The `LDO_CONTEXT` mission label does not assert central LDO jurisdiction over the four municipal property systems. Source publication dates are null when not established. Source catalogue was provided as chat text, not downloaded as a data file.

## Source verification
Official contextual sources and their limited verified claims appear in `21_source_registry.json`. No restricted or registered data was accessed. Source URLs are intentionally absent from synthetic operational records.
