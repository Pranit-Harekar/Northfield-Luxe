"use client";

import { use } from "react";
import { toast } from "sonner";
import { useOrder, useRefundOrder } from "@/lib/query/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "refunded" || status === "partially_refunded") return "secondary";
  if (status === "cancelled") return "outline";
  return "default";
}

export default function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);
  const refund = useRefundOrder();

  async function handleRefund(orderId: string) {
    try {
      await refund.mutateAsync({ id: orderId });
      toast.success("Refund requested");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refund failed");
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-6 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!order) return <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">Order not found.</main>;

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-8">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            <Badge variant={statusVariant(order.status)} className="capitalize">
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.variantId}>
                  <TableCell className="font-medium">{item.name} × {item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unitPriceCents * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Subtotal</TableCell>
                <TableCell className="text-right">{formatPrice(order.subtotalCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tax</TableCell>
                <TableCell className="text-right">{formatPrice(order.taxCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Shipping</TableCell>
                <TableCell className="text-right">{formatPrice(order.shippingCents)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatPrice(order.totalCents)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {order.status === "placed" && (
            <Button
              variant="outline"
              onClick={() => handleRefund(order.id)}
              disabled={refund.isPending}
            >
              {refund.isPending ? "Refunding…" : "Request refund"}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
