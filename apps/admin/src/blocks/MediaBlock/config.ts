import type { Block } from "payload";

import { createBlockAdminImages, createBlockImageAlt } from "@/blocks/adminImages";

const adminImages = createBlockAdminImages({
  accent: "#F59E0B",
  label: "Media",
});

export const MediaBlock: Block = {
  slug: "mediaBlock",
  admin: {
    images: {
      icon: {
        alt: createBlockImageAlt("Media", "with an uploaded media preview"),
        url: adminImages.icon,
      },
      thumbnail: {
        alt: createBlockImageAlt("Media", "with an uploaded media preview"),
        url: adminImages.thumbnail,
      },
    },
  },
  interfaceName: "MediaBlock",
  fields: [
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true,
    },
  ],
};
