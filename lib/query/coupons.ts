"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "@/lib/mock-api/coupons";
import type { Coupon } from "@/lib/db/types";
import { queryKeys } from "./keys";

/** Admin-only: every coupon in the catalog. */
export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons.all,
    queryFn: () => listCoupons(),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Coupon, "id">) => createCoupon(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Coupon, "id">> }) => updateCoupon(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all }),
  });
}

/** Live/debounced coupon validation for the checkout coupon field. Pass an
 * already-debounced code so we don't fire a request on every keystroke. */
export function useValidateCoupon(code: string, subtotalCents: number) {
  return useQuery({
    queryKey: queryKeys.coupons.validate(code, subtotalCents),
    queryFn: () => validateCoupon(code, subtotalCents),
    enabled: code.trim().length > 0,
    staleTime: 10_000,
  });
}
