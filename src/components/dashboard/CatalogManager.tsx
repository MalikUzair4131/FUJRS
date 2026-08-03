"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { CatalogTable } from "@/components/dashboard/CatalogTable";
import {
  CatalogStorageError,
  createItem,
  listItems,
  removeItem,
  type CatalogItem,
  type NewCatalogItem,
} from "@/lib/local/catalog";

/**
 * Catalogue management for the roles that can publish — shared by the Admin
 * and Super Admin dashboards so the flow is identical for both. Pieces added
 * here go live immediately; there is no review queue.
 */
export function CatalogManager() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => setItems(listItems()), []);
  useEffect(refresh, [refresh]);

  function handleAdd(input: NewCatalogItem) {
    if (!session) return;
    try {
      createItem(input, { email: session.user.email, name: session.user.name });
      setShowForm(false);
      refresh();
      toast("Product published to the catalogue.", "success");
    } catch (err) {
      toast(
        err instanceof CatalogStorageError
          ? "Storage is full. Remove an older product or use a smaller image."
          : "Couldn't save that product.",
        "info"
      );
    }
  }

  function handleRemove(item: CatalogItem) {
    removeItem(item.id);
    refresh();
    toast(`“${item.title}” removed from the catalogue.`, "info");
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-sm">Catalogue</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Pieces you add here publish immediately — saved on this device only.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ Add Product"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6">
          <ProductForm
            submitLabel="Publish to Catalogue"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mt-6">
        <CatalogTable
          items={items}
          emptyMessage="No products added yet."
          actions={(item) => (
            <button
              onClick={() => handleRemove(item)}
              className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-error hover:text-error"
            >
              Remove
            </button>
          )}
        />
      </div>
    </section>
  );
}
