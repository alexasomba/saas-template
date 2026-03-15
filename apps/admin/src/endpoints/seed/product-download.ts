import type { Category, Media } from "@/payload-types";
import { RequiredDataFromCollectionSlug } from "payload";

type ProductArgs = {
  galleryImage: Media;
  metaImage: Media;
  categories: Category[];
};

export const productDownloadData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<"products"> = ({ galleryImage, metaImage, categories }) => {
  return {
    title: "UI Design System — Starter Kit",
    slug: "ui-design-system-starter-kit",
    productType: "simple",
    isVirtual: true,
    isDownloadable: true,
    downloadLimit: 3,
    downloadExpiry: 30,
    priceInUSDEnabled: true,
    priceInUSD: 2500,
    priceInNGNEnabled: true,
    priceInNGN: 15000,
    inventory: 999,
    _status: "published",
    categories,
    relatedProducts: [],
    gallery: [{ image: galleryImage }],
    layout: [],
    description: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "A comprehensive UI design system starter kit including Figma components, design tokens, and documentation. Download up to 3 times within 30 days of purchase.",
                type: "text",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
            textFormat: 0,
            textStyle: "",
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    },
    meta: {
      title: "UI Design System Starter Kit | AutomaticPallet",
      image: metaImage,
      description:
        "Figma UI design system starter kit with components and tokens. Downloadable digital product.",
    },
  };
};
