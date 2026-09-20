# Integrate city illustrations

## Asset integration
- Store the five approved uploads through the project asset flow using the requested deployment-safe filenames.
- Preserve each original image without regeneration, filters, overlays, stretching, or city reuse.
- Keep Karnal image-free and use a quiet pale-blue fallback surface.

## Canonical city identity
- Extend the existing `CityProfile` registry with one optional banner asset reference per canonical city ID.
- Map Surat, Ahmedabad, Thane, Guwahati, and Jalandhar to their own uploaded illustration; set Karnal to no image.
- Keep Surat as the default city and leave government authority identity assets separate.

## City at a glance
- Add a reusable decorative `CityBanner` that reads only from the active city profile.
- Place it between the city heading and the existing map-summary area.
- Use a reserved shallow viewport: about 120px mobile, 156px tablet, and 188px desktop, with proportional cover cropping anchored near the bottom.
- Preserve the map as the primary interactive element, including markers, navigation, attribution, sizing, and linked signals.
- Key the image to the canonical city ID so city changes cannot retain the previous illustration.

## Scope and validation
- Render the banner only in city scope; National View remains unchanged and has no municipal illustration.
- Verify all six city states, National switching, desktop/tablet/mobile cropping, landmark visibility, no distortion, no layout shift, and no console errors.
- Confirm the five deployed assets resolve and the current build remains healthy.

## Technical details
- Use CDN-backed local project asset pointers rather than chat URLs or external hotlinks.
- Import the pointer files centrally in the canonical registry and expose their stable URLs through `CityProfile.bannerImage`.
- Mark rendered images decorative with an empty alternative description and fixed intrinsic dimensions.
