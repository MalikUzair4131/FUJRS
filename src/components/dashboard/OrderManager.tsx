"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  ORDER_STATUS_LABELS,
  isTerminalStatus,
  nextStatuses,
  type OrderStatus,
} from "@/lib/orderStatus";
import { listOrders, updateOrderStatus, type LocalOrder } from "@/lib/local/orders";
import { DEMO_STATS } from "@/lib/auth/demoData";

const PKR = (amount: number) => `PKR ${amount.toLocaleString()}`;

function orderRef(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

/** What each move means to the person clicking it. */
const ACTION_LABELS: Record<OrderStatus, string> = {
  CONFIRMED: "Confirm",
  PROCESSING: "Mark Processing",
  DELIVERED: "Mark Delivered",
  CANCELLED: "Cancel Order",
  REFUNDED: "Refund",
};

/** Cancelling and refunding are the two an admin shouldn't fire by accident. */
const DESTRUCTIVE: OrderStatus[] = ["CANCELLED", "REFUNDED"];

function OrderDetail({
  order,
  onStatusChange,
}: {
  order: LocalOrder;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const moves = nextStatuses(order.status);

  return (
    <div className="border-t border-border-subtle bg-surface-container-low p-5">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-label-sm uppercase tracking-widest text-text-muted">Items</p>
          <ul className="mt-3 divide-y divide-border-subtle">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-body-md">{item.title}</p>
                  <p className="text-label-sm text-text-muted">
                    Qty {item.qty}
                    {item.stitchingLabel ? ` · ${item.stitchingLabel}` : ""}
                    {item.stitchingStatus ? ` · ${item.stitchingStatus}` : ""}
                  </p>
                </div>
                <p className="whitespace-nowrap text-body-md">{PKR(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4">
            <div className="flex justify-between text-label-sm text-text-muted">
              <dt>Fabric</dt>
              <dd>{PKR(order.fabricTotal)}</dd>
            </div>
            {order.stitchingTotal > 0 && (
              <div className="flex justify-between text-label-sm text-text-muted">
                <dt>Stitching</dt>
                <dd>{PKR(order.stitchingTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between text-label-sm text-text-muted">
              <dt>Shipping</dt>
              <dd>{PKR(order.shipping)}</dd>
            </div>
            <div className="flex justify-between font-display text-body-lg text-on-surface">
              <dt>Total</dt>
              <dd>{PKR(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="text-label-sm uppercase tracking-widest text-text-muted">Ship To</p>
          <p className="mt-3 text-body-md">
            {order.firstName} {order.lastName}
          </p>
          <p className="text-body-md text-text-muted">
            {order.street}
            <br />
            {order.city}, {order.postalCode}
          </p>

          <div className="mt-6 flex justify-between border-t border-border-subtle pt-4 text-label-sm">
            <span className="uppercase text-text-muted">Payment</span>
            <span>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}</span>
          </div>
          <div className="mt-2 flex justify-between text-label-sm">
            <span className="uppercase text-text-muted">Placed</span>
            <span>{order.createdAt.slice(0, 10)}</span>
          </div>
          <div className="mt-2 flex justify-between text-label-sm">
            <span className="uppercase text-text-muted">Referred By</span>
            <span
              className={
                order.referralCode ? "uppercase tracking-widest text-marketplace-bronze" : ""
              }
            >
              {order.referralCode ?? "Direct"}
            </span>
          </div>

          <p className="mt-6 text-label-sm uppercase tracking-widest text-text-muted">Actions</p>
          {moves.length === 0 ? (
            <p className="mt-3 text-body-md text-text-muted">
              {ORDER_STATUS_LABELS[order.status]} is final — nothing further to do.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {moves.map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`border px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors ${
                    DESTRUCTIVE.includes(status)
                      ? "border-outline-variant hover:border-error hover:text-error"
                      : "border-outline-variant hover:border-marketplace-bronze hover:text-marketplace-bronze"
                  }`}
                >
                  {ACTION_LABELS[status]}
                </button>
              ))}
            </div>
          )}
          {order.paymentMethod === "cod" && !isTerminalStatus(order.status) && (
            <p className="mt-3 max-w-prose text-label-sm text-marketplace-bronze">
              Refunds are recorded here only — moving money back to the customer needs a payment
              provider, which isn&apos;t wired up yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Order management for Admin and Super Admin. Real orders placed in this
 * browser are actionable; the sample rows below them are not, because there is
 * nothing behind them to update.
 */
export function OrderManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<LocalOrder[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => setOrders(listOrders()), []);
  useEffect(refresh, [refresh]);

  function handleStatusChange(order: LocalOrder, status: OrderStatus) {
    const updated = updateOrderStatus(order.id, status);
    if (!updated) {
      toast(
        `An order that's ${ORDER_STATUS_LABELS[order.status].toLowerCase()} can't move to ${ORDER_STATUS_LABELS[status].toLowerCase()}.`,
        "info"
      );
      return;
    }
    refresh();
    toast(`${orderRef(order.id)} is now ${ORDER_STATUS_LABELS[status].toLowerCase()}.`, "success");
  }

  return (
    <section>
      <h2 className="font-display text-headline-sm">Orders</h2>
      <p className="mt-1 text-label-sm text-marketplace-bronze">
        Orders placed in this browser can be progressed, cancelled or refunded. Changes are saved on
        this device only.
      </p>

      <div className="mt-4 overflow-x-auto border border-border-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Referred</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {!orders && (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={7}>
                  Loading…
                </td>
              </tr>
            )}

            {orders?.map((order) => {
              const open = openId === order.id;
              return (
                <tr key={order.id}>
                  <td className="px-4 py-3">{orderRef(order.id)}</td>
                  <td className="px-4 py-3">
                    {order.firstName} {order.lastName}
                  </td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{PKR(order.total)}</td>
                  <td className="px-4 py-3 text-label-sm uppercase tracking-widest text-marketplace-bronze">
                    {order.referralCode ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-label-sm uppercase text-text-muted">
                    {ORDER_STATUS_LABELS[order.status]}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenId(open ? null : order.id)}
                      aria-expanded={open}
                      className="border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
                    >
                      {open ? "Close" : "Open"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {orders?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={7}>
                  No real orders on this device yet — the sample rows below show what this table
                  looks like in use.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* The open order's detail sits below the table so it isn't squeezed into a cell. */}
      {orders
        ?.filter((order) => order.id === openId)
        .map((order) => (
          <div key={order.id} className="mt-4 border border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-display text-headline-sm">{orderRef(order.id)}</p>
                <p className="text-label-sm text-text-muted">
                  {order.firstName} {order.lastName} · {ORDER_STATUS_LABELS[order.status]}
                </p>
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="border border-outline-variant px-4 py-2 font-label-sm text-label-sm uppercase tracking-widest transition-colors hover:border-marketplace-bronze hover:text-marketplace-bronze"
              >
                Close
              </button>
            </div>
            <OrderDetail order={order} onStatusChange={(s) => handleStatusChange(order, s)} />
          </div>
        ))}

      <h3 className="mt-10 font-display text-headline-sm">Sample Orders</h3>
      <p className="mt-1 text-label-sm text-marketplace-bronze">
        Fixtures that make the dashboard look lived-in. They have no order behind them, so they
        can&apos;t be actioned.
      </p>
      <div className="mt-4 overflow-x-auto border border-border-subtle">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {DEMO_STATS.recentOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">{orderRef(order.id)}</td>
                <td className="px-4 py-3">{order.customer}</td>
                <td className="px-4 py-3">{order.itemCount}</td>
                <td className="px-4 py-3 whitespace-nowrap">{PKR(order.total)}</td>
                <td className="px-4 py-3 text-label-sm uppercase text-text-muted">
                  {order.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
