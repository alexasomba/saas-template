"use client";

import type { CartItem } from "@/components/Cart";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import clsx from "clsx";
import { XIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { parseCartError } from "./cartError";

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { removeItem } = useCart();
  const itemId = React.useMemo<string | undefined>(() => {
    return item.id ? String(item.id) : undefined;
  }, [item.id]);

  return (
    <form>
      <button
        aria-disabled={itemId === undefined}
        aria-label="Remove cart item"
        className={clsx(
          "ease hover:cursor-pointer flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200",
          {
            "cursor-not-allowed px-0": itemId === undefined,
          },
        )}
        disabled={itemId === undefined}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault();
          if (itemId !== undefined) {
            void removeItem(itemId as string).catch((error) => {
              const parsed = parseCartError(error);
              toast.error(parsed.message);
            });
          }
        }}
        type="button"
      >
        <XIcon className="hover:text-accent-3 mx-[1px] h-4 w-4 text-white dark:text-black" />
      </button>
    </form>
  );
}
