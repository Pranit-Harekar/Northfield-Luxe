"use client";

import Link from "next/link";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/lib/query/cart";
import { useProducts } from "@/lib/query/products";
import { useMemo } from "react";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();
  // Pull a large page of products so we can resolve names/prices for cart
  // items without a dedicated batch-get endpoint.
  const { data: productsPage } = useProducts({ pageSize: 500 });

  const productsById = useMemo(() => {
    const map = new Map(productsPage?.items.map((p) => [p.id, p]));
    return map;
  }, [productsPage]);

  if (isLoading) return <main className="mx-auto max-w-3xl px-6 py-8 text-sm text-zinc-500">Loading cart…</main>;

  const items = cart?.items ?? [];

  const subtotalCents = items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return sum + (variant?.priceCents ?? 0) * item.quantity;
  }, 0);

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Your Cart</h1>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Your cart is empty. <Link href="/" className="underline">Continue shopping</Link>.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const product = productsById.get(item.productId);
            const variant = product?.variants.find((v) => v.id === item.variantId);
            return (
              <div
                key={item.variantId}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{product?.name ?? "Unknown product"}</p>
                  {variant && variant.label !== "Standard" && (
                    <p className="text-xs text-zinc-500">{variant.label}</p>
                  )}
                  <p className="text-xs text-zinc-500">{formatPrice(variant?.priceCents ?? 0)} each</p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity.mutate({ variantId: item.variantId, quantity: Number(e.target.value) })
                  }
                  className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <span className="w-20 text-right text-sm font-semibold">
                  {formatPrice((variant?.priceCents ?? 0) * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem.mutate(item.variantId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })}

          <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <span className="text-sm text-zinc-500">Subtotal</span>
            <span className="text-lg font-semibold">{formatPrice(subtotalCents)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-2 rounded-full bg-zinc-900 px-5 py-2 text-center text-sm text-white dark:bg-white dark:text-black"
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </main>
  );
}
