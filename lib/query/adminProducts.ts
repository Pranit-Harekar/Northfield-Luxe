"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, deleteProduct, updateProduct } from "@/lib/mock-api/products";
import type { Product } from "@/lib/db/types";
import { queryKeys } from "./keys";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Product, "id" | "createdAt">) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Product> }) => updateProduct(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}
