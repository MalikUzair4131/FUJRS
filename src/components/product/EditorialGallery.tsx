import { ProductImage } from "@/components/ui/ProductImage";

export function EditorialGallery({ images, title }: { images: string[]; title: string }) {
  if (images.length >= 3) {
    // Matches source: two images side-by-side, one full-width below
    return (
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.slice(0, 2).map((src, i) => (
            <div
              key={i}
              className="relative group aspect-[4/5] overflow-hidden bg-surface-container"
            >
              <ProductImage
                src={src}
                alt={`${title} — view ${i + 1}`}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                priority={i === 0}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ))}
          <div className="relative group aspect-[4/5] md:col-span-2 overflow-hidden bg-surface-container">
            <ProductImage
              src={images[2]}
              alt={`${title} — lifestyle detail`}
              fill
              sizes="66vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
        <ProductImage
          src={images[0]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
