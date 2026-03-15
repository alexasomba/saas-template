import type { Access } from "payload";

import { checkRole } from "@/access/utilities";
import type { AppUser } from "@/types/user";

export const adminOnly: Access = ({ req: { user } }) => {
  if (user) return checkRole(["admin"], user as AppUser);

  return false;
};
