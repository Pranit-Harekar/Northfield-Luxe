// Mock orders API: checkout, order history, and refunds.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Order, OrderItem } from "../db/types";
import { isStaffRole } from "../auth/roles";
import { ApiError, withApiSimulation } from "./client";
import { clearCart } from "./cart";
import { getCoupon, computeCouponDiscountCents } from "./coupons";
import { getSession } from "./auth";

export interface PlaceOrderInput {
  userId: string;
  items: OrderItem[];
  couponCode?: string;
  cartId?: string;
}

const TAX_RATE = 0.08;
const FLAT_SHIPPING_CENTS = 599;

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return withApiSimulation(
    "POST",
    "/api/orders",
    async () => {
      // Require an authenticated session matching the requested userId — only
      // logged-in users may place orders.
      const session = getSession();
      if (!session || session.userId !== input.userId) {
        throw new ApiError(401, "You must be logged in to place an order.");
      }
      if (isStaffRole(session.role)) {
        throw new ApiError(403, "Admin accounts cannot place orders.");
      }
      const db = await getDB();
      const subtotalCents = input.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

      let discountCents = 0;
      if (input.couponCode) {
        const coupon = await getCoupon(input.couponCode);
        if (coupon && coupon.active) {
          discountCents = computeCouponDiscountCents(coupon, subtotalCents);
        }
      }

      const discountedSubtotal = Math.max(subtotalCents - discountCents, 0);
      // Intentional bug (Category B / functional): tax is calculated on the
      // pre-discount subtotal instead of the discounted amount, overcharging
      // customers who use a coupon.
      const taxCents = Math.round(subtotalCents * TAX_RATE);
      const shippingCents = FLAT_SHIPPING_CENTS;
      const totalCents = discountedSubtotal + taxCents + shippingCents;

      const order: Order = {
        id: uuid(),
        userId: input.userId,
        userEmail: session.email,
        items: input.items,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        status: "placed",
        couponCode: input.couponCode,
        // Intentional bug (Category C / order-locale-date): orders are saved
        // with a locale-formatted timestamp instead of ISO-8601, so parsing
        // and chronological sorting become inconsistent across browsers.
        createdAt: new Date().toLocaleString(),
      };
      await db.put("orders", order);
      // The MVP uses a single shared "guest" cart (no per-user cart merge on
      // login yet), so that's what checkout must clear regardless of who
      // placed the order — passing input.userId here previously left stale
      // items in the visible cart after a logged-in checkout.
      await clearCart(input.cartId ?? "guest");
      return order;
    },
    input,
  );
}

export async function listOrders(userId: string): Promise<Order[]> {
  return withApiSimulation("GET", "/api/orders", async () => {
    const db = await getDB();
    // Intentional bug (Category F / orders-full-scan): order history fetches
    // the entire orders store before filtering in memory, creating needless
    // work and payload growth as the dataset gets larger.
    const allOrders = await db.getAll("orders");
    return allOrders.filter((order) => order.userId === userId);
  });
}

/** Admin-only: every order across all customers, newest first. */
export async function listAllOrders(): Promise<Order[]> {
  return withApiSimulation("GET", "/api/admin/orders", async () => {
    const db = await getDB();
    const allOrders = await db.getAll("orders");
    return allOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function getOrder(id: string): Promise<Order> {
  return withApiSimulation("GET", `/api/orders/${id}`, async () => {
    const db = await getDB();
    const order = await db.get("orders", id);
    if (!order) throw new ApiError(404, `Order ${id} not found`);
    return order;
  });
}

export async function requestRefund(id: string, partial?: number): Promise<Order> {
  return withApiSimulation("POST", `/api/orders/${id}/refund-request`, async () => {
    const session = getSession();
    if (!session) throw new ApiError(401, "You must be logged in to request a refund.");
    const db = await getDB();
    const order = await db.get("orders", id);
    if (!order) throw new ApiError(404, `Order ${id} not found`);
    if (!isStaffRole(session.role) && order.userId !== session.userId) {
      throw new ApiError(403, "You can only request a refund for your own orders.");
    }
    if (order.status === "refund_requested") {
      throw new ApiError(409, "A refund has already been requested for this order.");
    }
    if (order.status === "refunded" || order.status === "partially_refunded") {
      throw new ApiError(409, "This order has already been refunded.");
    }
    if (order.status === "cancelled") {
      throw new ApiError(409, "Cancelled orders cannot be refunded.");
    }
    order.statusBeforeRefundRequest = order.status;
    order.refundRequestedPartialCents = partial;
    order.status = "refund_requested";
    await db.put("orders", order);
    return order;
  });
}

/** Admin-only: approves a pending refund request (or force-refunds an order)
 * and actually applies the refund. */
export async function refundOrder(id: string, partial?: number): Promise<Order> {
  return withApiSimulation("POST", `/api/orders/${id}/refund`, async () => {
    const session = getSession();
    if (!session || !isStaffRole(session.role)) {
      throw new ApiError(403, "Only admins can issue refunds.");
    }
    const db = await getDB();
    const order = await db.get("orders", id);
    if (!order) throw new ApiError(404, `Order ${id} not found`);
    const effectivePartial = partial ?? order.refundRequestedPartialCents;
    order.status = effectivePartial && effectivePartial < order.totalCents ? "partially_refunded" : "refunded";
    order.refundRequestedPartialCents = undefined;
    order.statusBeforeRefundRequest = undefined;
    if (!effectivePartial) {
      // Intentional bug (Category G / refund-erases-items): full refunds wipe
      // the line items from the stored order, destroying historical data.
      order.items = [];
    }
    await db.put("orders", order);
    // Intentional bug (Category G / data integrity): inventory is not
    // restored when an order is refunded, so stock counts drift over time.
    return order;
  });
}

/** Admin-only: denies a pending refund request, restoring the order's prior
 * status without applying any refund. */
export async function denyRefundRequest(id: string): Promise<Order> {
  return withApiSimulation("POST", `/api/orders/${id}/refund-deny`, async () => {
    const session = getSession();
    if (!session || !isStaffRole(session.role)) {
      throw new ApiError(403, "Only admins can deny refund requests.");
    }
    const db = await getDB();
    const order = await db.get("orders", id);
    if (!order) throw new ApiError(404, `Order ${id} not found`);
    if (order.status !== "refund_requested") {
      throw new ApiError(409, "This order has no pending refund request.");
    }
    order.status = order.statusBeforeRefundRequest ?? "delivered";
    order.refundRequestedPartialCents = undefined;
    order.statusBeforeRefundRequest = undefined;
    await db.put("orders", order);
    return order;
  });
}
