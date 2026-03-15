import type { Field, GroupField, PayloadRequest } from "payload";
import { createPaystack } from "@alexasomba/paystack-node";
import type { PaymentAdapter, PaymentAdapterArgs } from "@payloadcms/plugin-ecommerce/types";
import type { Order, Transaction } from "@/payload-types";
import {
  type CheckoutContact,
  type CheckoutShippingAddress,
  parseMetadataJSON,
} from "@/utilities/checkout/paystack";
import { getServerSideURL } from "@/utilities/getURL";

export type PaystackAdapterArgs = {
  publicKey: string;
  secretKey: string;
} & PaymentAdapterArgs;

type PaystackInitiatePaymentArgs = Parameters<PaymentAdapter["initiatePayment"]>[0];
type PaystackConfirmOrderArgs = Parameters<PaymentAdapter["confirmOrder"]>[0];
type EcommerceCart = PaystackInitiatePaymentArgs["data"]["cart"];
type TransactionCartItem = NonNullable<Transaction["items"]>[number];
type PaystackCheckoutMetadata = {
  cartID: string;
  cartItemsSnapshot: string;
  contact: string;
  shippingAddress: string;
  shippingMethod?: string;
  shippingTotal?: string;
  taxTotal?: string;
};
type PaystackInitiatePaymentData = PaystackInitiatePaymentArgs["data"] & {
  contact?: CheckoutContact;
};
type PaystackCurrency = "USD" | "NGN" | "GHS" | "KES" | "ZAR" | "XOF";
type StoreCurrency = NonNullable<Transaction["currency"]>;
type CollectionSlug = "carts" | "orders" | "transactions";
type ExtendedCart = EcommerceCart & {
  taxTotal?: number;
  shippingTotal?: number;
  shippingMethod?: string;
};

