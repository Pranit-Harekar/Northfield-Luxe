"use client";

import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useOrders } from "@/lib/query/orders";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const session = useSession();

  const { data: orders, isLoading } = useOrders(session?.userId ?? "");

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">
        <Link href="/login" className="underline">Log in</Link> to view your order history.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Order History</h1>
      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading orders…</p>
      ) : orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm hover:border-zinc-400 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs capitalize dark:bg-zinc-800">
                {order.status.replace("_", " ")}
              </span>
              <span className="font-semibold">{formatPrice(order.totalCents)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No orders yet.</p>
      )}
    </main>
  );
}
