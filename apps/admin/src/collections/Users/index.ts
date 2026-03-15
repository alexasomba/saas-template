import type { CollectionConfig } from "payload";

import { adminOnly } from "@/access/adminOnly";
import { adminOrSelfFieldAccess } from "@/access/adminOrSelfFieldAccess";
import { adminOnlyFieldAccess } from "@/access/adminOnlyFieldAccess";
import { publicAccess } from "@/access/publicAccess";
import { adminOrSelf } from "@/access/adminOrSelf";
import { checkRole } from "@/access/utilities";
import { userRoles } from "@/types/user";
import { buildVerifyEmail } from "@/utilities/email/templates";

import { ensureFirstUserIsAdmin } from "./hooks/ensureFirstUserIsAdmin";
import { sendWelcomeEmail } from "./hooks/sendWelcomeEmail";

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: ({ req: { user } }) => checkRole(["admin"], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    group: "Users",
    defaultColumns: ["name", "email", "roles"],
    useAsTitle: "name",
  },
  auth: {
    tokenExpiration: 1209600,
    verify: {
      generateEmailHTML: async ({ token, user }) => {
        const email = buildVerifyEmail({
          email: user.email,
          token,
        });

        return email.html;
      },
      generateEmailSubject: async () => "Verify your email address",
    },
  },
  hooks: {
    afterChange: [sendWelcomeEmail],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      access: {
        create: adminOnlyFieldAccess,
        read: adminOrSelfFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ["customer"],
      hasMany: true,
      saveToJWT: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: userRoles.map((role) => ({
        label: role,
        value: role,
      })),
    },
    {
      name: "orders",
      type: "join",
      collection: "orders",
      on: "customer",
      admin: {
        allowCreate: false,
        defaultColumns: ["id", "createdAt", "total", "currency", "items"],
      },
    },
    {
      name: "cart",
      type: "join",
      collection: "carts",
      on: "customer",
      admin: {
        allowCreate: false,
        defaultColumns: ["id", "createdAt", "total", "currency", "items"],
      },
    },
    {
      name: "addresses",
      type: "join",
      collection: "addresses",
      on: "customer",
      admin: {
        allowCreate: false,
        defaultColumns: ["id"],
      },
    },
  ],
};
