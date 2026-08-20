"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/query/cart";
import { useProducts } from "@/lib/query/products";
import { usePlaceOrder } from "@/lib/query/orders";
import { getSession } from "@/lib/mock-api/auth";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useCart();
  const { data: productsPage } = useProducts({ pageSize: 500 });
  const placeOrder = usePlaceOrder();
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const productsById = useMemo(
    () => new Map(productsPage?.items.map((p) => [p.id, p])),
    [productsPage],
  );

  const items = cart?.items ?? [];
  const orderItems = items
    .map((item) => {
      const product = productsById.get(item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!product || !variant) return null;
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceCents: variant.priceCents,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const session = getSession();
    if (!session) {
      setError("Please log in before checking out.");
      return;
    }
    try {
      const order = await placeOrder.mutateAsync({
        userId: session.userId,
        items: orderItems,
        couponCode: couponCode || undefined,
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    }
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">Your cart is empty.</main>;
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Coupon code (optional)</label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. SAVE10"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <div className="flex justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Tax and shipping will be calculated on the confirmation page.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={placeOrder.isPending}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {placeOrder.isPending ? "Placing order…" : "Place order"}
        </button>
      </form>
    </main>
  );
}
