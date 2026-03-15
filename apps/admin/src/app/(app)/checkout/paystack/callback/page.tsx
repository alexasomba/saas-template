"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Message } from "@/components/Message";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type CheckoutResponse = {
  order?: { id?: number | string | null };
  accountInviteToken?: string | null;
  orderAccessToken?: string | null;
  error?: string;
};

export default function PaystackCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRunRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setError("Payment reference missing from Paystack callback.");
      return;
    }

    const finalize = async () => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentData: {
            reference,
          },
        }),
      });

      const data = (await response.json().catch(() => null)) as CheckoutResponse | null;

      if (!response.ok || !data?.order?.id) {
        throw new Error(data?.error || "Unable to finalize checkout.");
      }

      const params = new URLSearchParams();
      params.set("orderId", String(data.order.id));
      if (data.orderAccessToken) {
        params.set("accessToken", data.orderAccessToken);
      }
      if (data.accountInviteToken) {
        params.set("inviteToken", data.accountInviteToken);
      }

      router.replace(`/checkout/confirm-order?${params.toString()}`);
    };

    void finalize().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to finalize checkout.");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="container min-h-[70vh] flex flex-col items-center justify-center gap-6 py-12">
        <Message error={error} />
        <Button asChild variant="outline">
          <Link href="/checkout">Return to checkout</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container min-h-[70vh] flex flex-col items-center justify-center gap-6 py-12">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">Finalizing your payment...</p>
    </div>
  );
}
