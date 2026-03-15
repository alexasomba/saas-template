"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Message } from "@/components/Message";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type VerifyResponse = {
  error?: string;
  message?: string;
  status?: "already_verified" | "verified";
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const redirect = searchParams.get("redirect");
  const hasRunRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token || hasRunRef.current) return;
    hasRunRef.current = true;

    const verify = async () => {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...(email ? { email } : {}),
        }),
      });

      const data = (await response.json().catch(() => null)) as VerifyResponse | null;

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Unable to verify email.");
      }

      setSuccessMessage(
        data?.status === "already_verified"
          ? "Email already verified. Redirecting you to login..."
          : "Email verified successfully. Redirecting you to login...",
      );
      setVerified(true);
    };

    void verify().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to verify email.");
    });
  }, [token]);

  useEffect(() => {
    if (!verified) return;

    const timeout = window.setTimeout(() => {
      const nextURL = redirect
        ? `/login?redirect=${encodeURIComponent(redirect)}&success=${encodeURIComponent(
            "Email verified. Please sign in.",
          )}`
        : `/login?success=${encodeURIComponent("Email verified. Please sign in.")}`;

      router.replace(nextURL);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [redirect, router, verified]);

  if (error) {
    return (
      <div className="container py-16 max-w-xl">
        <Message error={error} />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="container py-16 max-w-xl">
        <Message
          success={successMessage || "Email verified successfully. Redirecting you to login..."}
        />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container py-16 max-w-xl">
        <div className="prose dark:prose-invert">
          <h1>Verify your email</h1>
          <p>
            {email
              ? `We sent a verification link to ${email}. Open that email to activate your account.`
              : "We sent you a verification link. Open that email to activate your account."}
          </p>
        </div>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 max-w-xl flex flex-col items-center gap-4">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">Verifying your email...</p>
    </div>
  );
}
