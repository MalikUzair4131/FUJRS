"use client";

import { useEffect, useState } from "react";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { OrderManager } from "@/components/dashboard/OrderManager";
import { DEMO_STATS, DEMO_VENDORS } from "@/lib/auth/demoData";
import { catalog } from "@/lib/data";

export function AdminView() {
  // Everything here reads fixtures — there is no backend to query yet, and
  // actions update local state only.
  const [data, setData] = useState<typeof DEMO_STATS | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    setData(DEMO_STATS);
    let active = true;
    catalog.list().then((items) => {
      if (active) setProductCount(items.length);
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Total Orders", value: data ? data.totalOrders.toLocaleString() : "—" },
    { label: "Total Revenue", value: data ? `PKR ${data.totalRevenue.toLocaleString()}` : "—" },
    { label: "Catalogue Products", value: productCount === null ? "—" : String(productCount) },
    { label: "Active Vendors", value: String(DEMO_VENDORS.length) },
  ];

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        Revenue and order-status charts are sample data. Orders and the catalogue below are real.
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
                emptyMessage="No revenue in this window yet."
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
                emptyMessage="No orders placed yet."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <OrderManager />
      </div>

      <div className="mt-10">
        <CatalogManager />
      </div>
    </div>
  );
}
