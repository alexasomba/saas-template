import { describe, expect, it } from "vitest";

import { cartsConfig, ecommerceStorageConfig, ordersConfig } from "@/plugins/ecommerceConfig";
import { CART_STORAGE_KEY, getGuestCartSecret } from "@/utilities/ecommerce/cartStorage";

describe("ecommerce guest cart configuration", () => {
  it("keeps guest carts explicitly enabled for guest checkout flows", () => {
    expect(cartsConfig.allowGuestCarts).toBe(true);
    expect(typeof cartsConfig.cartsCollectionOverride).toBe("function");
    expect(typeof ordersConfig.ordersCollectionOverride).toBe("function");
  });

  it("uses a shared localStorage key for cart persistence", () => {
    expect(ecommerceStorageConfig.syncLocalStorage).toEqual({
      key: CART_STORAGE_KEY,
    });
  });

  it("reads the guest cart secret from the shared storage key", () => {
    const storage = {
      getItem: (key: string) => (key === "cart_secret" ? "secret_123" : null),
    };

    expect(getGuestCartSecret(storage)).toBe("secret_123");
    expect(getGuestCartSecret(null)).toBeNull();
  });
});
