"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Minus, Plus, RefreshCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/lib/query/cart";
import { useCategories, useProducts } from "@/lib/query/products";
import { useSession } from "@/lib/hooks/useSession";
import { isStaffRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/product-image";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const session = useSession();
  const { data: cart, isLoading } = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();
  // Pull a large page of products so we can resolve names/prices for cart
  // items without a dedicated batch-get endpoint.
  const { data: productsPage } = useProducts({ pageSize: 500 });
  const { data: categories } = useCategories();

  const productsById = useMemo(() => {
    const map = new Map(productsPage?.items.map((p) => [p.id, p]));
    return map;
  }, [productsPage]);

  const categoriesById = useMemo(() => {
    const map = new Map(categories?.map((c) => [c.id, c]));
    return map;
  }, [categories]);

  if (isStaffRole(session?.role)) {
    return (
      <main className="mx-auto max-w-md flex-1 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not available for admin accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Admin accounts manage the catalog and can&apos;t add items to a cart or place orders.</p>
            <Button className="w-full" nativeButton={false} render={<Link href="/admin/products" />}>
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Your Cart</h1>
        <Badge variant="outline">{items.length} items</Badge>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Browse the storefront and add something you like.</p>
            <Button className="mt-2" nativeButton={false} render={<Link href="/" />}>
              Continue shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-muted-foreground" />
              <span>Free shipping over $75</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCcw className="size-4 shrink-0 text-muted-foreground" />
              <span>30-day easy returns</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span>Secure checkout</span>
            </div>
          </div>

          {items.map((item) => {
            const product = productsById.get(item.productId);
            const variant = product?.variants.find((v) => v.id === item.variantId);
            const category = product ? categoriesById.get(product.categoryId) : undefined;
            const outOfStock = variant !== undefined && variant.stock <= 0;
            const lowStock = variant !== undefined && variant.stock > 0 && variant.stock <= 5;
            return (
              <Card key={item.variantId} className="overflow-hidden py-0">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <Link
                    href={product ? `/products/${product.id}` : "#"}
                    className="shrink-0 overflow-hidden rounded-lg border border-border"
                  >
                    {product ? (
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name}
                        className="size-24 object-cover"
                      />
                    ) : (
                      <div className="flex size-24 items-center justify-center bg-muted text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 space-y-1.5">
                    <Link
                      href={product ? `/products/${product.id}` : "#"}
                      className="text-sm font-medium hover:underline"
                    >
                      {product?.name ?? "Unknown product"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      {category && <Badge variant="outline">{category.name}</Badge>}
                      {variant && variant.label !== "Standard" && <Badge variant="secondary">{variant.label}</Badge>}
                      {outOfStock && <Badge variant="destructive">Out of stock</Badge>}
                      {lowStock && <Badge variant="outline">Only {variant.stock} left</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatPrice(variant?.priceCents ?? 0)} each</p>
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
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
                    <span className="text-sm font-semibold">
                      {formatPrice((variant?.priceCents ?? 0) * item.quantity)}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      // Intentional bug (Category B / cart-remove-wrong-id): the
                      // remove action sends the product id instead of the variant
                      // id, so removing multi-variant items silently fails.
                      onClick={() => removeItem.mutate(item.productId)}
                      className="h-auto px-0 text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policies &amp; support</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion multiple={false}>
                <AccordionItem value="shipping">
                  <AccordionTrigger>Shipping &amp; delivery</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Orders are typically processed within 1-2 business days. Standard delivery takes 3-7 business
                      days depending on your location; expedited options are available at checkout. Shipping is free
                      on orders over $75.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="returns">
                  <AccordionTrigger>Returns &amp; refund policy</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Not the right fit? Items can be returned within 30 days of delivery for a full refund, provided
                      they&apos;re unused and in their original packaging. Refunds are issued to your original payment
                      method within 5-10 business days of us receiving your return.
                    </p>
                    <p>Sale and final-sale items are excluded from returns unless defective.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="payment">
                  <AccordionTrigger>Payment &amp; security</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      All transactions are encrypted end-to-end. We never store your full card details on our
                      servers. Your order confirmation and receipt are emailed immediately after checkout.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="support">
                  <AccordionTrigger>Need help?</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Our support team is available 24/7 for questions about your order, shipping, or returns. Reach
                      out any time and we&apos;ll get back to you within one business day.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
