import type { Category, Media } from "@/payload-types";
import { RequiredDataFromCollectionSlug } from "payload";

type ProductArgs = {
  galleryImage: Media;
  metaImage: Media;
  categories: Category[];
};

export const productExternalData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<"products"> = ({ galleryImage, metaImage, categories }) => {
  return {
    title: "Payload CMS Official Merch",
    slug: "payload-cms-official-merch",
    productType: "external",
    isVirtual: false,
    isDownloadable: false,
    externalUrl: "https://t.co/payloadcms",
    externalButtonText: "Shop on Payload Store",
    priceInUSDEnabled: true,
    priceInUSD: 3000,
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
                text: "Official Payload CMS merchandise — t-shirts, hoodies, and accessories available directly from the Payload store.",
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
      title: "Payload CMS Official Merch | AutomaticPallet",
      image: metaImage,
      description: "Official Payload CMS merchandise, sold on the Payload store.",
    },
  };
};
