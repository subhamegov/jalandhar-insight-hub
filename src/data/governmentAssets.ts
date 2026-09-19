// Authority identity registry.
//
// One place for administrative authority naming and any official logo asset.
// No logo is invented, generated, redrawn or sourced from an unofficial mark:
// until an official asset is supplied and verified, `logoSource` stays
// "unverified", `usageStatus` stays "do-not-use", and the interface falls back
// to a neutral administrative icon.

import type { CityId } from "@/data/cities/registry";

export type AdministrativeLevel = "national" | "state" | "district" | "city";
export type LogoSource = "official" | "unverified";
export type UsageStatus = "verified" | "do-not-use";

export interface AuthorityAsset {
  id: string;
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
}

export const NATIONAL_AUTHORITY: AuthorityAsset = {
  id: "national-mohua",
  name: "Ministry of Housing & Urban Affairs",
  administrativeLevel: "national",
  authority: "Government of India",
  geography: "India",
  logoSource: "unverified",
  sourceUrl: null,
  assetPath: null,
  variant: null,
  usageStatus: "do-not-use",
  lastVerified: null,
};

/** Urban local body of record for each city in the registry. */
export const CITY_AUTHORITIES: Record<CityId, AuthorityAsset> = {
  "CITY-JALANDHAR": {
    id: "ulb-jalandhar",
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
  },
  "CITY-THANE": {
    id: "ulb-thane",
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
  },
  "CITY-SURAT": {
    id: "ulb-surat",
    name: "Surat Municipal Corporation",
    administrativeLevel: "city",
    authority: "Urban local body",
    geography: "Surat",
    logoSource: "unverified",
    sourceUrl: null,
    assetPath: null,
    variant: null,
    usageStatus: "do-not-use",
    lastVerified: null,
  },
  "CITY-AHMEDABAD": {
    id: "ulb-ahmedabad",
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
  },
  "CITY-GUWAHATI": {
    id: "ulb-guwahati",
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
};

function district(id: string, geography: string, name: string): AuthorityAsset {
  return {
    id: `district-${id}`,
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
  };
}

/** True only when an official asset has been supplied and verified. */
export function logoUsable(asset: AuthorityAsset): boolean {
  return asset.usageStatus === "verified" && asset.logoSource === "official" && !!asset.assetPath;
}
