import { axiosInstance } from "@/src/utlis/axiosInstance";
import type {
  AuthProfile,
  Role,
  RoleDetail,
  RolePermission,
  RoleRef,
  StaffUser,
  UserLookup,
} from "@/src/types/admin/access.types";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  isAdmin?: boolean;
  isActive?: boolean;
  roleIds?: string[];
  password?: string;
}

export interface RolePayload {
  name: string;
  description?: string | null;
  permissions: RolePermission[];
}

/** Drops undefined/null/"" params so they don't reach the query string. */
export const cleanParams = (params: ListParams = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

export const usersApi = {
  list: async (params: ListParams) =>
    (await axiosInstance.get<Paginated<StaffUser>>("/users", {
      params: cleanParams(params),
    })).data,
  lookup: async (includeInactive = false) =>
    (await axiosInstance.get<{ data: UserLookup[] }>("/users/lookup", {
      params: includeInactive ? { includeInactive: "true" } : {},
    })).data.data,
  get: async (id: string) =>
    (await axiosInstance.get<{ data: StaffUser }>(`/users/${id}`)).data.data,
  create: async (payload: UserPayload) =>
    (await axiosInstance.post<{ data: StaffUser }>("/users", payload)).data
      .data,
  update: async (id: string, payload: Partial<UserPayload>) =>
    (await axiosInstance.put<{ data: StaffUser }>(`/users/${id}`, payload))
      .data.data,
  setPassword: async (id: string, password: string) =>
    (await axiosInstance.put(`/users/${id}/password`, { password })).data,
  remove: async (id: string) =>
    (await axiosInstance.delete(`/users/${id}`)).data,
};

export const rolesApi = {
  list: async (params: ListParams) =>
    (await axiosInstance.get<Paginated<Role>>("/roles", {
      params: cleanParams(params),
    })).data,
  options: async () =>
    (await axiosInstance.get<{ data: RoleRef[] }>("/roles/options")).data
      .data,
  get: async (id: string) =>
    (await axiosInstance.get<{ data: RoleDetail }>(`/roles/${id}`)).data.data,
  create: async (payload: RolePayload) =>
    (await axiosInstance.post<{ data: Role }>("/roles", payload)).data.data,
  update: async (id: string, payload: Partial<RolePayload>) =>
    (await axiosInstance.put<{ data: Role }>(`/roles/${id}`, payload)).data
      .data,
  remove: async (id: string) =>
    (await axiosInstance.delete<{ detachedUsers: number }>(`/roles/${id}`))
      .data,
};

export const profileApi = {
  update: async (payload: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  }) =>
    (await axiosInstance.put<{ user: AuthProfile }>("/auth/me", payload)).data
      .user,
  changePassword: async (currentPassword: string, newPassword: string) =>
    (
      await axiosInstance.put<{ token: string }>("/auth/me/password", {
        currentPassword,
        newPassword,
      })
    ).data.token,
};
