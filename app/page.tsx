"use client";

import { useState } from "react";
import Link from "next/link";
import { useCategories, useProducts } from "@/lib/query/products";
import { useAddToCart } from "@/lib/query/cart";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Home() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({ categoryId, search: search || undefined, sort, pageSize: 24 });
  const addToCart = useAddToCart();

  const parentCategories = categories?.filter((c) => c.parentId === null) ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value || undefined)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All categories</option>
          {parentCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        {data && <span className="ml-auto text-sm text-zinc-500">{data.total} products</span>}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading products…</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((product) => (
            <div
              key={product.id}
              className="flex flex-col rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <Link href={`/products/${product.id}`} className="mb-2 block overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
              </Link>
              <Link href={`/products/${product.id}`} className="text-sm font-medium hover:underline">
                {product.name}
              </Link>
              <span className="text-xs text-zinc-500">★ {product.rating} ({product.reviewCount})</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{formatPrice(product.basePriceCents)}</span>
                <button
                  onClick={() =>
                    addToCart.mutate({ productId: product.id, variantId: product.variants[0].id, quantity: 1 })
                  }
                  className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
