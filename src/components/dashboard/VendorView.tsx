"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEMO_DRAFTS } from "@/lib/auth/demoData";

interface Draft {
  id: string;
  title: string;
  price: number;
  fabric: string;
  category: string;
  gender: string;
  description: string;
  status: string;
  createdAt: string;
}

const emptyForm = {
  title: "",
  price: "",
  fabric: "",
  category: "",
  gender: "Women" as "Men" | "Women" | "Unisex",
  description: "",
};

export function VendorView() {
  const { session } = useAuth();
  const isDemo = !!session?.user.isDemo;

  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function loadDrafts() {
    if (isDemo) {
      setDrafts(DEMO_DRAFTS);
      return;
    }
    fetch("/api/vendor/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setDrafts(data.drafts))
      .catch(() => setError("Couldn't load your submitted products right now."));
  }

  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const price = Number(form.price);
    if (!form.title || !price || !form.fabric || !form.category || form.description.length < 10) {
      setFormError("Fill in every field — description needs at least 10 characters.");
      return;
    }

    if (isDemo) {
      const newDraft: Draft = {
        id: `demo-draft-${Date.now()}`,
        title: form.title,
        price,
        fabric: form.fabric,
        category: form.category,
        gender: form.gender,
        description: form.description,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      setDrafts((prev) => [newDraft, ...(prev ?? [])]);
      setForm(emptyForm);
      setShowForm(false);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error ?? "Could not submit product.");
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    loadDrafts();
  }

  const pending = drafts?.filter((d) => d.status === "PENDING").length ?? 0;
  const approved = drafts?.filter((d) => d.status === "APPROVED").length ?? 0;

  const shopStats = [
    { label: "Shop Status", value: "Active" },
    { label: "Submitted Drafts", value: drafts ? String(drafts.length) : "—" },
    { label: "Pending Review", value: drafts ? String(pending) : "—" },
    { label: "Approved to Catalog", value: drafts ? String(approved) : "—" },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        {isDemo
          ? "Demo data — submissions here are local only and not persisted."
          : "Products you submit here go into a real review queue — they're proposals for the live catalog (which is code-managed), not instantly published."}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shopStats.map((stat) => (
          <div key={stat.label} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-headline-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-headline-sm">Your Submitted Products</h2>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ Add Product"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 border border-border-subtle p-6 sm:grid-cols-2"
        >
          <div>
            <label className="text-label-sm uppercase text-text-muted">Product Name</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-label-sm uppercase text-text-muted">Price (PKR)</label>
            <input
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-label-sm uppercase text-text-muted">Fabric</label>
            <input
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-label-sm uppercase text-text-muted">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. 3-Piece Suits"
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-label-sm uppercase text-text-muted">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-label-sm uppercase text-text-muted">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {formError && <p className="sm:col-span-2 text-label-sm text-error">{formError}</p>}
          <Button
            type="submit"
            variant="primary"
            className="sm:col-span-2 w-fit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit for Review"}
          </Button>
        </form>
      )}

      {error && <p className="mt-6 text-label-sm text-error">{error}</p>}

      <div className="mt-6 overflow-x-auto border border-border-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {!drafts && !error && (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}
            {drafts?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={4}>
                  No products submitted yet.
                </td>
              </tr>
            )}
            {drafts?.map((draft) => (
              <tr key={draft.id}>
                <td className="px-4 py-3">{draft.title}</td>
                <td className="px-4 py-3">{draft.category}</td>
                <td className="px-4 py-3">PKR {draft.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="text-label-sm uppercase text-text-muted">{draft.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
