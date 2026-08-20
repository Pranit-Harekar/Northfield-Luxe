"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, RefreshCcw, Truck, Sparkles, BadgeCheck, Loader2, XCircle } from "lucide-react";
import { useAddToCart, useCart } from "@/lib/query/cart";
import { useCategories, useProducts } from "@/lib/query/products";
import { usePlaceOrder } from "@/lib/query/orders";
import { useValidateCoupon } from "@/lib/query/coupons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useSession } from "@/lib/hooks/useSession";
import { isStaffRole } from "@/lib/auth/roles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/product-image";
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

const SHIPPING_OPTIONS = [
  { value: "standard", label: "Standard shipping (3-7 business days)", flatCents: 599, eta: "3-7 business days" },
  { value: "express", label: "Express shipping (2-3 business days)", flatCents: 1499, eta: "2-3 business days" },
  { value: "overnight", label: "Overnight shipping (next business day)", flatCents: 2999, eta: "next business day" },
] as const;

const FREE_SHIPPING_THRESHOLD_CENTS = 7500;

export default function CheckoutPage() {
  const router = useRouter();
  const session = useSession();
  const { data: cart } = useCart();
  const { data: productsPage } = useProducts({ pageSize: 500 });
  const { data: categories } = useCategories();
  const placeOrder = usePlaceOrder();
  const addToCart = useAddToCart();
  const [couponCode, setCouponCode] = useState("");
  const [fullName, setFullName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [shippingMethod, setShippingMethod] = useState<(typeof SHIPPING_OPTIONS)[number]["value"]>("standard");
  const [error, setError] = useState<string | null>(null);

  const productsById = useMemo(
    () => new Map(productsPage?.items.map((p) => [p.id, p])),
    [productsPage],
  );

  const categoriesById = useMemo(
    () => new Map(categories?.map((c) => [c.id, c])),
    [categories],
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
        image: product.images[0],
        category: categoriesById.get(product.categoryId),
        variantLabel: variant.label !== "Standard" ? variant.label : null,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const selectedShipping = SHIPPING_OPTIONS.find((o) => o.value === shippingMethod) ?? SHIPPING_OPTIONS[0];
  const qualifiesForFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS && shippingMethod === "standard";
  const shippingCents = qualifiesForFreeShipping ? 0 : selectedShipping.flatCents;
  const estimatedTaxCents = Math.round(subtotalCents * 0.08);

  const debouncedCouponCode = useDebouncedValue(couponCode.trim(), 400);
  const isCouponPending = debouncedCouponCode !== couponCode.trim();
  const { data: couponResult, isFetching: isValidatingCoupon } = useValidateCoupon(
    debouncedCouponCode,
    subtotalCents,
  );
  const discountCents = couponResult?.valid ? (couponResult.discountCents ?? 0) : 0;
  const totalCents = Math.max(0, subtotalCents + shippingCents + estimatedTaxCents - discountCents);

  const cartProductIds = new Set(orderItems.map((i) => i.productId));
  const recommendedProducts = (productsPage?.items ?? [])
    .filter((p) => !cartProductIds.has(p.id) && p.variants.length > 0)
    .slice(0, 4);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!session) {
      setError("Please log in before checking out.");
      return;
    }
    if (isStaffRole(session.role)) {
      setError("Admin accounts cannot place orders.");
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

  if (!session) {
    return (
      <main className="mx-auto max-w-md flex-1 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Log in to check out</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>You need an account to place an order. Your cart will be waiting for you.</p>
            <Button className="w-full" nativeButton={false} render={<Link href="/login" />}>
              Log in or sign up
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isStaffRole(session.role)) {
    return (
      <main className="mx-auto max-w-md flex-1 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not available for admin accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Admin accounts manage the catalog and can&apos;t place orders.</p>
            <Button className="w-full" nativeButton={false} render={<Link href="/admin/products" />}>
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-zinc-500">Your cart is empty.</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
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
                {couponCode.trim().length > 0 && (
                  <p className="flex items-center gap-1.5 text-xs">
                    {isCouponPending || isValidatingCoupon ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" />
                        Checking code…
                      </span>
                    ) : couponResult?.valid ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="size-3.5" />
                        {couponResult.coupon?.code} applied — {formatPrice(couponResult.discountCents ?? 0)} off
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <XCircle className="size-3.5" />
                        {couponResult?.reason ?? "Coupon not found"}
                      </span>
                    )}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel>Shipping option</FieldLabel>
                <Select
                  value={shippingMethod}
                  onValueChange={(value) => setShippingMethod((value as typeof shippingMethod) ?? "standard")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {qualifiesForFreeShipping && (
                  <p className="text-xs text-muted-foreground">
                    Your order qualifies for free standard shipping.
                  </p>
                )}
              </Field>
            </FieldGroup>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 text-sm">
              {orderItems.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3">
                  <Link
                    href={`/products/${item.productId}`}
                    className="shrink-0 overflow-hidden rounded-lg border border-border"
                  >
                    <ProductImage src={item.image} alt={item.name} className="size-16 object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link href={`/products/${item.productId}`} className="line-clamp-1 font-medium hover:underline">
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {item.category.name}
                        </Badge>
                      )}
                      {item.variantLabel && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.variantLabel}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-medium">{formatPrice(item.unitPriceCents * item.quantity)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping{" "}
                  <span className="text-xs">
                    ({selectedShipping.eta}
                    {qualifiesForFreeShipping ? ", free" : ""})
                  </span>
                </span>
                <span>{shippingCents === 0 ? "Free" : formatPrice(shippingCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated tax</span>
                <span>{formatPrice(estimatedTaxCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({couponResult?.coupon?.code})</span>
                  <span>-{formatPrice(discountCents)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
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

      {recommendedProducts.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">You might also like</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recommendedProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <Card key={product.id} className="overflow-hidden py-0">
                  <Link href={`/products/${product.id}`}>
                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      className="aspect-square w-full object-cover"
                    />
                  </Link>
                  <CardContent className="space-y-2 p-3">
                    <Link href={`/products/${product.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                      {product.name}
                    </Link>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{formatPrice(variant.priceCents)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addToCart.mutate({ productId: product.id, variantId: variant.id, quantity: 1 })
                        }
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
