"use client";

import { useEffect, useState } from "react";

interface QueueItem {
  id: string;
  orderId: string;
  customer: string;
  garment: string;
  stitchingLabel: string;
  status: string;
  createdAt: string;
}

const STATUSES = [
  "Awaiting Measurements",
  "In Progress",
  "Quality Check",
  "Ready for Fitting",
  "Delivered",
];

export function TailorView() {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tailor/queue")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setQueue(data.items))
      .catch(() => setError("Couldn't load your queue right now."));
  }, []);

  async function updateStatus(itemId: string, status: string) {
    setUpdating(itemId);
    const previous = queue;
    setQueue((prev) => prev?.map((item) => (item.id === itemId ? { ...item, status } : item)) ?? null);

    const res = await fetch("/api/tailor/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    });

    setUpdating(null);
    if (!res.ok) {
      setQueue(previous); // revert on failure
      setError("Couldn't save that update — please try again.");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.slice(0, 4).map((status) => (
          <div key={status} className="border border-border-subtle p-6">
            <p className="text-label-sm uppercase text-text-muted">{status}</p>
            <p className="mt-2 font-display text-headline-sm">
              {queue ? queue.filter((q) => q.status === status).length : "—"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-headline-sm">Active Measurement Queue</h2>
      {error && <p className="mt-4 text-label-sm text-error">{error}</p>}

      {!queue && !error && <p className="mt-4 text-text-muted">Loading…</p>}
      {queue?.length === 0 && (
        <p className="mt-4 text-text-muted">
          No bespoke orders assigned to you yet — they&apos;ll appear here
          as customers place custom stitching orders.
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
              disabled={updating === item.id}
              onChange={(e) => updateStatus(item.id, e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-2 text-body-md focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {STATUSES.map((s) => (
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
