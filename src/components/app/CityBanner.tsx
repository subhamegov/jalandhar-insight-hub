import type { CityProfile } from "@/data/cities/registry";

interface CityBannerProps {
  city: CityProfile;
}

/** Decorative city illustration. Government identity remains in AuthorityIdentity. */
export function CityBanner({ city }: CityBannerProps) {
  return (
    <div
      key={city.city_id}
      className="h-[120px] w-full overflow-hidden bg-info-surface sm:h-[156px] xl:h-[188px]"
      aria-hidden="true"
    >
      {city.bannerImage ? (
        <img
          src={city.bannerImage}
          alt=""
          width={1920}
          height={640}
          decoding="async"
          className="h-full w-full object-cover object-[50%_55%]"
        />
      ) : null}
    </div>
  );
}