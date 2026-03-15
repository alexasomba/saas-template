import { paystackAdapterClient } from "@/plugins/paystack/client";
import { describe, expect, it } from "vitest";

describe("paystack client adapter", () => {
  it("exposes a browser-safe payment adapter shape", () => {
    expect(
      paystackAdapterClient({
        label: "Paystack",
      }),
    ).toEqual({
      name: "paystack",
      confirmOrder: true,
      initiatePayment: true,
      label: "Paystack",
    });
  });
});
