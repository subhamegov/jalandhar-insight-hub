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
}: {
  asset: AuthorityAsset;
  className?: string;
  tone?: "default" | "sidebar";
}) {
  const Icon = asset.administrativeLevel === "national" ? Landmark : Building2;
  const muted = tone === "sidebar" ? "text-sidebar-foreground/60" : "text-muted-foreground";
  const strong = tone === "sidebar" ? "text-sidebar-foreground" : "text-foreground";

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {logoUsable(asset) ? (
        <img
          src={asset.assetPath as string}
          alt={`${asset.name} official logo`}
          className="h-7 w-auto shrink-0 object-contain"
        />
      ) : (
        <Icon className={cn("h-4 w-4 shrink-0", muted)} aria-hidden="true" />
      )}
      <div className="min-w-0">
        {asset.authority ? (
          <p className={cn("truncate text-[11px] leading-tight", muted)}>{asset.authority}</p>
        ) : null}
        <p className={cn("truncate text-xs leading-tight font-medium", strong)}>{asset.name}</p>
      </div>
    </div>
  );
}
