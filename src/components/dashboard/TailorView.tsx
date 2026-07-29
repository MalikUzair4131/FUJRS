"use client";

import { useEffect, useState } from "react";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import { DEMO_TAILOR_QUEUE, type DemoQueueItem } from "@/lib/auth/demoData";

export function TailorView() {
  // Fixture queue — status changes update local state only, since there is
  // no backend to persist them to yet.
  const [queue, setQueue] = useState<DemoQueueItem[] | null>(null);

  useEffect(() => {
    setQueue(DEMO_TAILOR_QUEUE);
  }, []);

  function updateStatus(itemId: string, status: string) {
    setQueue(
      (prev) => prev?.map((item) => (item.id === itemId ? { ...item, status } : item)) ?? null
    );
  }

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
        Sample data — this queue isn&apos;t connected to a database yet.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STITCHING_STATUSES.slice(0, 4).map((status) => (
          <div key={status} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{status}</p>
            <p className="mt-2 font-display text-headline-sm">
              {queue ? queue.filter((q) => q.status === status).length : "—"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-headline-sm">Active Measurement Queue</h2>

      {!queue && <p className="mt-4 text-text-muted">Loading…</p>}
      {queue?.length === 0 && (
        <p className="mt-4 text-text-muted">
          No bespoke orders assigned to you yet — they&apos;ll appear here as customers place custom
          stitching orders.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {queue?.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 border border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-body-md text-on-surface">
                #{item.orderId.slice(-8).toUpperCase()} — {item.customer}
              </p>
              <p className="text-label-sm text-text-muted">
                {item.garment} · {item.stitchingLabel}
              </p>
            </div>
            <select
              value={item.status}
              aria-label={`Stitching status for order ${item.orderId.slice(-8).toUpperCase()}`}
              onChange={(e) => updateStatus(item.id, e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-2 text-body-md focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {STITCHING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
