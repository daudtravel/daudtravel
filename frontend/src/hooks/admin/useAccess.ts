"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  rolesApi,
  usersApi,
  type RolePayload,
  type UserPayload,
} from "@/src/services/admin/access.service";
import type { ListParams } from "@/src/types/admin/common.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const accessKeys = {
  users: ["admin", "users"] as const,
  usersList: (params: ListParams) => ["admin", "users", "list", params] as const,
  user: (id: string) => ["admin", "users", "detail", id] as const,
  usersLookup: (includeInactive: boolean) =>
    ["admin", "users", "lookup", includeInactive] as const,
  roles: ["admin", "roles"] as const,
  rolesList: (params: ListParams) => ["admin", "roles", "list", params] as const,
  roleOptions: ["admin", "roles", "options"] as const,
  role: (id: string) => ["admin", "roles", "detail", id] as const,
};

export function useUsersList(params: ListParams) {
  return useQuery({
    queryKey: accessKeys.usersList(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: accessKeys.user(id ?? ""),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
    retry: adminRetry,
  });
}

export function useUsersLookup(includeInactive = false, enabled = true) {
  return useQuery({
    queryKey: accessKeys.usersLookup(includeInactive),
    queryFn: () => usersApi.lookup(includeInactive),
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });
}

export function useRoleOptions(enabled = true) {
  return useQuery({
    queryKey: accessKeys.roleOptions,
    queryFn: rolesApi.options,
    staleTime: 60 * 1000,
    enabled,
    retry: adminRetry,
  });
}

export function useRolesList(params: ListParams) {
  return useQuery({
    queryKey: accessKeys.rolesList(params),
    queryFn: () => rolesApi.list(params),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: accessKeys.role(id ?? ""),
    queryFn: () => rolesApi.get(id!),
    enabled: !!id,
    retry: adminRetry,
  });
}

export function useSaveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: UserPayload }) =>
      id ? usersApi.update(id, payload) : usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKeys.users });
      queryClient.invalidateQueries({ queryKey: accessKeys.roles });
    },
  });
}

export function useUpdateUserFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserPayload> }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKeys.users });
      queryClient.invalidateQueries({ queryKey: accessKeys.roles });
    },
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApi.setPassword(id, password),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKeys.users });
      queryClient.invalidateQueries({ queryKey: accessKeys.roles });
    },
  });
}

export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: RolePayload }) =>
      id ? rolesApi.update(id, payload) : rolesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKeys.roles });
      queryClient.invalidateQueries({ queryKey: accessKeys.users });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessKeys.roles });
      queryClient.invalidateQueries({ queryKey: accessKeys.users });
    },
  });
}
