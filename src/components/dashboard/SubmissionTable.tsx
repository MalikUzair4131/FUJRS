"use client";

import Image from "next/image";
import type { CatalogItem, ProductStatus } from "@/lib/local/catalog";

const STATUS_CLASS: Record<ProductStatus, string> = {
  PENDING: "border-outline-variant text-text-muted",
  APPROVED: "border-marketplace-bronze text-marketplace-bronze",
  REJECTED: "border-error text-error",
};

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-block border px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-widest ${STATUS_CLASS[status]}`}
    >
      {status}
    </span>
  );
}

export function ProductThumb({ item }: { item: CatalogItem }) {
  return (
    <div className="relative h-14 w-11 shrink-0 overflow-hidden border border-border-subtle bg-surface-container-low">
      {item.image ? (
        <Image src={item.image} alt="" fill unoptimized className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-lg text-outline-variant"
          >
            image
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * One table for every catalogue list — the vendor's own submissions, the
 * admin's review queue, and the published catalogue. `actions` renders the
 * approve/reject controls only where the role allows them.
 */
export function SubmissionTable({
  items,
  emptyMessage,
  showSubmitter,
  showReviewer,
  actions,
}: {
  items: CatalogItem[] | null;
  emptyMessage: string;
  showSubmitter?: boolean;
  showReviewer?: boolean;
  actions?: (item: CatalogItem) => React.ReactNode;
}) {
  const columnCount = 4 + (showSubmitter ? 1 : 0) + (showReviewer ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div className="overflow-x-auto border border-border-subtle">
      <table className="w-full text-left text-body-md">
        <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Category</th>
            {showSubmitter && <th className="px-4 py-3 font-medium">Submitted By</th>}
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {showReviewer && <th className="px-4 py-3 font-medium">Reviewed By</th>}
            {actions && <th className="px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {!items && (
            <tr>
              <td className="px-4 py-6 text-text-muted" colSpan={columnCount}>
                Loading…
              </td>
            </tr>
          )}

          {items?.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-text-muted" colSpan={columnCount}>
                {emptyMessage}
              </td>
            </tr>
          )}

          {items?.map((item) => (
            <tr key={item.id} className="align-middle">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ProductThumb item={item} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-label-sm text-text-muted">
                      {item.fabric} · {item.gender}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-muted">{item.category}</td>
              {showSubmitter && (
                <td className="px-4 py-3 text-text-muted">{item.submittedByName}</td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">PKR {item.price.toLocaleString()}</td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              {showReviewer && (
                <td className="px-4 py-3 text-text-muted">{item.reviewedByName ?? "—"}</td>
              )}
              {actions && <td className="px-4 py-3">{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
