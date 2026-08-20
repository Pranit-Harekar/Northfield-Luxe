// Mock coupons API.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Coupon } from "../db/types";
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

export async function createCoupon(input: Omit<Coupon, "id">): Promise<Coupon> {
  return withApiSimulation(
    "POST",
    "/api/coupons",
    async () => {
      const db = await getDB();
      const coupon: Coupon = { ...input, id: uuid(), code: input.code.toUpperCase() };
      await db.put("coupons", coupon);
      return coupon;
    },
    input,
  );
}

export async function deleteCoupon(id: string): Promise<void> {
  return withApiSimulation("DELETE", `/api/coupons/${id}`, async () => {
    const db = await getDB();
    const existing = await db.get("coupons", id);
    if (!existing) throw new ApiError(404, `Coupon ${id} not found`);
    await db.delete("coupons", id);
  });
}
