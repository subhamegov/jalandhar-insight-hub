import type { CityId } from "@/data/cities/registry";
import { CITY_AUTHORITIES } from "@/data/governmentAssets";
import { AuthorityIdentity } from "@/components/app/AuthorityIdentity";

/** Municipal identity resolved only from the canonical city ID. */
export function MunicipalIdentity({
  cityId,
  cityName,
  stateName,
  compact = false,
  tone = "default",
  className,
}: {
  cityId: CityId;
  cityName?: string;
  stateName?: string;
  compact?: boolean;
  tone?: "default" | "sidebar";
  className?: string;
}) {
  return (
    <AuthorityIdentity
      asset={CITY_AUTHORITIES[cityId]}
      cityName={cityName}
      stateName={stateName}
      tone={tone}
      variant={compact ? "compact" : "page-header"}
      className={className}
    />
  );
}