"use client";

import Link from "next/link";
import { ArrowLeft, Ban, Box, CheckCircle2, Clock3, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { toast } from "sonner";
import { useDenyRefundRequest, useOrder, useRefundOrder, useRequestRefund } from "@/lib/query/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/types";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "refunded" || status === "partially_refunded") return "secondary";
  if (status === "cancelled" || status === "refund_requested") return "outline";
  return "default";
}

const HAPPY_PATH: { status: OrderStatus; label: string; icon: typeof Box }[] = [
  { status: "placed", label: "Placed", icon: Box },
  { status: "processing", label: "Processing", icon: PackageCheck },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "refund_requested") {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3.5 text-sm">
        <Clock3 className="size-5 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          A refund was requested for this order and is awaiting admin review.
        </span>
      </div>
    );
  }

  if (status === "cancelled" || status === "refunded" || status === "partially_refunded") {
    const isCancelled = status === "cancelled";
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3.5 text-sm">
        {isCancelled ? (
          <Ban className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <RotateCcw className="size-5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          {isCancelled
            ? "This order was cancelled and was not fulfilled."
            : status === "refunded"
              ? "This order was fully refunded."
              : "Part of this order was refunded."}
        </span>
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.findIndex((step) => step.status === status);

  return (
    <div className="flex items-center rounded-lg border px-4 py-5 sm:px-6">
      {HAPPY_PATH.map((step, index) => {
        const Icon = step.icon;
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 transition-colors",
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/25 text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : isComplete ? "text-foreground/80" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < HAPPY_PATH.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-0.5 flex-1",
                  isComplete && index < currentIndex ? "bg-primary" : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface OrderDetailViewProps {
  orderId: string;
  /** e.g. "Shop" (customer) or "Admin" */
  rootLabel: string;
  rootHref: string;
  /** e.g. "Orders" */
  listLabel: string;
  listHref: string;
  /** Whether to surface which customer placed the order (admin view only). */
  showCustomer?: boolean;
}

export function OrderDetailView({ orderId, rootLabel, rootHref, listLabel, listHref, showCustomer }: OrderDetailViewProps) {
  const { data: order, isLoading } = useOrder(orderId);
  const requestRefund = useRequestRefund();
  const issueRefund = useRefundOrder();
  const denyRefund = useDenyRefundRequest();

  async function handleRequestRefund(id: string) {
    try {
      await requestRefund.mutateAsync({ id });
      toast.success("Refund requested — an admin will review it shortly.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refund request failed");
    }
  }

  async function handleIssueRefund(id: string) {
    try {
      await issueRefund.mutateAsync({ id });
      toast.success("Refund issued");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refund failed");
    }
  }

  async function handleDenyRefund(id: string) {
    try {
      await denyRefund.mutateAsync(id);
      toast.success("Refund request denied");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deny refund request");
    }
  }

  const backLink = (
    <Button
      variant="ghost"
      size="sm"
      className="mb-6 -ml-2 gap-1.5 text-muted-foreground"
      nativeButton={false}
      render={<Link href={listHref} />}
    >
      <ArrowLeft className="size-4" />
      Back to {listLabel.toLowerCase()}
    </Button>
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Skeleton className="mb-8 h-9 w-1/3" />
        <Skeleton className="mb-8 h-24 w-full" />
        <div className="space-y-8">
          <Card>
            <CardHeader className="gap-4 border-b pb-6">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {backLink}
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </main>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={rootHref} />}>{rootLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={listHref} />}>{listLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{order.id.slice(0, 8)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {backLink}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Order #{order.id.slice(0, 8)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
          {showCustomer && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              Customer:{" "}
              <Link href={`/admin/users?highlight=${order.userId}`} className="text-foreground underline-offset-4 hover:underline">
                {order.userEmail || "Unknown"}
              </Link>
              {order.archived && <Badge variant="outline">Account deleted</Badge>}
            </p>
          )}
        </div>
        <Badge variant={statusVariant(order.status)} className="px-3 py-1.5 text-sm capitalize">
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mb-8">
        <OrderProgress status={order.status} />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader className="border-b pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Items</CardTitle>
              <p className="text-sm text-muted-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="divide-y">
              {order.items.length > 0 ? (
                order.items.map((item) => (
                  <li
                    key={item.variantId}
                    className="flex items-center justify-between gap-6 py-6 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/products/${item.productId}`}
                        className="flex size-16 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br from-muted to-muted/40 transition-opacity hover:opacity-80"
                      >
                        <Box className="size-6 text-muted-foreground" />
                      </Link>
                      <div>
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-medium leading-tight underline-offset-4 hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Qty {item.quantity} &middot; {formatPrice(item.unitPriceCents)} each
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">{formatPrice(item.unitPriceCents * item.quantity)}</p>
                  </li>
                ))
              ) : (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  No item details available for this order.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-lg">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              {order.couponCode ? (
                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm sm:max-w-xs">
                  Coupon <span className="font-medium text-foreground">{order.couponCode}</span> applied
                </div>
              ) : (
                <div />
              )}

              <div className="w-full space-y-3 sm:max-w-xs">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatPrice(order.taxCents)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingCents)}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalCents)}</span>
                </div>

                {!showCustomer &&
                  ["placed", "processing", "shipped", "delivered"].includes(order.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="outline" className="w-full" disabled={requestRefund.isPending} />}
                      >
                        {requestRefund.isPending ? "Requesting…" : "Request refund"}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Request a refund?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This sends a refund request for the full order total of {formatPrice(order.totalCents)}{" "}
                            to our team for review. You&apos;ll be notified once it&apos;s approved or denied.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRequestRefund(order.id)}>
                            Request refund
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                {showCustomer && order.status === "refund_requested" && (
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="outline" className="w-full" disabled={denyRefund.isPending} />}
                      >
                        Deny request
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deny this refund request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The order status will revert to &quot;{order.statusBeforeRefundRequest ?? "delivered"}
                            &quot; and no refund will be issued.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDenyRefund(order.id)}>
                            Deny request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button className="w-full" disabled={issueRefund.isPending} />}>
                        {issueRefund.isPending ? "Issuing…" : "Issue refund"}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Issue this refund?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This refunds{" "}
                            {formatPrice(order.refundRequestedPartialCents ?? order.totalCents)} to the customer.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleIssueRefund(order.id)}>
                            Issue refund
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
