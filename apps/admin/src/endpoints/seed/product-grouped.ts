import type { Category, Media, Product } from "@/payload-types";
import { RequiredDataFromCollectionSlug } from "payload";

type ProductArgs = {
  galleryImage: Media;
  metaImage: Media;
  categories: Category[];
  childProducts: Product[];
};

export const productGroupedData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<"products"> = ({
  galleryImage,
  metaImage,
  categories,
  childProducts,
}) => {
  return {
    title: "Starter Pack",
    slug: "starter-pack",
    productType: "grouped",
    isVirtual: false,
    isDownloadable: false,
    groupedProducts: childProducts,
    priceInUSDEnabled: false,
    priceInNGNEnabled: false,
    inventory: 0,
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
                text: "Everything you need to get started. This collection bundles our most popular items — add any or all of them to your cart.",
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
      title: "Starter Pack | AutomaticPallet",
      image: metaImage,
      description: "A curated bundle of our most popular items. Add any or all to your cart.",
    },
  };
};
