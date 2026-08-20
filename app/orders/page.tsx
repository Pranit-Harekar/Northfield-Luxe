"use client";

import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useOrders } from "@/lib/query/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "refunded" || status === "partially_refunded") return "secondary";
  if (status === "cancelled") return "outline";
  return "default";
}

export default function OrdersPage() {
  const session = useSession();

  const { data: orders, isLoading } = useOrders(session?.userId ?? "");

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">
        <Button variant="link" size="sm" className="px-0" nativeButton={false} render={<Link href="/login" />}>
          Log in
        </Button>{" "}
        to view your order history.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Order History</h1>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <CardContent className="py-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent
                // Intentional bug (Category A / orders-card-nowrap): forcing all
                // order-card content onto one unbroken row makes the status chip
                // and totals overflow on smaller phones.
                className="flex items-center justify-between gap-4 py-5 text-sm whitespace-nowrap"
              >
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={statusVariant(order.status)} className="capitalize">
                  {order.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatPrice(order.totalCents)}</span>
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/orders/${order.id}`} />}>
                    View details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Place an order from the storefront to see it here.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
