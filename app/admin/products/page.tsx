"use client";

import { useState } from "react";
import { useCategories, useProducts } from "@/lib/query/products";
import { useCreateProduct, useDeleteProduct } from "@/lib/query/adminProducts";
import { GENERIC_PRODUCT_IMAGE } from "@/lib/db/seed";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const { data, isLoading } = useProducts({ pageSize: 50 });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const [name, setName] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const leafCategories = categories?.filter((c) => c.parentId !== null) ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !priceDollars || !categoryId) return;
    const basePriceCents = Math.round(parseFloat(priceDollars) * 100);
    await createProduct.mutateAsync({
      name,
      description: `${name} — added via Admin Portal.`,
      categoryId,
      basePriceCents,
      images: [GENERIC_PRODUCT_IMAGE],
      variants: [{ id: crypto.randomUUID(), sku: `SKU-${Date.now()}`, label: "Standard", priceCents: basePriceCents, stock: 25 }],
      rating: 0,
      reviewCount: 0,
    });
    setName("");
    setPriceDollars("");
    setCategoryId("");
  }

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Product Management</h1>

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Price (USD)</label>
          <input
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            type="number"
            step="0.01"
            className="w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select…</option>
            {leafCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={createProduct.isPending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {createProduct.isPending ? "Creating…" : "Add product"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading products…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Variants</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((product) => (
              <tr key={product.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2">{product.name}</td>
                <td className="py-2">{formatPrice(product.basePriceCents)}</td>
                <td className="py-2">{product.variants.length}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => deleteProduct.mutate(product.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
