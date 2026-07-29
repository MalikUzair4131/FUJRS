"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { SubmissionTable } from "@/components/dashboard/SubmissionTable";
import {
  CatalogStorageError,
  createItem,
  listBySubmitter,
  type CatalogItem,
  type NewCatalogItem,
} from "@/lib/local/catalog";

export function VendorView() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const email = session?.user.email ?? "";

  const refresh = useCallback(() => {
    if (email) setItems(listBySubmitter(email));
  }, [email]);

  useEffect(refresh, [refresh]);

  function handleSubmit(input: NewCatalogItem) {
    if (!session) return;
    try {
      createItem(input, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      });
      setShowForm(false);
      refresh();
      toast("Submitted for review — an Admin will approve or reject it.", "success");
    } catch (err) {
      toast(
        err instanceof CatalogStorageError
          ? "Storage is full. Remove an older submission or use a smaller image."
          : "Couldn't save that submission.",
        "info"
      );
    }
  }

  const pending = items?.filter((i) => i.status === "PENDING").length ?? 0;
  const approved = items?.filter((i) => i.status === "APPROVED").length ?? 0;
  const rejected = items?.filter((i) => i.status === "REJECTED").length ?? 0;

  const shopStats = [
    { label: "Shop Status", value: "Active" },
    { label: "Submitted", value: items ? String(items.length) : "—" },
    { label: "Pending Review", value: items ? String(pending) : "—" },
    { label: "Approved", value: items ? String(approved) : "—" },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        Saved on this device — submissions aren&apos;t sent anywhere yet.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shopStats.map((stat) => (
          <div key={stat.label} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-headline-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-headline-sm">Your Submissions</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Every piece you submit goes to an Admin for approval before it reaches the catalogue.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ Submit Product"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6">
          <ProductForm
            submitLabel="Submit for Review"
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mt-6">
        <SubmissionTable
          items={items}
          emptyMessage="You haven't submitted a product yet."
          showReviewer
        />
      </div>

      {rejected > 0 && (
        <p className="mt-4 font-label-sm text-label-sm text-text-muted">
          {rejected} submission{rejected === 1 ? " was" : "s were"} rejected. Revise the details and
          submit again.
        </p>
      )}
    </div>
  );
}
