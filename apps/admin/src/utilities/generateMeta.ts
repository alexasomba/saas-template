import type { Metadata } from "next";

import type { Page, Post, Product } from "../payload-types";

import { getServerSideURL } from "./getURL";
import { mergeOpenGraph } from "./mergeOpenGraph";

export const generateMeta = async (args: { doc: Page | Post | Product }): Promise<Metadata> => {
  const { doc } = args || {};

  const imageURL =
    typeof doc?.meta?.image === "object" && doc.meta.image !== null && "url" in doc.meta.image
      ? doc.meta.image.url
      : null;

  const ogImage =
    typeof imageURL === "string" && imageURL.length > 0
      ? new URL(imageURL, getServerSideURL()).toString()
      : undefined;

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      ...(doc?.meta?.description
        ? {
            description: doc?.meta?.description,
          }
        : {}),
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title: doc?.meta?.title || doc?.title || "Payload Ecommerce Template",
      url: Array.isArray(doc?.slug) ? doc?.slug.join("/") : "/",
    }),
    title: doc?.meta?.title || doc?.title || "Payload Ecommerce Template",
  };
};
