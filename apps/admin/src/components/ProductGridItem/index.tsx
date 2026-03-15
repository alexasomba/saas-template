"use client";
import type { Product, Variant } from "@/payload-types";

import Link from "next/link";
import React from "react";
import clsx from "clsx";
import { Media } from "@/components/Media";
import { Price } from "@/components/Price";
import { useCurrency } from "@payloadcms/plugin-ecommerce/client/react";
import { getEffectiveUnitPrice } from "@/utilities/ecommerce/pricing";

type Props = {
  product: Partial<Product>;
};

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, title } = product;
  const { currency } = useCurrency();

  const variants = product.variants?.docs;
  const firstVariant =
    variants && variants.length > 0 && typeof variants[0] === "object" ? variants[0] : undefined;
  const price =
    getEffectiveUnitPrice({
      currencyCode: currency.code,
      product,
      variant: firstVariant,
    }) ?? undefined;

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== "string" ? gallery[0]?.image : false;

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      {image ? (
        <Media
          className={clsx(
            "relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground",
          )}
          height={80}
          imgClassName={clsx("h-full w-full object-cover rounded-2xl", {
            "transition duration-300 ease-in-out group-hover:scale-102": true,
          })}
          resource={image}
          width={80}
        />
      ) : null}

      <div className="font-mono text-primary/50 group-hover:text-primary/100 flex justify-between items-center mt-4">
        <div>{title}</div>

        {typeof price === "number" && (
          <div className="">
            <Price amount={price} />
          </div>
        )}
      </div>
    </Link>
  );
};
