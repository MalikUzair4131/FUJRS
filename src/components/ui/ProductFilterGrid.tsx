"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/products";

type SortOption = "featured" | "price-asc" | "price-desc";

const sortLabels: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="border-b border-outline-variant pb-6">
      <h3 className="label-caps mb-4 text-text-muted">{title}</h3>
      <ul className="space-y-2.5">
        {options.map((option) => (
          <li key={option}>
            <label className="flex cursor-pointer items-center gap-2.5 text-body-md">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                className="h-4 w-4 accent-primary"
              />
              {option}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProductFilterGrid({ products }: { products: Product[] }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("featured");

  const options = useMemo(() => {
    const uniq = (values: string[]) => Array.from(new Set(values)).sort();
    return {
      categories: uniq(products.map((p) => p.category)),
      fabrics: uniq(products.map((p) => p.fabric)),
      colors: uniq(products.map((p) => p.color)),
      highestPrice: products.reduce((max, p) => Math.max(max, p.price), 0),
    };
  }, [products]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const filtered = useMemo(() => {
    let result = products.filter(
      (p) =>
        (categories.length === 0 || categories.includes(p.category)) &&
        (fabrics.length === 0 || fabrics.includes(p.fabric)) &&
        (colors.length === 0 || colors.includes(p.color)) &&
        (maxPrice === null || p.price <= maxPrice)
    );

    if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);

    return result;
  }, [products, categories, fabrics, colors, maxPrice, sort]);

  const activeFilterCount =
    categories.length + fabrics.length + colors.length + (maxPrice !== null ? 1 : 0);

  function clearFilters() {
    setCategories([]);
    setFabrics([]);
    setColors([]);
    setMaxPrice(null);
  }

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-[240px_1fr]">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="label-caps flex items-center justify-between border border-outline-variant px-4 py-3 lg:hidden"
      >
        <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
        <span className="material-symbols-outlined text-[20px]">
          {filtersOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Filter panel — static, not fixed/overlay, so no containing-block risk */}
      <aside className={`space-y-6 lg:block ${filtersOpen ? "block" : "hidden"}`}>
        <div className="flex items-center justify-between">
          <h2 className="label-caps">Filter</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="font-label-sm text-label-sm text-marketplace-bronze underline"
            >
              Clear all
            </button>
          )}
        </div>

        <FilterGroup
          title="Category"
          options={options.categories}
          selected={categories}
          onToggle={(v) => toggle(categories, setCategories, v)}
        />
        <FilterGroup
          title="Fabric"
          options={options.fabrics}
          selected={fabrics}
          onToggle={(v) => toggle(fabrics, setFabrics, v)}
        />
        <FilterGroup
          title="Color"
          options={options.colors}
          selected={colors}
          onToggle={(v) => toggle(colors, setColors, v)}
        />

        {options.highestPrice > 0 && (
          <div className="pb-2">
            <h3 className="label-caps mb-4 text-text-muted">Max Price</h3>
            <input
              type="range"
              min={0}
              max={options.highestPrice}
              step={500}
              value={maxPrice ?? options.highestPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-2 text-body-md text-text-muted">
              Up to PKR {(maxPrice ?? options.highestPrice).toLocaleString()}
            </p>
          </div>
        )}
      </aside>

      {/* Results */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="label-caps text-text-muted">
            {filtered.length} {filtered.length === 1 ? "Piece" : "Pieces"}
          </p>
          <label className="flex items-center gap-2 text-body-md">
            <span className="text-text-muted">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="border border-outline-variant bg-transparent px-3 py-2 focus:outline-none"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-4xl text-text-muted">
              filter_alt_off
            </span>
            <p className="mt-4 font-display text-headline-sm">No pieces match those filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 font-label-sm text-label-sm text-marketplace-bronze underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-gutter md:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
