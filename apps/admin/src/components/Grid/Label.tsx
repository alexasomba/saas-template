"use client";
import { useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import type { Product, Variant } from "@/payload-types";
import clsx from "clsx";
import React from "react";

import { Price } from "@/components/Price";

type Props = {
  amount?: number;
  product?: Product;
  position?: "bottom" | "center";
  title: string;
};

export const Label: React.FC<Props> = ({
  amount: amountFromProps,
  product,
  position = "bottom",
  title,
}) => {
  const { currency } = useCurrency();
  const priceField = `priceIn${currency.code}` as keyof Product;

  let amount = amountFromProps;

  if (!amount && product) {
    amount = product[priceField] as number;

    if (product.enableVariants && product.variants?.docs?.length) {
      amount = product.variants.docs.reduce<number>((acc, variant) => {
        if (typeof variant === "object" && variant) {
          const variantPrice = (variant as Variant)[priceField as keyof Variant];
          if (typeof variantPrice === "number" && variantPrice < acc) {
            return variantPrice;
          }
        }
        return acc;
      }, amount || Infinity);

      if (amount === Infinity) amount = 0;
    }
  }
  return (
    <div
      className={clsx("absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label", {
        "": position === "center",
      })}
    >
      <div className="flex items-end justify-between text-sm grow font-semibold ">
        <h3 className="mr-4 font-mono line-clamp-2 border p-2 px-3 leading-none tracking-tight rounded-full bg-white/70 text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
          {title}
        </h3>

        <Price
          amount={amount || 0}
          className="flex-none rounded-full bg-blue-600 p-2 text-white"
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  );
};
