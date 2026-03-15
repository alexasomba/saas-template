"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGuestCartSecret } from "@/utilities/ecommerce/cartStorage";
import { useCart, useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import { toast } from "sonner";

export const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const { cart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCurrencyChange = async (newCurrencyCode: string) => {
    if (newCurrencyCode === currency.code || isSyncing) return;

    document.cookie = `payload-currency=${newCurrencyCode}; path=/; max-age=31536000; samesite=lax`;

    if (!cart?.id) {
      setCurrency(newCurrencyCode);
      return;
    }

    setIsSyncing(true);

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
            currency: newCurrencyCode,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to sync cart currency.");
      }

      setCurrency(newCurrencyCode);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Unable to update cart currency. Please try again.");
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select disabled={isSyncing} value={currency.code} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-20 h-8 text-xs border-none bg-transparent shadow-none focus:ring-0">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent align="end">
          {supportedCurrencies.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs text-center cursor-pointer">
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
