export const ORDER_STATUSES = ["CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Status every newly placed order starts in. */
export const INITIAL_ORDER_STATUS: OrderStatus = "CONFIRMED";
