// Mock cart API. Cart is keyed by userId when logged in, or "guest" otherwise.

import { getDB } from "../db/schema";
import type { Cart, CartItem } from "../db/types";
import { isStaffRole } from "../auth/roles";
import { ApiError, withApiSimulation } from "./client";
import { getSession } from "./auth";

const GUEST_CART_ID = "guest";

async function loadCart(cartId: string): Promise<Cart> {
  const db = await getDB();
  const existing = await db.get("carts", cartId);
  return existing ?? { id: cartId, items: [], updatedAt: new Date().toISOString() };
}

export async function getCart(cartId: string = GUEST_CART_ID): Promise<Cart> {
  return withApiSimulation("GET", "/api/cart", () => loadCart(cartId));
}

export async function addToCart(
  item: CartItem,
  cartId: string = GUEST_CART_ID,
): Promise<Cart> {
  return withApiSimulation(
    "POST",
    "/api/cart/items",
    async () => {
      // Staff accounts manage the catalog, not shop it — block adding items
      // to the cart at the API layer too, not just in the UI.
      const session = getSession();
      if (isStaffRole(session?.role)) {
        throw new ApiError(403, "Admin accounts cannot add items to the cart.");
      }
      const db = await getDB();
      const cart = await loadCart(cartId);
      const existingItem = cart.items.find((i) => i.variantId === item.variantId);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }
      cart.updatedAt = new Date().toISOString();
      await db.put("carts", cart);
      return cart;
    },
    item,
  );
}

export async function updateCartItemQuantity(
  variantId: string,
  quantity: number,
  cartId: string = GUEST_CART_ID,
): Promise<Cart> {
  return withApiSimulation("PUT", `/api/cart/items/${variantId}`, async () => {
    const db = await getDB();
    const cart = await loadCart(cartId);
    const item = cart.items.find((i) => i.variantId === variantId);
    if (item) {
      item.quantity = quantity;
    }
    // Intentional bug (Category B / functional): zero/negative quantities are
    // not stripped from the cart, so the displayed cart count can drift from
    // the number of purchasable items.
    cart.updatedAt = new Date().toISOString();
    await db.put("carts", cart);
    return cart;
  });
}

export async function removeFromCart(
  variantId: string,
  cartId: string = GUEST_CART_ID,
): Promise<Cart> {
  return withApiSimulation("DELETE", `/api/cart/items/${variantId}`, async () => {
    const db = await getDB();
    const cart = await loadCart(cartId);
    cart.items = cart.items.filter((i) => i.variantId !== variantId);
    cart.updatedAt = new Date().toISOString();
    await db.put("carts", cart);
    return cart;
  });
}

export async function clearCart(cartId: string = GUEST_CART_ID): Promise<void> {
  return withApiSimulation("DELETE", "/api/cart", async () => {
    const db = await getDB();
    await db.delete("carts", cartId);
  });
}
