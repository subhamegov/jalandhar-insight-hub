/**
 * UX4G colour values for canvas-drawn surfaces (Leaflet markers and shapes)
 * that cannot read CSS custom properties.
 *
 * Every value is an official UX4G primitive colour token from
 * ux4g-web-components (see src/styles/ux4g-tokens.css). Nothing here is a
 * new colour: these are the same tokens the CSS layer uses, expressed as
 * literals because the map library needs plain strings.
 *
 * Meaning is never carried by colour alone — map states also carry a label
 * in the legend and in each marker's tooltip.
 */
export const ux4g = {
  neutral0: "#fff", // --ux4g-color-neutral-0
  neutral500: "#737373", // --ux4g-color-neutral-500
  neutral900: "#171717", // --ux4g-color-neutral-900
  primary600: "#4a2bc2", // --ux4g-color-primary-600
  primary900: "#24145c", // --ux4g-color-primary-900
  blue700: "#1157ce", // --ux4g-color-blue-700
  blue900: "#012c6f", // --ux4g-color-blue-900
  skyblue700: "#006788", // --ux4g-color-skyblue-700
  skyblue900: "#003549", // --ux4g-color-skyblue-900
  cyan700: "#08979c", // --ux4g-color-cyan-700
  cyan900: "#00474f", // --ux4g-color-cyan-900
  green700: "#006c35", // --ux4g-color-green-700
  green900: "#00381f", // --ux4g-color-green-900
  gold800: "#b36b00", // --ux4g-color-gold-800
  gold950: "#613400", // --ux4g-color-gold-950
  orange700: "#d46b08", // --ux4g-color-orange-700
  orange900: "#873800", // --ux4g-color-orange-900
  red700: "#b3251e", // --ux4g-color-red-700
  red900: "#60150f", // --ux4g-color-red-900
} as const;

/** Map state colours. Keys and behaviour are unchanged from before migration. */
export const mapStateColors = {
  announced: { fill: "transparent", stroke: ux4g.primary600 },
  active: { fill: ux4g.primary600, stroke: ux4g.primary900 },
  completed: { fill: ux4g.cyan700, stroke: ux4g.cyan900 },
  operational: { fill: ux4g.green700, stroke: ux4g.green900 },
  warning: { fill: ux4g.orange700, stroke: ux4g.orange900 },
  critical: { fill: ux4g.red700, stroke: ux4g.red900 },
  asset: { fill: ux4g.skyblue700, stroke: ux4g.skyblue900 },
  location: { fill: ux4g.gold800, stroke: ux4g.gold950 },
} as const;

export type MapStateKey = keyof typeof mapStateColors;
