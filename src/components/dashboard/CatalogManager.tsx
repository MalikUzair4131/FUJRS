"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { CatalogTable } from "@/components/dashboard/CatalogTable";
import { catalog, StoreWriteError } from "@/lib/data";
import type { CatalogItem, NewCatalogItem } from "@/lib/data";

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

  const refresh = useCallback(async () => {
    setItems(await catalog.list());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd(input: NewCatalogItem) {
    if (!session) return;
    try {
      await catalog.create(input, { email: session.user.email, name: session.user.name });
      setShowForm(false);
      await refresh();
      toast("Product published to the catalogue.", "success");
    } catch (err) {
      toast(
        err instanceof StoreWriteError && err.outOfSpace
          ? "Storage is full. Remove an older product or use a smaller image."
          : "Couldn't save that product.",
        "info"
      );
    }
  }

  async function handleRemove(item: CatalogItem) {
    await catalog.remove(item.id);
    await refresh();
    toast(`“${item.title}” removed from the catalogue.`, "info");
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-sm">Catalogue</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Pieces you add here publish immediately — they appear in the shop straight away.
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
            onSubmit={(input) => void handleAdd(input)}
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
              onClick={() => void handleRemove(item)}
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
