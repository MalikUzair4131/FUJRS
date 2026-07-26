import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import { AddToBagButton } from "@/components/product/AddToBagButton";

export function NewArrivalsGrid() {
  const items = products.filter((p) => p.isNewArrival).slice(0, 4);

  return (
    <section className="py-margin-desktop bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-gutter">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-headline-md text-headline-md">New Arrivals</h2>
            <p className="text-on-surface-variant font-body-md">
              Hand-picked luxury for the discerning eye.
            </p>
          </div>
          <Link
            href="/new-arrivals"
            className="font-label-md text-label-md uppercase tracking-widest border-b border-primary hover:text-tertiary-fixed-dim transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
          {items.map((product) => (
            <div key={product.id} className="product-card group relative">
              <div className="aspect-[4/5] bg-surface-container-highest overflow-hidden relative">
                <Link href={`/products/${product.slug}`} className="block h-full w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-primary text-on-primary text-[10px] px-2 py-1 uppercase tracking-tighter">
                      New Collection
                    </span>
                  </div>
                </Link>
                <div className="quick-add-bar absolute bottom-0 left-0 w-full bg-primary py-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <AddToBagButton product={product} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <h4 className="font-headline-sm text-[18px] mb-2">{product.title}</h4>
                <p className="font-label-md text-label-md">
                  PKR {product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
