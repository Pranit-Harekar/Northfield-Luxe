"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  denyRefundRequest,
  getOrder,
  listAllOrders,
  listOrders,
  placeOrder,
  refundOrder,
  requestRefund,
  type PlaceOrderInput,
} from "@/lib/mock-api/orders";
import { queryKeys } from "./keys";

export function useOrders(userId: string) {
  return useQuery({
    queryKey: queryKeys.orders.list(userId),
    queryFn: () => listOrders(userId),
    enabled: Boolean(userId),
  });
}

/** Admin-only: every order across all customers. */
export function useAllOrders() {
  return useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => listAllOrders(),
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

/** Customer-facing: submits a refund request for admin review. */
export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial?: number }) => requestRefund(id, partial),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(order.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/** Admin-only: approves a pending request (or force-refunds an order). */
export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial?: number }) => refundOrder(id, partial),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(order.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/** Admin-only: denies a pending refund request. */
export function useDenyRefundRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => denyRefundRequest(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(order.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
