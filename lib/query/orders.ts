"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder, listOrders, placeOrder, refundOrder, type PlaceOrderInput } from "@/lib/mock-api/orders";
import { queryKeys } from "./keys";

export function useOrders(userId: string) {
  return useQuery({
    queryKey: queryKeys.orders.list(userId),
    queryFn: () => listOrders(userId),
    enabled: Boolean(userId),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => placeOrder(input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(order.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail("guest") });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial?: number }) => refundOrder(id, partial),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(order.userId) });
    },
  });
}
