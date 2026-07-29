"use client";

import { useEffect, useState } from "react";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { DEMO_STATS } from "@/lib/auth/demoData";
import { listByStatus } from "@/lib/local/catalog";

export function AdminView() {
  // Everything here reads fixtures — there is no backend to query yet, and
  // actions update local state only.
  const [data, setData] = useState<typeof DEMO_STATS | null>(null);
  const [counts, setCounts] = useState<{ published: number; pending: number } | null>(null);

  useEffect(() => {
    setData(DEMO_STATS);
    setCounts({
      published: listByStatus("APPROVED").length,
      pending: listByStatus("PENDING").length,
    });
  }, []);

  const stats = [
    { label: "Total Orders", value: data ? data.totalOrders.toLocaleString() : "—" },
    { label: "Total Revenue", value: data ? `PKR ${data.totalRevenue.toLocaleString()}` : "—" },
    { label: "Catalogue Products", value: counts ? String(counts.published) : "—" },
    { label: "Awaiting Review", value: counts ? String(counts.pending) : "—" },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        Sample data — this dashboard isn&apos;t connected to a database yet.
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
                data={(data?.revenueByDay ?? []).map((d) => ({
                  label: d.date.slice(5),
                  value: d.revenue,
                }))}
                valueFormatter={(v) => `PKR ${v.toLocaleString()}`}
                emptyMessage={data ? "No revenue in this window yet." : "Loading…"}
              />
            </div>
          </div>
          <div className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">Orders by status</p>
            <div className="mt-4">
              <CategoryBarChart
                data={(data?.ordersByStatus ?? []).map((s) => ({
                  label: s.status,
                  value: s.count,
                }))}
                emptyMessage={data ? "No orders placed yet." : "Loading…"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-headline-sm">Recent Orders</h2>
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
              {!data && (
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
        <CatalogManager />
      </div>
    </div>
  );
}
