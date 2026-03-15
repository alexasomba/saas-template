import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache.js";

import type { Post } from "@/payload-types";

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const path = `/posts/${doc.slug}`;

      payload.logger.info(`Revalidating post at path: ${path}`);

      revalidatePath(path);
      revalidateTag("posts-sitemap");
    }

    if (previousDoc?._status === "published" && doc._status !== "published") {
      const oldPath = `/posts/${previousDoc.slug}`;

      payload.logger.info(`Revalidating old post at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("posts-sitemap");
    }
  }

  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`;

    payload.logger.info(`Revalidating deleted post at path: ${path}`);

    revalidatePath(path);
    revalidateTag("posts-sitemap");
  }

  return doc;
};
