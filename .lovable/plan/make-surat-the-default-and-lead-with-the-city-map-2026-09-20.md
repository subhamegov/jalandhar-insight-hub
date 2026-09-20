# Make Surat the default and lead with the city map

## Default city context
- Change the single canonical default city to `CITY-SURAT`.
- Keep explicit city and National links authoritative.
- Treat previously stored Jalandhar as a legacy default only on a fresh root visit, while preserving deliberate city changes during normal navigation.
- Verify the city context, records, breadcrumbs, map configuration, and authority identity all resolve to Surat.

## Map-first city overview
- Recompose the existing four-city overview so its first major area is a responsive map and summary grid.
- Use the existing Surat locality, project, asset, and service geography only. Do not create boundaries or coordinates.
- Make the map prominent on desktop and place it before the summary on mobile.
- Keep existing marker interaction, attribution, city routing, and resize handling.
- Show concise city observations, up to three decision signals, selected existing indicators, and a link to the full City Map.
- Keep detailed citizen-domain, mission, and investment sections below this first-view overview.

## Government identity
- Extend the existing authority registry with official website, source-page, location, usage, verification, and fallback metadata.
- Integrate only assets that can be confirmed on the named authority’s current official website and whose use is supportable.
- Store accepted assets through the project asset flow and preserve their original colours and proportions.
- Add page-header, compact, detail, and text-only variants to the shared authority identity component.
- Use the municipal identity on city overview pages, switch it with city context, and remove it in National scope.
- Retain neutral fallbacks for any authority whose logo or usage status cannot be verified.

## Validation
- Test a fresh root visit, explicit National links, explicit city links, refresh, and user city switching.
- Test the map and authority identity at desktop, tablet, and mobile widths.
- Confirm map markers remain interactive, no unsupported geometry appears, and no data or calculations change.
- Confirm every integrated asset exists, renders, and has a recorded official source.
