import type { CollectionConfig } from "payload";

import { Banner } from "@/blocks/Banner/config";
import { Carousel } from "@/blocks/Carousel/config";
import { ThreeItemGrid } from "@/blocks/ThreeItemGrid/config";
import { generatePreviewPath } from "@/utilities/generatePreviewPath";
import { Archive } from "@/blocks/ArchiveBlock/config";
import { CallToAction } from "@/blocks/CallToAction/config";
import { Content } from "@/blocks/Content/config";
import { FormBlock } from "@/blocks/Form/config";
import { MediaBlock } from "@/blocks/MediaBlock/config";
import { hero } from "@/fields/hero";
import { slugField } from "payload";
import { adminOrPublishedStatus } from "@/access/adminOrPublishedStatus";
import { populatePublishedAt } from "@/hooks/populatePublishedAt";
import { adminOrEditor } from "@/access/adminOrEditor";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import { revalidatePage, revalidateDelete } from "./hooks/revalidatePage";
import { slugifyTextOrUndefined } from "@/utilities/slugify";
import {
  scheduledDraftVersions,
  setPublishedAtIfPublishing,
} from "@/collections/shared/versioning";

export const Pages: CollectionConfig = {
  slug: "pages",
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrPublishedStatus,
    update: adminOrEditor,
  },
  admin: {
    group: "Content",
    defaultColumns: ["title", "slug", "updatedAt"],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: "pages",
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: "pages",
        req,
      }),
    useAsTitle: "title",
  },
  defaultPopulate: {
    title: true,
    slug: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      type: "tabs",
      tabs: [
        {
          fields: [hero],
          label: "Hero",
        },
        {
          fields: [
            {
              name: "layout",
              type: "blocks",
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                Carousel,
                ThreeItemGrid,
                Banner,
                FormBlock,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: "Content",
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
      },
      hooks: {
        beforeChange: [setPublishedAtIfPublishing],
      },
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTextOrUndefined(valueToSlugify),
    }),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: scheduledDraftVersions,
};
