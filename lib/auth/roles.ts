import type { Role } from "@/lib/db/types";

/**
 * Staff roles get the Admin Portal (product/inventory/promo management,
 * analytics). "customer" gets the regular storefront/checkout experience.
 */
export function isStaffRole(role: Role | null | undefined): boolean {
  return role === "support_agent" || role === "inventory_manager" || role === "store_admin" || role === "super_admin";
}

/** Where to land a user right after login/register, based on their role. */
export function homeRouteForRole(role: Role | null | undefined): string {
  return isStaffRole(role) ? "/admin" : "/";
}
