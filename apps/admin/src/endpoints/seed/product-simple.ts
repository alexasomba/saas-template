import type { Category, Media, Product } from "@/payload-types";
import { RequiredDataFromCollectionSlug } from "payload";

type ProductArgs = {
  galleryImage: Media;
  metaImage: Media;
  categories: Category[];
  relatedProducts: Product[];
};

export const productSimpleData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<"products"> = ({
  galleryImage,
  metaImage,
  categories,
  relatedProducts,
}) => {
  return {
    title: "Classic Notebook",
    slug: "classic-notebook",
    productType: "simple",
    isVirtual: false,
    isDownloadable: false,
    sku: "NB-CLASSIC-001",
    weight: 0.3,
    dimensions: { length: 21, width: 14.8, height: 1 },
    priceInUSDEnabled: true,
    priceInUSD: 1200,
    priceInNGNEnabled: true,
    priceInNGN: 7500,
    inventory: 50,
    _status: "published",
    categories,
    relatedProducts,
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
                text: "A premium A5 hardcover notebook with 200 acid-free pages, perfect for journaling, sketching, or note-taking. Lay-flat binding lets you write comfortably from edge to edge.",
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
      title: "Classic Notebook | AutomaticPallet",
      image: metaImage,
      description:
        "Premium A5 hardcover notebook with 200 acid-free pages. Perfect for journaling and note-taking.",
    },
  };
};
