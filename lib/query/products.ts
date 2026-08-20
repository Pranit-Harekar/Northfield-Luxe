"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategories, listProducts, getProduct, type ProductListParams } from "@/lib/mock-api/products";
import { queryKeys } from "./keys";

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => listProducts(params),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => listCategories(),
  });
}
