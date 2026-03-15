import type { BeforeSync, DocToSync } from "@payloadcms/plugin-search/types";

export const beforeSyncWithSearch: BeforeSync = async ({ req, originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc;

  const { slug, id, categories, title, meta } = originalDoc as {
    slug?: string;
    id?: string | number;
    categories?: Array<string | number | { id: string | number; title: string } | null>;
    title?: string;
    meta?: {
      title?: string;
      description?: string;
      image?: { id?: string | number } | string | number | null;
    };
  };

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    meta: {
      ...meta,
      title: meta?.title || title,
      image: meta?.image && typeof meta.image === "object" ? meta.image.id : meta?.image,
      description: meta?.description,
    },
    categories: [],
  };

  if (categories && Array.isArray(categories) && categories.length > 0) {
    const populatedCategories: { id: string | number; title: string }[] = [];

    for (const category of categories) {
      if (!category) continue;

      if (typeof category === "object") {
        populatedCategories.push({ id: category.id, title: category.title });
        continue;
      }

      const doc = await req.payload.findByID({
        collection: "categories",
        id: category,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      });

      if (doc !== null) {
        populatedCategories.push({ id: doc.id, title: doc.title as string });
      } else {
        req.payload.logger.error(
          `Category not found when syncing collection '${collection}' with doc '${String(id)}' and category '${category}'.`,
        );
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: "categories",
      categoryID: String(each.id),
      title: each.title,
    }));
  }

  return modifiedDoc;
};
