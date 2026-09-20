import { Building2, Landmark } from "lucide-react";
import { logoUsable, type AuthorityAsset } from "@/data/governmentAssets";
import { cn } from "@/lib/utils";

/**
 * Shows whose administrative context is active. A logo is shown only when an
 * official asset has been supplied and verified in the registry; otherwise a
 * neutral administrative icon is used. Nothing here is decorative branding.
 */
export function AuthorityIdentity({
  asset,
  className,
  tone = "default",
  variant = "compact",
  cityName,
  stateName,
}: {
  asset: AuthorityAsset;
  className?: string;
  tone?: "default" | "sidebar";
  variant?: "compact" | "page-header" | "detail" | "text-only";
  cityName?: string;
  stateName?: string;
}) {
  const Icon = asset.administrativeLevel === "national" ? Landmark : Building2;
  const muted = tone === "sidebar" ? "text-sidebar-foreground/60" : "text-muted-foreground";
  const strong = tone === "sidebar" ? "text-sidebar-foreground" : "text-foreground";

  const logoHeight = variant === "page-header" ? "h-10" : variant === "detail" ? "h-9" : "h-7";
  const primaryName = variant === "page-header" && cityName ? cityName : asset.name;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {variant !== "text-only" && logoUsable(asset) ? (
        <img
          src={asset.assetPath as string}
          alt={`${asset.name} official logo`}
          className={cn(logoHeight, "w-auto shrink-0 object-contain")}
        />
      ) : variant !== "text-only" ? (
        <Icon className={cn("h-4 w-4 shrink-0", muted)} aria-hidden="true" />
      ) : null}
      <div className="min-w-0">
        {variant === "page-header" && stateName ? (
          <p className={cn("text-[11px] leading-tight", muted)}>{stateName}</p>
        ) : asset.authority ? (
          <p className={cn("truncate text-[11px] leading-tight", muted)}>{asset.authority}</p>
        ) : null}
        <p className={cn("truncate leading-tight font-medium", strong, variant === "page-header" ? "text-base" : "text-xs")}>{primaryName}</p>
        {variant === "page-header" && cityName ? (
          <p className={cn("mt-0.5 text-xs leading-tight", muted)}>{asset.name}</p>
        ) : null}
      </div>
    </div>
  );
}
