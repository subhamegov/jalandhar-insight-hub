import { Landmark } from "lucide-react";
import {
  MOHUA_AUTHORITY,
  NUDM_AUTHORITY,
  logoUsable,
} from "@/data/governmentAssets";
import { cn } from "@/lib/utils";

/** Stable national product identity. Government marks do not describe dataset status. */
export function InstitutionalIdentity({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)} aria-label="MoHUA and NUDM">
      <IdentityMark asset={MOHUA_AUTHORITY} className="h-9 w-auto sm:h-10" />
      <span className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />
      <IdentityMark asset={NUDM_AUTHORITY} className="h-8 w-auto sm:h-9" />
      <div className="hidden min-w-0 border-l border-border pl-3 xl:block">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">
          MoHUA Urban Intelligence
        </p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">Prototype</p>
      </div>
    </div>
  );
}

function IdentityMark({
  asset,
  className,
}: {
  asset: typeof MOHUA_AUTHORITY;
  className: string;
}) {
  if (logoUsable(asset) && asset.assetPath) {
    return <img src={asset.assetPath} alt={asset.name} className={cn(className, "shrink-0 object-contain")} />;
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
      <Landmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      {asset.fallbackLabel}
    </span>
  );
}