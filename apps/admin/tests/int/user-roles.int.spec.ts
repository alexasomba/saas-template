import { describe, expect, it } from "vitest";

import { adminOrSelfFieldAccess } from "@/access/adminOrSelfFieldAccess";
import { adminOnlyFieldAccess } from "@/access/adminOnlyFieldAccess";
import { Users } from "@/collections/Users";
import { userRoles } from "@/types/user";

describe("user roles", () => {
  it("exposes the CRM and finance role options in the users collection", () => {
    const rolesField = Users.fields.find((field) => "name" in field && field.name === "roles");

    expect(rolesField).toMatchObject({
      defaultValue: ["customer"],
      hasMany: true,
      name: "roles",
    });

    expect(userRoles).toEqual([
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
    ]);

    expect("options" in (rolesField || {}) ? (rolesField as any).options : []).toEqual(
      userRoles.map((role) => ({
        label: role,
        value: role,
      })),
    );
  });

  it("allows only admins to create or update roles after bootstrap", async () => {
    const payload = {
      find: async () => ({ totalDocs: 1 }),
    };

    await expect(
      adminOnlyFieldAccess({
        req: {
          payload,
          user: { id: 10, roles: ["customer"] },
        },
      } as never),
    ).resolves.toBe(false);

    await expect(
      adminOnlyFieldAccess({
        req: {
          payload,
          user: { id: 1, roles: ["admin"] },
        },
      } as never),
    ).resolves.toBe(true);
  });

  it("allows users to read their own roles but not other users roles", () => {
    expect(
      adminOrSelfFieldAccess({
        doc: { id: 9 },
        req: {
          user: { id: 9, roles: ["customer"] },
        },
      } as never),
    ).toBe(true);

    expect(
      adminOrSelfFieldAccess({
        doc: { id: 7 },
        req: {
          user: { id: 9, roles: ["customer"] },
        },
      } as never),
    ).toBe(false);
  });
});
