// Catalogue products, stored in the browser. Admins and Super Admins add
// pieces here and they publish immediately — there is no review step, because
// no role submits products for approval. This module is the only place that
// reads/writes them, so swapping it for an API client later is a one-file
// change.

const STORAGE_KEY = "fujrs-catalog";

export const PRODUCT_GENDERS = ["Women", "Men", "Unisex"] as const;
export type ProductGender = (typeof PRODUCT_GENDERS)[number];

export interface CatalogItem {
  id: string;
  title: string;
  price: number;
  fabric: string;
  category: string;
  gender: ProductGender;
  description: string;
  /** Data URL, or null when no image was attached. */
  image: string | null;
  addedByEmail: string;
  addedByName: string;
  createdAt: string;
}

export interface NewCatalogItem {
  title: string;
  price: number;
  fabric: string;
  category: string;
  gender: ProductGender;
  description: string;
  image: string | null;
}

export interface Author {
  email: string;
  name: string;
}

/** Thrown when the browser refuses the write — almost always the ~5MB quota. */
export class CatalogStorageError extends Error {
  constructor() {
    super("storage-full");
    this.name = "CatalogStorageError";
  }
}

/**
 * Rows written before the review step was removed carry `submittedBy*` and a
 * status. Normalising here keeps the old shape out of the components.
 */
function normalise(row: Record<string, unknown>): CatalogItem {
  const { addedByEmail, addedByName, submittedByEmail, submittedByName, ...rest } = row;
  return {
    ...(rest as Omit<CatalogItem, "addedByEmail" | "addedByName">),
    addedByEmail: String(addedByEmail ?? submittedByEmail ?? ""),
    addedByName: String(addedByName ?? submittedByName ?? "—"),
  };
}

function readAll(): CatalogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(normalise) : [];
  } catch {
    return [];
  }
}

function writeAll(items: CatalogItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Images are data URLs, so a big upload can exceed the quota.
    throw new CatalogStorageError();
  }
}

/** Newest first. */
export function listItems(): CatalogItem[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createItem(input: NewCatalogItem, author: Author): CatalogItem {
  const item: CatalogItem = {
    ...input,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    addedByEmail: author.email.trim().toLowerCase(),
    addedByName: author.name,
    createdAt: new Date().toISOString(),
  };

  writeAll([...readAll(), item]);
  return item;
}

export function removeItem(id: string) {
  writeAll(readAll().filter((item) => item.id !== id));
}
