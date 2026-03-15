import type { Access } from "payload";

import { checkRole } from "@/access/utilities";

export const adminEditorOrAuthor: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  return checkRole(["admin", "editor", "author"], user);
};
