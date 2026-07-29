// Catalogue submissions, stored in the browser. Vendors submit items that an
// Admin must approve; Admins and Super Admins publish directly. This module is
// the only place that reads/writes them, so swapping it for an API client
// later is a one-file change.
import type { AppRole } from "@/lib/auth/roles";

const STORAGE_KEY = "fujrs-catalog";

export const PRODUCT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_GENDERS = ["Women", "Men", "Unisex"] as const;
export type ProductGender = (typeof PRODUCT_GENDERS)[number];

/** Roles allowed to publish straight to the catalogue, skipping review. */
const PUBLISH_DIRECT_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN"];

export function canPublishDirectly(role: AppRole | null | undefined): boolean {
  return !!role && PUBLISH_DIRECT_ROLES.includes(role);
}

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
  status: ProductStatus;
  submittedByEmail: string;
  submittedByName: string;
  submittedByRole: AppRole;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
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

export interface Submitter {
  email: string;
  name: string;
  role: AppRole;
}

/** Thrown when the browser refuses the write — almost always the ~5MB quota. */
export class CatalogStorageError extends Error {
  constructor() {
    super("storage-full");
    this.name = "CatalogStorageError";
  }
}

function readAll(): CatalogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
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

export function listByStatus(status: ProductStatus): CatalogItem[] {
  return listItems().filter((item) => item.status === status);
}

export function listBySubmitter(email: string): CatalogItem[] {
  const target = email.trim().toLowerCase();
  return listItems().filter((item) => item.submittedByEmail === target);
}

/**
 * Admins and Super Admins publish straight to the catalogue; everyone else
 * lands in the review queue. The caller's role decides — not the caller.
 */
export function createItem(input: NewCatalogItem, submitter: Submitter): CatalogItem {
  const direct = canPublishDirectly(submitter.role);
  const now = new Date().toISOString();

  const item: CatalogItem = {
    ...input,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    status: direct ? "APPROVED" : "PENDING",
    submittedByEmail: submitter.email.trim().toLowerCase(),
    submittedByName: submitter.name,
    submittedByRole: submitter.role,
    createdAt: now,
    reviewedAt: direct ? now : null,
    reviewedByName: direct ? submitter.name : null,
  };

  writeAll([...readAll(), item]);
  return item;
}

function review(id: string, status: ProductStatus, reviewerName: string): CatalogItem | null {
  const all = readAll();
  const item = all.find((i) => i.id === id);
  if (!item) return null;

  const updated: CatalogItem = {
    ...item,
    status,
    reviewedAt: new Date().toISOString(),
    reviewedByName: reviewerName,
  };
  writeAll(all.map((i) => (i.id === id ? updated : i)));
  return updated;
}

export function approveItem(id: string, reviewerName: string) {
  return review(id, "APPROVED", reviewerName);
}

export function rejectItem(id: string, reviewerName: string) {
  return review(id, "REJECTED", reviewerName);
}
