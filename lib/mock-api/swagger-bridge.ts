// Routes the Swagger UI "Execute" button straight into this same browser
// tab's real mock API layer (IndexedDB-backed), instead of making an actual
// network request to a server that doesn't exist. See app/swagger/page.tsx,
// which patches window.fetch for /api/* requests only, using this module.
//
// This means Execute calls are REAL: they read/write the same IndexedDB data
// and localStorage session as the rest of the app, including intentional
// bugs, auth checks, and validation. Nothing here is faked or stubbed except
// the two endpoints noted below that have no backing implementation anywhere
// in the app.

import { getDB } from "../db/schema";
import type { InventoryRecord } from "../db/types";
import { isStaffRole } from "../auth/roles";
import { ApiError } from "./client";
import * as auth from "./auth";
import * as products from "./products";
import * as orders from "./orders";
import * as coupons from "./coupons";

async function listInventory(): Promise<InventoryRecord[]> {
  const db = await getDB();
  return db.getAll("inventory");
}

async function updateInventory(id: string, patch: Partial<InventoryRecord>): Promise<InventoryRecord> {
  const db = await getDB();
  const existing = await db.get("inventory", id);
  if (!existing) throw new ApiError(404, `Inventory record ${id} not found`);
  const updated = { ...existing, ...patch, id };
  await db.put("inventory", updated);
  return updated;
}

interface RouteContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}

type RouteHandler = (ctx: RouteContext) => Promise<unknown>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

function route(method: string, path: string, handler: RouteHandler): Route {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/\{([^}]+)\}/g, (_match, key: string) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$",
  );
  return { method, pattern, keys, handler };
}

const routes: Route[] = [
  route("POST", "/api/auth/login", ({ body }) => {
    const { email, password } = body as { email: string; password: string };
    return auth.login(email, password);
  }),
  route("POST", "/api/auth/register", ({ body }) => auth.register(body as { email: string; password: string; name: string })),
  route("POST", "/api/auth/reset-password", ({ body }) => auth.resetPassword((body as { email: string }).email)),
  route("POST", "/api/auth/logout", () => auth.logout()),

  route("GET", "/api/products", ({ query }) =>
    products.listProducts({
      categoryId: query.get("categoryId") ?? undefined,
      search: query.get("search") ?? undefined,
      page: query.get("page") ? Number(query.get("page")) : undefined,
      pageSize: query.get("pageSize") ? Number(query.get("pageSize")) : undefined,
      sort: (query.get("sort") as products.ProductListParams["sort"]) ?? undefined,
    }),
  ),
  route("POST", "/api/products", ({ body }) => products.createProduct(body as Parameters<typeof products.createProduct>[0])),
  route("GET", "/api/products/{id}", ({ params }) => products.getProduct(params.id)),
  route("PUT", "/api/products/{id}", ({ params, body }) => products.updateProduct(params.id, body as Parameters<typeof products.updateProduct>[1])),
  route("DELETE", "/api/products/{id}", ({ params }) => products.deleteProduct(params.id)),

  route("GET", "/api/inventory", () => listInventory()),
  route("PUT", "/api/inventory/{id}", ({ params, body }) => updateInventory(params.id, body as Partial<InventoryRecord>)),
  route("POST", "/api/transfers", () => {
    // Stock transfers were never actually implemented anywhere in the app
    // (no "transfers" store, no UI) — be honest about that instead of
    // faking a success response.
    throw new ApiError(501, "Stock transfers aren't implemented in this mock environment.");
  }),

  route("POST", "/api/orders", ({ body }) => orders.placeOrder(body as Parameters<typeof orders.placeOrder>[0])),
  route("GET", "/api/orders", () => {
    const session = auth.getSession();
    if (!session) throw new ApiError(401, "You must be logged in to view orders.");
    return isStaffRole(session.role) ? orders.listAllOrders() : orders.listOrders(session.userId);
  }),
  route("GET", "/api/orders/{id}", ({ params }) => orders.getOrder(params.id)),
  route("POST", "/api/orders/{id}/refund", ({ params, body }) =>
    orders.refundOrder(params.id, (body as { partial?: number } | undefined)?.partial),
  ),
  route("POST", "/api/orders/{id}/refund-request", ({ params, body }) =>
    orders.requestRefund(params.id, (body as { partial?: number } | undefined)?.partial),
  ),
  route("POST", "/api/orders/{id}/refund-deny", ({ params }) => orders.denyRefundRequest(params.id)),

  route("GET", "/api/coupons", () => coupons.listCoupons()),
  route("POST", "/api/coupons", ({ body }) => coupons.createCoupon(body as Parameters<typeof coupons.createCoupon>[0])),
  route("PUT", "/api/coupons/{id}", ({ params, body }) => coupons.updateCoupon(params.id, body as Parameters<typeof coupons.updateCoupon>[1])),
  route("DELETE", "/api/coupons/{id}", ({ params }) => coupons.deleteCoupon(params.id)),
  route("GET", "/api/coupons/validate/{code}", ({ params, query }) =>
    coupons.validateCoupon(params.code, Number(query.get("subtotalCents") ?? 0)),
  ),
];

function resolveUrl(input: RequestInfo | URL): URL {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return new URL(raw, window.location.origin);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body ?? null), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Returns a fetch-compatible function that serves /api/* requests from the
 * real mock API instead of the network. Intended to be swapped in only for
 * requests under /api/ (see app/swagger/page.tsx), never globally. */
export function createMockFetch() {
  return async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = resolveUrl(input);
    const method = (init?.method ?? "GET").toUpperCase();

    let body: unknown;
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch {
        body = init.body;
      }
    }

    for (const r of routes) {
      if (r.method !== method) continue;
      const match = r.pattern.exec(url.pathname);
      if (!match) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1]);
      });
      try {
        const result = await r.handler({ params, query: url.searchParams, body });
        return jsonResponse(result, 200);
      } catch (err) {
        if (err instanceof ApiError) {
          return jsonResponse({ error: err.message }, err.status);
        }
        return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
      }
    }

    return jsonResponse({ error: `No mock route for ${method} ${url.pathname}` }, 404);
  };
}
