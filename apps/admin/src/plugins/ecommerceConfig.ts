import { CartsCollection } from "@/collections/Carts";
import { OrdersCollection } from "@/collections/Orders";
import { CART_STORAGE_KEY } from "@/utilities/ecommerce/cartStorage";

export const cartsConfig = {
  // Payload 3.67+ supports first-class guest carts. Keep this explicit because
  // guest checkout and account conversion both depend on anonymous cart access.
  allowGuestCarts: true,
  cartsCollectionOverride: CartsCollection,
};

export const ordersConfig = {
  ordersCollectionOverride: OrdersCollection,
} as const;

export const ecommerceStorageConfig = {
  syncLocalStorage: {
    key: CART_STORAGE_KEY,
  },
} as const;
