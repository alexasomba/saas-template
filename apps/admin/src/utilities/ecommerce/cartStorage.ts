export const CART_STORAGE_KEY = "cart";

export const getGuestCartSecret = (storage?: Pick<Storage, "getItem"> | null): string | null => {
  if (!storage) {
    return null;
  }

  return storage.getItem(`${CART_STORAGE_KEY}_secret`);
};
