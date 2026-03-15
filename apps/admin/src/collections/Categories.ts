import { slugField } from "payload";
import type { CollectionConfig } from "payload";

import { adminOrEditor } from "@/access/adminOrEditor";
import { slugifyTextOrUndefined } from "@/utilities/slugify";

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    useAsTitle: "title",
    group: "Content",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField({
      position: undefined,
      slugify: ({ valueToSlugify }) => slugifyTextOrUndefined(valueToSlugify),
    }),
  ],
};
