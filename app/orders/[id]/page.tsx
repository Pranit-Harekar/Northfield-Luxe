"use client";

import { use } from "react";
import { useOrder, useRefundOrder } from "@/lib/query/orders";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);
  const refund = useRefundOrder();

  if (isLoading) return <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">Loading order…</main>;
  if (!order) return <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">Order not found.</main>;

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
      <p className="mb-6 text-xs text-zinc-500 capitalize">
        {order.status.replace("_", " ")} · {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        {order.items.map((item) => (
          <div key={item.variantId} className="flex justify-between text-sm">
            <span>{item.name} × {item.quantity}</span>
            <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-1 border-t border-zinc-200 pt-2 text-sm dark:border-zinc-800">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Tax</span>
            <span>{formatPrice(order.taxCents)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {order.status === "placed" && (
        <button
          onClick={() => refund.mutate({ id: order.id })}
          disabled={refund.isPending}
          className="mt-4 rounded-full border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
        >
          {refund.isPending ? "Refunding…" : "Request refund"}
        </button>
      )}
    </main>
  );
}
