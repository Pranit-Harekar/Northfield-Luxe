"use client";

import { use, useState } from "react";
import { useProduct } from "@/lib/query/products";
import { useAddToCart } from "@/lib/query/cart";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const [variantId, setVariantId] = useState<string | undefined>(undefined);

  if (isLoading) return <main className="mx-auto max-w-4xl px-6 py-8 text-sm text-zinc-500">Loading…</main>;
  if (!product) return <main className="mx-auto max-w-4xl px-6 py-8 text-sm text-zinc-500">Product not found.</main>;

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <main className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.images[0]} alt={product.name} className="aspect-square w-full rounded-lg object-cover" />
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">★ {product.rating} · {product.reviewCount} reviews</p>
        <p className="mt-4 text-zinc-700 dark:text-zinc-300">{product.description}</p>

        {product.variants.length > 1 && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-zinc-500">Options</label>
            <select
              value={selectedVariant.id}
              onChange={(e) => setVariantId(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {formatPrice(v.priceCents)} ({v.stock} in stock)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <span className="text-2xl font-bold">{formatPrice(selectedVariant.priceCents)}</span>
          <button
            onClick={() => addToCart.mutate({ productId: product.id, variantId: selectedVariant.id, quantity: 1 })}
            disabled={selectedVariant.stock === 0}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {selectedVariant.stock === 0 ? "Out of stock" : addToCart.isPending ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </main>
  );
}
