import type {
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from "@payloadcms/plugin-ecommerce/types";

export const paystackAdapterClient = (props: PaymentAdapterClientArgs): PaymentAdapterClient => {
  return {
    name: "paystack",
    confirmOrder: true,
    initiatePayment: true,
    label: props.label || "Paystack",
  };
};
