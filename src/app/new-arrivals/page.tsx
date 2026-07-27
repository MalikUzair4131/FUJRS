import Image from "next/image";
import { ProductFilterGrid } from "@/components/ui/ProductFilterGrid";
import { LinkButton } from "@/components/ui/Button";
import { products } from "@/data/products";

export default function NewArrivalsPage() {
  const newArrivals = products.filter((p) => p.isNewArrival);
  const [spotlight, ...rest] = newArrivals;

  return (
    <div className="py-12">
      <div className="container-luxe">
        <p className="label-caps text-gold">Just Landed</p>
        <h1 className="mt-2 font-display text-headline-md">New Arrivals</h1>
      </div>

      {spotlight && (
        <div className="container-luxe mt-10 grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-container lg:aspect-auto">
            <Image
              src={spotlight.images[0]}
              alt={spotlight.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="label-caps text-gold">Spotlight</p>
            <h2 className="mt-3 font-display text-headline-md">{spotlight.title}</h2>
            <p className="mt-4 max-w-md text-body-md text-text-muted">{spotlight.description}</p>
            <p className="mt-4 text-headline-sm font-display">
              PKR {spotlight.price.toLocaleString()}
            </p>
            <LinkButton
              href={`/products/${spotlight.slug}`}
              variant="primary"
              className="mt-6 w-fit"
            >
              Shop This Piece
            </LinkButton>
          </div>
        </div>
      )}

      <div className="container-luxe mt-16">
        <h2 className="font-display text-headline-sm mb-8">More New In</h2>
        <ProductFilterGrid products={rest} />
      </div>
    </div>
  );
}
