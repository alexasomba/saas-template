import { DEFAULT_CURRENCY } from "@/config/currencies";

export type CheckoutContact = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type CheckoutShippingAddress = {
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  country?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  postalCode?: string;
  state?: string;
};

type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const parseMetadataJSON = <T>(value: unknown): T | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

export const getOrderCurrency = (currency?: string | null): string =>
  currency?.toUpperCase() ?? DEFAULT_CURRENCY;

export const normalizeCheckoutContact = ({
  contact,
  fallbackContact,
  fallbackShipping,
  marketingOptIn,
  transactionCustomerEmail,
}: {
  contact?: CheckoutContact;
  fallbackContact?: UnknownRecord;
  fallbackShipping?: UnknownRecord;
  marketingOptIn: boolean;
  transactionCustomerEmail?: string | null;
}): CheckoutContact & { email: string; marketingOptIn: boolean } => {
  const email =
    contact?.email ||
    (typeof fallbackContact?.email === "string" ? fallbackContact.email : undefined) ||
    transactionCustomerEmail;

  if (!email) {
    throw new Error("Contact email is required.");
  }

  return {
    email,
    firstName:
      contact?.firstName ??
      (typeof fallbackContact?.firstName === "string" ? fallbackContact.firstName : null) ??
      (typeof fallbackShipping?.firstName === "string" ? fallbackShipping.firstName : null) ??
      null,
    lastName:
      contact?.lastName ??
      (typeof fallbackContact?.lastName === "string" ? fallbackContact.lastName : null) ??
      (typeof fallbackShipping?.lastName === "string" ? fallbackShipping.lastName : null) ??
      null,
    phone:
      contact?.phone ??
      (typeof fallbackContact?.phone === "string" ? fallbackContact.phone : null) ??
      (typeof fallbackShipping?.phone === "string" ? fallbackShipping.phone : null) ??
      null,
    marketingOptIn,
  };
};

export const normalizeShippingAddress = ({
  contact,
  fallbackContact,
  fallbackShipping,
  shippingAddress,
}: {
  contact?: CheckoutContact;
  fallbackContact?: UnknownRecord;
  fallbackShipping?: UnknownRecord;
  shippingAddress?: CheckoutShippingAddress;
}): CheckoutShippingAddress => ({
  ...fallbackShipping,
  ...shippingAddress,
  firstName:
    shippingAddress?.firstName ??
    (typeof fallbackShipping?.firstName === "string" ? fallbackShipping.firstName : null) ??
    contact?.firstName ??
    (typeof fallbackContact?.firstName === "string" ? fallbackContact.firstName : null) ??
    null,
  lastName:
    shippingAddress?.lastName ??
    (typeof fallbackShipping?.lastName === "string" ? fallbackShipping.lastName : null) ??
    contact?.lastName ??
    (typeof fallbackContact?.lastName === "string" ? fallbackContact.lastName : null) ??
    null,
  phone:
    shippingAddress?.phone ??
    (typeof fallbackShipping?.phone === "string" ? fallbackShipping.phone : null) ??
    contact?.phone ??
    (typeof fallbackContact?.phone === "string" ? fallbackContact.phone : null) ??
    null,
});

export const isShippingAddressComplete = (shippingAddress: CheckoutShippingAddress): boolean =>
  Boolean(
    shippingAddress.addressLine1 &&
    shippingAddress.city &&
    shippingAddress.postalCode &&
    shippingAddress.country,
  );
