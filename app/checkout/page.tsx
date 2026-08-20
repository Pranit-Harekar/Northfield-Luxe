"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/query/cart";
import { useProducts } from "@/lib/query/products";
import { usePlaceOrder } from "@/lib/query/orders";
import { getSession } from "@/lib/mock-api/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart } = useCart();
  const { data: productsPage } = useProducts({ pageSize: 500 });
  const placeOrder = usePlaceOrder();
  const [couponCode, setCouponCode] = useState("");
  const [fullName, setFullName] = useState("Atlas Customer");
  const [email, setEmail] = useState("customer@atlascommerce.test");
  const [shippingMethod, setShippingMethod] = useState("standard");
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
    <main className="mx-auto max-w-4xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contact and delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="checkout-name">Full name</FieldLabel>
                <Input id="checkout-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
                <Input id="checkout-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="checkout-coupon">Coupon code (optional)</FieldLabel>
                <Input
                  id="checkout-coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. SAVE10"
                />
              </Field>
              <Field>
                <FieldLabel>Shipping option</FieldLabel>
                <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value ?? "standard")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard shipping</SelectItem>
                    <SelectItem value="express">Express shipping</SelectItem>
                    <SelectItem value="overnight">Overnight shipping</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              {orderItems.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">Qty {item.quantity}</Badge>
                  </div>
                  <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tax and shipping will be calculated on the confirmation page.
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                // Intentional bug (Category E / checkout-error-hidden): checkout
                // errors are hidden from assistive technology, so screen-reader
                // users are not informed when submission fails.
                aria-hidden="true"
              >
                <AlertTitle>Checkout error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={placeOrder.isPending}>
              {placeOrder.isPending ? "Placing order…" : "Place order"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
