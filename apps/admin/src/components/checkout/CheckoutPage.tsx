"use client";

import { Media } from "@/components/Media";
import { Message } from "@/components/Message";
import { Price } from "@/components/Price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/Auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { getMockCheckoutStatus } from "@/utilities/isMockCheckout";
import { getGuestCartSecret } from "@/utilities/ecommerce/cartStorage";
import {
  useAddresses,
  useCart,
  useCurrency,
  usePayments,
} from "@payloadcms/plugin-ecommerce/client/react";
import { CheckoutAddresses } from "@/components/checkout/CheckoutAddresses";
import { CreateAddressModal } from "@/components/addresses/CreateAddressModal";
import type {
  Address,
  Media as PayloadMedia,
  Product,
  Variant,
  VariantOption,
} from "@/payload-types";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressItem } from "@/components/addresses/AddressItem";
import { FormItem } from "@/components/forms/FormItem";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  matchShippingZone,
  getMethodsFromZone,
  type ShippingMethod,
} from "@/utilities/ecommerce/shipping";
import { getEffectiveUnitPrice } from "@/utilities/ecommerce/pricing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShippingZone } from "@/payload-types";

const mockCheckout = getMockCheckoutStatus();

type PaymentData = Record<string, unknown> & {
  authorization_url?: string;
  reference?: string;
};

const isPaymentData = (value: unknown): value is PaymentData =>
  typeof value === "object" && value !== null;

