"use client";

import { useEffect, useState } from "react";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";
import { MEASUREMENT_FIELDS, MEASUREMENT_UNIT, missingMeasurements } from "@/lib/measurements";
import { DEMO_TAILOR_QUEUE, type DemoQueueItem } from "@/lib/auth/demoData";
import { Loading } from "@/components/ui/Loading";

function orderRef(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

/** The spec sheet a tailor actually cuts from — every measurement, in order. */
function SpecSheet({ item }: { item: DemoQueueItem }) {
  const missing = missingMeasurements(item.measurements);

  return (
    <div className="border-t border-border-subtle bg-surface-container-low p-5">
      {missing.length > 0 && (
        <p className="mb-4 border border-outline-variant border-l-4 border-l-error p-3 text-label-sm text-error">
          Missing {missing.length} measurement{missing.length === 1 ? "" : "s"}:{" "}
          {missing.join(", ")}. This piece can&apos;t be cut until the customer supplies them.
        </p>
      )}

      <p className="text-label-sm uppercase tracking-widest text-text-muted">
        Measurements ({MEASUREMENT_UNIT})
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {MEASUREMENT_FIELDS.map((field) => {
          const value = item.measurements[field]?.trim();
          return (
            <div key={field} className="border-b border-border-subtle pb-2">
              <dt className="text-label-sm text-text-muted">{field}</dt>
              <dd
                className={`font-display text-body-lg ${value ? "text-on-surface" : "text-error"}`}
              >
                {value ? `${value}${MEASUREMENT_UNIT}` : "—"}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">
        Cut &amp; Finish
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
        {[
          { label: "Neckline", value: item.neckline },
          { label: "Sleeve", value: item.sleeve },
          { label: "Hemline", value: item.hemline },
        ].map((row) => (
          <div key={row.label} className="border-b border-border-subtle pb-2">
            <dt className="text-label-sm text-text-muted">{row.label}</dt>
            <dd className="text-body-md">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">Customer Notes</p>
      <p className="mt-2 max-w-prose text-body-md text-on-surface">
        {item.notes ?? <span className="text-text-muted">None left for this piece.</span>}
      </p>

      <p className="mt-6 text-label-sm text-marketplace-bronze">
        Reference photos from the customer arrive with the backend — upload isn&apos;t built yet.
      </p>
    </div>
  );
}

export function TailorView() {
  // Fixture queue — status changes update local state only, since there is
  // no backend to persist them to yet.
  const [queue, setQueue] = useState<DemoQueueItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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

      {!queue && (
        <div className="mt-6">
          <Loading />
        </div>
      )}
      {queue?.length === 0 && (
        <p className="mt-4 text-text-muted">
          No bespoke orders assigned to you yet — they&apos;ll appear here as customers place custom
          stitching orders.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {queue?.map((item) => {
          const open = openId === item.id;
          const panelId = `spec-${item.id}`;

          return (
            <div key={item.id} className="border border-border-subtle">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-body-md text-on-surface">
                    {orderRef(item.orderId)} — {item.customer}
                  </p>
                  <p className="text-label-sm text-text-muted">
                    {item.garment} · {item.stitchingLabel}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="border border-outline-variant px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
                  >
                    {open ? "Hide Measurements" : "View Measurements"}
                  </button>
                  <select
                    value={item.status}
                    aria-label={`Stitching status for order ${orderRef(item.orderId)}`}
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
              </div>

              {open && (
                <div id={panelId}>
                  <SpecSheet item={item} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
