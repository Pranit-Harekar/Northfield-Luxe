// Mock implementation of GET/POST/PUT/DELETE /api/products against IndexedDB.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Product } from "../db/types";
import { ApiError, withApiSimulation } from "./client";

export interface ProductListParams {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "price-asc" | "price-desc" | "rating" | "newest";
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  return withApiSimulation("GET", "/api/products", async () => {
    const { categoryId, search, page = 1, pageSize = 20, sort } = params;
    const db = await getDB();
    let items = await db.getAll("products");

    if (categoryId) {
      items = items.filter((p) => p.categoryId === categoryId);
    }
    if (search) {
      const needle = search.toLowerCase();
      // Intentional bug (Category C / functional): search only matches the
      // product name, not the description, so relevant results are missed.
      items = items.filter((p) => p.name.toLowerCase().includes(needle));
    }

    switch (sort) {
      case "price-asc":
        items = [...items].sort((a, b) => a.basePriceCents - b.basePriceCents);
        break;
      case "price-desc":
        items = [...items].sort((a, b) => b.basePriceCents - a.basePriceCents);
        break;
      case "rating":
        items = [...items].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);
    return { items: paged, total, page, pageSize };
  }, params);
}

export async function getProduct(id: string): Promise<Product> {
  return withApiSimulation("GET", `/api/products/${id}`, async () => {
    const db = await getDB();
    const product = await db.get("products", id);
    if (!product) throw new ApiError(404, `Product ${id} not found`);
    return product;
  });
}

export async function createProduct(input: Omit<Product, "id" | "createdAt">): Promise<Product> {
  return withApiSimulation(
    "POST",
    "/api/products",
    async () => {
      const db = await getDB();
      const product: Product = { ...input, id: uuid(), createdAt: new Date().toISOString() };
      await db.put("products", product);
      return product;
    },
    input,
  );
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
  return withApiSimulation(
    "PUT",
    `/api/products/${id}`,
    async () => {
      const db = await getDB();
      const existing = await db.get("products", id);
      if (!existing) throw new ApiError(404, `Product ${id} not found`);
      const updated = { ...existing, ...patch, id };
      await db.put("products", updated);
      return updated;
    },
    patch,
  );
}

export async function deleteProduct(id: string): Promise<void> {
  return withApiSimulation("DELETE", `/api/products/${id}`, async () => {
    const db = await getDB();
    await db.delete("products", id);
  });
}

export async function listCategories() {
  return withApiSimulation("GET", "/api/categories", async () => {
    const db = await getDB();
    return db.getAll("categories");
  });
}
