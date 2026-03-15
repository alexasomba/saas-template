import type { Block } from "payload";

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

import { createBlockAdminImages, createBlockImageAlt } from "@/blocks/adminImages";

const adminImages = createBlockAdminImages({
  accent: "#0EA5E9",
  label: "Banner",
});

export const Banner: Block = {
  slug: "banner",
  admin: {
    images: {
      icon: {
        alt: createBlockImageAlt("Banner", "showing a highlighted message preview"),
        url: adminImages.icon,
      },
      thumbnail: {
        alt: createBlockImageAlt("Banner", "showing a highlighted message preview"),
        url: adminImages.thumbnail,
      },
    },
  },
  fields: [
    {
      name: "style",
      type: "select",
      defaultValue: "info",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Error", value: "error" },
        { label: "Success", value: "success" },
      ],
      required: true,
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
        },
      }),
      label: false,
      required: true,
    },
  ],
  interfaceName: "BannerBlock",
};
