"use client";

import { Message } from "@/components/Message";
import { Button } from "@/components/ui/button";
import React, { useCallback, FormEvent, useRef } from "react";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import { Address } from "@/payload-types";

import { getMockCheckoutStatus } from "@/utilities/isMockCheckout";

const mockCheckout = getMockCheckoutStatus();
const testSecretHeader = "X-E2E-Test-Secret";
const testSecretValue = process.env.NEXT_PUBLIC_E2E_TEST_SECRET || "test-secret";
const paystackInlineScriptSelector = 'script[data-paystack-inline-script="true"]';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key?: string;
        email?: string;
        amount: number;
        ref?: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

let paystackScriptPromise: Promise<void> | null = null;
const checkoutFinalizeRetryDelayMs = 1500;
const checkoutFinalizeRetryAttempts = 5;

const loadPaystackInlineScript = (form: HTMLFormElement): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack can only load in the browser."));
  }

  if (window.PaystackPop) {
    return Promise.resolve();
  }

  if (paystackScriptPromise) {
    return paystackScriptPromise;
  }

  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(paystackInlineScriptSelector);

    const handleLoad = () => resolve();
    const handleError = () => {
      paystackScriptPromise = null;
      reject(new Error("Unable to load Paystack checkout script."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.dataset.paystackInlineScript = "true";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    form.appendChild(script);
  });

  return paystackScriptPromise;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryFinalize = (message: string) => {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("payment verification failed") ||
    normalized.includes("payment is not complete") ||
    normalized.includes("checkout session not found")
  );
};

type Props = {
  customerEmail?: string;
  contact?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  billingAddress?: Partial<Address>;
  shippingAddress?: Partial<Address>;
  marketingOptIn?: boolean;
  onOrderCreated?: (
    order: { id?: number | string | null } | null,
    inviteToken?: string | null,
  ) => void;
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>;
  paymentData?: {
    reference?: string | null;
  } | null;
};

export const CheckoutForm: React.FC<Props> = ({
  customerEmail,
  contact,
  billingAddress,
  shippingAddress,
  marketingOptIn,
  onOrderCreated,
  setProcessingPayment,
  paymentData,
}) => {
  const [error, setError] = React.useState<null | string>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { clearCart, cart } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const finalizingRef = useRef(false);

  const finalizeCheckout = useCallback(
    async (reference: string) => {
      if (finalizingRef.current) return;

      finalizingRef.current = true;

      try {
        let data:
          | {
              order?: { id?: number | string | null };
              accountInviteToken?: string | null;
            }
          | undefined;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < checkoutFinalizeRetryAttempts; attempt++) {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contact,
              shippingAddress,
              paymentData: {
                reference,
              },
              marketingOptIn,
            }),
          });

          if (response.ok) {
            data = (await response.json()) as {
              order?: { id?: number | string | null };
              accountInviteToken?: string | null;
            };
            lastError = null;
            break;
          }

          const errorBody = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = errorBody?.error || "Verification failed";
          lastError = new Error(message);

          if (attempt < checkoutFinalizeRetryAttempts - 1 && shouldRetryFinalize(message)) {
            await wait(checkoutFinalizeRetryDelayMs);
            continue;
          }

          throw lastError;
        }

        if (!data) {
          throw lastError ?? new Error("Verification failed");
        }

        clearCart();
        onOrderCreated?.(data.order ?? null, data.accountInviteToken ?? null);
        setIsLoading(false);
        setProcessingPayment(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment verification failed.");
        setIsLoading(false);
        setProcessingPayment(false);
      } finally {
        finalizingRef.current = false;
      }
    },
    [clearCart, contact, shippingAddress, marketingOptIn, onOrderCreated, setProcessingPayment],
  );

  const onClose = useCallback(() => {
    if (paymentData?.reference) {
      void finalizeCheckout(paymentData.reference);
      return;
    }

    setIsLoading(false);
    setProcessingPayment(false);
  }, [finalizeCheckout, paymentData?.reference, setProcessingPayment]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setProcessingPayment(true);

      if (mockCheckout) {
        try {
          const response = await fetch("/api/test/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [testSecretHeader]: testSecretValue,
            },
            credentials: "include",
            body: JSON.stringify({
              contact: {
                email: contact?.email ?? customerEmail,
                firstName: contact?.firstName,
                lastName: contact?.lastName,
                phone: contact?.phone,
              },
              billingAddress,
              shippingAddress,
              marketingOptIn: Boolean(marketingOptIn),
              items: cart?.items ?? [],
              amount: typeof cart?.subtotal === "number" ? cart.subtotal : undefined,
              currency: cart?.currency,
            }),
          });

          if (!response.ok) {
            const errorBody = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            const message = errorBody?.error ?? "Unable to complete order in test mode.";
            throw new Error(message);
          }

          const data = (await response.json()) as {
            order?: { id?: number | string | null };
            accountInviteToken?: string | null;
          };

          clearCart();
          onOrderCreated?.(data.order ?? null, data.accountInviteToken ?? null);
          setIsLoading(false);
          setProcessingPayment(false);
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          setError(`Mock checkout failed: ${msg}`);
          setIsLoading(false);
          setProcessingPayment(false);
        }
      } else {
        if (!formRef.current) {
          setError("Checkout form is not ready yet. Please try again.");
          setIsLoading(false);
          setProcessingPayment(false);
          return;
        }

        try {
          await loadPaystackInlineScript(formRef.current);

          if (!window.PaystackPop) {
            throw new Error("Paystack script not loaded yet. Please try again in a moment.");
          }

          const handler = window.PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
            email: customerEmail,
            amount: cart?.subtotal || 0,
            ref: paymentData?.reference ?? undefined,
            callback: (response) => {
              if (response?.reference) {
                void finalizeCheckout(response.reference);
              } else {
                onClose();
              }
            },
            onClose: () => {
              onClose();
            },
          });

          handler.openIframe();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to initialize Paystack.");
          setIsLoading(false);
          setProcessingPayment(false);
        }
      }
    },
    [
      finalizeCheckout,
      onClose,
      contact?.email,
      contact?.firstName,
      contact?.lastName,
      contact?.phone,
      customerEmail,
      billingAddress,
      shippingAddress,
      marketingOptIn,
      cart?.items,
      cart?.subtotal,
      cart?.currency,
      clearCart,
      onOrderCreated,
      setProcessingPayment,
      paymentData?.reference,
    ],
  );

  return (
    <>
      <form onSubmit={handleSubmit} ref={formRef}>
        {error && <Message error={error} />}
        {mockCheckout && (
          <p className="text-sm text-muted-foreground">
            Test mode enabled. Payment details are skipped and an order will be simulated for E2E
            verification.
          </p>
        )}
        {!mockCheckout && (
          <p className="text-sm text-muted-foreground">
            Click the button below to complete your payment with Paystack.
          </p>
        )}
        <div className="mt-8 flex gap-4">
          <Button disabled={isLoading} type="submit" variant="default">
            {isLoading ? "Loading..." : mockCheckout ? "Complete order" : "Pay now"}
          </Button>
        </div>
      </form>
    </>
  );
};