const parseNumericId = (id: unknown): number | undefined => {
  if (typeof id === "number") return id;

  if (typeof id === "string") {
    const parsed = Number.parseInt(id, 10);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeAddressValue = (address: unknown): Partial<Address> | undefined => {
  if (!address || typeof address !== "object") return undefined;

  const partialAddress = address as Partial<Address> & { id?: string | number };
  const parsedId = parseNumericId(partialAddress.id);

  return {
    ...partialAddress,
    ...(parsedId !== undefined ? { id: parsedId } : {}),
  } as Partial<Address>;
};

const normalizeMediaResource = (media: unknown): PayloadMedia | undefined => {
  if (!media || typeof media !== "object") return undefined;

  const resource = media as Partial<PayloadMedia> & { id?: string | number };
  const parsedId = parseNumericId(resource.id);

  return {
    ...resource,
    ...(parsedId !== undefined ? { id: parsedId } : {}),
  } as PayloadMedia;
};

type EcommerceAddress = NonNullable<ReturnType<typeof useAddresses>["addresses"]>[number];

export const CheckoutPage: React.FC = () => {
  const { user, status } = useAuth();
  const router = useRouter();
  const { cart } = useCart();
  const { currency } = useCurrency();
  const activeCurrencyCode = cart?.currency ?? currency.code;
  const [error, setError] = useState<null | string>(null);
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState("");
  const [emailEditable, setEmailEditable] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const { initiatePayment } = usePayments();
  const { addresses } = useAddresses();
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>();
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>();
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
  const [isProcessingPayment, setProcessingPayment] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [availableMethods, setAvailableMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const lastCartIdentitySync = useRef<string | null>(null);

  const transformAddress = useCallback(
    (address: EcommerceAddress) => normalizeAddressValue(address),
    [],
  );

  const cartIsEmpty = !cart || !cart.items || !cart.items.length;

  const contactEmail = useMemo(() => {
    if (user?.email) return user.email;
    if (emailEditable) return undefined;
    return email || undefined;
  }, [email, emailEditable, user?.email]);

  const resolvedShippingAddress = useMemo(() => {
    return billingAddressSameAsShipping ? billingAddress : shippingAddress;
  }, [billingAddress, billingAddressSameAsShipping, shippingAddress]);

  const canGoToPayment = Boolean(
    contactEmail && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  );

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setEmailEditable(false);
    }
  }, [user]);

  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0];
        if (defaultAddress) {
          const normalized = normalizeAddressValue(defaultAddress);
          if (normalized) {
            setBillingAddress(normalized);
          }
        }
      }
    }
  }, [addresses, shippingAddress]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch("/api/shipping-zones?limit=100");
        const data = (await response.json()) as { docs: ShippingZone[] };
        setShippingZones(data.docs || []);
      } catch (error) {
        console.error("Failed to fetch shipping zones:", error);
      }
    };
    void fetchZones();

    return () => {
      setShippingAddress(undefined);
      setBillingAddress(undefined);
      setBillingAddressSameAsShipping(true);
      setEmail("");
      setEmailEditable(true);
    };
  }, []);

  useEffect(() => {
    if (!cart?.id || !contactEmail) return;

    const syncKey = `${cart.id}:${contactEmail}:${marketingOptIn ? "1" : "0"}`;
    if (lastCartIdentitySync.current === syncKey) return;

    const syncCartIdentity = async () => {
      try {
        const secret = getGuestCartSecret(window.localStorage);
        const query = new URLSearchParams();

        if (secret) {
          query.set("secret", secret);
        }

        const response = await fetch(
          `/api/carts/${cart.id}${query.size > 0 ? `?${query.toString()}` : ""}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              customerEmail: contactEmail,
              marketingOptIn,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        lastCartIdentitySync.current = syncKey;
      } catch (error) {
        console.error("Failed to sync cart contact details for lifecycle email campaigns.", error);
      }
    };

    void syncCartIdentity();
  }, [cart?.id, contactEmail, marketingOptIn]);

  const handleShippingChange = useCallback(
    async (methodId: string, cost: number, label: string) => {
      if (!cart?.id) return;

      setSelectedMethod(methodId);
      setIsUpdatingCart(true);

      try {
        const secret = getGuestCartSecret(window.localStorage);
        const query = new URLSearchParams();
        if (secret) query.set("secret", secret);

        const response = await fetch(
          `/api/carts/${cart.id}${query.size > 0 ? `?${query.toString()}` : ""}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              shippingMethod: label,
              shippingTotal: cost,
            }),
          },
        );

        if (!response.ok) throw new Error("Failed to update shipping method");

        router.refresh();
      } catch (error) {
        console.error("Error updating shipping:", error);
        toast.error("Failed to update shipping method");
      } finally {
        setIsUpdatingCart(false);
      }
    },
    [cart?.id, router],
  );

  // Update available methods when address or subtotal changes
  useEffect(() => {
    if (
      resolvedShippingAddress?.country &&
      resolvedShippingAddress?.state &&
      shippingZones.length > 0
    ) {
      const zone = matchShippingZone(
        shippingZones,
        resolvedShippingAddress.country,
        resolvedShippingAddress.state,
      );
      if (zone) {
        const methods = getMethodsFromZone(zone, cart?.subtotal || 0);
        setAvailableMethods(methods);

        // Auto-select first method if none selected or if previously selected is not in new methods
        if (methods.length > 0) {
          const stillAvailable = methods.find((m) => m.id === selectedMethod);
          if (!stillAvailable) {
            void handleShippingChange(methods[0].id, methods[0].cost, methods[0].label);
          }
        } else {
          setAvailableMethods([]);
          setSelectedMethod("");
        }
      } else {
        setAvailableMethods([]);
        setSelectedMethod("");
      }
    } else {
      setAvailableMethods([]);
      setSelectedMethod("");
    }
  }, [
    resolvedShippingAddress,
    shippingZones,
    cart?.subtotal,
    selectedMethod,
    handleShippingChange,
  ]);

  const contactDetails = useMemo(() => {
    const [firstNameFromUser, ...restName] = user?.name ? user.name.split(" ") : [];
    const inferredLastNameFromUser = restName.length > 0 ? restName.join(" ") : undefined;

    return {
      email: contactEmail,
      firstName:
        billingAddress?.firstName ??
        resolvedShippingAddress?.firstName ??
        firstNameFromUser ??
        undefined,
      lastName:
        billingAddress?.lastName ??
        resolvedShippingAddress?.lastName ??
        inferredLastNameFromUser ??
        undefined,
      phone: billingAddress?.phone ?? resolvedShippingAddress?.phone ?? undefined,
    };
  }, [billingAddress, contactEmail, resolvedShippingAddress, user?.name]);

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      if (!cart?.id) {
        setError("Cart is missing. Please refresh and try again.");
        return;
      }

      setError(null);

      if (mockCheckout) {
        setPaymentData({ reference: "mock" });
        return;
      }

      try {
        const paymentResponse = await initiatePayment(paymentID, {
          additionalData: {
            ...(contactEmail ? { customerEmail: contactEmail } : {}),
            contact: contactDetails,
            billingAddress,
            shippingAddress: resolvedShippingAddress,
          },
        });

        if (isPaymentData(paymentResponse)) {
          if (paymentResponse.authorization_url && typeof window !== "undefined") {
            window.location.assign(paymentResponse.authorization_url);
            return;
          }
          setPaymentData(paymentResponse);
        } else {
          setPaymentData(null);
        }
      } catch (err: unknown) {
        console.error("Payment initiation error:", err);
        let errorMessage = "An error occurred while initiating payment.";

        if (err instanceof Error) {
          try {
            const errorData = JSON.parse(err.message);
            if (errorData?.cause?.code === "OutOfStock") {
              errorMessage = "One or more items in your cart are out of stock.";
            }
          } catch {
            errorMessage = err.message || errorMessage;
          }
        }

        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [
      billingAddress,
      cart?.id,
      contactDetails,
      contactEmail,
      initiatePayment,
      resolvedShippingAddress,
    ],
  );

  const handleOrderCreated = useCallback(
    (order: { id?: number | string | null } | null, inviteToken?: string | null) => {
      if (!order?.id) {
        return;
      }

      const params = new URLSearchParams();
      params.set("orderId", String(order.id));
      if (contactDetails.email) params.set("email", contactDetails.email);
      if (inviteToken) params.set("inviteToken", inviteToken);

      const url = `/checkout/confirm-order?${params.toString()}`;
      router.push(url);
    },
    [contactDetails.email, router],
  );

  if (status === undefined) {
    return (
      <div className="py-24 w-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-12 w-full items-center justify-center">
        <div className="prose dark:prose-invert text-center max-w-none self-center mb-8">
          <p>Processing your payment...</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>Your cart is empty.</p>
        <Link href="/search">Continue shopping?</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <h2 className="font-medium text-3xl">Contact</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">or</span>
                <Link href="/create-account">create an account</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{" "}
              <p>
                Not you?{" "}
                <Link className="underline" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">Enter your email to checkout as a guest.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault();
                  setEmailEditable(false);
                }}
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Checkbox
            id="marketingOptIn"
            checked={marketingOptIn}
            onCheckedChange={(state) => {
              setMarketingOptIn(Boolean(state));
            }}
          />
          <Label htmlFor="marketingOptIn">Keep me updated with news and offers</Label>
        </div>

        <h2 className="font-medium text-3xl">Address</h2>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={"outline"}
                  disabled={Boolean(paymentData)}
                  onClick={(e) => {
                    e.preventDefault();
                    setBillingAddress(undefined);
                  }}
                >
                  Remove
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses
            heading="Billing address"
            setAddress={setBillingAddress}
            transformAddress={transformAddress}
          />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address);
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={Boolean(paymentData || (!user && (!email || Boolean(emailEditable))))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean);
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={"outline"}
                      disabled={Boolean(paymentData)}
                      onClick={(e) => {
                        e.preventDefault();
                        setShippingAddress(undefined);
                      }}
                    >
                      Remove
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading="Shipping address"
                description="Please select a shipping address."
                setAddress={setShippingAddress}
                transformAddress={transformAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address);
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}

        {resolvedShippingAddress && (
          <div className="flex flex-col gap-4">
            <h2 className="font-medium text-3xl">Shipping Method</h2>
            {availableMethods.length > 0 ? (
              <Select
                value={selectedMethod}
                onValueChange={(val) => {
                  const method = availableMethods.find((m) => m.id === val);
                  if (method) void handleShippingChange(method.id, method.cost, method.label);
                }}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select a shipping method" />
                </SelectTrigger>
                <SelectContent>
                  {availableMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.label}{" "}
                      {method.cost > 0 ? `(+N${method.cost.toLocaleString()})` : "(Free)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground italic">
                No shipping methods available for this location.
              </p>
            )}
            {isUpdatingCart && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoadingSpinner className="w-3 h-3" /> Updating cart...
              </div>
            )}
          </div>
        )}

        {!paymentData && (
          <Button
            className="self-start"
            disabled={!canGoToPayment}
            onClick={(e) => {
              e.preventDefault();
              void initiatePaymentIntent("paystack");
            }}
          >
            {mockCheckout ? "Review order" : "Go to payment"}
          </Button>
        )}

        {!paymentData && error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault();
                router.refresh();
              }}
              variant="default"
            >
              Try again
            </Button>
          </div>
        )}

        <Suspense fallback={<React.Fragment />}>
          {paymentData && (
            <div className="pb-16">
              <h2 className="font-medium text-3xl">Payment</h2>
              {error && <p>{`Error: ${error}`}</p>}
              <div className="flex flex-col gap-8">
                <CheckoutForm
                  contact={contactDetails}
                  customerEmail={contactDetails.email}
                  billingAddress={billingAddress}
                  marketingOptIn={marketingOptIn}
                  onOrderCreated={handleOrderCreated}
                  shippingAddress={resolvedShippingAddress}
                  setProcessingPayment={setProcessingPayment}
                  paymentData={paymentData}
                />
                <Button variant="ghost" className="self-start" onClick={() => setPaymentData(null)}>
                  Cancel payment
                </Button>
              </div>
            </div>
          )}
        </Suspense>
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
          <h2 className="text-3xl font-medium">Your cart</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === "object" && item.product) {
              const {
                product,
                product: { meta, title, gallery },
                quantity,
                variant,
              } = item;

              if (!quantity) return null;

              let imageCandidate: unknown = gallery?.[0]?.image || meta?.image;
              let price =
                getEffectiveUnitPrice({
                  currencyCode: activeCurrencyCode,
                  product,
                }) ?? null;

              const isVariant = Boolean(variant) && typeof variant === "object";

              if (isVariant) {
                price =
                  getEffectiveUnitPrice({
                    currencyCode: activeCurrencyCode,
                    product,
                    variant,
                  }) ?? null;

                const imageVariant = product.gallery?.find(
                  (item: NonNullable<Product["gallery"]>[number]) => {
                    if (!item.variantOption) return false;
                    const variantOptionID =
                      typeof item.variantOption === "object"
                        ? item.variantOption.id
                        : item.variantOption;

                    const hasMatch = variant?.options?.some((option: number | VariantOption) => {
                      if (typeof option === "object") return option.id === variantOptionID;
                      else return option === variantOptionID;
                    });

                    return hasMatch;
                  },
                );

                if (imageVariant && typeof imageVariant.image !== "string") {
                  imageCandidate = imageVariant.image;
                }
              }

              const mediaResource = normalizeMediaResource(imageCandidate);

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {mediaResource && (
                        <Media
                          className=""
                          fill
                          imgClassName="rounded-lg"
                          resource={mediaResource}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === "object" && (
                        <p className="text-sm font-mono text-primary/50 tracking-widest">
                          {variant.options
                            ?.map((option: number | VariantOption) => {
                              if (typeof option === "object") return option.label;
                              return null;
                            })
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      <div>
                        {"x"}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === "number" && <Price amount={price} />}
                  </div>
                </div>
              );
            }
            return null;
          })}
          <hr />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground uppercase">Subtotal</span>
              <Price amount={cart.subtotal || 0} currencyCode={activeCurrencyCode} />
            </div>
            {(cart as unknown as any).shippingTotal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                  Shipping ({(cart as unknown as any).shippingMethod})
                </span>
                <Price
                  amount={(cart as unknown as any).shippingTotal}
                  currencyCode={activeCurrencyCode}
                />
              </div>
            )}
            {(cart as unknown as any).taxTotal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
                  VAT (7.5%)
                </span>
                <Price
                  amount={(cart as unknown as any).taxTotal}
                  currencyCode={activeCurrencyCode}
                />
              </div>
            )}
            <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t">
              <span className="uppercase font-bold">Total</span>
              <Price
                className="text-3xl font-medium"
                amount={
                  (cart.subtotal || 0) +
                  ((cart as unknown as any).shippingTotal || 0) +
                  ((cart as unknown as any).taxTotal || 0)
                }
                currencyCode={activeCurrencyCode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