const getAuthenticatedUserID = (req: PayloadRequest): number | undefined => {
  if (!(typeof req.user === "object" && req.user && "id" in req.user)) {
    return undefined;
  }

  const id = req.user.id;

  if (typeof id === "number") return id;
  if (typeof id === "string") {
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

const flattenCartItems = (items: EcommerceCart["items"] | undefined): TransactionCartItem[] =>
  (items ?? []).reduce<TransactionCartItem[]>((acc, item) => {
    if (!item) return acc;

    const productID = typeof item.product === "object" ? item.product?.id : item.product;
    const variantID =
      item.variant && typeof item.variant === "object" ? item.variant.id : item.variant;

    acc.push({
      product: productID,
      quantity: item.quantity,
      variant: variantID,
    });

    return acc;
  }, []);

const toPaystackCurrency = (currency: string): PaystackCurrency => {
  const normalized = currency.toUpperCase();

  if (["USD", "NGN", "GHS", "KES", "ZAR", "XOF"].includes(normalized)) {
    return normalized as PaystackCurrency;
  }

  throw new Error(`Unsupported Paystack currency: ${currency}`);
};

const toStoreCurrency = (currency: string): StoreCurrency => {
  const normalized = currency.toUpperCase();

  if (normalized === "USD" || normalized === "NGN") {
    return normalized;
  }

  throw new Error(`Unsupported storefront currency: ${currency}`);
};

export const paystackAdapter = (props: PaystackAdapterArgs): PaymentAdapter => {
  const { secretKey, groupOverrides } = props;
  const label = props?.label || "Paystack";

  const baseFields: Field[] = [
    {
      name: "customerID",
      type: "text",
      label: "Paystack Customer ID",
    },
    {
      name: "reference",
      type: "text",
      label: "Paystack Reference",
    },
  ];

  const groupField: GroupField = {
    name: "paystack",
    type: "group",
    ...groupOverrides,
    admin: {
      condition: (data) => {
        return data?.paymentMethod === "paystack";
      },
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides?.fields === "function"
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  };

  const paystack = createPaystack({ secretKey });
  const callbackURL = `${getServerSideURL()}/checkout/paystack/callback`;

  const initiatePayment: PaymentAdapter["initiatePayment"] = async ({
    data,
    req,
    transactionsSlug,
  }: PaystackInitiatePaymentArgs) => {
    const typedData = data as PaystackInitiatePaymentData;
    const payload = req.payload;
    const { customerEmail, contact, currency, cart, shippingAddress } = typedData;
    const extCart = cart as ExtendedCart;
    const amount = (extCart.subtotal || 0) + (extCart.taxTotal || 0) + (extCart.shippingTotal || 0);

    if (typeof amount !== "number") {
      throw new Error("A valid amount is required.");
    }

    const subunitsAmount = Math.round(amount);
    const paystackCurrency = toPaystackCurrency(currency);
    const storeCurrency = toStoreCurrency(currency);
    const customerID = getAuthenticatedUserID(req);
    const transactionsCollection = transactionsSlug as CollectionSlug;

    if (!secretKey) throw new Error("Paystack secret key is required.");
    if (!currency) throw new Error("Currency is required.");
    if (!customerEmail) throw new Error("Customer email is required.");
    if (!amount || amount <= 0) throw new Error("A valid amount is required.");

    try {
      const callbackURLWithEmail = customerEmail
        ? `${callbackURL}?email=${encodeURIComponent(customerEmail)}`
        : callbackURL;

      const flattenedCart = flattenCartItems(cart.items);
      const extCart = cart as ExtendedCart;
      const metadata: PaystackCheckoutMetadata = {
        cartID: String(cart.id),
        cartItemsSnapshot: JSON.stringify(flattenedCart),
        contact: JSON.stringify((contact ?? {}) as CheckoutContact),
        shippingAddress: JSON.stringify((shippingAddress ?? {}) as CheckoutShippingAddress),
        shippingMethod: extCart.shippingMethod || "",
        shippingTotal: String(extCart.shippingTotal || 0),
        taxTotal: String(extCart.taxTotal || 0),
      };

      const { data: paystackData, error } = await paystack.transaction_initialize({
        body: {
          email: customerEmail,
          amount: subunitsAmount, // Paystack expects amount in subunits (kobo/cents)
          callback_url: callbackURLWithEmail,
          currency: paystackCurrency,
          // The SDK's generated metadata type is currently too narrow for Paystack's real API.
          metadata: metadata as unknown as Record<string, never>,
        },
      });

      if (error || !paystackData || !paystackData.status) {
        payload.logger.error({
          error,
          paystackData,
          msg: "Paystack transaction_initialize failed",
        });
        throw new Error("Paystack initialization failed");
      }

      // Create transaction record
      await payload.create({
        collection: transactionsCollection,
        data: {
          ...(customerID ? { customer: customerID } : { customerEmail }),
          amount: subunitsAmount,
          cart: cart.id,
          currency: storeCurrency,
          items: flattenedCart,
          paymentMethod: "paystack",
          status: "pending",
          paystack: {
            reference: paystackData.data.reference,
          },
        },
        req,
      });

      return {
        ...paystackData.data,
        message: "Payment initiated successfully",
      };
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: "Error initiating payment with Paystack",
        data: { customerEmail, currency, subunitsAmount },
      });
      throw error;
    }
  };

  const confirmOrder: PaymentAdapter["confirmOrder"] = async ({
    cartsSlug = "carts",
    data,
    ordersSlug = "orders",
    req,
    transactionsSlug = "transactions",
  }: PaystackConfirmOrderArgs) => {
    const payload = req.payload;
    const { reference } = data;
    const customerID = getAuthenticatedUserID(req);
    const cartsCollection = cartsSlug as CollectionSlug;
    const ordersCollection = ordersSlug as CollectionSlug;
    const transactionsCollection = transactionsSlug as CollectionSlug;

    if (!reference) throw new Error("Paystack reference is required");

    try {
      const { data: verifyData, error } = await paystack.transaction_verify({
        params: { path: { reference } },
      });

      if (error || !verifyData || !verifyData.status || verifyData.data.status !== "success") {
        throw new Error("Payment verification failed");
      }

      const transactionsResults = await payload.find({
        collection: transactionsCollection,
        req,
        where: {
          "paystack.reference": { equals: reference },
        },
      });

      const transaction = transactionsResults.docs[0];
      if (!transaction) throw new Error("Transaction not found");

      const metadata =
        typeof verifyData.data.metadata === "object" && verifyData.data.metadata !== null
          ? (verifyData.data.metadata as Partial<PaystackCheckoutMetadata>)
          : {};
      const cartID = metadata.cartID;

      if (!cartID) {
        throw new Error("Cart reference is missing from the Paystack metadata.");
      }

      const cartItemsSnapshot =
        parseMetadataJSON<NonNullable<Order["items"]>>(metadata.cartItemsSnapshot) ?? [];
      const shippingAddress = parseMetadataJSON<Order["shippingAddress"]>(metadata.shippingAddress);

      const order = await payload.create({
        collection: ordersCollection,
        data: {
          amount: verifyData.data.amount,
          currency: toStoreCurrency(verifyData.data.currency || "NGN"),
          ...(customerID
            ? { customer: customerID }
            : { customerEmail: verifyData.data.customer?.email || "" }),
          items: cartItemsSnapshot,
          shippingAddress,
          shippingMethod: metadata.shippingMethod || "",
          shippingTotal: Number(metadata.shippingTotal) || 0,
          taxTotal: Number(metadata.taxTotal) || 0,
          status: "processing",
          transactions: [transaction.id],
        },
        req,
      });

      await payload.update({
        id: cartID,
        collection: cartsCollection,
        data: { purchasedAt: new Date().toISOString() },
        req,
      });

      await payload.update({
        id: transaction.id,
        collection: transactionsCollection,
        data: { order: order.id, status: "succeeded" },
        req,
      });

      return {
        message: "Order confirmed successfully",
        orderID: order.id,
        transactionID: transaction.id,
      };
    } catch (error) {
      payload.logger.error({ err: error, msg: "Error confirming order with Paystack" });
      throw error;
    }
  };

  return {
    name: "paystack",
    confirmOrder,
    group: groupField,
    initiatePayment,
    label,
  };
};
