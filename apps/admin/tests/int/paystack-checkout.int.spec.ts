import { describe, expect, it } from "vitest";

import {
  getOrderCurrency,
  isShippingAddressComplete,
  normalizeCheckoutContact,
  normalizeShippingAddress,
  parseMetadataJSON,
} from "@/utilities/checkout/paystack";

describe("paystack checkout helpers", () => {
  it("parses metadata JSON safely", () => {
    expect(parseMetadataJSON<{ email: string }>('{"email":"buyer@example.com"}')).toEqual({
      email: "buyer@example.com",
    });
    expect(parseMetadataJSON("{invalid")).toBeUndefined();
  });

  it("normalizes contact details from request and metadata fallbacks", () => {
    expect(
      normalizeCheckoutContact({
        contact: { firstName: "Ada" },
        fallbackContact: { email: "ada@example.com", lastName: "Lovelace" },
        fallbackShipping: { phone: "+234" },
        marketingOptIn: true,
      }),
    ).toEqual({
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "+234",
      marketingOptIn: true,
    });
  });

  it("normalizes shipping details and validates completeness", () => {
    const shipping = normalizeShippingAddress({
      contact: { firstName: "Ada", lastName: "Lovelace" },
      fallbackContact: { phone: "+234" },
      shippingAddress: {
        addressLine1: "123 Market St",
        city: "Lagos",
        postalCode: "100001",
        country: "NG",
      },
    });

    expect(shipping.firstName).toBe("Ada");
    expect(shipping.lastName).toBe("Lovelace");
    expect(shipping.phone).toBe("+234");
    expect(isShippingAddressComplete(shipping)).toBe(true);
    expect(getOrderCurrency("ngn")).toBe("NGN");
  });
});
