"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/src/auth/authProvider";
import type {
  PermissionAction,
  PermissionModule,
} from "@/src/types/admin/access.types";

export type AccessRequirement =
  | { module: PermissionModule; action?: PermissionAction }
  | { anyOf: PermissionModule[]; action?: PermissionAction }
  | "superAdmin"
  | "authenticated";

export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback(
    (module: PermissionModule, action: PermissionAction = "view") =>
      !!user && (user.isAdmin || user.permissions?.[module]?.[action] != null),
    [user]
  );

  /** True when the action applies to every employee's records. */
  const canAll = useCallback(
    (module: PermissionModule, action: PermissionAction = "view") =>
      !!user &&
      (user.isAdmin || user.permissions?.[module]?.[action] === "ALL"),
    [user]
  );

  const allows = useCallback(
    (requirement: AccessRequirement) => {
      if (!user) return false;
      if (requirement === "authenticated") return true;
      if (requirement === "superAdmin") return user.isAdmin;
      if ("anyOf" in requirement) {
        return requirement.anyOf.some((m) => can(m, requirement.action));
      }
      return can(requirement.module, requirement.action);
    },
    [user, can]
  );

  return useMemo(
    () => ({
      user,
      isAdmin: !!user?.isAdmin,
      can,
      canAll,
      allows,
    }),
    [user, can, canAll, allows]
  );
}
