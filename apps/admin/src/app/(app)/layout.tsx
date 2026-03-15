import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminBar } from "@/components/AdminBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LivePreviewListener } from "@/components/LivePreviewListener";
import { Providers } from "@/providers";
import { InitTheme } from "@/providers/Theme/InitTheme";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import React from "react";
import { cookies, headers } from "next/headers";
import "./globals.css";

import { ensureStartsWith } from "@/utilities/ensureStartsWith";
import { DEFAULT_CURRENCY } from "@/config/currencies";

const { SITE_NAME, TWITTER_CREATOR, TWITTER_SITE } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8787";
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, "@") : undefined;
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, "https://") : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: SITE_NAME || "Payload Ecommerce",
    template: `%s | ${SITE_NAME || "Payload Ecommerce"}`,
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: "summary_large_image",
        creator: twitterCreator,
        site: twitterSite,
      },
    }),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultCurrency = cookieStore.get("payload-currency")?.value || DEFAULT_CURRENCY;

  return (
    <html
      className={[GeistSans.variable, GeistMono.variable].filter(Boolean).join(" ")}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body>
        <Providers defaultCurrency={defaultCurrency}>
          <AdminBar />
          <LivePreviewListener />

          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
