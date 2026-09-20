import nationalBanner from "@/assets/banners/india-national-overview.jpg.asset.json";

/** Decorative architecture crop only. The interactive India map remains authoritative. */
export function NationalBanner() {
  return (
    <div
      className="h-[120px] w-full overflow-hidden border-y border-border bg-info-surface sm:h-[160px] lg:h-[200px]"
      aria-hidden="true"
    >
      <img
        src={nationalBanner.url}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}