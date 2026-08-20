// Mock orders API: checkout, order history, and refunds.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Order, OrderItem } from "../db/types";
import { ApiError, withApiSimulation } from "./client";
import { clearCart } from "./cart";
import { getCoupon } from "./coupons";

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
      const db = await getDB();
      const subtotalCents = input.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

      let discountCents = 0;
      if (input.couponCode) {
        const coupon = await getCoupon(input.couponCode);
        if (coupon && coupon.active) {
          discountCents =
            coupon.type === "percentage"
              ? Math.round((subtotalCents * coupon.value) / 100)
              : coupon.value;
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
        items: input.items,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        status: "placed",
        couponCode: input.couponCode,
        createdAt: new Date().toISOString(),
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
    return db.getAllFromIndex("orders", "by-user", userId);
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

export async function refundOrder(id: string, partial?: number): Promise<Order> {
  return withApiSimulation("POST", `/api/orders/${id}/refund`, async () => {
    const db = await getDB();
    const order = await db.get("orders", id);
    if (!order) throw new ApiError(404, `Order ${id} not found`);
    order.status = partial && partial < order.totalCents ? "partially_refunded" : "refunded";
    await db.put("orders", order);
    // Intentional bug (Category G / data integrity): inventory is not
    // restored when an order is refunded, so stock counts drift over time.
    return order;
  });
}
