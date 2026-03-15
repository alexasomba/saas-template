"use client";

import type { SortFilterItem as SortFilterItemType } from "@/lib/constants";

import { createUrl } from "@/utilities/createUrl";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import type { ListItem } from ".";
import type { PathFilterItem as PathFilterItemType } from ".";
import { useCurrency } from "@payloadcms/plugin-ecommerce/client/react";

function PathFilterItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? "p" : Link;

  newParams.delete("q");

  return (
    <li className="mt-2 flex text-black dark:text-white" key={item.title}>
      <DynamicTag
        className={clsx(
          "w-full text-sm underline-offset-4 hover:underline dark:hover:text-neutral-100",
          {
            "underline underline-offset-4": active,
          },
        )}
        href={createUrl(item.path, newParams)}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItemType }) {
  const { currency } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const itemSlug = item.slug?.replace("priceInUSD", `priceIn${currency.code}`);
  const active = searchParams.get("sort") === itemSlug;
  const q = searchParams.get("q");
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(itemSlug && itemSlug.length && { sort: itemSlug }),
    }),
  );
  const DynamicTag = active ? "p" : Link;

  return (
    <li className="mt-2 flex text-sm text-black dark:text-white" key={item.title}>
      <DynamicTag
        className={clsx("w-full hover:underline hover:underline-offset-4", {
          "underline underline-offset-4": active,
        })}
        href={href}
        prefetch={!active ? false : undefined}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return "path" in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />;
}
