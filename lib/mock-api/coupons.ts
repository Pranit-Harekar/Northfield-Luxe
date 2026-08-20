// Mock coupons API.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Coupon } from "../db/types";
import { getSession } from "./auth";
import { isStaffRole } from "../auth/roles";
import { ApiError, withApiSimulation } from "./client";

export async function listCoupons(): Promise<Coupon[]> {
  return withApiSimulation("GET", "/api/coupons", async () => {
    const db = await getDB();
    return db.getAll("coupons");
  });
}

export async function getCoupon(code: string): Promise<Coupon | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex("coupons", "by-code", code.toUpperCase());
  // Intentional bug (Category C / API): expired coupons are not filtered
  // out here, so they remain redeemable past their expiresAt date.
  return all[0];
}

/** Computes the discount for a coupon against a given subtotal. Shared by
 * checkout (order placement) and live coupon validation so both paths stay
 * in sync, including the "expired coupons still redeemable" bug above. */
export function computeCouponDiscountCents(coupon: Coupon, subtotalCents: number): number {
  return coupon.type === "percentage"
    ? Math.round((subtotalCents * coupon.value) / 100)
    : coupon.value;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
  discountCents?: number;
}

/** Live/debounced validation used by the checkout coupon field. Reuses
 * getCoupon so the preview always matches what placeOrder will actually
 * apply. */
export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponValidationResult> {
  return withApiSimulation("GET", `/api/coupons/validate/${code}`, async () => {
    const trimmed = code.trim();
    if (!trimmed) return { valid: false, reason: "Enter a coupon code." };
    const coupon = await getCoupon(trimmed);
    if (!coupon) return { valid: false, reason: "This coupon code doesn't exist." };
    if (!coupon.active) return { valid: false, reason: "This coupon is no longer active." };
    return { valid: true, coupon, discountCents: computeCouponDiscountCents(coupon, subtotalCents) };
  });
}

export async function createCoupon(input: Omit<Coupon, "id">): Promise<Coupon> {
  return withApiSimulation(
    "POST",
    "/api/coupons",
    async () => {
      const session = getSession();
      if (!session || !isStaffRole(session.role)) {
        throw new ApiError(403, "Only admins can create coupons.");
      }
      const db = await getDB();
      const coupon: Coupon = { ...input, id: uuid(), code: input.code.toUpperCase() };
      await db.put("coupons", coupon);
      return coupon;
    },
    input,
  );
}

export async function updateCoupon(id: string, patch: Partial<Omit<Coupon, "id">>): Promise<Coupon> {
  return withApiSimulation(
    "PUT",
    `/api/coupons/${id}`,
    async () => {
      const session = getSession();
      if (!session || !isStaffRole(session.role)) {
        throw new ApiError(403, "Only admins can edit coupons.");
      }
      const db = await getDB();
      const existing = await db.get("coupons", id);
      if (!existing) throw new ApiError(404, `Coupon ${id} not found`);
      const updated: Coupon = {
        ...existing,
        ...patch,
        id,
        code: (patch.code ?? existing.code).toUpperCase(),
      };
      await db.put("coupons", updated);
      return updated;
    },
    patch,
  );
}

export async function deleteCoupon(id: string): Promise<void> {
  return withApiSimulation("DELETE", `/api/coupons/${id}`, async () => {
    const session = getSession();
    if (!session || !isStaffRole(session.role)) {
      throw new ApiError(403, "Only admins can delete coupons.");
    }
    const db = await getDB();
    const existing = await db.get("coupons", id);
    if (!existing) throw new ApiError(404, `Coupon ${id} not found`);
    await db.delete("coupons", id);
  });
}
