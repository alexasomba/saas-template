import type { AppUser, UserRole } from "@/types/user";

export const checkRole = (allRoles: UserRole[] = [], user?: AppUser | null): boolean => {
  if (!user || allRoles.length === 0) {
    return false;
  }

  const roles = Array.isArray(user.roles)
    ? user.roles
    : typeof user?.roles === "string"
      ? [user.roles]
      : [];

  if (roles.length === 0) {
    return false;
  }

  return allRoles.some((role) => roles.includes(role));
};
