"use client";

import { useCart } from "@/components/cart/CartContext";
import type { Product } from "@/data/products";

export function AddToBagButton({
  product,
  label = "Quick Purchase",
}: {
  product: Product;
  label?: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        addItem(product);
      }}
      className="text-on-primary font-label-md text-label-sm uppercase tracking-[0.2em]"
    >
      {label}
    </button>
  );
}
