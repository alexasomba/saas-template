import type { Block } from "payload";

import { createBlockAdminImages, createBlockImageAlt } from "@/blocks/adminImages";

const adminImages = createBlockAdminImages({
  accent: "#22C55E",
  label: "Code",
});

export const Code: Block = {
  slug: "code",
  admin: {
    images: {
      icon: {
        alt: createBlockImageAlt("Code", "with lines of code"),
        url: adminImages.icon,
      },
      thumbnail: {
        alt: createBlockImageAlt("Code", "with lines of code"),
        url: adminImages.thumbnail,
      },
    },
  },
  interfaceName: "CodeBlock",
  fields: [
    {
      name: "language",
      type: "select",
      defaultValue: "typescript",
      options: [
        {
          label: "Typescript",
          value: "typescript",
        },
        {
          label: "Javascript",
          value: "javascript",
        },
        {
          label: "CSS",
          value: "css",
        },
      ],
    },
    {
      name: "code",
      type: "code",
      label: false,
      required: true,
    },
  ],
};
