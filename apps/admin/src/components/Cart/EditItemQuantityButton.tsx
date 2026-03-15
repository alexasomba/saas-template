"use client";

import { CartItem } from "@/components/Cart";
import { useCart } from "@payloadcms/plugin-ecommerce/client/react";
import clsx from "clsx";
import { MinusIcon, PlusIcon } from "lucide-react";
import React, { useMemo } from "react";
import { toast } from "sonner";

import { parseCartError } from "./cartError";

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: "minus" | "plus" }) {
  const { decrementItem, incrementItem } = useCart();
  const itemId = useMemo<string | undefined>(() => {
    return item.id ? String(item.id) : undefined;
  }, [item.id]);

  const disabled = useMemo(() => {
    if (itemId === undefined) return true;

    const target =
      item.variant && typeof item.variant === "object"
        ? item.variant
        : item.product && typeof item.product === "object"
          ? item.product
          : null;

    if (
      target &&
      typeof target === "object" &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === "plus" && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory;
      }
    }

    return false;
  }, [item, itemId, type]);

  return (
    <form>
      <button
        aria-disabled={disabled}
        disabled={disabled}
        aria-label={type === "plus" ? "Increase item quantity" : "Reduce item quantity"}
        className={clsx(
          "ease hover:cursor-pointer flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80",
          {
            "cursor-not-allowed": disabled,
            "ml-auto": type === "minus",
          },
        )}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault();

          if (itemId !== undefined) {
            if (type === "plus") {
              void incrementItem(itemId as string).catch((error) => {
                const parsed = parseCartError(error);
                toast.error(parsed.message);
              });
            } else {
              void decrementItem(itemId as string).catch((error) => {
                const parsed = parseCartError(error);
                toast.error(parsed.message);
              });
            }
          }
        }}
        type="button"
      >
        {type === "plus" ? (
          <PlusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        ) : (
          <MinusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        )}
      </button>
    </form>
  );
}
