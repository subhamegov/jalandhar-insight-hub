import type { CityId } from "@/data/cities/registry";
import { CITY_AUTHORITIES } from "@/data/governmentAssets";
import { AuthorityIdentity } from "@/components/app/AuthorityIdentity";

/** Municipal identity resolved only from the canonical city ID. */
export function MunicipalIdentity({
  cityId,
  cityName,
  stateName,
  compact = false,
  textOnly = false,
  tone = "default",
  className,
}: {
  cityId: CityId;
  cityName?: string;
  stateName?: string;
  compact?: boolean;
  textOnly?: boolean;
  tone?: "default" | "sidebar";
  className?: string;
}) {
  return (
    <AuthorityIdentity
      asset={CITY_AUTHORITIES[cityId]}
      tone={tone}
      variant={textOnly ? "text-only" : compact ? "compact" : "page-header"}
      {...(cityName ? { cityName } : {})}
      {...(stateName ? { stateName } : {})}
      {...(className ? { className } : {})}
    />
  );
}