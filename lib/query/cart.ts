"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToCart, getCart, removeFromCart, updateCartItemQuantity } from "@/lib/mock-api/cart";
import type { CartItem } from "@/lib/db/types";
import { queryKeys } from "./keys";

const GUEST_CART_ID = "guest";

export function useCart(cartId: string = GUEST_CART_ID) {
  return useQuery({
    queryKey: queryKeys.cart.detail(cartId),
    queryFn: () => getCart(cartId),
  });
}

export function useAddToCart(cartId: string = GUEST_CART_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: CartItem) => addToCart(item, cartId),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.detail(cartId), cart),
  });
}

export function useUpdateCartQuantity(cartId: string = GUEST_CART_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      updateCartItemQuantity(variantId, quantity, cartId),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.detail(cartId), cart),
  });
}

export function useRemoveFromCart(cartId: string = GUEST_CART_ID) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => removeFromCart(variantId, cartId),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.detail(cartId), cart),
  });
}
