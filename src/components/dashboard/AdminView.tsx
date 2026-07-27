"use client";

import { useEffect, useState } from "react";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEMO_DRAFTS, DEMO_STATS, type DemoDraft } from "@/lib/auth/demoData";

interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  itemCount: number;
}

interface StatsResponse {
  totalOrders: number;
  totalRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: RecentOrder[];
}

export function AdminView() {
  const { session } = useAuth();
  const isDemo = !!session?.user.isDemo;

  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DemoDraft[] | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  async function handleDraftAction(id: string, action: "APPROVED" | "REJECTED") {
    setDraftError(null);
    const previous = drafts;
    setDrafts((prev) => prev?.map((d) => (d.id === id ? { ...d, status: action } : d)) ?? null);

    if (isDemo) return;

    const res = await fetch("/api/admin/drafts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });

    if (!res.ok) {
      setDrafts(previous);
      setDraftError("Could not update draft.");
      return;
    }

    const json = await res.json().catch(() => null);
    if (json?.draft) {
      setDrafts((prev) => prev?.map((d) => (d.id === id ? json.draft : d)) ?? null);
    }
  }

  useEffect(() => {
    if (isDemo) {
      setData(DEMO_STATS);
      return;
    }
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Couldn't load live stats right now."));
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setDrafts(DEMO_DRAFTS);
      return;
    }
    // Load pending drafts (admin only)
    fetch("/api/admin/drafts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load drafts");
        return res.json();
      })
      .then((d) => setDrafts(d.drafts))
      .catch(() => setDraftError("Couldn't load product drafts right now."));
  }, [isDemo]);

  const stats = [
    { label: "Total Orders", value: data ? data.totalOrders.toLocaleString() : "—" },
    { label: "Total Revenue", value: data ? `PKR ${data.totalRevenue.toLocaleString()}` : "—" },
    { label: "Active Products", value: "18" },
    { label: "Pending Tailoring Requests", value: "—" },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        {isDemo
          ? "Demo data — not connected to a live database."
          : "Orders & Revenue are live from the database. Product count and tailoring queue are still placeholders — no product-management or tailoring-request tables exist yet."}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-headline-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="label-caps text-gold">Operations</p>
        <h2 className="mt-2 font-display text-headline-sm">Revenue &amp; Orders</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">
              Revenue, last {data?.revenueByDay.length ?? 14} days
            </p>
            <div className="mt-4">
              <RevenueTrendChart
                data={(data?.revenueByDay ?? []).map((d) => ({ label: d.date.slice(5), value: d.revenue }))}
                valueFormatter={(v) => `PKR ${v.toLocaleString()}`}
                emptyMessage={data ? "No revenue in this window yet." : "Loading…"}
              />
            </div>
          </div>
          <div className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">Orders by status</p>
            <div className="mt-4">
              <CategoryBarChart
                data={(data?.ordersByStatus ?? []).map((s) => ({ label: s.status, value: s.count }))}
                emptyMessage={data ? "No orders placed yet." : "Loading…"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-headline-sm">Recent Orders</h2>
        {error && <p className="mt-4 text-label-sm text-error">{error}</p>}
        <div className="mt-4 overflow-x-auto border border-border-subtle">
          <table className="w-full text-left text-body-md">
            <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {!data && !error && (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {data?.recentOrders.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    No orders placed yet.
                  </td>
                </tr>
              )}
              {data?.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3">{order.itemCount}</td>
                  <td className="px-4 py-3">PKR {order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-label-sm uppercase text-text-muted">{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-headline-sm">Pending Product Drafts</h2>
        <p className="text-label-sm text-marketplace-bronze mb-4">
          Admins can approve or reject vendor-submitted drafts.
        </p>
        {draftError && <p className="mt-4 text-label-sm text-error">{draftError}</p>}
        <div className="mt-4 overflow-x-auto border border-border-subtle">
          <table className="w-full text-left text-body-md">
            <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {!drafts && !draftError && (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {drafts?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    No drafts submitted yet.
                  </td>
                </tr>
              )}
              {drafts?.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">{d.title}</td>
                  <td className="px-4 py-3">{d.vendorId}</td>
                  <td className="px-4 py-3">PKR {d.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{d.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDraftAction(d.id, "APPROVED")}
                        className="px-3 py-1 bg-primary text-on-primary"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDraftAction(d.id, "REJECTED")}
                        className="px-3 py-1 border border-outline-variant"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
