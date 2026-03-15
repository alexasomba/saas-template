import type { FieldAccess } from "payload";

import { checkRole } from "@/access/utilities";

export const adminOnlyFieldAccess: FieldAccess = async ({ req }) => {
  const { payload, user } = req;

  if (!user) {
    try {
      // allow first user to be created with admin role
      const users = await payload.find({
        collection: "users",
        limit: 0,
        req,
        overrideAccess: true,
      });
      if (users.totalDocs === 0) return true;
    } catch (_err) {
      // ignore
    }
    return false;
  }

  if (checkRole(["admin"], user)) {
    return true;
  }

  return false;
};
