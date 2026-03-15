"use client";

import type { Order } from "@/payload-types";

import { AddressItem } from "@/components/addresses/AddressItem";
import { Message } from "@/components/Message";
import { OrderStatus } from "@/components/OrderStatus";
import { Price } from "@/components/Price";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/Auth";
import { formatDateTime } from "@/utilities/formatDateTime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent, useCallback, useMemo, useState } from "react";

type OrderSummary = {
  id: Order["id"];
  amount?: Order["amount"];
  currency?: Order["currency"];
  status?: Order["status"];
  createdAt?: Order["createdAt"];
  customerEmail?: Order["customerEmail"];
  items?: Order["items"];
  shippingAddress?: Order["shippingAddress"];
  contact?: Order["contact"];
  accountInvite?: Order["accountInvite"];
};

type ConfirmOrderProps = {
  order: OrderSummary | null;
  accessToken?: string;
  inviteToken?: string;
  email?: string;
};

type LineItem = {
  id: string;
  title: string;
  variant?: string | null;
  quantity: number;
};

function extractLineItems(order: OrderSummary | null): LineItem[] {
  if (!order?.items || !Array.isArray(order.items)) return [];

  const lineItems: LineItem[] = [];

  order.items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const productRaw = "product" in item ? item.product : null;
    const variantRaw = "variant" in item ? item.variant : null;

    const productTitle =
      productRaw && typeof productRaw === "object" && "title" in productRaw
        ? (productRaw.title as string)
        : null;

    const variantTitle =
      variantRaw && typeof variantRaw === "object" && "title" in variantRaw
        ? (variantRaw.title as string | null)
        : null;

    const options =
      variantRaw &&
      typeof variantRaw === "object" &&
      "options" in variantRaw &&
      Array.isArray(variantRaw.options)
        ? variantRaw.options
            .map((option) => {
              if (!option || typeof option !== "object") return null;
              const label = "label" in option ? option.label : null;
              const value = "value" in option ? option.value : null;
              if (typeof label === "string" && typeof value === "string") {
                return `${label}: ${value}`;
              }
              if (typeof value === "string") return value;
              if (typeof label === "string") return label;
              return null;
            })
            .filter(Boolean)
            .join(" · ")
        : null;

    const quantity = "quantity" in item && typeof item.quantity === "number" ? item.quantity : 1;

    const lineItem: LineItem = {
      id: "id" in item && item.id ? String(item.id) : `${index}`,
      title: productTitle ?? "Item",
      quantity,
    };

    const resolvedVariant = variantTitle || options;
    if (resolvedVariant) {
      lineItem.variant = resolvedVariant;
    }

    lineItems.push(lineItem);
  });

  return lineItems;
}

function formatInviteExpiry(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateTime({ date: expiresAt, format: "MMMM dd, yyyy p" });
}

