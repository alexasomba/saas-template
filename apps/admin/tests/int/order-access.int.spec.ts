import { describe, expect, it } from "vitest";

import { canAccessOrder } from "@/utilities/orders/canAccessOrder";

describe("order access", () => {
  it("does not allow email-only access", () => {
    expect(
      canAccessOrder({
        order: {
          accountInvite: undefined,
          accessToken: "secret-token",
          customer: null,
        },
        accessToken: undefined,
        inviteToken: undefined,
        user: null,
      }),
    ).toBe(false);
  });

  it("allows a matching access token", () => {
    expect(
      canAccessOrder({
        order: {
          accountInvite: undefined,
          accessToken: "secret-token",
          customer: null,
        },
        accessToken: "secret-token",
        user: null,
      }),
    ).toBe(true);
  });
});
