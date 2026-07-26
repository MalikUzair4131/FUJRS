import Link from "next/link";
import Image from "next/image";
import { AddToBagButton } from "@/components/product/AddToBagButton";
import type { Product } from "@/data/products";

export function CompleteTheLook({ items }: { items: Product[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-32">
      <div className="flex justify-between items-end mb-12">
        <h3 className="font-headline-md text-headline-md text-primary">Complete the Look</h3>
        <Link
          href="/new-arrivals"
          className="font-label-md text-primary underline underline-offset-8 uppercase tracking-widest hover:text-marketplace-bronze transition-colors"
        >
          View Collection
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {items.map((item) => (
          <div key={item.id} className="group">
            <Link href={`/products/${item.slug}`} className="block">
              <div className="aspect-[4/5] bg-surface-container overflow-hidden relative mb-4">
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 w-full bg-black text-white font-label-md py-4 text-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0 duration-300">
                  <AddToBagButton product={item} label="Quick Add" />
                </div>
              </div>
            </Link>
            <p className="font-label-md text-primary uppercase mb-1">{item.title}</p>
            <p className="font-body-md text-text-muted">PKR {item.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
