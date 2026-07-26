import Link from "next/link";

const tiles = [
  {
    label: "The Women's Edit",
    href: "/women",
    span: "md:col-span-8",
    alt: "High-end studio photography of a variety of colorful, premium unstitched fabrics for women, draped gracefully over sculptural forms.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3zDvt0A27LB5D7gh3nkqxkhWg_hA88tuZKp3qqh3qYgDSV3qS-ztTwhBP1y_kARD8_n0quKxs6jqVairWGmRSvLmjUWdNoXF5yqzw05EUdGpTvwFylkaggxXIgnPx7dNCiWiPpXTy4pceIGoV2VkBKYhvqYloJapiMVs6Rcnn0uYqXOdaKVAg6IdxqJbOZVMX6CQMfwbGKt65UI0ZVtZeKJS68xipGoWYviUGRmKXEmVLdg0LP5UngSQSxftCfYTg-CkSEIeAAVk",
  },
  {
    label: "Men's Suiting",
    href: "/men",
    span: "md:col-span-4",
    alt: "Detailed close-up shot of premium men's unstitched fabric in deep navy and charcoal gray textures.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDywpCPFPsc0Ayo72HlqB3aI71zk0w7E8MTEcVI96JK9B79B8Qlr9RsfVRaN1mIs5UPqVI7nTwAJmv_OWFQA6uS-mnMsRDPwmm1JWQUxR8uhUmisZh4Tfhd2Ib0JB2NuR5K_Y-8Xmk4NWO7DQ7eSVdBMu6LpM7VOSKj7tsSCUlNXv1aT87qPriYFot7btJ5loduyC8tyXESWtZX_NEMb5OtjU7YAKamZk6V5_ABaBYPfNhhE24Ds1E56NWEHxQHLj7SjtYDPvs6UuE",
  },
];

export function FeaturedCollectionsBento() {
  return (
    <section className="py-margin-desktop px-gutter max-w-container-max mx-auto">
      <div className="mb-12 text-center">
        <h2 className="font-headline-md text-headline-md mb-2">Curated Curation</h2>
        <div className="h-px w-24 bg-tertiary-fixed-dim mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter h-[800px] md:h-[600px]">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`${tile.span} relative group overflow-hidden cursor-pointer block`}
          >
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${tile.image}')` }}
              role="img"
              aria-label={tile.alt}
            />
            <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-40" />
            <div className="absolute bottom-10 left-10 text-on-primary">
              <h3 className="font-headline-md text-headline-md mb-2">{tile.label}</h3>
              <p className="font-label-md text-label-md uppercase tracking-widest border-b border-on-primary inline-block">
                Explore More
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
