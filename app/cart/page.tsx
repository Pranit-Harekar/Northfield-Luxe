"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/lib/query/cart";
import { useProducts } from "@/lib/query/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <CardContent className="py-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  const items = cart?.items ?? [];

  const subtotalCents = items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return sum + (variant?.priceCents ?? 0) * item.quantity;
  }, 0);

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Your Cart</h1>
        <Badge variant="outline">{items.length} items</Badge>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Your cart is empty.{" "}
            <Button variant="link" size="sm" className="px-0" nativeButton={false} render={<Link href="/" />}>
              Continue shopping
            </Button>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const product = productsById.get(item.productId);
            const variant = product?.variants.find((v) => v.id === item.variantId);
            return (
              <Card key={item.variantId}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{product?.name ?? "Unknown product"}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {variant && variant.label !== "Standard" && <Badge variant="secondary">{variant.label}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatPrice(variant?.priceCents ?? 0)} each</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity.mutate({ variantId: item.variantId, quantity: item.quantity - 1 })}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity.mutate({ variantId: item.variantId, quantity: Number(e.target.value) })
                      }
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity.mutate({ variantId: item.variantId, quantity: item.quantity + 1 })}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <span className="w-24 text-left text-sm font-semibold sm:text-right">
                    {formatPrice((variant?.priceCents ?? 0) * item.quantity)}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    // Intentional bug (Category B / cart-remove-wrong-id): the
                    // remove action sends the product id instead of the variant
                    // id, so removing multi-variant items silently fails.
                    onClick={() => removeItem.mutate(item.productId)}
                    className="px-0 text-destructive"
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(subtotalCents)}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">Taxes and shipping are calculated during checkout.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" nativeButton={false} render={<Link href="/checkout" />}>
                Proceed to checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
