import type { Category, Media } from "@/payload-types";
import { RequiredDataFromCollectionSlug } from "payload";

type ProductArgs = {
  galleryImage: Media;
  metaImage: Media;
  categories: Category[];
};

export const productVirtualData: (
  args: ProductArgs,
) => RequiredDataFromCollectionSlug<"products"> = ({ galleryImage, metaImage, categories }) => {
  return {
    title: "1-Hour Design Consultation",
    slug: "design-consultation-1hr",
    productType: "simple",
    isVirtual: true,
    isDownloadable: false,
    priceInUSDEnabled: true,
    priceInUSD: 15000,
    priceInNGNEnabled: true,
    priceInNGN: 90000,
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
                text: "Book a one-hour live session with our design team. We will review your project, provide actionable feedback, and help you plan your next steps. No shipping required — you will receive a calendar invite after checkout.",
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
      title: "1-Hour Design Consultation | AutomaticPallet",
      image: metaImage,
      description:
        "One-hour live design consultation session. Virtual — no shipping required. Calendar invite sent after checkout.",
    },
  };
};
