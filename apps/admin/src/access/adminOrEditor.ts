import type { Access } from "payload";

import { checkRole } from "@/access/utilities";

export const adminOrEditor: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  return checkRole(["admin", "editor"], user);
};
