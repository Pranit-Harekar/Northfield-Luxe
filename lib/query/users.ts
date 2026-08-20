"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUser, listUsers, updateUser, type UpdateUserInput } from "@/lib/mock-api/users";
import { queryKeys } from "./keys";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => listUsers(),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateUserInput }) => updateUser(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