export const ConfirmOrder: React.FC<ConfirmOrderProps> = ({
  order,
  accessToken,
  inviteToken,
  email,
}) => {
  const router = useRouter();
  const { login } = useAuth();

  const resolvedEmail = email ?? order?.contact?.email ?? order?.customerEmail ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(() =>
    Boolean(order?.contact?.marketingOptIn),
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const lineItems = useMemo(() => extractLineItems(order), [order]);

  const inviteExpired = useMemo(() => {
    if (!order?.accountInvite?.expiresAt) return false;
    const expires = new Date(order.accountInvite.expiresAt);
    if (Number.isNaN(expires.getTime())) return false;
    return expires.getTime() < Date.now();
  }, [order?.accountInvite?.expiresAt]);

  const activeInviteToken = useMemo(() => {
    if (!order?.accountInvite || order.accountInvite.redeemedAt) return null;
    return inviteToken ?? order.accountInvite.token ?? null;
  }, [inviteToken, order?.accountInvite]);

  const canRedeemInvite = Boolean(activeInviteToken && !inviteExpired);

  const headline = order ? "Thank you! Your order is confirmed." : "Order not found.";

  const handleAccountConversion = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!activeInviteToken) {
        setErrorMessage("This invite is no longer valid.");
        return;
      }
      if (inviteExpired) {
        setErrorMessage("This invite has expired. Reach out to support for a new link.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setLoginError(null);

      try {
        const response = await fetch("/api/checkout/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountInviteToken: activeInviteToken,
            password,
            marketingOptIn,
          }),
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
          const message = errorBody?.error ?? "Unable to create account. Please try again.";
          throw new Error(message);
        }

        setSuccessMessage("Account created! Redirecting you to your account dashboard...");

        if (resolvedEmail) {
          try {
            await login({ email: resolvedEmail, password });
            router.push(
              "/account?success=" + encodeURIComponent("Welcome! Your account has been created."),
            );
          } catch (authError) {
            console.error(authError);
            setLoginError("Account created, but automatic sign-in failed. Please log in manually.");
          }
        }

        setPassword("");
        setConfirmPassword("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to convert account.";
        setErrorMessage(message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      activeInviteToken,
      confirmPassword,
      inviteExpired,
      login,
      marketingOptIn,
      password,
      resolvedEmail,
      router,
    ],
  );

  if (!order) {
    return (
      <div className="w-full flex flex-col gap-8 items-center text-center">
        <h1 className="text-3xl font-semibold">{headline}</h1>
        <p className="text-muted-foreground max-w-xl">
          We could not find the order you were looking for. Double-check the link in your
          confirmation email or search for your order below.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link href="/find-order">Find my order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const inviteRedeemed = Boolean(order.accountInvite?.redeemedAt);
  const showInviteBanner = canRedeemInvite || inviteRedeemed;

  return (
    <div className="w-full flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold mb-4">{headline}</h1>
        <div className="text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Order ID:</span> #{order.id}
          </p>
          {order.createdAt && (
            <p>
              <span className="font-medium">Placed on:</span>{" "}
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: "MMMM dd, yyyy p" })}
              </time>
            </p>
          )}
          {order.status && (
            <div className="flex gap-2 items-center">
              <span className="font-medium">Status:</span>
              <OrderStatus status={order.status} />
            </div>
          )}
        </div>
      </div>

      {showInviteBanner && (
        <div className="rounded-lg border bg-primary/5 p-6 flex flex-col gap-2 max-w-2xl">
          <h2 className="text-xl font-semibold">Create an account to track your orders</h2>
          {inviteRedeemed ? (
            <p className="text-muted-foreground">
              This invite has already been redeemed. You can{" "}
              <Link href="/login" className="underline">
                sign in
              </Link>{" "}
              with your account to review your order history.
            </p>
          ) : inviteExpired ? (
            <p className="text-muted-foreground">
              Your invite expired on {formatInviteExpiry(order.accountInvite?.expiresAt)}. Contact
              support for a new link or continue as a guest.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Set a password below to save your details for next time and keep your order history in
              one place.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Order summary</h2>
            <div className="space-y-4">
              {lineItems.length === 0 ? (
                <p className="text-muted-foreground">
                  We could not recover the items on this order.
                </p>
              ) : (
                <ul className="space-y-4">
                  {lineItems.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.variant && (
                          <p className="text-muted-foreground text-sm">{item.variant}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Qty {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t pt-4 text-right">
              {typeof order.amount === "number" ? (
                <Price
                  amount={order.amount}
                  currencyCode={order.currency ?? undefined}
                  className="text-lg font-semibold"
                />
              ) : (
                <p className="text-muted-foreground text-sm">Total unavailable</p>
              )}
            </div>
          </div>

          {order.shippingAddress && (
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping address</h2>
              {/* @ts-expect-error - payload returns address shape compatible with AddressItem */}
              <AddressItem address={order.shippingAddress} hideActions />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {canRedeemInvite && !inviteRedeemed && (
            <form className="rounded-lg border p-6 space-y-6" onSubmit={handleAccountConversion}>
              <div>
                <h2 className="text-lg font-semibold">Create your account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the email{" "}
                  <span className="font-medium">{resolvedEmail || "provided at checkout"}</span> and
                  choose a password below.
                </p>
              </div>

              <Message error={errorMessage} success={successMessage} warning={loginError} />

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="passwordConfirm">Confirm password</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={submitting}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={marketingOptIn}
                  onCheckedChange={(next) => setMarketingOptIn(Boolean(next))}
                  disabled={submitting}
                />
                Keep me updated with product news and offers.
              </label>

              <Button disabled={submitting} type="submit" className="w-full" variant="default">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner className="h-4 w-4" />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          )}

          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">What&apos;s next?</h2>
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive an email confirmation with your order details. You can review your
              order anytime using the link below.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link
                href={`/checkout/confirm-order?orderId=${encodeURIComponent(String(order.id))}${accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : ""}${inviteToken ? `&inviteToken=${encodeURIComponent(inviteToken)}` : ""}`}
              >
                View order details
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/search">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
