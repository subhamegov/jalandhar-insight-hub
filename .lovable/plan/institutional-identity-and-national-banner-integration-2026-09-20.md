# Institutional identity and National banner integration

## Goal
Add a restrained, scope-aware identity system using verified government assets where available, neutral fallbacks where verification is incomplete, and a safe architectural crop of the supplied National banner. Preserve all city illustrations, maps, data, routes, Surat default behaviour, and UX4G styling.

## Asset verification and preparation
- Compare the uploaded MoHUA, Ahmedabad, Karnal, and National images with the listed official government sources.
- Treat reconstructed uploads as inputs, not automatically approved master marks.
- Use official-domain MoHUA and NUDM assets when verification and practical reuse are clear. Otherwise show accurate text identity with a neutral administrative mark and record the pending status.
- Use a municipal logo only when it can be tied to the correct municipal authority on an official source. Keep neutral fallbacks for unverified cities.
- Do not use district seals, state marks, Smart City marks, or generated emblems as municipal substitutes.
- Crop the supplied National banner to retain its architectural panorama while excluding the embedded generated ministry marks, slogan, and illustrated India map. Preserve the original proportions and upload the safe derivative through the existing asset system.
- Keep the existing five city illustration mappings unchanged. Karnal keeps its current city-banner fallback.

## Identity registry
Extend the existing government identity registry rather than creating another city model. Normalise each entry around:
- Authority ID and name
- Authority type and administrative level
- Canonical city, district, and state IDs
- Local asset path
- Official source URL and source page
- Verification and usage status
- Last verification date
- Fallback label and usage note

Add distinct national entries for MoHUA and NUDM, while retaining city authorities under canonical city IDs.

## Reusable presentation
- Add an `InstitutionalIdentity` component for the compact MoHUA and NUDM masthead group.
- Add a `MunicipalIdentity` wrapper for the active city authority, using verified artwork or a neutral fallback.
- Preserve `CityBanner` for decorative city illustrations.
- Add `NationalBanner` for the safe architectural National panorama.
- Keep logos at their native proportions and within the requested compact sizes.

## Scope-aware placement
- Show MoHUA and NUDM identity once in the permanent application masthead.
- Show only the selected municipality in City scope, driven by canonical city ID.
- Clear municipal identity in National scope.
- Place the National banner between the National page heading and the map.
- Do not show the National banner in City scope or city illustrations in National scope.
- Keep prototype and synthetic-data notices visible and independent of government identity.

## National page composition
- Retain the existing National heading, India-only interactive map, city cards, marker behaviour, and scope transition.
- Insert the shallow National banner at approximately 120px mobile, 160px tablet, and 200px desktop.
- Reserve image space before loading and use a pale-blue UX4G surface fallback.
- Keep the map immediately visible after the banner and do not derive geography from the artwork.

## Metadata and favicon
- Update stale root metadata from the former Jalandhar-only product name to MoHUA Urban Intelligence Prototype.
- Use an appropriate verified institutional mark for the favicon only if verification permits. Otherwise retain the existing neutral favicon rather than presenting an unverified emblem.

## Verification
- Confirm every registered asset exists and renders from the deployment-safe asset path.
- Test National scope and all six city contexts for correct identity switching and no stale-logo carryover.
- Confirm Surat remains the fresh-visit default and explicit National or city links still win.
- Test National banner crop and layout on desktop, tablet, and mobile.
- Verify the interactive National and city maps remain visible and usable.
- Check for overflow, aspect-ratio distortion, duplicate identity, missing images, console errors, and build errors.
- Report the verification status and source for every organisation, plus unresolved permissions or missing assets.
