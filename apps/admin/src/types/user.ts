import type { User } from "@/payload-types";

export const userRoles = [
  "admin",
  "editor",
  "author",
  "contributor",
  "customer",
  "subscriber",
  "marketing",
  "sales",
  "service",
  "revops",
  "finance",
] as const;

export type UserRole = (typeof userRoles)[number];

export type AppUser = User & {
  name?: string | null;
  roles?: UserRole[] | UserRole | null;
};
