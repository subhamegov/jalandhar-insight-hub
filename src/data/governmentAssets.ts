// Authority identity registry.
//
// One place for administrative authority naming and any official logo asset.
// No logo is invented, generated, redrawn or sourced from an unofficial mark:
// until an official asset is supplied and verified, `logoSource` stays
// "unverified", `usageStatus` stays "do-not-use", and the interface falls back
// to a neutral administrative icon.

import type { CityId } from "@/data/cities/registry";
import suratLogo from "@/assets/government/surat-municipal-corporation.png.asset.json";
import karnalLogo from "@/assets/government/karnal-municipal-corporation.png.asset.json";
import mohuaIdentity from "@/assets/identity/mohua-identity.png.asset.json";
import nudmIdentity from "@/assets/identity/nudm-identity.png.asset.json";

export type AdministrativeLevel = "national" | "state" | "district" | "city";
export type LogoSource = "official" | "supplied-reconstruction" | "unverified";
export type UsageStatus = "verified" | "limited-use" | "do-not-use";

export interface AuthorityAsset {
  id: string;
  authorityType: "ministry" | "mission" | "municipal-corporation" | "district-administration";
  /** Authority of record, written exactly as the authority names itself. */
  name: string;
  administrativeLevel: AdministrativeLevel;
  /** Parent authority or ministry shown above the authority name. */
  authority: string | null;
  /** Geographic name this authority covers. */
  geography: string;
  logoSource: LogoSource;
  sourceUrl: string | null;
  assetPath: string | null;
  variant: "full-colour" | "monochrome" | null;
  usageStatus: UsageStatus;
  lastVerified: string | null;
  officialWebsite: string;
  logoSourcePage: string | null;
  stateId: string | null;
  districtId: string | null;
  usageNote: string;
  fallbackIcon: "landmark" | "building";
  fallbackLabel: string;
}

export const MOHUA_AUTHORITY: AuthorityAsset = {
  id: "national-mohua",
  authorityType: "ministry",
  name: "Ministry of Housing and Urban Affairs",
  administrativeLevel: "national",
  authority: "Government of India",
  geography: "India",
  logoSource: "official",
  sourceUrl: "https://www.nudm.mohua.gov.in/wp-content/uploads/2026/08/Department_of_Urban_Development_Ministry_of_Housing_and_Urban_Affairs_Government_of_India-removebg-preview.png",
  assetPath: mohuaIdentity.url,
  variant: "monochrome",
  usageStatus: "limited-use",
  lastVerified: "2026-09-20",
  officialWebsite: "https://www.mohua.gov.in/",
  logoSourcePage: "https://www.nudm.mohua.gov.in/",
  stateId: null,
  districtId: null,
  usageNote: "Official-domain web identity. Displayed without alteration in this prototype. Wider reuse permission requires review.",
  fallbackIcon: "landmark",
  fallbackLabel: "MoHUA",
};

export const NUDM_AUTHORITY: AuthorityAsset = {
  id: "national-nudm",
  authorityType: "mission",
  name: "National Urban Digital Mission",
  administrativeLevel: "national",
  authority: "Ministry of Housing and Urban Affairs",
  geography: "India",
  logoSource: "official",
  sourceUrl: "https://www.nudm.mohua.gov.in/wp-content/uploads/2026/06/NUDM-LOGO_Transparent-Bg-1-1.png",
  assetPath: nudmIdentity.url,
  variant: "full-colour",
  usageStatus: "limited-use",
  lastVerified: "2026-09-20",
  officialWebsite: "https://www.nudm.mohua.gov.in/",
  logoSourcePage: "https://www.nudm.mohua.gov.in/resources/engagement/",
  stateId: null,
  districtId: null,
  usageNote: "Official-domain NUDM identity. Displayed without alteration in this prototype. Wider reuse permission requires review.",
  fallbackIcon: "landmark",
  fallbackLabel: "NUDM",
};

/** Backward-compatible national authority reference. */
export const NATIONAL_AUTHORITY = MOHUA_AUTHORITY;

