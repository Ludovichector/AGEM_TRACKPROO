"use client";

import { useSession } from "next-auth/react";
import { hasPermission, getAllowedActions } from "@/lib/permissions";
import type { Module, Action } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export function usePermission() {
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  return {
    can: (module: Module, action: Action): boolean => {
      if (!role) return false;
      return hasPermission(role, module, action);
    },
    getAllowedActions: (module: Module): Action[] => {
      if (!role) return [];
      return getAllowedActions(role, module);
    },
    role,
    isAuthenticated: !!session,
    userId: session?.user?.id,
    userFullName: session?.user?.name,
    userEmail: session?.user?.email,
    userOrganization: session?.user?.organization,
  };
}
