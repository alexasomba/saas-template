import { currenciesConfig } from "@/config/currencies";
import { AuthProvider } from "@/providers/Auth";
import { EcommerceProvider } from "@payloadcms/plugin-ecommerce/client/react";
import { ecommerceApiConfig } from "@/providers/ecommerceApiConfig";
import { ecommerceStorageConfig } from "@/plugins/ecommerceConfig";
import { paystackAdapterClient } from "@/plugins/paystack/client";
import React from "react";

import { HeaderThemeProvider } from "./HeaderTheme";
import { ThemeProvider } from "./Theme";
import { SonnerProvider } from "@/providers/Sonner";

import { getMockCheckoutStatus } from "@/utilities/isMockCheckout";

const mockCheckout = getMockCheckoutStatus();

const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

const paymentMethods =
  !mockCheckout && paystackPublicKey
    ? [
        paystackAdapterClient({
          label: "Paystack",
        }),
      ]
    : [];

export const Providers: React.FC<{
  children: React.ReactNode;
  defaultCurrency?: string;
}> = ({ children, defaultCurrency = "NGN" }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            currenciesConfig={{
              ...currenciesConfig,
              defaultCurrency: defaultCurrency as "USD" | "NGN",
            }}
            enableVariants={true}
            api={ecommerceApiConfig}
            paymentMethods={paymentMethods}
            syncLocalStorage={ecommerceStorageConfig.syncLocalStorage}
          >
            {children}
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
