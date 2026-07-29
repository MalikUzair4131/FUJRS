"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { SubmissionTable } from "@/components/dashboard/SubmissionTable";
import {
  CatalogStorageError,
  approveItem,
  createItem,
  listItems,
  rejectItem,
  type CatalogItem,
  type NewCatalogItem,
} from "@/lib/local/catalog";

/**
 * Catalogue management for the roles that can publish directly — reviewing
 * vendor submissions and adding pieces straight to the catalogue. Shared by
 * the Admin and Super Admin dashboards so the flow is identical for both.
 */
export function CatalogManager() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => setItems(listItems()), []);
  useEffect(refresh, [refresh]);

  const reviewerName = session?.user.name ?? "Admin";

  function handleAdd(input: NewCatalogItem) {
    if (!session) return;
    try {
      createItem(input, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      });
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

  function handleApprove(item: CatalogItem) {
    approveItem(item.id, reviewerName);
    refresh();
    toast(`“${item.title}” approved.`, "success");
  }

  function handleReject(item: CatalogItem) {
    rejectItem(item.id, reviewerName);
    refresh();
    toast(`“${item.title}” rejected.`, "info");
  }

  const pending = items?.filter((i) => i.status === "PENDING") ?? null;
  const published = items?.filter((i) => i.status === "APPROVED") ?? null;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-headline-sm">Pending Vendor Submissions</h2>
            <p className="mt-1 text-label-sm text-marketplace-bronze">
              {items === null
                ? "Loading…"
                : pending && pending.length > 0
                  ? `${pending.length} awaiting your review.`
                  : "Nothing awaiting review."}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <SubmissionTable
            items={pending}
            emptyMessage="No submissions are waiting for review."
            showSubmitter
            actions={(item) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(item)}
                  className="bg-primary px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest text-on-primary transition-opacity hover:opacity-80"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(item)}
                  className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-error hover:text-error"
                >
                  Reject
                </button>
              </div>
            )}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-headline-sm">Catalogue</h2>
            <p className="mt-1 text-label-sm text-marketplace-bronze">
              Pieces you add here publish immediately — no review step.
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
          <SubmissionTable
            items={published}
            emptyMessage="No products published yet."
            showSubmitter
            showReviewer
          />
        </div>
      </section>
    </div>
  );
}