/** Urban local body of record for each city in the registry. */
export const CITY_AUTHORITIES: Record<CityId, AuthorityAsset> = {
  "CITY-JALANDHAR": {
    id: "ulb-jalandhar",
    authorityType: "municipal-corporation",
    name: "Municipal Corporation of Jalandhar",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Jalandhar",
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
    officialWebsite: "https://mcjalandhar.in/",
    logoSourcePage: null,
    stateId: "STATE-PUNJAB",
    districtId: "DISTRICT-JALANDHAR",
    usageNote: "A current, reusable official mark has not been verified.",
    fallbackIcon: "building",
    fallbackLabel: "MC Jalandhar",
  },
  "CITY-THANE": {
    id: "ulb-thane",
    authorityType: "municipal-corporation",
    name: "Thane Municipal Corporation",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Thane",
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
    officialWebsite: "https://thanecity.gov.in/",
    logoSourcePage: null,
    stateId: "STATE-MAHARASHTRA",
    districtId: "DISTRICT-THANE",
    usageNote: "A current, reusable official mark has not been verified.",
    fallbackIcon: "building",
    fallbackLabel: "TMC",
  },
  "CITY-SURAT": {
    id: "ulb-surat",
    authorityType: "municipal-corporation",
    name: "Surat Municipal Corporation",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Surat",
    logoSource: "official",
    sourceUrl: "https://www.suratmunicipal.gov.in/OnlineServices/Images/smc-logo.png",
    assetPath: suratLogo.url,
    variant: null,
    usageStatus: "verified",
    lastVerified: "2026-09-20",
    officialWebsite: "https://www.suratmunicipal.gov.in/",
    logoSourcePage: "https://www.suratmunicipal.gov.in/OnlineServices/Home/Sitemap",
    stateId: "STATE-GUJARAT",
    districtId: "DISTRICT-SURAT",
    usageNote: "Official-domain web identity. Used only at small interface sizes with source attribution. Reuse terms require confirmation for broader use.",
    fallbackIcon: "building",
    fallbackLabel: "SMC",
  },
  "CITY-AHMEDABAD": {
    id: "ulb-ahmedabad",
    authorityType: "municipal-corporation",
    name: "Ahmedabad Municipal Corporation",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Ahmedabad",
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
    officialWebsite: "https://ahmedabadcity.gov.in/",
    logoSourcePage: null,
    stateId: "STATE-GUJARAT",
    districtId: "DISTRICT-AHMEDABAD",
    usageNote: "A current, reusable official mark has not been verified.",
    fallbackIcon: "building",
    fallbackLabel: "AMC",
  },
  "CITY-GUWAHATI": {
    id: "ulb-guwahati",
    authorityType: "municipal-corporation",
    name: "Guwahati Municipal Corporation",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Guwahati",
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
    officialWebsite: "https://gmc.assam.gov.in/",
    logoSourcePage: null,
    stateId: "STATE-ASSAM",
    districtId: "DISTRICT-KAMRUP-METROPOLITAN",
    usageNote: "A current, reusable official mark has not been verified.",
    fallbackIcon: "building",
    fallbackLabel: "GMC",
  },
  "CITY-KARNAL": {
    id: "ulb-karnal",
    authorityType: "municipal-corporation",
    name: "Municipal Corporation Karnal",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Karnal",
    logoSource: "official",
    sourceUrl: "https://mckarnal.co.in/themes/custom/mc_theme/mc-karnal.png",
    assetPath: karnalLogo.url,
    variant: "full-colour",
    usageStatus: "limited-use",
    lastVerified: "2026-09-20",
    officialWebsite: "https://mckarnal.co.in/",
    logoSourcePage: "https://mckarnal.co.in/",
    stateId: "STATE-HARYANA",
    districtId: "DISTRICT-KARNAL",
    usageNote: "Current municipal-site identity. The district directory points to a different municipal domain, so broader reuse requires review.",
    fallbackIcon: "building",
    fallbackLabel: "MC Karnal",
  },
};

/**
 * District administration of record. Guwahati city sits in the Kamrup
 * Metropolitan district; no "Guwahati District" authority exists.
 */
export const DISTRICT_AUTHORITIES: Record<CityId, AuthorityAsset> = {
  "CITY-JALANDHAR": district("jalandhar", "Jalandhar", "District Administration"),
  "CITY-THANE": district("thane", "Thane", "District Administration"),
  "CITY-SURAT": district("surat", "Surat", "District Administration"),
  "CITY-AHMEDABAD": district("ahmedabad", "Ahmedabad", "District Administration"),
  "CITY-GUWAHATI": district(
    "kamrup-metropolitan",
    "Kamrup Metropolitan",
    "Kamrup Metropolitan District Administration",
  ),
  "CITY-KARNAL": district("karnal", "Karnal", "District Administration Karnal"),
};

function district(id: string, geography: string, name: string): AuthorityAsset {
  return {
    id: `district-${id}`,
    authorityType: "district-administration",
    name,
    administrativeLevel: "district",
    authority: "District administration",
    geography,
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
    officialWebsite: id === "surat" ? "https://surat.nic.in/" : id === "jalandhar" ? "https://jalandhar.nic.in/" : id === "karnal" ? "https://karnal.gov.in/" : "",
    logoSourcePage: null,
    stateId: null,
    districtId: `DISTRICT-${id.toUpperCase()}`,
    usageNote: "No district seal is used without a verified, reusable official asset.",
    fallbackIcon: "building",
    fallbackLabel: name,
  };
}

/** True only when an official asset has been supplied and verified. */
export function logoUsable(asset: AuthorityAsset): boolean {
  return (asset.usageStatus === "verified" || asset.usageStatus === "limited-use") && asset.logoSource === "official" && !!asset.assetPath;
}
