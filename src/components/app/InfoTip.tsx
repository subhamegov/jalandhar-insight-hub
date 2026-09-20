import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Accessible information control for short definitions and calculation notes.
 * Click or keyboard opens it, Escape closes it. Critical warnings stay on the
 * page and are never moved in here.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`About ${label}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="z-50 w-72 max-w-[calc(100vw-2rem)] text-xs leading-relaxed text-foreground"
      >
        <p className="mb-1 text-sm font-semibold">{label}</p>
        {children}
      </PopoverContent>
    </Popover>
  );
}
