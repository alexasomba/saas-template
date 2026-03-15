import type { FieldAccess } from "payload";

import { checkRole } from "@/access/utilities";

export const adminOrSelfFieldAccess: FieldAccess = ({ req: { user }, doc }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin"], user)) {
    return true;
  }

  if (!doc || typeof doc !== "object" || !("id" in doc)) {
    return false;
  }

  return String(doc.id) === String(user.id);
};
