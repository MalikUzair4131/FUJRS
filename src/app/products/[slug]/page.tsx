import { notFound } from "next/navigation";
import Link from "next/link";
import { EditorialGallery } from "@/components/product/EditorialGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { SpecsAccordion } from "@/components/product/SpecsAccordion";
import { CompleteTheLook } from "@/components/product/CompleteTheLook";
import { getProductBySlug, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams.slug);
  if (!product) notFound();

  // "Complete the Look": same-category pieces first, falling back to
  // accessories so the section is never empty.
  const sameCategory = products.filter((p) => p.id !== product.id && p.category === product.category);
  const accessoryCategories = ["Accessories", "Jewelry", "Footwear"];
  const accessories = products.filter(
    (p) => p.id !== product.id && accessoryCategories.includes(p.category)
  );
  const completeTheLook = [...sameCategory, ...accessories]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 pb-24">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 mb-8 font-label-sm text-text-muted uppercase tracking-wider"
      >
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="text-[10px]">/</span>
        <Link href={`/${product.gender.toLowerCase()}`} className="hover:text-primary">
          {product.gender}
        </Link>
        <span className="text-[10px]">/</span>
        <span className="text-primary">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <EditorialGallery images={product.images} title={product.title} />
        <PurchasePanel product={product} />
      </div>

      <div className="lg:grid lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7">
          <SpecsAccordion product={product} />
        </div>
      </div>

      <CompleteTheLook items={completeTheLook} />
    </div>
  );
}
