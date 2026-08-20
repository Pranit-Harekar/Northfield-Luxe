"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { useProduct } from "@/lib/query/products";
import { useAddToCart } from "@/lib/query/cart";
import { useSession } from "@/lib/hooks/useSession";
import { isStaffRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const session = useSession();
  const staff = isStaffRole(session?.role);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);

  async function handleAddToCart(productId: string, selectedVariantId: string) {
    try {
      await addToCart.mutateAsync({ productId, variantId: selectedVariantId, quantity: 1 });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to cart");
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <Card>
          <CardHeader className="gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!product) return <main className="mx-auto max-w-4xl px-6 py-8 text-sm text-zinc-500">Product not found.</main>;

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <main className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2">
      <Card className="overflow-hidden py-0">
        {/* Intentional bug (Category E / product-image-empty-alt): the primary
            product image has an empty alt attribute, so screen readers miss the
            product identity entirely. */}
        <ProductImage src={product.images[0]} alt="" className="aspect-square w-full object-cover" />
      </Card>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <Badge variant="secondary">★ {product.rating}</Badge>
            <Badge variant="outline">{product.reviewCount} reviews</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {product.variants.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Options</p>
              <Select value={selectedVariant.id} onValueChange={(value) => setVariantId(value ?? undefined)}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label} — {formatPrice(v.priceCents)} ({v.stock} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedVariant.label}</Badge>
            <Badge variant={selectedVariant.stock > 0 ? "secondary" : "destructive"}>
              {selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : "Out of stock"}
            </Badge>
          </div>

          <div className="mt-6 flex flex-nowrap items-center gap-4 overflow-x-hidden">
            <span className="text-2xl font-bold">{formatPrice(selectedVariant.priceCents)}</span>
            {!staff && (
              <Button
                onClick={() => handleAddToCart(product.id, selectedVariant.id)}
                disabled={selectedVariant.stock === 0 || addToCart.isPending}
                // Intentional bug (Category A / product-cta-overflow): the
                // purchase CTA is given a fixed wide minimum width inside a
                // non-wrapping row, so it clips or overflows on narrow screens.
                className="min-w-64"
              >
                {selectedVariant.stock === 0 ? "Out of stock" : addToCart.isPending ? "Adding…" : "Add to cart"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
